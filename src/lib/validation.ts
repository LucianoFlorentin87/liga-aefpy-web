import { z } from "zod";

export const loginSchema = z.object({
  identifier: z.string().min(1, "Ingresá tu usuario"),
  password: z.string().min(1, "Ingresá tu contraseña"),
});

const roleEnum = z.enum(["SUPERADMIN", "ADMINISTRADOR", "CARGA_DATOS", "DELEGADO"]);
const statusEnum = z.enum(["ACTIVO", "INACTIVO"]);

const baseUserSchema = z.object({
  firstName: z.string().trim().min(1, "El nombre es obligatorio"),
  lastName: z.string().trim().min(1, "El apellido es obligatorio"),
  email: z.string().trim().email("Correo inválido"),
  username: z
    .string()
    .trim()
    .min(3, "El usuario debe tener al menos 3 caracteres")
    .regex(/^[a-zA-Z0-9._-]+$/, "Sólo letras, números, puntos, guiones y guión bajo"),
  role: roleEnum,
  status: statusEnum,
  // Sólo obligatorio cuando role === "DELEGADO" (se valida con .refine abajo).
  teamId: z.string().nullish(),
});

export const createUserSchema = baseUserSchema
  .extend({ password: z.string().min(8, "La contraseña temporal debe tener al menos 8 caracteres") })
  .refine((data) => data.role !== "DELEGADO" || !!data.teamId, {
    message: "Seleccioná el equipo para el delegado",
    path: ["teamId"],
  });

export const updateUserSchema = baseUserSchema
  .extend({ id: z.string().min(1) })
  .refine((data) => data.role !== "DELEGADO" || !!data.teamId, {
    message: "Seleccioná el equipo para el delegado",
    path: ["teamId"],
  });

export const resetPasswordSchema = z.object({
  id: z.string().min(1),
  password: z.string().min(8, "La contraseña temporal debe tener al menos 8 caracteres"),
});

// .nullish() (no sólo .optional()) porque formData.get() devuelve null —no
// undefined— para un campo que no está presente en el formulario (ver el
// mismo problema ya resuelto antes con pointAdjustmentSchema.matchId): así
// funciona igual si un formulario (ej. el de admin) no incluye algún campo
// que sí tiene el otro (ej. el del propio delegado).
const optionalText = z.string().trim().nullish().or(z.literal(""));
const optionalUrl = z
  .string()
  .trim()
  .url("Ingresá un link completo (empezando con https://)")
  .nullish()
  .or(z.literal(""));

/** Nombre y abreviatura — el propio delegado también puede corregirlos para su equipo. */
const teamNameFields = {
  name: z.string().trim().min(2, "El nombre es obligatorio"),
  shortName: z
    .string()
    .trim()
    .min(2, "La abreviatura es obligatoria")
    .max(6, "Máximo 6 caracteres"),
};

/** Datos de contacto, redes/streaming y gamertag — comunes al form de admin y al del propio delegado. */
const teamContactFields = {
  delegateName: optionalText,
  delegatePhone: optionalText,
  delegateEmail: z.string().trim().email("Correo inválido").nullish().or(z.literal("")),
  homeVenue: optionalText,
  instagramUrl: optionalUrl,
  facebookUrl: optionalUrl,
  youtubeUrl: optionalUrl,
  twitchUrl: optionalUrl,
  discordUrl: optionalUrl,
  tiktokUrl: optionalUrl,
  gamertag: z.string().trim().max(60, "Máximo 60 caracteres").nullish().or(z.literal("")),
};

export const teamSchema = z.object({
  ...teamNameFields,
  ...teamContactFields,
  status: statusEnum,
});

/** Datos que puede editar el propio delegado sobre su equipo (incluye nombre/abreviatura, no el estado). */
export const myTeamSchema = z.object({
  ...teamNameFields,
  ...teamContactFields,
});

const positionEnum = z.enum(["ARQUERO", "DEFENSOR", "MEDIOCAMPISTA", "DELANTERO"]);

export const playerSchema = z.object({
  firstName: z.string().trim().min(1, "El nombre es obligatorio"),
  lastName: z.string().trim().optional().or(z.literal("")),
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

export const generateFixtureSchema = z.object({
  startDate: z.string().min(1, "La fecha de inicio es obligatoria"),
  matchTime: z.string().min(1, "La hora sugerida es obligatoria"),
  venue: z.string().trim().min(1, "La cancha/modalidad es obligatoria"),
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
  rulesContent: z.string().trim().optional().or(z.literal("")),
});

export const pointAdjustmentSchema = z.object({
  teamId: z.string().min(1, "Seleccioná el equipo"),
  points: z.coerce.number().int().refine((v) => v !== 0, "El ajuste no puede ser 0"),
  reason: z.string().trim().min(1, "El motivo es obligatorio"),
  matchId: z.string().nullish(),
});

export const videoSchema = z.object({
  title: z.string().trim().min(2, "El título es obligatorio").max(120, "Máximo 120 caracteres"),
  url: z.string().trim().url("Ingresá un link completo (empezando con https://)"),
});

export const settingsSchema = z.object({
  orgName: z.string().trim().min(1, "El nombre de la organización es obligatorio").max(60, "Máximo 60 caracteres"),
  orgTagline: z.string().trim().min(1, "La bajada es obligatoria").max(80, "Máximo 80 caracteres"),
  heroSubtitle: z.string().trim().min(1, "El subtítulo es obligatorio").max(80, "Máximo 80 caracteres"),
  footerDescription: z.string().trim().min(1, "La descripción del pie de página es obligatoria").max(300, "Máximo 300 caracteres"),
  standingsCriteria: z
    .string()
    .trim()
    .min(1)
    .regex(/^(PTS|DG|GF|PG)(,(PTS|DG|GF|PG))*$/, "Criterio inválido"),
});

// ---------------------------------------------------------------------------
// Cuentas públicas (hinchas) y predicciones
// ---------------------------------------------------------------------------

export const fanRegisterSchema = z
  .object({
    firstName: z.string().trim().min(1, "El nombre es obligatorio"),
    lastName: z.string().trim().min(1, "El apellido es obligatorio"),
    email: z.string().trim().email("Correo inválido"),
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
    confirmPassword: z.string().min(1, "Confirmá tu contraseña"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export const fanLoginSchema = z.object({
  email: z.string().trim().email("Correo inválido"),
  password: z.string().min(1, "Ingresá tu contraseña"),
});

const predictionChoiceEnum = z.enum(["LOCAL", "EMPATE", "VISITANTE"]);

export const predictionSchema = z.object({
  matchId: z.string().min(1),
  choice: predictionChoiceEnum,
});
