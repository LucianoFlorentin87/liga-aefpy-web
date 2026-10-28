"use server";

import { headers } from "next/headers";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { seasonAdminDb } from "@/lib/db";
import { requireActiveUser, hashPassword } from "@/lib/auth";
import { registrationSchema, registrationIsOpen } from "@/lib/league-validation";
import { allowLeagueApplication } from "@/lib/league-rate-limit";
import type { LeagueActionState } from "@/lib/league-action-state";

export async function submitLeagueRegistration(_state: LeagueActionState, form: FormData): Promise<LeagueActionState> {
  if (String(form.get("website") || "")) return { error: "No se pudo procesar la solicitud." };
  const requestHeaders = await headers();
  const key = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!allowLeagueApplication(key)) return { error: "Recibimos varios intentos. Esperá unos minutos antes de volver a enviar." };
  const auth = await requireActiveUser();
  if (auth && auth.user.role.key !== "DELEGADO") return { error: "La inscripción está destinada a cuentas de delegados. Usá una cuenta de delegado o cerrá esta sesión." };
  const existing = auth?.user;
  const parsed = registrationSchema.safeParse({
    seasonId: form.get("seasonId"), teamName: form.get("teamName"), shortName: form.get("shortName"), gamertag: form.get("gamertag"),
    firstName: existing?.firstName ?? form.get("firstName"), lastName: existing?.lastName ?? form.get("lastName"),
    email: existing?.email ?? form.get("email"), username: existing?.username ?? form.get("username"),
    phone: form.get("phone"), consent: form.get("consent") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "Revisá los datos." };
  const input = parsed.data;
  const password = String(form.get("password") || "");
  if (!existing && (password.length < 10 || password.length > 72 || Buffer.byteLength(password, "utf8") > 72 || password !== form.get("confirmPassword"))) return { error: "Usá una contraseña de 10 a 72 caracteres y repetila exactamente." };
  // Hash before taking a database lock; never store or echo the raw password.
  const passwordHash = existing ? null : await hashPassword(password);
  try {
    const result = await seasonAdminDb.$transaction(async tx => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock_shared(736527184)`;
      const settings = await tx.tournamentSettings.findUniqueOrThrow({ where: { id: "settings" } });
      const season = await tx.season.findUniqueOrThrow({ where: { id: input.seasonId } });
      if (settings.currentSeasonId !== season.id || !registrationIsOpen(season)) return { error: "Las inscripciones de esta liga están cerradas." };
      if (existing?.teamId && await tx.team.findFirst({ where: { id: existing.teamId, seasonId: season.id } })) return { error: "Ya administrás un equipo inscrito en esta liga." };
      if (!existing && await tx.user.findFirst({ where: { OR: [{ email: input.email }, { username: input.username }] }, select: { id: true } })) return { error: "Si ya tenés cuenta, ingresá antes de inscribir tu equipo. También podés elegir otro usuario." };
      await tx.leagueRegistration.create({ data: {
        seasonId: season.id, teamName: input.teamName, shortName: input.shortName, gamertag: input.gamertag,
        delegateFirstName: input.firstName, delegateLastName: input.lastName, email: input.email, phone: input.phone,
        username: input.username, userId: existing?.id, passwordHash,
      } });
      return { success: "Solicitud recibida. El equipo queda pendiente de aprobación. Una vez aprobado, podrás administrar tu equipo con tu usuario y contraseña.", link: "/admin/login", linkLabel: "Ingresar al panel" };
    });
    revalidatePath("/admin/inscripciones");
    revalidatePath("/inscripcion");
    return result;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { error: "Ya hay una inscripción con este equipo, correo o delegado para esta liga." };
    return { error: "No se pudo guardar la inscripción. Intentá nuevamente." };
  }
}
