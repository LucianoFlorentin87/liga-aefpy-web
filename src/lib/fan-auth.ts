import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

const FAN_SESSION_COOKIE_NAME = process.env.FAN_SESSION_COOKIE_NAME || "exafrutos_fan_session";
const FAN_SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30; // 30 días — sesión de hincha, no de staff

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "SESSION_SECRET no está configurado (o es demasiado corto). Definilo en .env — ver .env.example.",
    );
  }
  // Deriva una clave distinta a la de sesión admin (mismo secreto base, "namespace"
  // distinto) para que un JWT de hincha nunca sea válido como sesión admin ni viceversa.
  return new TextEncoder().encode(`fan:${secret}`);
}

export type FanSessionPayload = {
  sub: string; // FanUser id
  firstName: string;
  lastName: string;
};

export async function createFanSession(payload: FanSessionPayload) {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${FAN_SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());

  const cookieStore = await cookies();
  cookieStore.set(FAN_SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: FAN_SESSION_DURATION_SECONDS,
  });
}

export async function destroyFanSession() {
  const cookieStore = await cookies();
  cookieStore.delete(FAN_SESSION_COOKIE_NAME);
}

export async function getFanSession(): Promise<FanSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(FAN_SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return {
      sub: payload.sub as string,
      firstName: payload.firstName as string,
      lastName: payload.lastName as string,
    };
  } catch {
    return null;
  }
}

/** Vuelve a validar contra la base de datos que la cuenta de hincha sigue existiendo. */
export async function requireActiveFan() {
  const session = await getFanSession();
  if (!session) return null;

  const fan = await prisma.fanUser.findUnique({ where: { id: session.sub } });
  if (!fan) return null;

  return { session, fan };
}
