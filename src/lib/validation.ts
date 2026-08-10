import { z } from "zod";

export const loginSchema = z.object({
  identifier: z.string().min(1, "Ingresá tu usuario o correo"),
  password: z.string().min(1, "Ingresá tu contraseña"),
});

const roleEnum = z.enum(["SUPERADMIN", "ADMINISTRADOR", "CARGA_DATOS"]);
const statusEnum = z.enum(["ACTIVO", "INACTIVO"]);

export const createUserSchema = z.object({
  firstName: z.string().trim().min(1, "El nombre es obligatorio"),
  lastName: z.string().trim().min(1, "El apellido es obligatorio"),
  email: z.string().trim().email("Correo inválido"),
  username: z
    .string()
    .trim()
    .min(3, "El usuario debe tener al menos 3 caracteres")
    .regex(/^[a-zA-Z0-9._-]+$/, "Sólo letras, números, puntos, guiones y guión bajo"),
  password: z.string().min(8, "La contraseña temporal debe tener al menos 8 caracteres"),
  role: roleEnum,
  status: statusEnum,
});

export const updateUserSchema = createUserSchema
  .omit({ password: true })
  .extend({ id: z.string().min(1) });

export const resetPasswordSchema = z.object({
  id: z.string().min(1),
  password: z.string().min(8, "La contraseña temporal debe tener al menos 8 caracteres"),
});

export const teamSchema = z.object({
  name: z.string().trim().min(2, "El nombre es obligatorio"),
  shortName: z
    .string()
    .trim()
    .min(2, "La abreviatura es obligatoria")
    .max(6, "Máximo 6 caracteres"),
  delegateName: z.string().trim().optional().or(z.literal("")),
  delegatePhone: z.string().trim().optional().or(z.literal("")),
  status: statusEnum,
});

const positionEnum = z.enum(["ARQUERO", "DEFENSOR", "MEDIOCAMPISTA", "DELANTERO"]);

export const playerSchema = z.object({
  firstName: z.string().trim().min(1, "El nombre es obligatorio"),
  lastName: z.string().trim().min(1, "El apellido es obligatorio"),
  jerseyNumber: z.coerce.number().int().min(0).max(99),
  position: positionEnum,
  teamId: z.string().min(1, "Seleccioná un equipo"),
  birthDate: z.string().optional().or(z.literal("")),
  status: statusEnum,
});

const matchStatusEnum = z.enum([
  "PROGRAMADO",
  "EN_CURSO",
  "FINALIZADO",
  "SUSPENDIDO",
  "REPROGRAMADO",
]);

export const matchSchema = z
  .object({
    matchday: z.coerce.number().int().min(1, "La jornada debe ser mayor a 0"),
    date: z.string().min(1, "La fecha es obligatoria"),
    time: z.string().min(1, "La hora es obligatoria"),
    venue: z.string().trim().min(1, "La cancha es obligatoria"),
    homeTeamId: z.string().min(1, "Seleccioná el equipo local"),
    awayTeamId: z.string().min(1, "Seleccioná el equipo visitante"),
    status: matchStatusEnum,
    notes: z.string().trim().optional().or(z.literal("")),
  })
  .refine((data) => data.homeTeamId !== data.awayTeamId, {
    message: "El equipo local y visitante no pueden ser el mismo",
    path: ["awayTeamId"],
  });

export const goalSchema = z.object({
  matchId: z.string().min(1),
  playerId: z.string().min(1, "Seleccioná el jugador"),
  teamId: z.string().min(1),
  minute: z.coerce.number().int().min(0, "El minuto no puede ser negativo").max(130),
});

const cardTypeEnum = z.enum(["AMARILLA", "ROJA"]);

export const cardSchema = z.object({
  matchId: z.string().min(1),
  playerId: z.string().min(1, "Seleccioná el jugador"),
  teamId: z.string().min(1),
  type: cardTypeEnum,
  minute: z.coerce.number().int().min(0, "El minuto no puede ser negativo").max(130),
  note: z.string().trim().optional().or(z.literal("")),
});

const sanctionStatusEnum = z.enum(["ACTIVA", "CUMPLIDA"]);

export const sanctionSchema = z.object({
  playerId: z.string().min(1, "Seleccioná el jugador"),
  reason: z.string().trim().min(1, "El motivo es obligatorio"),
  matchesCount: z.coerce.number().int().min(1, "Debe ser al menos 1 partido"),
  startDate: z.string().min(1, "La fecha de inicio es obligatoria"),
  endDate: z.string().optional().or(z.literal("")),
  status: sanctionStatusEnum,
});

export const rulesSchema = z.object({
  rulesContent: z.string().trim().min(1, "El reglamento no puede estar vacío"),
});

export const settingsSchema = z.object({
  tournamentName: z.string().trim().min(1, "El nombre del torneo es obligatorio"),
  standingsCriteria: z
    .string()
    .trim()
    .min(1)
    .regex(/^(PTS|DG|GF|PG)(,(PTS|DG|GF|PG))*$/, "Criterio inválido"),
});
