"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireDelegate } from "@/lib/permissions";
import { logActivity } from "@/lib/activity";
import { myTeamSchema, playerSchema } from "@/lib/validation";
import { saveTeamLogo } from "@/lib/upload";
import { playerFullName } from "@/lib/format";

export type FormState = { error?: string; success?: string };

function revalidatePublic() {
  revalidatePath("/equipos");
  revalidatePath("/");
}

export async function updateMyTeamAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const { user: actor, teamId } = await requireDelegate();

  const parsed = myTeamSchema.safeParse({
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
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const duplicate = await prisma.team.findFirst({ where: { name: parsed.data.name, NOT: { id: teamId } } });
  if (duplicate) return { error: "Ya existe otro equipo con ese nombre." };

  let logoUrl: string | undefined;
  try {
    const uploaded = await saveTeamLogo(formData.get("logo") as File | null, teamId);
    if (uploaded) logoUrl = uploaded;
  } catch (e) {
    return { error: e instanceof Error ? e.message : "No se pudo subir el logo." };
  }

  const team = await prisma.team.update({
    where: { id: teamId },
    data: {
      name: parsed.data.name,
      shortName: parsed.data.shortName,
      delegateName: parsed.data.delegateName || null,
      delegatePhone: parsed.data.delegatePhone || null,
      delegateEmail: parsed.data.delegateEmail || null,
      homeVenue: parsed.data.homeVenue || null,
      instagramUrl: parsed.data.instagramUrl || null,
      facebookUrl: parsed.data.facebookUrl || null,
      youtubeUrl: parsed.data.youtubeUrl || null,
      twitchUrl: parsed.data.twitchUrl || null,
      discordUrl: parsed.data.discordUrl || null,
      tiktokUrl: parsed.data.tiktokUrl || null,
      gamertag: parsed.data.gamertag || null,
      ...(logoUrl ? { logoUrl } : {}),
    },
  });

  await logActivity(`${actor.firstName} ${actor.lastName} actualizó los datos de "${team.name}".`, actor.id);
  revalidatePath("/admin/mi-equipo");
  revalidatePublic();
  return { success: "Datos del equipo actualizados." };
}

export async function createMyPlayerAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const { user: actor, teamId } = await requireDelegate();

  const parsed = playerSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    jerseyNumber: formData.get("jerseyNumber"),
    position: formData.get("position"),
    teamId, // forzado desde la sesión, nunca desde el formulario
    birthDate: formData.get("birthDate"),
    status: formData.get("status"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const duplicateNumber = await prisma.player.findFirst({
    where: { teamId, jerseyNumber: parsed.data.jerseyNumber, status: "ACTIVO" },
  });
  if (duplicateNumber) return { error: `Ya hay un jugador activo con el número ${parsed.data.jerseyNumber}.` };

  const player = await prisma.player.create({
    data: {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName || null,
      jerseyNumber: parsed.data.jerseyNumber,
      position: parsed.data.position,
      teamId,
      birthDate: parsed.data.birthDate ? new Date(parsed.data.birthDate) : null,
      status: parsed.data.status,
    },
  });

  await logActivity(`${actor.firstName} ${actor.lastName} cargó el jugador "${playerFullName(player)}".`, actor.id);
  revalidatePath("/admin/mi-equipo");
  revalidatePublic();
  return { success: "Jugador creado." };
}

export async function updateMyPlayerAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const { user: actor, teamId } = await requireDelegate();
  const id = String(formData.get("id"));

  const parsed = playerSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    jerseyNumber: formData.get("jerseyNumber"),
    position: formData.get("position"),
    teamId, // forzado desde la sesión, nunca desde el formulario
    birthDate: formData.get("birthDate"),
    status: formData.get("status"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const target = await prisma.player.findUnique({ where: { id } });
  if (!target || target.teamId !== teamId) return { error: "El jugador no existe." };

  const duplicateNumber = await prisma.player.findFirst({
    where: { teamId, jerseyNumber: parsed.data.jerseyNumber, status: "ACTIVO", NOT: { id } },
  });
  if (duplicateNumber) return { error: `Ya hay un jugador activo con el número ${parsed.data.jerseyNumber}.` };

  await prisma.player.update({
    where: { id },
    data: {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName || null,
      jerseyNumber: parsed.data.jerseyNumber,
      position: parsed.data.position,
      birthDate: parsed.data.birthDate ? new Date(parsed.data.birthDate) : null,
      status: parsed.data.status,
    },
  });

  await logActivity(`${actor.firstName} ${actor.lastName} editó el jugador "${playerFullName(parsed.data)}".`, actor.id);
  revalidatePath("/admin/mi-equipo");
  revalidatePublic();
  return { success: "Jugador actualizado." };
}

export async function toggleMyPlayerStatusAction(formData: FormData): Promise<void> {
  const { user: actor, teamId } = await requireDelegate();
  const id = String(formData.get("id"));

  const target = await prisma.player.findUnique({ where: { id } });
  if (!target || target.teamId !== teamId) return;

  const newStatus = target.status === "ACTIVO" ? "INACTIVO" : "ACTIVO";
  await prisma.player.update({ where: { id }, data: { status: newStatus } });
  await logActivity(
    `${actor.firstName} ${actor.lastName} ${newStatus === "ACTIVO" ? "activó" : "desactivó"} el jugador "${playerFullName(target)}".`,
    actor.id,
  );
  revalidatePath("/admin/mi-equipo");
  revalidatePublic();
}
