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

// El rival recibe el valor normal de una victoria (3 pts) por CADA partido
// contra el equipo retirado — ya jugado (cualquier resultado real: ganó,
// empató o perdió) o todavía pendiente —, como si lo hubiera ganado. Si el
// campeonato es ida y vuelta, un rival con los dos partidos contra el
// retirado recibe 3+3=6 en total; uno con un solo partido recibe 3.
const RETIRED_OPPONENT_BONUS_POINTS = 3;

// Prefijo fijo del reason de cada PointAdjustment que otorga esta
// bonificación, para poder detectarlos de forma confiable en
// reconcileRetiredTeamAction sin depender de otra marca.
const RETIREMENT_BONUS_REASON_PREFIX = "Bonificación por partido anulado contra ";

/**
 * Retira un equipo de la liga a mitad de temporada (Art. 9): pasa a
 * RETIRADO (sigue en la tabla, pero ver más abajo qué puntos le quedan) y
 * anula TODOS sus partidos contra el resto de la liga, ya jugados o
 * pendientes: dejan de contar (PJ, goles, PG/PE/PP) para cualquiera de los
 * dos equipos, sin importar el resultado real, y en cambio el rival recibe
 * RETIRED_OPPONENT_BONUS_POINTS de bonificación fija por cada uno.
 */
export async function retireTeamAction(formData: FormData): Promise<void> {
  const { user: actor } = await requirePermission("equipos");
  const id = String(formData.get("id"));

  const target = await prisma.team.findUnique({ where: { id } });
  if (!target || target.status === "RETIRADO") return;

  const matchesToAnnul = await prisma.match.findMany({
    where: {
      OR: [{ homeTeamId: id }, { awayTeamId: id }],
      annulledTeamId: null,
    },
    select: { id: true, homeTeamId: true, awayTeamId: true },
  });

  await prisma.$transaction([
    prisma.team.update({ where: { id }, data: { status: "RETIRADO" } }),
    ...matchesToAnnul.flatMap((m) => [
      prisma.match.update({ where: { id: m.id }, data: { status: "FINALIZADO", annulledTeamId: id } }),
      prisma.pointAdjustment.create({
        data: {
          teamId: m.homeTeamId === id ? m.awayTeamId : m.homeTeamId,
          points: RETIRED_OPPONENT_BONUS_POINTS,
          reason: `${RETIREMENT_BONUS_REASON_PREFIX}"${target.name}", retirado de la liga.`,
          matchId: m.id,
        },
      }),
    ]),
  ]);

  await logActivity(
    `${actor.firstName} ${actor.lastName} retiró al equipo "${target.name}" de la liga` +
      (matchesToAnnul.length > 0
        ? ` — ${matchesToAnnul.length} partido(s) se anularon y sus rivales recibieron ${RETIRED_OPPONENT_BONUS_POINTS} puntos de bonificación cada uno.`
        : "."),
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

/**
 * Corrige a un equipo YA retirado cuyos partidos quedaron procesados con
 * una versión anterior de esta lógica (walkover 3-0 real en vez de
 * anulado, un resultado real sin ninguna bonificación, o una bonificación
 * con un valor de puntos que ya no es el vigente) — retireTeamAction no se
 * puede volver a ejecutar sobre un equipo que ya está en RETIRADO, así que
 * esto recorre sus partidos sueltos y los deja en el estado final
 * correcto: anulados, con el rival recibiendo exactamente
 * RETIRED_OPPONENT_BONUS_POINTS por partido (ni de más ni de menos). Es
 * seguro ejecutarlo más de una vez.
 */
export async function reconcileRetiredTeamAction(formData: FormData): Promise<void> {
  const { user: actor } = await requirePermission("equipos");
  const id = String(formData.get("id"));

  const target = await prisma.team.findUnique({ where: { id } });
  if (!target || target.status !== "RETIRADO") return;

  const matches = await prisma.match.findMany({
    where: { OR: [{ homeTeamId: id }, { awayTeamId: id }] },
    include: { pointAdjustments: true },
  });

  const pending = matches
    .map((m) => {
      const opponentId = m.homeTeamId === id ? m.awayTeamId : m.homeTeamId;
      const needsAnnul = m.annulledTeamId !== id;
      const existingBonus = m.pointAdjustments.find(
        (pa) => pa.teamId === opponentId && pa.reason.startsWith(RETIREMENT_BONUS_REASON_PREFIX),
      );
      const needsBonusCreate = !existingBonus;
      const needsBonusFix = Boolean(existingBonus) && existingBonus!.points !== RETIRED_OPPONENT_BONUS_POINTS;
      return { match: m, opponentId, needsAnnul, existingBonus, needsBonusCreate, needsBonusFix };
    })
    .filter((x) => x.needsAnnul || x.needsBonusCreate || x.needsBonusFix);

  if (pending.length > 0) {
    await prisma.$transaction(
      pending.flatMap(({ match: m, opponentId, needsAnnul, existingBonus, needsBonusCreate, needsBonusFix }) => [
        ...(needsAnnul
          ? [
              prisma.match.update({
                where: { id: m.id },
                data: { status: "FINALIZADO", annulledTeamId: id, forfeitedTeamId: null },
              }),
            ]
          : []),
        ...(needsBonusCreate
          ? [
              prisma.pointAdjustment.create({
                data: {
                  teamId: opponentId,
                  points: RETIRED_OPPONENT_BONUS_POINTS,
                  reason: `${RETIREMENT_BONUS_REASON_PREFIX}"${target.name}", retirado de la liga.`,
                  matchId: m.id,
                },
              }),
            ]
          : []),
        ...(needsBonusFix
          ? [
              prisma.pointAdjustment.update({
                where: { id: existingBonus!.id },
                data: { points: RETIRED_OPPONENT_BONUS_POINTS },
              }),
            ]
          : []),
      ]),
    );
  }

  await logActivity(
    `${actor.firstName} ${actor.lastName} reconcilió los partidos del equipo retirado "${target.name}"` +
      (pending.length > 0
        ? ` — ${pending.length} partido(s) corregido(s) a la bonificación de ${RETIRED_OPPONENT_BONUS_POINTS} puntos por partido.`
        : " — no había nada para corregir."),
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
