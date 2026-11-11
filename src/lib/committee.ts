import 'server-only';
import { classifyClaim } from '@/lib/regulation-policy';
import { expandIdentities } from '@/lib/committee-conflicts';
import { Prisma } from '@prisma/client';
import { seasonAdminDb as db, getCurrentSeasonId } from '@/lib/db';
import { requireAuth } from '@/lib/permissions';
import { applyCommitteeDecision } from '@/lib/committee-application';
import { effectLabel, parseEffect } from '@/lib/committee-effects';
import { ballotResult, hoursAfter, panelValid, canReadCase } from '@/lib/committee-policy';

export async function committeeActor() {
  const { user, session } = await requireAuth();
  const seasonId = await getCurrentSeasonId();
  const season = await db.season.findUniqueOrThrow({ where: { id: seasonId } });
  const member = await db.committeeMember.findUnique({ where: { seasonId_userId: { seasonId, userId: user.id } } });
  return { user, session, seasonId, member, writable: season.status !== 'FINALIZADA', operator: session.role === 'SUPERADMIN' };
}
export async function readCommitteeCase(id: string) {
  const actor = await committeeActor();
  const record = await db.committeeCase.findFirst({ where: { id, seasonId: actor.seasonId }, include: { statements: { orderBy: { createdAt: 'asc' } }, ballots: true, events: { orderBy: { createdAt: 'asc' } } } });
  const reviewAccess = record ? await db.committeeCase.findFirst({ where: { parentId:record.id, seasonId:actor.seasonId, ballots:{some:{userId:actor.user.id}} }, select:{id:true} }) : null;
  const identityLinks=await db.committeeMember.findMany({where:{seasonId:actor.seasonId},select:{userId:true,linkedUserId:true}});
  const partyIds=record?expandIdentities([record.applicantId,record.respondentId],identityLinks):[];
  const actorIds=expandIdentities([actor.user.id],identityLinks);
  const actorTeams=await db.user.findMany({where:{id:{in:actorIds}},select:{teamId:true}});
  const parties = record ? await db.user.findMany({where:{id:{in:partyIds}},select:{teamId:true}}) : [];
  const conflict = actorIds.some(id=>partyIds.includes(id)) || actorTeams.some(u=>u.teamId && parties.some(p=>p.teamId===u.teamId));
  if (record && conflict && ![record.applicantId,record.respondentId].includes(actor.user.id)) throw new Error('Expediente no disponible por conflicto de interés.');
  if (!record || (!(reviewAccess && actor.member?.active && !conflict) && !canReadCase(actor.user.id, record.applicantId, record.respondentId, record.ballots.map(b => b.userId), ((actor.operator || actor.member?.active === true) && !conflict)))) throw new Error('Expediente no disponible.');
  return { actor, record, conflict, panel: record.ballots.some(b => b.userId === actor.user.id) && actor.member?.active === true && !conflict };
}
const text = (f: FormData, key: string, max = 12000) => {
  const value = String(f.get(key) ?? '').trim();
  if (!value || value.length > max) throw new Error(`Completá ${key} (máximo ${max} caracteres).`);
  return value;
};
export async function mutateCommittee(f: FormData) {
  const a = await committeeActor();
  if (!a.writable) throw new Error('La edición está cerrada.');
  const operation = text(f, 'operation', 40);
  const now = new Date();
  // Serialize membership changes, assignments and votes to avoid duplicate closes.
  return db.$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock_shared(736527184)`;
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${a.seasonId}), 4107)`;
    const activeActor=await tx.user.findUniqueOrThrow({where:{id:a.user.id},include:{role:true}});
    if(activeActor.status !== 'ACTIVO') throw new Error('Usuario inactivo.');
    a.user=activeActor;
    a.operator=activeActor.role.key === 'SUPERADMIN';
    a.member=await tx.committeeMember.findUnique({where:{seasonId_userId:{seasonId:a.seasonId,userId:a.user.id}}});
    const current = await tx.tournamentSettings.findUniqueOrThrow({where:{id:'settings'},select:{currentSeasonId:true}});
    const season = await tx.season.findUniqueOrThrow({where:{id:a.seasonId},select:{status:true}});
    if(current.currentSeasonId !== a.seasonId || season.status === 'FINALIZADA') throw new Error('La edición cambió o se cerró.');
    if (operation === 'member') {
      if (!a.operator) throw new Error('Solo el superadministrador designa miembros.');
      const userId = text(f, 'userId', 100);
      const user = await tx.user.findFirst({ where: { id: userId, status: 'ACTIVO' } });
      if (!user) throw new Error('Usuario no disponible.');
      await tx.committeeMember.upsert({ where: { seasonId_userId: { seasonId: a.seasonId, userId } }, create: { seasonId: a.seasonId, userId, alternate: f.get('alternate') === 'on' }, update: { active: true, alternate: f.get('alternate') === 'on' } });
      await tx.activityLog.create({ data: { userId: a.user.id, message: `Comité: designación de miembro ${userId} en ${a.seasonId}.` } });
      return '';
    }
    if (operation === 'create') {
      const classification=classifyClaim(f.get('nature'),f.get('article'));
      const publication=await tx.regulationPublication.findFirst({where:{seasonId:a.seasonId,effectiveAt:{lte:now}},orderBy:[{effectiveAt:'desc'},{publishedAt:'desc'}]});
      if(activeActor.role.key==='DELEGADO' && publication && !await tx.regulationAcceptance.findUnique({where:{publicationId_userId:{publicationId:publication.id,userId:a.user.id}}})) throw new Error('Aceptá el reglamento vigente desde tu perfil antes de presentar un reclamo nuevo. La defensa y revisión siguen disponibles.');
      const openCount = await tx.committeeCase.count({where:{seasonId:a.seasonId,applicantId:a.user.id,status:{in:['DEFENSA','VOTACION']}}});
      if(openCount >= 3) throw new Error('Ya tenés tres expedientes abiertos. Incorporá información al correspondiente o contactá al comité.');
      const respondentId = text(f, 'respondentId', 100);
      if (respondentId === a.user.id) throw new Error('La contraparte debe ser otra persona.');
      const respondent = await tx.user.findFirst({ where: { id: respondentId, status: 'ACTIVO', team: { seasonId: a.seasonId } } });
      if (!respondent) throw new Error('La contraparte no pertenece a esta edición.');
      if(a.user.teamId && a.user.teamId === respondent.teamId) throw new Error('La contraparte debe representar otro equipo.');
      const matchId = String(f.get('matchId') ?? '').trim() || null;
      const match = matchId ? await tx.match.findFirst({ where: { id: matchId, seasonId: a.seasonId } }) : null;
      if (matchId && !match) throw new Error('Partido no disponible.');
      if (activeActor.role.key==='DELEGADO' || (!a.operator && !a.member?.active)) {
        if (!a.user.teamId || (match && ![match.homeTeamId, match.awayTeamId].includes(a.user.teamId))) throw new Error('Solo podés reclamar partidos de tu equipo.');
      }
      if (match && respondent.teamId && ![match.homeTeamId, match.awayTeamId].includes(respondent.teamId)) throw new Error('La contraparte no pertenece al partido.');
      const record = await tx.committeeCase.create({ data: { seasonId: a.seasonId, ...classification, regulationPublicationId:publication?.id, matchId, title: text(f, 'title', 180), applicantId: a.user.id, respondentId, evidenceDeadline: f.get('complete') === 'on' ? now : hoursAfter(now, 12), statements: { create: { authorId: a.user.id, kind: 'RECLAMO', body: text(f, 'body') } }, events: { create: { actorId: a.user.id, action: 'CREADO', detail: 'Reclamo recibido; pendiente de traslado comprobable.' } } } });
      return record.id;
    }
    const id = text(f, 'caseId', 100);
    const c = await tx.committeeCase.findFirst({ where: { id, seasonId: a.seasonId }, include: { ballots: true } });
    if (!c) throw new Error('Expediente no disponible.');
    const identityLinks=await tx.committeeMember.findMany({where:{seasonId:a.seasonId},select:{userId:true,linkedUserId:true}});
    const excludedIds=expandIdentities([c.applicantId,c.respondentId],identityLinks);
    const actorIds=expandIdentities([a.user.id],identityLinks);
    const actorUsers=await tx.user.findMany({where:{id:{in:actorIds}},select:{teamId:true}});
    const parties = await tx.user.findMany({ where:{id:{in:excludedIds}},select:{teamId:true} });
    const affectedTeams = parties.map(p=>p.teamId).filter((id): id is string=>!!id);
    const party = actorIds.some(id=>excludedIds.includes(id)) || actorUsers.some(u=>u.teamId && affectedTeams.includes(u.teamId));
    const coordinator = (a.operator || a.member?.active === true) && !party;
    const event = async (action: string, detail: string) => { await tx.committeeEvent.create({ data: { caseId: id, actorId: a.user.id, action, detail } }); };
    if (operation === 'apply') {
      if (!coordinator) throw new Error('Solo un coordinador sin conflicto aplica decisiones firmes.');
      return applyCommitteeDecision(tx, id, a.seasonId, a.user.id, now);
    }
    if (operation === 'evidence' || operation === 'defense') {
      const isDefense = operation === 'defense';
      if (c.status !== 'DEFENSA' || (isDefense ? a.user.id !== c.respondentId : a.user.id !== c.applicantId)) throw new Error('No podés realizar esta presentación.');
      const deadline = isDefense ? c.defenseDeadline : c.evidenceDeadline;
      if (!deadline || now >= deadline || (!isDefense && c.notifiedAt)) throw new Error('La etapa está cerrada. Prueba nueva requiere nuevo traslado.');
      await tx.committeeStatement.create({ data: { caseId: id, authorId: a.user.id, kind: isDefense ? 'DEFENSA' : 'PRUEBA', body: text(f, 'body') } });
      await event(isDefense ? 'DEFENSA' : 'PRUEBA', 'Presentación incorporada sin editar anteriores.'); return id;
    }
    if (operation === 'completeEvidence') {
      if(c.applicantId !== a.user.id || c.status !== 'DEFENSA' || c.notifiedAt || now >= c.evidenceDeadline) throw new Error('La presentación ya está cerrada.');
      await tx.committeeCase.update({where:{id},data:{evidenceDeadline:now}});
      await event('PRUEBAS_COMPLETAS','El reclamante cerró su presentación.'); return id;
    }
    if (operation === 'notify') {
      if (!coordinator || c.status !== 'DEFENSA' || c.notifiedAt || now < c.evidenceDeadline) throw new Error('Traslado no permitido.');
      const proof = text(f, 'notificationProof', 2000);
      // The clock starts at actual delivery, not at creation or merely sending WhatsApp.
      const deliveredAt = new Date(text(f, 'deliveredAt', 60));
      if (!Number.isFinite(deliveredAt.getTime()) || deliveredAt > now || deliveredAt < c.createdAt) throw new Error('Fecha de entrega inválida.');
      await tx.committeeCase.update({ where: { id }, data: { notifiedAt: deliveredAt, notificationProof: proof, defenseDeadline: hoursAfter(deliveredAt, c.parentId ? 12 : 24) } });
      await event('NOTIFICADO', `Entrega comprobada: ${deliveredAt.toISOString()}.`); return id;
    }
    if (operation === 'extendDecision') {
      if (!coordinator || c.status !== 'DEFENSA' || !c.defenseDeadline || now < hoursAfter(c.defenseDeadline,24) || now >= hoursAfter(c.defenseDeadline,48)) throw new Error('Ampliación no disponible en esta etapa.');
      if (await tx.committeeEvent.findFirst({where:{caseId:id,action:'AMPLIACION'}})) throw new Error('La única ampliación ya se utilizó.');
      await tx.committeeCase.update({where:{id},data:{voteDeadline:hoursAfter(c.defenseDeadline,48)}});
      await event('AMPLIACION', 'Ampliación única de decisión: '+text(f,'reason',2000)); return id;
    }
    if (operation === 'open') {
      if (!coordinator || c.status !== 'DEFENSA' || !c.defenseDeadline || now < c.defenseDeadline) throw new Error('Debe concluir el plazo de defensa antes de votar.');
      const decisionDeadline = c.voteDeadline ?? hoursAfter(c.defenseDeadline,24);
      if (now >= decisionDeadline) throw new Error('Venció el plazo de decisión: registrá la ampliación y sustitución por el procedimiento del reglamento.');
      const ids = f.getAll('panelIds').map(String);
      const previous = c.parentId ? await tx.committeeBallot.findMany({ where: { caseId: c.parentId }, select: { userId: true } }) : [];
      if (!panelValid(ids, expandIdentities([...excludedIds,...previous.map(b => b.userId)],identityLinks)) || new Set(ids.map(id=>expandIdentities([id],identityLinks).sort().join('|'))).size!==3) throw new Error('Elegí tres miembros distintos, sin partes ni votantes de primera instancia.');
      const members = await tx.committeeMember.findMany({ where: { seasonId: a.seasonId, active: true, userId: { in: ids } } });
      const activeUsers = await tx.user.count({ where: { id: { in: ids }, status: 'ACTIVO' } });
      const conflictUsers = await tx.user.count({where:{id:{in:expandIdentities(ids,identityLinks)},teamId:{in:affectedTeams}}});
      if (conflictUsers || members.length !== 3 || activeUsers !== 3) throw new Error('Los tres miembros deben estar activos.');
      const proposedEffect = parseEffect(f.get('proposedEffect'));
      const residualEffect = c.parentId ? 'SIN_CAMBIO' : parseEffect(f.get('residualEffect'));
      if (!c.matchId && proposedEffect !== 'SIN_CAMBIO') throw new Error('Relacioná un partido para adjudicar un efecto deportivo.');
      if (!c.parentId && !['SIN_CAMBIO','ANULAR','ANULAR_TECNICO'].includes(residualEffect)) throw new Error('El rechazo no puede conceder una victoria.');
      if (!c.matchId && residualEffect !== 'SIN_CAMBIO') throw new Error('Sin partido: el efecto residual debe conservar el registro.');
      const proposal = text(f, 'proposal');
      const parent = c.parentId ? await tx.committeeCase.findFirstOrThrow({where:{id:c.parentId,seasonId:a.seasonId}}) : null;
      const residualResolution = parent ? 'Se confirma la resolución inicial.\n\n'+parent.resolution : text(f,'residualResolution');
      await tx.committeeCase.update({ where: { id }, data: { status: 'VOTACION', proposal, proposedEffect, residualEffect, residualResolution, voteDeadline: decisionDeadline, ballots: { create: ids.map(userId => ({ userId })) } } });
      await event('VOTACION_ABIERTA', 'Panel de tres miembros asignado. Propuesta congelada.'); return id;
    }
    if (operation === 'vote') {
      if (c.status !== 'VOTACION' || !c.voteDeadline || now >= c.voteDeadline || !a.member?.active || party) throw new Error('No estás habilitado o venció la votación.');
      const ballot = c.ballots.find(b => b.userId === a.user.id);
      if (!ballot || ballot.votedAt) throw new Error('No asignado o voto ya emitido.');
      const choice = text(f, 'choice', 20);
      if (!['APROBAR', 'RECHAZAR'].includes(choice)) throw new Error('Voto inválido.');
      await tx.committeeBallot.update({ where: { id: ballot.id }, data: { choice, reason: text(f, 'reason', 4000), votedAt: now } });
      await event('VOTO_EMITIDO', 'Voto individual reservado.');
      const ballots = await tx.committeeBallot.findMany({ where: { caseId: id } });
      const result = ballotResult(ballots.map(b => b.choice));
      if (result) {
        const validMembers = await tx.committeeMember.count({where:{seasonId:a.seasonId,active:true,userId:{in:ballots.map(b=>b.userId)}}});
        const validUsers = await tx.user.count({where:{id:{in:ballots.map(b=>b.userId)},status:'ACTIVO',OR:[{teamId:null},{teamId:{notIn:affectedTeams}}]}});
        const conflictAliases=await tx.user.count({where:{id:{in:expandIdentities(ballots.map(b=>b.userId),identityLinks)},teamId:{in:affectedTeams}}});
        if(conflictAliases || validMembers !== 3 || validUsers !== 3) throw new Error('El panel dejó de estar habilitado. Revisá los conflictos antes de resolver.');
        const resolution = result === 'APROBADA' ? c.proposal! + '\n\nEfecto deportivo aprobado: ' + effectLabel(c.proposedEffect) : c.residualResolution ? c.residualResolution + (c.parentId ? '' : '\n\nEfecto residual aprobado: '+effectLabel(c.residualEffect)) : c.parentId ? 'Se mantiene la resolución inicial: la propuesta de revisión no alcanzó mayoría.' : 'La propuesta no alcanzó mayoría. No se concede la sanción ni la victoria solicitada. Efecto residual: '+effectLabel(c.residualEffect);
        await tx.committeeCase.update({ where: { id }, data: { status: result, resolution, resolvedAt: now, resolutionNumber: `AEFPY-${a.seasonId.toUpperCase()}-${id.toUpperCase()}` } });
        await event('RESUELTO', 'Resolución colegiada disponible. Pendiente de notificación para iniciar revisión.');
      } return id;
    }
    if (operation === 'notifyDecision') {
      if (!coordinator || !c.resolvedAt || !['APROBADA','RECHAZADA'].includes(c.status)) throw new Error('Resolución no notificable.');
      const proof = text(f, 'notificationProof', 2000);
      if (await tx.committeeEvent.findFirst({ where: { caseId: id, action: 'RESOLUCION_NOTIFICADA' } })) throw new Error('Ya se notificó.');
      await event('RESOLUCION_NOTIFICADA', proof); return id;
    }
    if (operation === 'review') {
      if (!party || c.parentId || !c.resolvedAt) throw new Error('Revisión no disponible.');
      const notification = await tx.committeeEvent.findFirst({ where: { caseId: id, action: 'RESOLUCION_NOTIFICADA' } });
      if (!notification || now >= hoursAfter(notification.createdAt, 12)) throw new Error('Revisión fuera de plazo o sin notificación.');
      const r = await tx.committeeCase.create({ data: { seasonId: a.seasonId, matchId: c.matchId, parentId: id, applicantId: a.user.id, respondentId: a.user.id === c.applicantId ? c.respondentId : c.applicantId, title: `Revisión: ${c.title}`.slice(0,180), evidenceDeadline: now, statements: { create: { authorId: a.user.id, kind: 'REVISION', body: text(f, 'body') } }, events: { create: { actorId: a.user.id, action: 'CREADO', detail: `Revisión de ${id}. Exige panel independiente.` } } } }); return r.id;
    }
    if (operation === 'replace') {
      if (!coordinator || c.status !== 'VOTACION' || !c.voteDeadline || now < c.voteDeadline) throw new Error('Sustitución solo después del vencimiento.');
      if (await tx.committeeEvent.findFirst({ where: { caseId: id, action: 'AMPLIACION' } })) throw new Error('La única ampliación ya se utilizó.');
      const absentId = text(f, 'absentId',100), replacementId = text(f,'replacementId',100);
      const ballot = c.ballots.find(b => b.userId === absentId && !b.votedAt);
      const replacementUser = await tx.user.findFirst({where:{id:replacementId,status:'ACTIVO'}});
      const replacementAliases=await tx.user.count({where:{id:{in:expandIdentities([replacementId],identityLinks)},teamId:{in:affectedTeams}}});
      if(replacementAliases || !replacementUser || (replacementUser.teamId && affectedTeams.includes(replacementUser.teamId))) throw new Error('Suplente con conflicto o inactivo.');
      const replacement = await tx.committeeMember.findFirst({ where: { seasonId:a.seasonId,userId:replacementId,active:true } });
      const previous = c.parentId ? await tx.committeeBallot.findMany({ where:{ caseId:c.parentId } }) : [];
      if (!ballot || !replacement || expandIdentities([...excludedIds,...c.ballots.map(b=>b.userId),...previous.map(b=>b.userId)],identityLinks).includes(replacementId)) throw new Error('Suplente inválido o con conflicto.');
      await tx.committeeBallot.update({ where:{id:ballot.id},data:{userId:replacementId} });
      await tx.committeeCase.update({where:{id},data:{voteDeadline:hoursAfter(now,24)}});
      await event('AMPLIACION',`Sustitución ${absentId} por ${replacementId}: ${text(f,'reason',2000)}`);return id;
    }
    throw new Error('Operación no disponible.');
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 15000 });
}
