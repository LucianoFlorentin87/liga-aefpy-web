"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { logActivity } from "@/lib/activity";
import { matchSchema } from "@/lib/validation";

export type FormState = { error?: string; success?: string };

function revalidatePublic() {
  revalidatePath("/");
  revalidatePath("/fixture");
  revalidatePath("/resultados");
  revalidatePath("/posiciones");
  revalidatePath("/goleadores");
  revalidatePath("/disciplina");
  revalidatePath("/equipos");
}

export async function createMatchAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const { user: actor } = await requirePermission("partidos");

  const parsed = matchSchema.safeParse({
    matchday: formData.get("matchday"),
    date: formData.get("date"),
    time: formData.get("time"),
    venue: formData.get("venue"),
    homeTeamId: formData.get("homeTeamId"),
    awayTeamId: formData.get("awayTeamId"),
    status: formData.get("status"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const [home, away] = await Promise.all([
    prisma.team.findUnique({ where: { id: parsed.data.homeTeamId } }),
    prisma.team.findUnique({ where: { id: parsed.data.awayTeamId } }),
  ]);
  if (!home || !away) return { error: "Seleccioná equipos válidos." };

  await prisma.match.create({
    data: {
      matchday: parsed.data.matchday,
      date: new Date(parsed.data.date),
      time: parsed.data.time,
      venue: parsed.data.venue,
      homeTeamId: parsed.data.homeTeamId,
      awayTeamId: parsed.data.awayTeamId,
      status: parsed.data.status,
      notes: parsed.data.notes || null,
    },
  });

  await logActivity(`${actor.firstName} ${actor.lastName} agregó el partido ${home.name} vs ${away.name} (Jornada ${parsed.data.matchday}).`, actor.id);
  revalidatePath("/admin/partidos");
  revalidatePath("/admin/resultados");
  revalidatePublic();
  return { success: "Partido creado." };
}

export async function updateMatchAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const { user: actor } = await requirePermission("partidos");
  const id = String(formData.get("id"));

  const parsed = matchSchema.safeParse({
    matchday: formData.get("matchday"),
    date: formData.get("date"),
    time: formData.get("time"),
    venue: formData.get("venue"),
    homeTeamId: formData.get("homeTeamId"),
    awayTeamId: formData.get("awayTeamId"),
    status: formData.get("status"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const target = await prisma.match.findUnique({ where: { id } });
  if (!target) return { error: "El partido no existe." };

  const [home, away] = await Promise.all([
    prisma.team.findUnique({ where: { id: parsed.data.homeTeamId } }),
    prisma.team.findUnique({ where: { id: parsed.data.awayTeamId } }),
  ]);
  if (!home || !away) return { error: "Seleccioná equipos válidos." };

  await prisma.match.update({
    where: { id },
    data: {
      matchday: parsed.data.matchday,
      date: new Date(parsed.data.date),
      time: parsed.data.time,
      venue: parsed.data.venue,
      homeTeamId: parsed.data.homeTeamId,
      awayTeamId: parsed.data.awayTeamId,
      status: parsed.data.status,
      notes: parsed.data.notes || null,
    },
  });

  await logActivity(`${actor.firstName} ${actor.lastName} actualizó el partido ${home.name} vs ${away.name}.`, actor.id);
  revalidatePath("/admin/partidos");
  revalidatePath(`/admin/partidos/${id}`);
  revalidatePath("/admin/resultados");
  revalidatePublic();
  return { success: "Partido actualizado." };
}

export async function deleteMatchAction(formData: FormData): Promise<void> {
  const { user: actor } = await requirePermission("partidos");
  const id = String(formData.get("id"));

  const target = await prisma.match.findUnique({
    where: { id },
    include: { homeTeam: true, awayTeam: true, _count: { select: { goals: true, cards: true } } },
  });
  if (!target) return;
  if (target._count.goals > 0 || target._count.cards > 0) return; // hay que suspender/reprogramar, no eliminar

  await prisma.match.delete({ where: { id } });
  await logActivity(`${actor.firstName} ${actor.lastName} eliminó el partido ${target.homeTeam.name} vs ${target.awayTeam.name}.`, actor.id);
  revalidatePath("/admin/partidos");
  revalidatePath("/admin/resultados");
  revalidatePublic();
}
