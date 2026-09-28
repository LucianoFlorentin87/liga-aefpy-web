import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { RoleKey } from "@prisma/client";
import { prisma } from "@/lib/db";

export { hashPassword, verifyPassword } from "@/lib/password";

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "aefpy_session";
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
 *
 * También detecta si el rol cambió después de que se firmó este JWT (un
 * SUPERADMIN le cambió el rol a alguien con una sesión ya abierta, que dura
 * hasta 8hs): en vez de "parchear" el rol al vuelo, se trata la sesión vieja
 * como inválida y se fuerza a volver a iniciar sesión. Un parche al vuelo
 * quedaría desincronizado con proxy.ts (la barrera de borde, que sólo puede
 * leer el rol del JWT, nunca de la base) y podía terminar en un bucle de
 * redirects entre esa barrera y esta. Forzar el re-login es más simple y
 * evita ese problema de raíz: no se puede destruir la cookie acá porque esta
 * función también se llama desde Server Components (sólo se puede escribir
 * cookies desde Server Actions/Route Handlers) — alcanza con no confiar en
 * ella; se pisa sola con una válida en el próximo login.
 */
export async function requireActiveUser() {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    include: { role: true },
  });

  if (!user || user.status !== "ACTIVO") return null;
  if (session.role !== user.role.key) return null;

  return { session, user };
}

export const SESSION_COOKIE = SESSION_COOKIE_NAME;
