"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { logActivity } from "@/lib/activity";
import { teamSchema } from "@/lib/validation";
import { saveTeamLogo } from "@/lib/upload";

export type FormState = { error?: string; success?: string };

function readTeamFormData(formData: FormData) {
  return {
    name: formData.get("name"),
    shortName: formData.get("shortName"),
    delegateName: formData.get("delegateName"),
    delegatePhone: formData.get("delegatePhone"),
    delegateEmail: formData.get("delegateEmail"),
    homeVenue: formData.get("homeVenue"),
    instagramUrl: formData.get("instagramUrl"),
    facebookUrl: formData.get("facebookUrl"),
    youtubeUrl: formData.get("youtubeUrl"),
    twitchUrl: formData.get("twitchUrl"),
    discordUrl: formData.get("discordUrl"),
    tiktokUrl: formData.get("tiktokUrl"),
    gamertag: formData.get("gamertag"),
    status: formData.get("status"),
  };
}

function teamContactData(parsed: {
  delegateName?: string | null;
  delegatePhone?: string | null;
  delegateEmail?: string | null;
  homeVenue?: string | null;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  youtubeUrl?: string | null;
  twitchUrl?: string | null;
  discordUrl?: string | null;
  tiktokUrl?: string | null;
  gamertag?: string | null;
}) {
  return {
    delegateName: parsed.delegateName || null,
    delegatePhone: parsed.delegatePhone || null,
    delegateEmail: parsed.delegateEmail || null,
    homeVenue: parsed.homeVenue || null,
    instagramUrl: parsed.instagramUrl || null,
    facebookUrl: parsed.facebookUrl || null,
    youtubeUrl: parsed.youtubeUrl || null,
    twitchUrl: parsed.twitchUrl || null,
    discordUrl: parsed.discordUrl || null,
    tiktokUrl: parsed.tiktokUrl || null,
    gamertag: parsed.gamertag || null,
  };
}

export async function createTeamAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const { user: actor } = await requirePermission("equipos");

  const parsed = teamSchema.safeParse(readTeamFormData(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const existing = await prisma.team.findUnique({ where: { name: parsed.data.name } });
  if (existing) return { error: "Ya existe un equipo con ese nombre." };

  const team = await prisma.team.create({
    data: {
      name: parsed.data.name,
      shortName: parsed.data.shortName,
      status: parsed.data.status,
      ...teamContactData(parsed.data),
    },
  });

  try {
    const logoUrl = await saveTeamLogo(formData.get("logo") as File | null, team.id);
    if (logoUrl) await prisma.team.update({ where: { id: team.id }, data: { logoUrl } });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "No se pudo subir el logo." };
  }

  await logActivity(`${actor.firstName} ${actor.lastName} creó el equipo "${team.name}".`, actor.id);
  revalidatePath("/admin/equipos");
  revalidatePath("/equipos");
  revalidatePath("/");
  return { success: "Equipo creado." };
}

export async function updateTeamAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const { user: actor } = await requirePermission("equipos");
  const id = String(formData.get("id"));

  const parsed = teamSchema.safeParse(readTeamFormData(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const target = await prisma.team.findUnique({ where: { id } });
  if (!target) return { error: "El equipo no existe." };

  const duplicate = await prisma.team.findFirst({ where: { name: parsed.data.name, NOT: { id } } });
  if (duplicate) return { error: "Ya existe otro equipo con ese nombre." };

  let logoUrl = target.logoUrl;
  try {
    const uploaded = await saveTeamLogo(formData.get("logo") as File | null, id);
    if (uploaded) logoUrl = uploaded;
  } catch (e) {
    return { error: e instanceof Error ? e.message : "No se pudo subir el logo." };
  }

  await prisma.team.update({
    where: { id },
    data: {
      name: parsed.data.name,
      shortName: parsed.data.shortName,
      status: parsed.data.status,
      logoUrl,
      ...teamContactData(parsed.data),
    },
  });

  await logActivity(`${actor.firstName} ${actor.lastName} editó el equipo "${parsed.data.name}".`, actor.id);
  revalidatePath("/admin/equipos");
  revalidatePath("/equipos");
  revalidatePath("/");
  return { success: "Equipo actualizado." };
}

export async function toggleTeamStatusAction(formData: FormData): Promise<void> {
  const { user: actor } = await requirePermission("equipos");
  const id = String(formData.get("id"));

  const target = await prisma.team.findUnique({ where: { id } });
  if (!target) return;
  if (target.status === "RETIRADO") return; // se reactiva editando el equipo, no con este botón

  const newStatus = target.status === "ACTIVO" ? "INACTIVO" : "ACTIVO";
  await prisma.team.update({ where: { id }, data: { status: newStatus } });
  await logActivity(
    `${actor.firstName} ${actor.lastName} ${newStatus === "ACTIVO" ? "activó" : "desactivó"} el equipo "${target.name}".`,
    actor.id,
  );
  revalidatePath("/admin/equipos");
  revalidatePath("/equipos");
}

const FORFEITABLE_STATUSES: ("PROGRAMADO" | "EN_CURSO" | "SUSPENDIDO" | "REPROGRAMADO")[] = [
  "PROGRAMADO",
  "EN_CURSO",
  "SUSPENDIDO",
  "REPROGRAMADO",
];

// Bonificación fija para el rival de cada partido YA JUGADO contra el
// equipo retirado, en vez del resultado real (que se anula: ver
// annulledTeamId en el schema) — decisión administrativa de la liga, no
// vinculada al valor normal de una victoria (3 pts).
const RETIRED_OPPONENT_BONUS_POINTS = 6;

/**
 * Retira un equipo de la liga a mitad de temporada (Art. 9): pasa a
 * RETIRADO (sigue en la tabla, pero ver más abajo qué puntos le quedan),
 * resuelve todos sus partidos todavía no jugados como 3-0 en contra por
 * abandono (walkover) para que el resto del fixture no quede colgado, y
 * anula sus partidos YA JUGADOS: dejan de contar (PJ, goles, PG/PE/PP) para
 * cualquiera de los dos equipos, y en cambio el rival recibe
 * RETIRED_OPPONENT_BONUS_POINTS de bonificación fija, sin importar el
 * resultado real (que sigue mostrándose en el detalle del partido, sólo a
 * título informativo).
 */
export async function retireTeamAction(formData: FormData): Promise<void> {
  const { user: actor } = await requirePermission("equipos");
  const id = String(formData.get("id"));

  const target = await prisma.team.findUnique({ where: { id } });
  if (!target || target.status === "RETIRADO") return;

  const pendingMatches = await prisma.match.findMany({
    where: {
      OR: [{ homeTeamId: id }, { awayTeamId: id }],
      status: { in: FORFEITABLE_STATUSES },
    },
    select: { id: true },
  });

  const playedMatches = await prisma.match.findMany({
    where: {
      OR: [{ homeTeamId: id }, { awayTeamId: id }],
      status: "FINALIZADO",
      forfeitedTeamId: null,
      annulledTeamId: null,
    },
    select: { id: true, homeTeamId: true, awayTeamId: true },
  });

  await prisma.$transaction([
    prisma.team.update({ where: { id }, data: { status: "RETIRADO" } }),
    ...pendingMatches.map((m) =>
      prisma.match.update({ where: { id: m.id }, data: { status: "FINALIZADO", forfeitedTeamId: id } }),
    ),
    ...playedMatches.flatMap((m) => [
      prisma.match.update({ where: { id: m.id }, data: { annulledTeamId: id } }),
      prisma.pointAdjustment.create({
        data: {
          teamId: m.homeTeamId === id ? m.awayTeamId : m.homeTeamId,
          points: RETIRED_OPPONENT_BONUS_POINTS,
          reason: `Bonificación por partido anulado contra "${target.name}", retirado de la liga.`,
          matchId: m.id,
        },
      }),
    ]),
  ]);

  await logActivity(
    `${actor.firstName} ${actor.lastName} retiró al equipo "${target.name}" de la liga` +
      (pendingMatches.length > 0
        ? ` — ${pendingMatches.length} partido(s) pendiente(s) se resolvieron 3-0 en contra por abandono.`
        : ".") +
      (playedMatches.length > 0
        ? ` — ${playedMatches.length} partido(s) ya jugado(s) se anularon y sus rivales recibieron ${RETIRED_OPPONENT_BONUS_POINTS} puntos de bonificación.`
        : ""),
    actor.id,
  );
  revalidatePath("/admin/equipos");
  revalidatePath("/admin/partidos");
  revalidatePath("/admin/resultados");
  revalidatePath("/admin/ajustes-puntos");
  revalidatePath("/equipos");
  revalidatePath("/fixture");
  revalidatePath("/resultados");
  revalidatePath("/posiciones");
  revalidatePath("/");
}

export async function deleteTeamAction(formData: FormData): Promise<void> {
  const { user: actor } = await requirePermission("equipos");
  const id = String(formData.get("id"));

  const target = await prisma.team.findUnique({
    where: { id },
    include: { _count: { select: { players: true, homeMatches: true, awayMatches: true } } },
  });
  if (!target) return;

  const hasRelated = target._count.players > 0 || target._count.homeMatches > 0 || target._count.awayMatches > 0;
  if (hasRelated) return; // el UI ya avisa: hay que desactivar, no se puede eliminar

  await prisma.team.delete({ where: { id } });
  await logActivity(`${actor.firstName} ${actor.lastName} eliminó el equipo "${target.name}".`, actor.id);
  revalidatePath("/admin/equipos");
  revalidatePath("/equipos");
}
