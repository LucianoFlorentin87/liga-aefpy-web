"use server";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { seasonAdminDb } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import type { LeagueActionState } from "@/lib/league-action-state";

class ReviewError extends Error {}
export async function reviewLeagueRegistration(_state: LeagueActionState, form: FormData): Promise<LeagueActionState> {
  const { user: actor } = await requirePermission("inscripciones");
  const id = String(form.get("registrationId") || "");
  const decision = form.get("decision");
  const note = String(form.get("note") || "").trim().slice(0, 500);
  if (!id || (decision !== "APROBAR" && decision !== "RECHAZAR")) return { error: "Solicitud inválida." };
  try {
    await seasonAdminDb.$transaction(async tx => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock_shared(736527184)`;
      await tx.$queryRaw`SELECT id FROM league_registrations WHERE id = ${id} FOR UPDATE`;
      const request = await tx.leagueRegistration.findUniqueOrThrow({ where: { id }, include: { season: true } });
      const settings = await tx.tournamentSettings.findUniqueOrThrow({ where: { id: "settings" } });
      if (request.seasonId !== settings.currentSeasonId || request.season.status !== "INSCRIPCION") throw new ReviewError("Esta liga ya no admite revisión de inscripciones.");
      if (request.status !== "PENDIENTE") throw new ReviewError("La solicitud ya fue revisada. Actualizá la página.");
      if (decision === "RECHAZAR") {
        await tx.leagueRegistration.update({ where: { id }, data: { status: "RECHAZADA", reviewedById: actor.id, reviewedAt: new Date(), reviewNote: note || "No aprobada por la organización.", passwordHash: null } });
      } else {
        const role = await tx.role.findUniqueOrThrow({ where: { key: "DELEGADO" } });
        const applicant = request.userId ? await tx.user.findUnique({ where: { id: request.userId }, include: { role: true, team: { select: { seasonId: true } } } }) : null;
        if (request.userId && (!applicant || applicant.role.key !== "DELEGADO" || applicant.status !== "ACTIVO")) throw new ReviewError("La cuenta del delegado no está habilitada. Revisá sus datos.");
        if (applicant?.team?.seasonId === request.seasonId) throw new ReviewError("Este delegado ya administra otro equipo en la liga.");
        if (!applicant && (!request.passwordHash || await tx.user.findFirst({ where: { OR: [{ email: request.email }, { username: request.username }] } }))) throw new ReviewError("El correo o usuario ya tiene cuenta. La inscripción debe realizarse con esa cuenta autenticada.");
        const team = await tx.team.create({ data: { seasonId: request.seasonId, name: request.teamName, shortName: request.shortName, gamertag: request.gamertag, delegateName: request.delegateFirstName + " " + request.delegateLastName, delegateEmail: request.email, delegatePhone: request.phone } });
        const delegate = applicant
          ? await tx.user.update({ where: { id: applicant.id }, data: { teamId: team.id } })
          : await tx.user.create({ data: { firstName: request.delegateFirstName, lastName: request.delegateLastName, email: request.email, username: request.username, passwordHash: request.passwordHash!, roleId: role.id, teamId: team.id, status: "ACTIVO", mustChangePassword: false } });
        await tx.leagueRegistration.update({ where: { id }, data: { status: "APROBADA", userId: delegate.id, teamId: team.id, passwordHash: null, reviewedById: actor.id, reviewedAt: new Date(), reviewNote: note || null } });
      }
      await tx.activityLog.create({ data: { userId: actor.id, message: actor.firstName + (decision === "APROBAR" ? " aprobó " : " rechazó ") + "la inscripción de " + request.teamName + "." } });
    }, { timeout: 15000 });
    revalidatePath("/", "layout");
    return { success: decision === "APROBAR" ? "Equipo aprobado y cuenta de delegado vinculada." : "Solicitud rechazada." };
  } catch (error) {
    if (error instanceof ReviewError) return { error: error.message };
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { error: "Ya existe un equipo o una cuenta con estos datos." };
    return { error: "No se pudo revisar la solicitud. Actualizá la página e intentá otra vez." };
  }
}
