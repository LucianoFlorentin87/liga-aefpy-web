"use server";

import { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { seasonAdminDb } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { captureLeagueArchive } from "@/lib/league-archive";
import { newLeagueSchema, leagueSlug, registrationDeadlineFor } from "@/lib/league-validation";
import type { LeagueActionState } from "@/lib/league-action-state";

class LeagueActionError extends Error {}
function fail(error: unknown): LeagueActionState {
  if (error instanceof LeagueActionError) return { error: error.message };
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { error: "Ya existe un registro con esos datos. Actualizá la página." };
  return { error: "No se pudo completar la operación. Actualizá la página e intentá nuevamente." };
}
function refresh() { revalidatePath("/", "layout"); }
async function lock(tx: Prisma.TransactionClient) {
  await tx.$executeRaw`SET LOCAL lock_timeout = '5s'`;
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(736527184)`;
  await tx.$queryRaw`SELECT id FROM tournament_settings WHERE id = 'settings' FOR UPDATE`;
}

export async function closeAndCreateLeague(_previous: LeagueActionState, form: FormData): Promise<LeagueActionState> {
  const { user } = await requirePermission("temporadas");
  const parsed = newLeagueSchema.safeParse({
    currentSeasonId: form.get("currentSeasonId"), confirmName: form.get("confirmName"), name: form.get("name"),
    deadline: String(form.get("deadline") || ""), acknowledgePending: form.get("acknowledgePending") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "Revisá el formulario." };
  const input = parsed.data;
  const deadline = input.deadline ? registrationDeadlineFor(input.deadline) : null;
  if (input.deadline && (!deadline || deadline <= new Date())) return { error: "La fecha límite debe ser futura." };
  try {
    const next = await seasonAdminDb.$transaction(async tx => {
      await lock(tx);
      const settings = await tx.tournamentSettings.findUniqueOrThrow({ where: { id: "settings" } });
      if (settings.currentSeasonId !== input.currentSeasonId) throw new LeagueActionError("La liga cambió. Actualizá la página antes de continuar.");
      const current = await tx.season.findUniqueOrThrow({ where: { id: input.currentSeasonId } });
      if (current.status === "FINALIZADA" || input.confirmName !== current.name) throw new LeagueActionError("Escribí exactamente el nombre de la liga actual para confirmar.");
      const unresolvedCases = await tx.committeeCase.count({where:{seasonId:current.id,status:{in:['DEFENSA','VOTACION']}}});
      if(unresolvedCases) throw new LeagueActionError('Hay expedientes del comité pendientes. Resolvelos antes de cerrar.');
      const resolvedCases = await tx.committeeCase.findMany({where:{seasonId:current.id},include:{events:{where:{action:'RESOLUCION_NOTIFICADA'}}}});
      if(resolvedCases.some(c=>!c.events[0] || (!c.parentId && Date.now()<c.events[0].createdAt.getTime()+12*3600000))) throw new LeagueActionError('Falta notificar decisiones o todavía corre un plazo de revisión del comité.');
      const playing = await tx.match.count({ where: { seasonId: current.id, status: "EN_CURSO" } });
      if (playing) throw new LeagueActionError("Hay partidos en curso. Resolvelos antes de cerrar la liga.");
      const pending = await tx.match.count({ where: { seasonId: current.id, status: { not: "FINALIZADO" } } });
      if (pending && !input.acknowledgePending) throw new LeagueActionError("Confirmá que los partidos pendientes se archivarán sin cambiar sus resultados.");
      const archive = await captureLeagueArchive(current.id, current.name, settings);
      await tx.leagueRegistration.updateMany({ where: { seasonId: current.id, status: "PENDIENTE" }, data: { passwordHash: null } });
      await tx.season.update({ where: { id: current.id }, data: { status: "FINALIZADA", registrationOpen: false, endedAt: new Date(), closedById: user.id, standingsCriteria: settings.standingsCriteria, archive } });
      const created = await tx.season.create({ data: { name: input.name, slug: leagueSlug(input.name, randomUUID().slice(0, 8)), registrationDeadline: deadline, standingsCriteria: settings.standingsCriteria } });
      await tx.tournamentSettings.update({ where: { id: "settings" }, data: { currentSeasonId: created.id } });
      await tx.activityLog.create({ data: { userId: user.id, message: user.firstName + " cerró " + current.name + " y abrió inscripciones para " + created.name + "." } });
      return created;
    }, { maxWait: 5000, timeout: 45000 });
    refresh();
    return { success: "Liga archivada. Las inscripciones de " + next.name + " están abiertas.", link: "/inscripcion/" + next.slug, linkLabel: "Abrir formulario de inscripción" };
  } catch (error) { return fail(error); }
}

export async function updateLeague(_previous: LeagueActionState, form: FormData): Promise<LeagueActionState> {
  await requirePermission("temporadas");
  const id = String(form.get("seasonId") || "");
  const name = String(form.get("name") || "").trim();
  if (name.length < 3 || name.length > 100) return { error: "El nombre debe tener entre 3 y 100 caracteres." };
  const deadlineText = String(form.get("deadline") || "");
  const deadline = deadlineText ? registrationDeadlineFor(deadlineText) : null;
  if (deadlineText && (!deadline || deadline <= new Date())) return { error: "La fecha límite debe ser futura." };
  try {
    await seasonAdminDb.$transaction(async tx => {
      await lock(tx);
      const settings = await tx.tournamentSettings.findUniqueOrThrow({ where: { id: "settings" } });
      if (settings.currentSeasonId !== id) throw new LeagueActionError("La liga cambió. Actualizá la página.");
      const season = await tx.season.findUniqueOrThrow({ where: { id } });
      await tx.season.update({ where: { id }, data: { name, registrationOpen: season.status === "INSCRIPCION" && form.get("registrationOpen") === "on", ...(season.status === "INSCRIPCION" ? { registrationDeadline: deadline } : {}) } });
    });
    refresh();
    return { success: "Configuración de la liga actualizada." };
  } catch (error) { return fail(error); }
}

export async function startLeague(_previous: LeagueActionState, form: FormData): Promise<LeagueActionState> {
  const { user } = await requirePermission("temporadas");
  try {
    await seasonAdminDb.$transaction(async tx => {
      await lock(tx);
      const settings = await tx.tournamentSettings.findUniqueOrThrow({ where: { id: "settings" } });
      if (settings.currentSeasonId !== form.get("seasonId")) throw new LeagueActionError("La liga cambió. Actualizá la página.");
      const season = await tx.season.findUniqueOrThrow({ where: { id: settings.currentSeasonId! } });
      if (season.status !== "INSCRIPCION") throw new LeagueActionError("Esta liga ya no está en fase de inscripción.");
      if (await tx.team.count({ where: { seasonId: season.id, status: "ACTIVO" } }) < 2) throw new LeagueActionError("Necesitás al menos dos equipos aprobados.");
      if (await tx.leagueRegistration.count({ where: { seasonId: season.id, status: "PENDIENTE" } })) throw new LeagueActionError("Aprobá o rechazá las solicitudes pendientes antes de iniciar.");
      await tx.season.update({ where: { id: season.id }, data: { status: "EN_CURSO", startedAt: new Date(), registrationOpen: false } });
      await tx.activityLog.create({ data: { userId: user.id, message: user.firstName + " inició " + season.name + "." } });
    });
    refresh();
    return { success: "Liga iniciada. Ya podés organizar y cargar los partidos." };
  } catch (error) { return fail(error); }
}
