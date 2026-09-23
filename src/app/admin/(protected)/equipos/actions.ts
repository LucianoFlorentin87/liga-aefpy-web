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
 * resto de la liga —ya jugados o pendientes— como 3-0 en contra suyo por
 * abandono (forfeitedTeamId), igual que un partido normal ganado: cuenta
 * como PJ, PG y 3 puntos para el rival en las columnas de siempre, sin
 * bonificación aparte ni resultado invisible. El resultado real (si el
 * partido se había jugado) queda en la base pero deja de mostrarse — ver
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
    select: { id: true },
  });

  await prisma.$transaction([
    prisma.team.update({ where: { id }, data: { status: "RETIRADO" } }),
    ...matchesToForfeit.map((m) =>
      prisma.match.update({ where: { id: m.id }, data: { status: "FINALIZADO", forfeitedTeamId: id } }),
    ),
  ]);

  await logActivity(
    `${actor.firstName} ${actor.lastName} retiró al equipo "${target.name}" de la liga` +
      (matchesToForfeit.length > 0
        ? ` — ${matchesToForfeit.length} partido(s) se resolvieron 3-0 en contra por abandono.`
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
 * una versión anterior de esta lógica (anulados con una bonificación de
 * puntos aparte, en vez de contar como un 3-0 ganado normal) —
 * retireTeamAction no se puede volver a ejecutar sobre un equipo que ya
 * está en RETIRADO, así que esto recorre sus partidos sueltos, los pasa a
 * forfeitedTeamId (3-0 walkover, cuenta como PJ/PG normal) y borra
 * cualquier PointAdjustment de la bonificación vieja que ya no corresponde
 * (evita duplicar puntos). Es seguro ejecutarlo más de una vez.
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
      const needsForfeit = m.forfeitedTeamId !== id;
      const staleBonuses = m.pointAdjustments.filter(
        (pa) => pa.teamId === opponentId && pa.reason.startsWith(RETIREMENT_BONUS_REASON_PREFIX),
      );
      return { match: m, needsForfeit, staleBonuses };
    })
    .filter((x) => x.needsForfeit || x.staleBonuses.length > 0);

  if (pending.length > 0) {
    await prisma.$transaction(
      pending.flatMap(({ match: m, needsForfeit, staleBonuses }) => [
        ...(needsForfeit
          ? [
              prisma.match.update({
                where: { id: m.id },
                data: { status: "FINALIZADO", forfeitedTeamId: id },
              }),
            ]
          : []),
        ...staleBonuses.map((pa) => prisma.pointAdjustment.delete({ where: { id: pa.id } })),
      ]),
    );
  }

  await logActivity(
    `${actor.firstName} ${actor.lastName} reconcilió los partidos del equipo retirado "${target.name}"` +
      (pending.length > 0
        ? ` — ${pending.length} partido(s) corregido(s) a 3-0 walkover, sin bonificación aparte.`
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
