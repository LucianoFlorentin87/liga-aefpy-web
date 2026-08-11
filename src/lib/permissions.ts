import "server-only";
import type { RoleKey } from "@prisma/client";
import { redirect } from "next/navigation";
import { requireActiveUser } from "@/lib/auth";

/**
 * Matriz de permisos por recurso. Es la única fuente de verdad: se usa tanto
 * para decidir qué mostrar en el sidebar como para autorizar cada acción de
 * servidor (nunca se confía solo en ocultar botones en el cliente).
 */
export const PERMISSIONS = {
  usuarios: ["SUPERADMIN"],
  equipos: ["SUPERADMIN", "ADMINISTRADOR"],
  jugadores: ["SUPERADMIN", "ADMINISTRADOR"],
  partidos: ["SUPERADMIN", "ADMINISTRADOR"],
  resultados: ["SUPERADMIN", "ADMINISTRADOR", "CARGA_DATOS"],
  goles: ["SUPERADMIN", "ADMINISTRADOR", "CARGA_DATOS"],
  tarjetas: ["SUPERADMIN", "ADMINISTRADOR", "CARGA_DATOS"],
  sanciones: ["SUPERADMIN", "ADMINISTRADOR"],
  ajustesPuntos: ["SUPERADMIN", "ADMINISTRADOR"],
  reglamento: ["SUPERADMIN", "ADMINISTRADOR"],
  configuracion: ["SUPERADMIN", "ADMINISTRADOR"],
} as const satisfies Record<string, RoleKey[]>;

export type PermissionResource = keyof typeof PERMISSIONS;

export function can(role: RoleKey, resource: PermissionResource): boolean {
  return (PERMISSIONS[resource] as readonly RoleKey[]).includes(role);
}

/** Sólo el SUPERADMIN puede fijar el rol SUPERADMIN al crear/editar usuarios. */
export function canAssignRole(actorRole: RoleKey, targetRole: RoleKey): boolean {
  if (targetRole === "SUPERADMIN") return actorRole === "SUPERADMIN";
  return actorRole === "SUPERADMIN";
}

/**
 * Exige sesión activa (revalidada contra la base de datos). Redirige a
 * /admin/login si no hay sesión válida. Usar al principio de cada página y
 * cada server action del panel administrativo.
 */
export async function requireAuth() {
  const result = await requireActiveUser();
  if (!result) {
    redirect("/admin/login");
  }
  return result;
}

/**
 * Exige sesión activa Y permiso sobre un recurso puntual. Lanza redirect al
 * dashboard con mensaje de acceso denegado si el rol no alcanza.
 */
export async function requirePermission(resource: PermissionResource) {
  const { session, user } = await requireAuth();
  if (!can(session.role, resource)) {
    redirect("/admin/dashboard?denegado=" + resource);
  }
  return { session, user };
}

/**
 * Ruta exclusiva del delegado de equipo (/admin/mi-equipo): no forma parte
 * de la matriz PERMISSIONS porque no es un recurso administrativo genérico,
 * sino el propio equipo del usuario. El teamId siempre se resuelve desde la
 * base de datos (user.teamId), nunca desde datos enviados por el cliente.
 */
export async function requireDelegate() {
  const { session, user } = await requireAuth();
  if (session.role !== "DELEGADO" || !user.teamId) {
    redirect("/admin/dashboard");
  }
  return { session, user, teamId: user.teamId };
}
