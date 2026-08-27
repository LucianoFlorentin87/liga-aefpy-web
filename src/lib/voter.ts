import "server-only";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { getFanSession } from "@/lib/fan-auth";
import { getSession } from "@/lib/auth";

const ANON_VOTER_COOKIE_NAME = process.env.ANON_VOTER_COOKIE_NAME || "exafrutos_anon_voter";
const ANON_VOTER_DURATION_SECONDS = 60 * 60 * 24 * 365; // 1 año

/**
 * Quién puede votar en las predicciones públicas: CUALQUIER visitante, con
 * o sin cuenta. Si tiene cuenta de hincha (FanUser) o es staff con rol
 * DELEGADO, se identifica con esa cuenta (así el voto lo sigue entre
 * dispositivos). Si no, se identifica con una cookie anónima — no hace
 * falta iniciar sesión para votar.
 */
export type VoterIdentity =
  | { kind: "fan"; id: string; firstName: string }
  | { kind: "staff"; id: string; firstName: string }
  | { kind: "anon"; id: string };

/**
 * Lee (sin escribir) la identidad del votante actual. No genera una cookie
 * anónima nueva acá — un Server Component sólo puede leer cookies, no
 * escribirlas; para eso está getOrCreateAnonVoterId, que sólo se puede
 * llamar desde un Server Action.
 */
export async function getVoterIdentity(): Promise<VoterIdentity | null> {
  const fan = await getFanSession();
  if (fan) return { kind: "fan", id: fan.sub, firstName: fan.firstName };

  const staff = await getSession();
  if (staff && staff.role === "DELEGADO") {
    return { kind: "staff", id: staff.sub, firstName: staff.firstName };
  }

  const cookieStore = await cookies();
  const anonId = cookieStore.get(ANON_VOTER_COOKIE_NAME)?.value;
  if (anonId) return { kind: "anon", id: anonId };

  return null;
}

export type AccountVoterIdentity = Extract<VoterIdentity, { kind: "fan" } | { kind: "staff" }>;

/**
 * A diferencia de getVoterIdentity, NO incluye el voto anónimo — se usa
 * para mostrar el estado de sesión real en el header (Ingresar / "Hola
 * Fulano"), no para identificar quién emitió un voto. Un visitante que votó
 * sin cuenta sigue viéndose como "no conectado" en el header.
 */
export async function getAccountVoter(): Promise<AccountVoterIdentity | null> {
  const voter = await getVoterIdentity();
  return voter && voter.kind !== "anon" ? voter : null;
}

/**
 * Sólo se puede llamar desde un Server Action (ej. castPredictionAction):
 * si el visitante todavía no tiene la cookie anónima, la crea. La cookie
 * sólo sirve para no perder el "ya votaste" al recargar la página — no
 * identifica a la persona de ninguna otra forma.
 */
export async function getOrCreateAnonVoterId(): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(ANON_VOTER_COOKIE_NAME)?.value;
  if (existing) return existing;

  const id = randomUUID();
  cookieStore.set(ANON_VOTER_COOKIE_NAME, id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ANON_VOTER_DURATION_SECONDS,
  });
  return id;
}
