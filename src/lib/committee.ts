import 'server-only';
import { Prisma } from '@prisma/client';
import { seasonAdminDb as db, getCurrentSeasonId } from '@/lib/db';
import { requireAuth } from '@/lib/permissions';
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
  if (!record || (!reviewAccess && !canReadCase(actor.user.id, record.applicantId, record.respondentId, record.ballots.map(b => b.userId), (actor.operator || actor.member?.active === true)))) throw new Error('Expediente no disponible.');
  return { actor, record, panel: record.ballots.some(b => b.userId === actor.user.id) && actor.member?.active === true };
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
      if (!a.operator && !a.member?.active) {
        if (!a.user.teamId || (match && ![match.homeTeamId, match.awayTeamId].includes(a.user.teamId))) throw new Error('Solo podés reclamar partidos de tu equipo.');
      }
      if (match && respondent.teamId && ![match.homeTeamId, match.awayTeamId].includes(respondent.teamId)) throw new Error('La contraparte no pertenece al partido.');
      const record = await tx.committeeCase.create({ data: { seasonId: a.seasonId, matchId, title: text(f, 'title', 180), applicantId: a.user.id, respondentId, evidenceDeadline: f.get('complete') === 'on' ? now : hoursAfter(now, 12), statements: { create: { authorId: a.user.id, kind: 'RECLAMO', body: text(f, 'body') } }, events: { create: { actorId: a.user.id, action: 'CREADO', detail: 'Reclamo recibido; pendiente de traslado comprobable.' } } } });
      return record.id;
    }
    const id = text(f, 'caseId', 100);
    const c = await tx.committeeCase.findFirst({ where: { id, seasonId: a.seasonId }, include: { ballots: true } });
    if (!c) throw new Error('Expediente no disponible.');
    const parties = await tx.user.findMany({ where:{id:{in:[c.applicantId,c.respondentId]}},select:{teamId:true} });
    const affectedTeams = parties.map(p=>p.teamId).filter((id): id is string=>!!id);
    const party = [c.applicantId, c.respondentId].includes(a.user.id) || (!!a.user.teamId && affectedTeams.includes(a.user.teamId));
    const coordinator = (a.operator || a.member?.active === true) && !party;
    const event = async (action: string, detail: string) => { await tx.committeeEvent.create({ data: { caseId: id, actorId: a.user.id, action, detail } }); };
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
    if (operation === 'open') {
      if (!coordinator || c.status !== 'DEFENSA' || !c.defenseDeadline || now < c.defenseDeadline) throw new Error('Debe concluir el plazo de defensa antes de votar.');
      const ids = f.getAll('panelIds').map(String);
      const previous = c.parentId ? await tx.committeeBallot.findMany({ where: { caseId: c.parentId }, select: { userId: true } }) : [];
      if (!panelValid(ids, [c.applicantId, c.respondentId, ...previous.map(b => b.userId)])) throw new Error('Elegí tres miembros distintos, sin partes ni votantes de primera instancia.');
      const members = await tx.committeeMember.findMany({ where: { seasonId: a.seasonId, active: true, userId: { in: ids } } });
      const activeUsers = await tx.user.count({ where: { id: { in: ids }, status: 'ACTIVO' } });
      const conflictUsers = await tx.user.count({where:{id:{in:ids},teamId:{in:affectedTeams}}});
      if (conflictUsers || members.length !== 3 || activeUsers !== 3) throw new Error('Los tres miembros deben estar activos.');
      const proposal = text(f, 'proposal');
      await tx.committeeCase.update({ where: { id }, data: { status: 'VOTACION', proposal, voteDeadline: hoursAfter(now, 24), ballots: { create: ids.map(userId => ({ userId })) } } });
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
        const resolution = result === 'APROBADA' ? c.proposal! : c.parentId ? 'Se mantiene la resolución inicial: la propuesta de revisión no alcanzó mayoría.' : 'La propuesta no alcanzó mayoría. No se concede la sanción ni la victoria solicitada. Se aplica el tratamiento residual del reglamento, según el tipo de partido.';
        await tx.committeeCase.update({ where: { id }, data: { status: result, resolution, resolvedAt: now, resolutionNumber: `AEFPY-${id.toUpperCase()}` } });
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
      if(!replacementUser || (replacementUser.teamId && affectedTeams.includes(replacementUser.teamId))) throw new Error('Suplente con conflicto o inactivo.');
      const replacement = await tx.committeeMember.findFirst({ where: { seasonId:a.seasonId,userId:replacementId,active:true } });
      const previous = c.parentId ? await tx.committeeBallot.findMany({ where:{ caseId:c.parentId } }) : [];
      if (!ballot || !replacement || [c.applicantId,c.respondentId,...c.ballots.map(b=>b.userId),...previous.map(b=>b.userId)].includes(replacementId)) throw new Error('Suplente inválido o con conflicto.');
      await tx.committeeBallot.update({ where:{id:ballot.id},data:{userId:replacementId} });
      await tx.committeeCase.update({where:{id},data:{voteDeadline:hoursAfter(now,24)}});
      await event('AMPLIACION',`Sustitución ${absentId} por ${replacementId}: ${text(f,'reason',2000)}`);return id;
    }
    throw new Error('Operación no disponible.');
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 15000 });
}
