"use server";

import { randomBytes, createHash } from "node:crypto";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { requestPasswordResetSchema, completePasswordResetSchema } from "@/lib/validation";
import { sendPasswordResetEmail } from "@/lib/email";
import { hashPassword } from "@/lib/password";
import { logActivity } from "@/lib/activity";

export type FormState = { error?: string; success?: string };

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hora

// Mismo mensaje exista o no la cuenta, y aunque el envío del correo falle —
// no hay forma de saber por afuera si un email está registrado o no.
const GENERIC_SUCCESS = "Si ese correo está registrado, te vamos a enviar un enlace para elegir una nueva contraseña.";

export async function requestPasswordResetAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const parsed = requestPasswordResetSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Correo inválido." };
  }

  const email = parsed.data.email.trim().toLowerCase();
  const user = await prisma.user.findFirst({ where: { email, status: "ACTIVO" } });
  if (!user) {
    return { success: GENERIC_SUCCESS };
  }

  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");

  await prisma.passwordResetToken.create({
    data: { tokenHash, userId: user.id, expiresAt: new Date(Date.now() + TOKEN_TTL_MS) },
  });

  const hdrs = await headers();
  const host = hdrs.get("host");
  const proto = hdrs.get("x-forwarded-proto") ?? "https";
  const resetUrl = `${proto}://${host}/admin/restablecer-contrasena?token=${rawToken}`;

  await sendPasswordResetEmail(user.email, `${user.firstName} ${user.lastName}`, resetUrl);

  return { success: GENERIC_SUCCESS };
}

export async function completePasswordResetAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const parsed = completePasswordResetSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const invalidMessage = "Este enlace no es válido o ya expiró. Pedí uno nuevo.";

  const tokenHash = createHash("sha256").update(parsed.data.token).digest("hex");
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!record || record.usedAt || record.expiresAt < new Date() || record.user.status !== "ACTIVO") {
    return { error: invalidMessage };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash, mustChangePassword: false } }),
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);

  await logActivity(`${record.user.firstName} ${record.user.lastName} restableció su contraseña por correo.`, record.userId);

  return { success: "Contraseña actualizada. Ya podés ingresar con la nueva." };
}
