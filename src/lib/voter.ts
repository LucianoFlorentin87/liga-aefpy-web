import "server-only";
import { getFanSession } from "@/lib/fan-auth";
import { getSession } from "@/lib/auth";

/**
 * Quién puede votar en las predicciones públicas: una cuenta de hincha
 * (FanUser), o un usuario de staff con rol DELEGADO usando su propia cuenta
 * del panel (no necesita además crear una cuenta de hincha). Ningún otro rol
 * de staff vota con esta identidad.
 */
export type VoterIdentity =
  | { kind: "fan"; id: string; firstName: string }
  | { kind: "staff"; id: string; firstName: string };

export async function getVoterIdentity(): Promise<VoterIdentity | null> {
  const fan = await getFanSession();
  if (fan) return { kind: "fan", id: fan.sub, firstName: fan.firstName };

  const staff = await getSession();
  if (staff && staff.role === "DELEGADO") {
    return { kind: "staff", id: staff.sub, firstName: staff.firstName };
  }

  return null;
}
