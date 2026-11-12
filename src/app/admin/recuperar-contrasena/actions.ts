"use server";

import { randomBytes, createHash } from "node:crypto";
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

  // Validate the canonical origin before persisting a usable reset token.
  const configuredOrigin = process.env.APP_URL;
  if (!configuredOrigin) return { success: GENERIC_SUCCESS };
  let origin: URL;
  try {
    origin = new URL(configuredOrigin);
    if (origin.username || origin.password || origin.search || origin.hash ||
      (process.env.NODE_ENV === "production" && origin.protocol !== "https:") ||
      !["https:", "http:"].includes(origin.protocol)) return { success: GENERIC_SUCCESS };
  } catch {
    return { success: GENERIC_SUCCESS };
  }

  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");

  await prisma.passwordResetToken.create({
    data: { tokenHash, userId: user.id, expiresAt: new Date(Date.now() + TOKEN_TTL_MS) },
  });

  // Never derive a password-reset destination from attacker-controlled Host headers.
  const resetUrl = new URL("/admin/restablecer-contrasena", origin);
  resetUrl.searchParams.set("token", rawToken);

  await sendPasswordResetEmail(user.email, `${user.firstName} ${user.lastName}`, resetUrl.toString());

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
  const changed = await prisma.$transaction(async (tx) => {
    const consumed = await tx.passwordResetToken.updateMany({
      where: { id: record.id, usedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date() },
    });
    if (consumed.count !== 1) return false;
    await tx.user.update({ where: { id: record.userId }, data: { passwordHash, mustChangePassword: false } });
    return true;
  });
  if (!changed) return { error: invalidMessage };

  await logActivity(`${record.user.firstName} ${record.user.lastName} restableció su contraseña por correo.`, record.userId);

  return { success: "Contraseña actualizada. Ya podés ingresar con la nueva." };
}
