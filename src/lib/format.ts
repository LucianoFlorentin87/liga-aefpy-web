const FORFEIT_SCORE = 3;

/**
 * Goles de un partido, contemplando el caso de abandono (walkover): si el
 * partido se resolvió por abandono de un equipo, el resultado es fijo 3-0 en
 * su contra — no hay goles reales cargados para contar. Se comparte entre
 * todos los lugares que muestran el marcador para que ninguno se olvide del
 * caso y termine mostrando "0 - 0" en un partido resuelto por abandono.
 */
export function getMatchScore(match: {
  homeTeamId: string;
  awayTeamId: string;
  forfeitedTeamId: string | null;
  goals: { teamId: string }[];
}): { home: number; away: number } {
  if (match.forfeitedTeamId) {
    return {
      home: match.forfeitedTeamId === match.homeTeamId ? 0 : FORFEIT_SCORE,
      away: match.forfeitedTeamId === match.awayTeamId ? 0 : FORFEIT_SCORE,
    };
  }
  return {
    home: match.goals.filter((g) => g.teamId === match.homeTeamId).length,
    away: match.goals.filter((g) => g.teamId === match.awayTeamId).length,
  };
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("es-PY", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

/** "SÁB, 22 AGO" — para tarjetas compactas (slider de próximos partidos). */
export function formatDateBadge(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const parts = new Intl.DateTimeFormat("es-PY", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  }).formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("weekday")}, ${get("day")} ${get("month")}`.replace(/\./g, "").toUpperCase();
}

export function formatDateShort(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("es-PY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

const MATCH_STATUS_LABEL: Record<string, string> = {
  PROGRAMADO: "Programado",
  EN_CURSO: "En curso",
  FINALIZADO: "Finalizado",
  SUSPENDIDO: "Suspendido",
  REPROGRAMADO: "Reprogramado",
};

export function matchStatusLabel(status: string): string {
  return MATCH_STATUS_LABEL[status] ?? status;
}

const USER_STATUS_LABEL: Record<string, string> = {
  ACTIVO: "Activo",
  INACTIVO: "Inactivo",
  RETIRADO: "Retirado",
};
export function statusLabel(status: string): string {
  return USER_STATUS_LABEL[status] ?? status;
}

const ROLE_LABEL: Record<string, string> = {
  SUPERADMIN: "Superadmin",
  ADMINISTRADOR: "Administrador",
  CARGA_DATOS: "Carga de datos",
  DELEGADO: "Delegado de equipo",
};
export function roleLabel(role: string): string {
  return ROLE_LABEL[role] ?? role;
}

const POSITION_LABEL: Record<string, string> = {
  ARQUERO: "Arquero",
  DEFENSOR: "Defensor",
  MEDIOCAMPISTA: "Mediocampista",
  DELANTERO: "Delantero",
};
export function positionLabel(position: string): string {
  return POSITION_LABEL[position] ?? position;
}

/** El apellido es opcional (muchos gamertags se cargan sólo con nombre). */
export function playerFullName(player: { firstName: string; lastName?: string | null }): string {
  return player.lastName ? `${player.firstName} ${player.lastName}` : player.firstName;
}

const SANCTION_STATUS_LABEL: Record<string, string> = {
  ACTIVA: "Activa",
  CUMPLIDA: "Cumplida",
};
export function sanctionStatusLabel(status: string): string {
  return SANCTION_STATUS_LABEL[status] ?? status;
}
