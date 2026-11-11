import type { Prisma } from '@prisma/client';
import { decisionIsFinal, effectPatch, parseEffect } from './committee-effects';

/** Called inside the serialized committee transaction. No goals/cards are deleted. */
export async function applyCommitteeDecision(tx: Prisma.TransactionClient, id: string, seasonId: string, actorId: string, now: Date) {
  const c = await tx.committeeCase.findFirstOrThrow({ where: { id, seasonId }, include: { events: true } });
  const review = await tx.committeeCase.findFirst({ where: { parentId: id, seasonId }, include: { events: true } });
  if (!decisionIsFinal(c, review, now)) throw new Error('La decisión debe estar notificada y firme, sin revisión pendiente.');
  const existing = await tx.committeeApplication.findUnique({ where: { caseId: id } });
  if (existing) return id; // retries cannot duplicate the effect
  if (!c.matchId) throw new Error('El expediente no tiene partido relacionado.');
  let source = c;
  if (c.parentId && c.status === 'RECHAZADA') source = await tx.committeeCase.findFirstOrThrow({ where: { id: c.parentId, seasonId }, include: { events: true } });
  const effect = parseEffect(source.status === 'APROBADA' ? source.proposedEffect : source.residualEffect);
  const match = await tx.match.findFirstOrThrow({ where: { id: c.matchId, seasonId } });
  // A later independent case must not silently overwrite an earlier ruling.
  if (match.committeeCaseId && ![c.id, c.parentId].includes(match.committeeCaseId)) throw new Error('El partido ya tiene otra resolución aplicada. Requiere revisión del expediente correspondiente.');
  const patch = effectPatch(effect);
  // A review that preserves the recorded result restores the original snapshot,
  // including a previous administrative result, rather than inventing player goals.
  const initialApplication = c.parentId ? await tx.committeeApplication.findUnique({ where: { caseId: c.parentId } }) : null;
  const original = initialApplication?.before as { status: typeof match.status; officialHomeScore: number | null; officialAwayScore: number | null; forfeitedTeamId: string | null } | undefined;
  const before = { status: match.status, officialHomeScore: match.officialHomeScore, officialAwayScore: match.officialAwayScore, forfeitedTeamId: match.forfeitedTeamId, committeeCaseId: match.committeeCaseId };
  const after = { ...(patch ?? original ?? before), committeeCaseId: id };
  await tx.$executeRaw`SELECT set_config('aefpy.committee_application', 'on', true)`;
  await tx.match.update({ where: { id: match.id }, data: after });
  await tx.committeeApplication.create({ data: { caseId: id, seasonId, matchId: match.id, actorId, effect, before, after } });
  await tx.committeeEvent.create({ data: { caseId: id, actorId, action: 'EFECTO_APLICADO', detail: `Efecto ${effect}; partido ${match.id}. Resultado anterior conservado en historial privado.` } });
  return id;
}
