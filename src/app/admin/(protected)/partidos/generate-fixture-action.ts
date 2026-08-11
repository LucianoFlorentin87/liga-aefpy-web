"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { logActivity } from "@/lib/activity";
import { generateFixtureSchema } from "@/lib/validation";
import { generateDoubleRoundRobin } from "@/lib/fixture";

export type FormState = { error?: string; success?: string };

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

export async function generateFixtureAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const { user: actor } = await requirePermission("partidos");

  const parsed = generateFixtureSchema.safeParse({
    startDate: formData.get("startDate"),
    matchTime: formData.get("matchTime"),
    venue: formData.get("venue"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const existingMatches = await prisma.match.count();
  if (existingMatches > 0) {
    return {
      error:
        "Ya hay partidos cargados. Para regenerar el fixture, primero eliminá todos los partidos existentes.",
    };
  }

  const teams = await prisma.team.findMany({ where: { status: "ACTIVO" }, orderBy: { name: "asc" } });
  if (teams.length < 2) {
    return { error: "Necesitás al menos 2 equipos activos para generar el fixture." };
  }

  const rounds = generateDoubleRoundRobin(teams.map((t) => t.id));
  const startDate = new Date(`${parsed.data.startDate}T00:00:00.000Z`);

  const data = rounds.flatMap((round, roundIndex) =>
    round.map((pair) => ({
      matchday: roundIndex + 1,
      date: addDays(startDate, roundIndex * 7),
      time: parsed.data.matchTime,
      venue: parsed.data.venue,
      homeTeamId: pair.homeTeamId,
      awayTeamId: pair.awayTeamId,
      status: "PROGRAMADO" as const,
    })),
  );

  await prisma.match.createMany({ data });

  await logActivity(
    `${actor.firstName} ${actor.lastName} generó el fixture (ida y vuelta): ${data.length} partidos en ${rounds.length} jornadas para ${teams.length} equipos.`,
    actor.id,
  );

  revalidatePath("/admin/partidos");
  revalidatePath("/admin/resultados");
  revalidatePath("/");
  revalidatePath("/fixture");

  return { success: `Fixture generado: ${data.length} partidos en ${rounds.length} jornadas (una por semana, empezando el ${parsed.data.startDate}).` };
}
