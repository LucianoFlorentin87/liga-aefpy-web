import { z } from "zod";

export const newLeagueSchema = z.object({
  currentSeasonId: z.string().min(1),
  confirmName: z.string().trim().min(1),
  name: z.string().trim().min(3, "Ingresá el nombre de la nueva liga").max(100),
  deadline: z.string().trim().max(40).optional(),
  acknowledgePending: z.boolean(),
});
export const registrationSchema = z.object({
  seasonId: z.string().min(1),
  teamName: z.string().trim().min(2, "Ingresá el nombre del equipo").max(80),
  shortName: z.string().trim().min(2).max(6).transform(value => value.toUpperCase()),
  gamertag: z.string().trim().min(2, "Ingresá tu identificador de juego").max(80),
  firstName: z.string().trim().min(1).max(60),
  lastName: z.string().trim().min(1).max(60),
  email: z.string().trim().email("Ingresá un correo válido").max(160).transform(value => value.toLowerCase()),
  phone: z.string().trim().min(6, "Ingresá un teléfono de contacto").max(30),
  username: z.string().trim().min(3).max(40).regex(/^[a-zA-Z0-9._-]+$/, "El usuario admite letras, números, puntos y guiones"),
  consent: z.literal(true, { error: "Aceptá el uso de datos para gestionar la inscripción" }),
});
export function registrationIsOpen(season: { status: string; registrationOpen: boolean; registrationDeadline: Date | null }, now = new Date()) {
  return season.status === "INSCRIPCION" && season.registrationOpen && (!season.registrationDeadline || season.registrationDeadline > now);
}
export function leagueSlug(name: string, suffix: string) {
  const slug = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 65);
  return (slug || "liga") + "-" + suffix;
}

/** End of a calendar day in Asunción, using IANA rules rather than a fixed UTC offset. */
export function registrationDeadlineFor(date: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const noon = new Date(date + "T12:00:00.000Z");
  if (Number.isNaN(+noon) || noon.toISOString().slice(0, 10) !== date) return null;
  const zone = new Intl.DateTimeFormat("en", { timeZone: "America/Asuncion", timeZoneName: "shortOffset" }).formatToParts(noon).find(part => part.type === "timeZoneName")?.value;
  const match = zone?.match(/^GMT([+-])(\d{1,2})(?::(\d{2}))?$/);
  if (!match) return null;
  const offsetMinutes = (match[1] === "-" ? -1 : 1) * (Number(match[2]) * 60 + Number(match[3] || 0));
  return new Date(+new Date(date + "T23:59:59.999Z") - offsetMinutes * 60_000);
}
