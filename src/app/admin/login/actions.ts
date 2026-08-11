"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { verifyPassword, createSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { loginSchema } from "@/lib/validation";

export type LoginState = { error?: string };

export async function loginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    identifier: formData.get("identifier"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Ingresá tu usuario/correo y tu contraseña." };
  }

  const identifier = parsed.data.identifier.trim().toLowerCase();

  const user = await prisma.user.findFirst({
    where: { OR: [{ username: identifier }, { email: identifier }] },
    include: { role: true },
  });

  // Mensaje genérico siempre igual: no revela si el usuario existe, si está
  // inactivo, o si fue la contraseña la que falló.
  const invalidMessage = "Usuario o contraseña incorrectos.";

  if (!user || user.status !== "ACTIVO") {
    return { error: invalidMessage };
  }

  const validPassword = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!validPassword) {
    return { error: invalidMessage };
  }

  await createSession({
    sub: user.id,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role.key,
  });

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await logActivity(`${user.firstName} ${user.lastName} inició sesión.`, user.id);

  redirect(user.role.key === "DELEGADO" ? "/admin/mi-equipo" : "/admin/dashboard");
}
