import "server-only";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { RoleKey } from "@prisma/client";
import { prisma } from "@/lib/db";

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "exafrutos_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 8; // 8 horas

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "SESSION_SECRET no está configurado (o es demasiado corto). Definilo en .env — ver .env.example.",
    );
  }
  return new TextEncoder().encode(secret);
}

export type SessionPayload = {
  sub: string; // user id
  username: string;
  firstName: string;
  lastName: string;
  role: RoleKey;
};

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return {
      sub: payload.sub as string,
      username: payload.username as string,
      firstName: payload.firstName as string,
      lastName: payload.lastName as string,
      role: payload.role as RoleKey,
    };
  } catch {
    return null;
  }
}

/**
 * Vuelve a validar contra la base de datos (no confía solo en el JWT) que el
 * usuario sigue existiendo y activo. Usar en acciones sensibles.
 */
export async function requireActiveUser() {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    include: { role: true },
  });

  if (!user || user.status !== "ACTIVO") return null;

  return { session, user };
}

export const SESSION_COOKIE = SESSION_COOKIE_NAME;
