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

// Prefijo fijo del reason de cualquier PointAdjustment que una versión
// anterior de esta lógica haya llegado a crear, para poder encontrarlos y
// borrarlos en reconcileRetiredTeamAction (ya no se usan: el 3-0 walkover
// da los puntos directo por PJ/PG, no hace falta un ajuste aparte).
const RETIREMENT_BONUS_REASON_PREFIX = "Bonificación por partido anulado contra ";

/**
 * Retira un equipo de la liga a mitad de temporada (Art. 9): pasa a
 * RETIRADO (sigue en la tabla) y resuelve TODOS sus partidos contra el
 * resto de la liga —ya jugados o pendientes— por abandono
 * (forfeitedTeamId): 3-0 en contra suyo si el rival sigue activo (cuenta
 * como PJ, PG y 3 puntos para el rival, igual que un partido normal
 * ganado), pero **0-0 si el rival también está retirado** — no tendría
 * sentido darle una victoria a cualquiera de los dos sólo porque a éste le
 * tocó retirarse antes o después. El resultado real (si el partido se
 * había jugado) queda en la base pero deja de mostrarse — ver
 * getMatchScore en lib/format.ts.
 */
export async function retireTeamAction(formData: FormData): Promise<void> {
  const { user: actor } = await requirePermission("equipos");
  const id = String(formData.get("id"));

  const target = await prisma.team.findUnique({ where: { id } });
  if (!target || target.status === "RETIRADO") return;

  const matchesToForfeit = await prisma.match.findMany({
    where: {
      OR: [{ homeTeamId: id }, { awayTeamId: id }],
      forfeitedTeamId: null,
    },
    select: {
      id: true,
      homeTeamId: true,
      homeTeam: { select: { status: true } },
      awayTeam: { select: { status: true } },
    },
  });

  const withOpponentStatus = matchesToForfeit.map((m) => ({
    id: m.id,
    opponentAlsoRetired: (m.homeTeamId === id ? m.awayTeam.status : m.homeTeam.status) === "RETIRADO",
  }));
  const mutualCount = withOpponentStatus.filter((m) => m.opponentAlsoRetired).length;
  const forfeitCount = withOpponentStatus.length - mutualCount;

  await prisma.$transaction([
    prisma.team.update({ where: { id }, data: { status: "RETIRADO" } }),
    ...withOpponentStatus.map((m) =>
      prisma.match.update({
        where: { id: m.id },
        data: { status: "FINALIZADO", forfeitedTeamId: m.opponentAlsoRetired ? null : id },
      }),
    ),
  ]);

  const parts: string[] = [];
  if (forfeitCount > 0) parts.push(`${forfeitCount} partido(s) se resolvieron 3-0 en contra por abandono`);
  if (mutualCount > 0) parts.push(`${mutualCount} contra otro(s) equipo(s) también retirado(s) quedaron 0-0`);
  await logActivity(
    `${actor.firstName} ${actor.lastName} retiró al equipo "${target.name}" de la liga` +
      (parts.length > 0 ? ` — ${parts.join("; ")}.` : "."),
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
 * Corrige a un equipo YA retirado cuyos partidos quedaron mal resueltos —
 * ya sea por una versión anterior de esta lógica (anulados con una
 * bonificación de puntos aparte, en vez de contar como un 3-0 ganado
 * normal), o porque un cruce contra OTRO equipo que también terminó
 * retirado le quedó con un 3-0 a favor de uno de los dos en vez de 0-0
 * (pasa cuando ese partido todavía no existía o seguía pendiente cuando
 * el primero de los dos se retiró, y recién el segundo retiro lo
 * resolvió — ver retireTeamAction). retireTeamAction no se puede volver a
 * ejecutar sobre un equipo que ya está en RETIRADO, así que esto recorre
 * sus partidos sueltos y los deja en el estado que corresponde según el
 * estado actual del rival, y borra cualquier PointAdjustment de la
 * bonificación vieja que ya no corresponde (evita duplicar puntos). Es
 * seguro ejecutarlo más de una vez.
 */
export async function reconcileRetiredTeamAction(formData: FormData): Promise<void> {
  const { user: actor } = await requirePermission("equipos");
  const id = String(formData.get("id"));

  const target = await prisma.team.findUnique({ where: { id } });
  if (!target || target.status !== "RETIRADO") return;

  const matches = await prisma.match.findMany({
    where: { OR: [{ homeTeamId: id }, { awayTeamId: id }] },
    include: {
      pointAdjustments: true,
      homeTeam: { select: { status: true } },
      awayTeam: { select: { status: true } },
    },
  });

  const pending = matches
    .map((m) => {
      const opponentId = m.homeTeamId === id ? m.awayTeamId : m.homeTeamId;
      const opponentAlsoRetired = (m.homeTeamId === id ? m.awayTeam.status : m.homeTeam.status) === "RETIRADO";
      const correctForfeitedTeamId = opponentAlsoRetired ? null : id;
      const needsFix = m.forfeitedTeamId !== correctForfeitedTeamId;
      const staleBonuses = m.pointAdjustments.filter(
        (pa) => pa.teamId === opponentId && pa.reason.startsWith(RETIREMENT_BONUS_REASON_PREFIX),
      );
      return { match: m, needsFix, correctForfeitedTeamId, staleBonuses };
    })
    .filter((x) => x.needsFix || x.staleBonuses.length > 0);

  if (pending.length > 0) {
    await prisma.$transaction(
      pending.flatMap(({ match: m, needsFix, correctForfeitedTeamId, staleBonuses }) => [
        ...(needsFix
          ? [
              prisma.match.update({
                where: { id: m.id },
                data: { status: "FINALIZADO", forfeitedTeamId: correctForfeitedTeamId },
              }),
            ]
          : []),
        ...staleBonuses.map((pa) => prisma.pointAdjustment.delete({ where: { id: pa.id } })),
      ]),
    );
  }

  const fixedCount = pending.filter((x) => x.needsFix).length;
  await logActivity(
    `${actor.firstName} ${actor.lastName} reconcilió los partidos del equipo retirado "${target.name}"` +
      (fixedCount > 0
        ? ` — ${fixedCount} partido(s) corregido(s) (3-0 walkover contra rivales activos, 0-0 contra rivales también retirados).`
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
