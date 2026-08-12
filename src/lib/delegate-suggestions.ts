import "server-only";
import { randomInt } from "node:crypto";

// Sin caracteres ambiguos (0/O, 1/l/I) para que se puedan transcribir a mano
// sin errores. Mismo criterio que scripts/create-delegates.ts.
const PASSWORD_CHARS = "23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ";

export function generatePassword(length = 10): string {
  let password = "";
  for (let i = 0; i < length; i++) {
    password += PASSWORD_CHARS[randomInt(PASSWORD_CHARS.length)];
  }
  return password;
}

export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // saca acentos (marcas diacríticas combinadas)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 20);
}

/** Sugiere un usuario "delegado.<base>" que no choque con los ya existentes (y lo reserva en `taken`). */
export function suggestUsername(base: string, taken: Set<string>): string {
  let candidate = `delegado.${base}`;
  let suffix = 2;
  while (taken.has(candidate)) {
    candidate = `delegado.${base}${suffix}`;
    suffix++;
  }
  taken.add(candidate);
  return candidate;
}
