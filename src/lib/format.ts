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

const SANCTION_STATUS_LABEL: Record<string, string> = {
  ACTIVA: "Activa",
  CUMPLIDA: "Cumplida",
};
export function sanctionStatusLabel(status: string): string {
  return SANCTION_STATUS_LABEL[status] ?? status;
}
