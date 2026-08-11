"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { createFanSession, destroyFanSession, getFanSession } from "@/lib/fan-auth";
import { fanRegisterSchema, fanLoginSchema } from "@/lib/validation";

export type FanFormState = { error?: string };

export async function registerFanAction(_prevState: FanFormState, formData: FormData): Promise<FanFormState> {
  const parsed = fanRegisterSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.fanUser.findUnique({ where: { email } });
  if (existing) {
    return { error: "Ya existe una cuenta con ese correo." };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const fan = await prisma.fanUser.create({
    data: {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      email,
      passwordHash,
    },
  });

  await createFanSession({ sub: fan.id, firstName: fan.firstName, lastName: fan.lastName });
  redirect("/fixture");
}

export async function loginFanAction(_prevState: FanFormState, formData: FormData): Promise<FanFormState> {
  const parsed = fanLoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "Ingresá tu correo y tu contraseña." };
  }

  const email = parsed.data.email.toLowerCase();
  const invalidMessage = "Correo o contraseña incorrectos.";

  const fan = await prisma.fanUser.findUnique({ where: { email } });
  if (!fan) return { error: invalidMessage };

  const valid = await verifyPassword(parsed.data.password, fan.passwordHash);
  if (!valid) return { error: invalidMessage };

  await createFanSession({ sub: fan.id, firstName: fan.firstName, lastName: fan.lastName });
  redirect("/fixture");
}

export async function logoutFanAction(): Promise<void> {
  await destroyFanSession();
  redirect("/fixture");
}

export async function getCurrentFan() {
  const session = await getFanSession();
  if (!session) return null;
  return session;
}
