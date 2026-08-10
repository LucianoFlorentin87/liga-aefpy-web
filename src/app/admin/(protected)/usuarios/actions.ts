"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { canAssignRole } from "@/lib/permissions";
import { hashPassword } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { createUserSchema, updateUserSchema, resetPasswordSchema } from "@/lib/validation";

export type FormState = { error?: string; success?: string };

async function getRoleByKey(key: string) {
  const role = await prisma.role.findUnique({ where: { key: key as never } });
  if (!role) throw new Error(`Rol inválido: ${key}`);
  return role;
}

export async function createUserAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const { session, user: actor } = await requirePermission("usuarios");

  const parsed = createUserSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    username: formData.get("username"),
    password: formData.get("password"),
    role: formData.get("role"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  if (!canAssignRole(session.role, parsed.data.role)) {
    return { error: "No tenés permiso para asignar ese rol." };
  }

  const email = parsed.data.email.toLowerCase();
  const username = parsed.data.username.toLowerCase();

  const existing = await prisma.user.findFirst({ where: { OR: [{ email }, { username }] } });
  if (existing) {
    return { error: "Ya existe un usuario con ese correo o usuario." };
  }

  const role = await getRoleByKey(parsed.data.role);
  const passwordHash = await hashPassword(parsed.data.password);

  await prisma.user.create({
    data: {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      email,
      username,
      passwordHash,
      roleId: role.id,
      status: parsed.data.status,
      mustChangePassword: true,
    },
  });

  await logActivity(`${actor.firstName} ${actor.lastName} creó el usuario "${username}".`, actor.id);
  revalidatePath("/admin/usuarios");
  return { success: "Usuario creado correctamente." };
}

export async function updateUserAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const { session, user: actor } = await requirePermission("usuarios");

  const parsed = updateUserSchema.safeParse({
    id: formData.get("id"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    username: formData.get("username"),
    role: formData.get("role"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const target = await prisma.user.findUnique({ where: { id: parsed.data.id }, include: { role: true } });
  if (!target) return { error: "El usuario no existe." };

  if (!canAssignRole(session.role, parsed.data.role)) {
    return { error: "No tenés permiso para asignar ese rol." };
  }
  if (target.role.key === "SUPERADMIN" && parsed.data.role !== "SUPERADMIN" && session.sub === target.id) {
    return { error: "No podés quitarte a vos mismo el rol de Superadmin." };
  }
  if (target.id === actor.id && parsed.data.status === "INACTIVO") {
    return { error: "No podés desactivar tu propia cuenta." };
  }
  if (target.role.key === "SUPERADMIN" && parsed.data.status === "INACTIVO") {
    const activeSuperadmins = await prisma.user.count({
      where: { status: "ACTIVO", role: { key: "SUPERADMIN" } },
    });
    if (activeSuperadmins <= 1) {
      return { error: "No podés desactivar al único Superadmin activo." };
    }
  }

  const email = parsed.data.email.toLowerCase();
  const username = parsed.data.username.toLowerCase();
  const duplicate = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }], NOT: { id: target.id } },
  });
  if (duplicate) return { error: "Ya existe otro usuario con ese correo o usuario." };

  const role = await getRoleByKey(parsed.data.role);

  await prisma.user.update({
    where: { id: target.id },
    data: {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      email,
      username,
      roleId: role.id,
      status: parsed.data.status,
    },
  });

  await logActivity(`${actor.firstName} ${actor.lastName} editó el usuario "${username}".`, actor.id);
  revalidatePath("/admin/usuarios");
  return { success: "Usuario actualizado." };
}

export async function toggleUserStatusAction(formData: FormData): Promise<void> {
  const { user: actor } = await requirePermission("usuarios");
  const id = String(formData.get("id"));

  const target = await prisma.user.findUnique({ where: { id }, include: { role: true } });
  if (!target) return;

  if (target.id === actor.id) return; // no auto-desactivación
  if (target.status === "ACTIVO" && target.role.key === "SUPERADMIN") {
    const activeSuperadmins = await prisma.user.count({
      where: { status: "ACTIVO", role: { key: "SUPERADMIN" } },
    });
    if (activeSuperadmins <= 1) return; // no dejar el sistema sin superadmin
  }

  const newStatus = target.status === "ACTIVO" ? "INACTIVO" : "ACTIVO";
  await prisma.user.update({ where: { id }, data: { status: newStatus } });
  await logActivity(
    `${actor.firstName} ${actor.lastName} ${newStatus === "ACTIVO" ? "activó" : "desactivó"} el usuario "${target.username}".`,
    actor.id,
  );
  revalidatePath("/admin/usuarios");
}

export async function deleteUserAction(formData: FormData): Promise<void> {
  const { user: actor } = await requirePermission("usuarios");
  const id = String(formData.get("id"));

  const target = await prisma.user.findUnique({ where: { id }, include: { role: true } });
  if (!target) return;
  if (target.id === actor.id) return; // no autoeliminación

  if (target.role.key === "SUPERADMIN") {
    const superadmins = await prisma.user.count({ where: { role: { key: "SUPERADMIN" } } });
    if (superadmins <= 1) return; // no eliminar al único superadmin del sistema
  }

  await prisma.user.delete({ where: { id } });
  await logActivity(`${actor.firstName} ${actor.lastName} eliminó el usuario "${target.username}".`, actor.id);
  revalidatePath("/admin/usuarios");
}

export async function resetPasswordAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const { user: actor } = await requirePermission("usuarios");

  const parsed = resetPasswordSchema.safeParse({
    id: formData.get("id"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const target = await prisma.user.findUnique({ where: { id: parsed.data.id } });
  if (!target) return { error: "El usuario no existe." };

  const passwordHash = await hashPassword(parsed.data.password);
  await prisma.user.update({
    where: { id: target.id },
    data: { passwordHash, mustChangePassword: true },
  });

  await logActivity(`${actor.firstName} ${actor.lastName} restableció la contraseña de "${target.username}".`, actor.id);
  revalidatePath("/admin/usuarios");
  return { success: "Contraseña restablecida." };
}
