"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { logActivity } from "@/lib/activity";
import { matchSchema } from "@/lib/validation";
import { matchStatusLabel } from "@/lib/format";

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

export type BulkFormState = { error?: string; success?: string };

export async function deleteMatchesAction(_prevState: BulkFormState, formData: FormData): Promise<BulkFormState> {
  const { user: actor } = await requirePermission("partidos");
  const ids = formData.getAll("ids").map(String);
  if (ids.length === 0) return { error: "No seleccionaste ningún partido." };

  const targets = await prisma.match.findMany({
    where: { id: { in: ids } },
    include: { _count: { select: { goals: true, cards: true } } },
  });
  const deletable = targets.filter((m) => m._count.goals === 0 && m._count.cards === 0);
  const skipped = targets.length - deletable.length;

  if (deletable.length > 0) {
    await prisma.match.deleteMany({ where: { id: { in: deletable.map((m) => m.id) } } });
    await logActivity(`${actor.firstName} ${actor.lastName} eliminó ${deletable.length} partido(s) en lote.`, actor.id);
    revalidatePath("/admin/partidos");
    revalidatePath("/admin/resultados");
    revalidatePublic();
  }

  if (skipped > 0) {
    return {
      error:
        deletable.length > 0
          ? `Se eliminaron ${deletable.length}. ${skipped} no se pudieron eliminar porque ya tienen goles o tarjetas cargadas.`
          : `Ninguno se pudo eliminar: ${skipped} ya tiene(n) goles o tarjetas cargadas.`,
    };
  }
  return { success: `${deletable.length} partido(s) eliminado(s).` };
}

const BULK_STATUSES = ["PROGRAMADO", "EN_CURSO", "FINALIZADO", "SUSPENDIDO", "REPROGRAMADO"] as const;

export async function updateMatchesStatusAction(_prevState: BulkFormState, formData: FormData): Promise<BulkFormState> {
  const { user: actor } = await requirePermission("partidos");
  const ids = formData.getAll("ids").map(String);
  const status = String(formData.get("status"));

  if (ids.length === 0) return { error: "No seleccionaste ningún partido." };
  if (!BULK_STATUSES.includes(status as (typeof BULK_STATUSES)[number])) return { error: "Estado inválido." };

  await prisma.match.updateMany({ where: { id: { in: ids } }, data: { status: status as (typeof BULK_STATUSES)[number] } });
  await logActivity(
    `${actor.firstName} ${actor.lastName} cambió el estado de ${ids.length} partido(s) en lote a "${matchStatusLabel(status)}".`,
    actor.id,
  );
  revalidatePath("/admin/partidos");
  revalidatePath("/admin/resultados");
  revalidatePublic();
  return { success: `Estado actualizado en ${ids.length} partido(s).` };
}
