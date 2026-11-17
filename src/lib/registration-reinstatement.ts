import type { Prisma } from '@prisma/client';
import { registrationIsOpen } from './league-validation';

export class ReinstatementError extends Error {}

export function assertReinstatementAllowed(request: { seasonId: string; status: string; teamId: string | null; season: { status: string; registrationOpen: boolean; registrationDeadline: Date | null } }, currentSeasonId: string | null) {
  if (request.seasonId !== currentSeasonId || !registrationIsOpen(request.season)) throw new ReinstatementError('La reincorporación solo está disponible durante las inscripciones abiertas de la liga actual.');
  if (request.status !== 'APROBADA' || request.teamId) throw new ReinstatementError('Solo se puede reincorporar una inscripción aprobada cuyo equipo fue eliminado.');
}

export function assertDelegateIdentity(request: { userId: string | null; email: string; username: string }, account: { id: string; email: string; username: string; status: string; role: { key: string }; team: { seasonId: string } | null }) {
  if ((request.userId && request.userId !== account.id) || request.email.toLowerCase() !== account.email.toLowerCase() || request.username.toLowerCase() !== account.username.toLowerCase()) throw new ReinstatementError('El correo o usuario pertenece a otra cuenta. Revisá la identidad del delegado antes de reincorporar.');
  if (account.role.key !== 'DELEGADO' || account.status !== 'ACTIVO') throw new ReinstatementError('La cuenta del delegado no está habilitada.');
}

/** Called only inside a transaction after checking the administrator's permission. */
export async function reinstateRegistration(tx: Prisma.TransactionClient, registrationId: string, actorId: string, lockedPasswordHash: string) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock_shared(736527184)`;
  await tx.$queryRaw`SELECT id FROM league_registrations WHERE id = ${registrationId} FOR UPDATE`;
  const request = await tx.leagueRegistration.findUniqueOrThrow({ where: { id: registrationId }, include: { season: true } });
  const settings = await tx.tournamentSettings.findUniqueOrThrow({ where: { id: 'settings' } });
  assertReinstatementAllowed(request, settings.currentSeasonId);
  const accounts = await tx.user.findMany({ where: { OR: [
    ...(request.userId ? [{ id: request.userId }] : []),
    { email: { equals: request.email, mode: 'insensitive' } },
    { username: { equals: request.username, mode: 'insensitive' } },
  ] }, include: { role: true, team: { select: { seasonId: true } } } });
  if (accounts.length > 1) throw new ReinstatementError('El correo y usuario corresponden a cuentas diferentes. Revisá los datos.');
  const account = accounts[0];
  if (request.userId && !account) throw new ReinstatementError('No se encontró la cuenta vinculada. Revisá sus datos.');
  if (account) {
    await tx.$queryRaw`SELECT id FROM users WHERE id = ${account.id} FOR UPDATE`;
    assertDelegateIdentity(request, account);
    if (account.team?.seasonId === request.seasonId) throw new ReinstatementError('Este delegado ya administra un equipo en esta liga.');
  }
  if (await tx.team.findFirst({ where: { seasonId: request.seasonId, name: { equals: request.teamName, mode: 'insensitive' } } })) throw new ReinstatementError('Ya existe un equipo con ese nombre en esta liga.');
  const role = await tx.role.findUniqueOrThrow({ where: { key: 'DELEGADO' } });
  const team = await tx.team.create({ data: { seasonId: request.seasonId, name: request.teamName, shortName: request.shortName, gamertag: request.gamertag, delegateName: request.delegateFirstName + ' ' + request.delegateLastName, delegateEmail: request.email, delegatePhone: request.phone } });
  const delegate = account
    ? await tx.user.update({ where: { id: account.id }, data: { teamId: team.id } })
    : await tx.user.create({ data: { firstName: request.delegateFirstName, lastName: request.delegateLastName, email: request.email.toLowerCase(), username: request.username.toLowerCase(), passwordHash: lockedPasswordHash, roleId: role.id, teamId: team.id, status: 'ACTIVO', mustChangePassword: false } });
  // Preserve the original request, approval date, reviewer and note.
  await tx.leagueRegistration.update({ where: { id: request.id }, data: { teamId: team.id, userId: delegate.id } });
  await tx.activityLog.create({ data: { userId: actorId, message: `Reincorporación aprobada de ${request.teamName}; inscripción original ${request.id}; equipo ${team.id}; delegado ${delegate.id}; cuenta ${account ? 'conservada' : 'recuperada con acceso por restablecimiento de contraseña'}. Aprobación original ${request.reviewedAt?.toISOString() ?? 'sin fecha'}, revisor ${request.reviewedById ?? 'sin registro'}.` } });
  return { recoveredAccount: !account };
}
