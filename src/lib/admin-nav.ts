import type { PermissionResource } from "@/lib/permissions";

export type AdminNavItem = { href: string; label: string; resource?: PermissionResource };
export type AdminNavIconKey = "home" | "torneo" | "estadisticas" | "contenido" | "configuracion";
export type AdminNavGroup = { title: string; icon: AdminNavIconKey; items: AdminNavItem[] };

/** Workflow order: prepare the league, operate it, inspect data, publish, administer. */
export const ADMIN_NAV: AdminNavGroup[] = [
  { title: "", icon: "home", items: [{ href: "/admin/dashboard", label: "Resumen" }] },
  { title: "Competición", icon: "torneo", items: [
    { href: "/admin/ligas", label: "Ligas y temporadas", resource: "temporadas" },
    { href: "/admin/inscripciones", label: "Inscripciones", resource: "inscripciones" },
    { href: "/admin/equipos", label: "Equipos", resource: "equipos" },
    { href: "/admin/jugadores", label: "Jugadores", resource: "jugadores" },
    { href: "/admin/partidos", label: "Fixture y partidos", resource: "partidos" },
    { href: "/admin/resultados", label: "Cargar resultados", resource: "resultados" },
    { href: "/admin/reglamento", label: "Reglamento", resource: "reglamento" },
  ] },
  { title: "Estadísticas", icon: "estadisticas", items: [
    { href: "/admin/posiciones", label: "Tabla de posiciones" },
    { href: "/admin/goleadores", label: "Goleadores" },
    { href: "/admin/disciplina", label: "Disciplina" },
    { href: "/admin/sanciones", label: "Sanciones", resource: "sanciones" },
    { href: "/admin/ajustes-puntos", label: "Ajustes de puntos", resource: "ajustesPuntos" },
  ] },
  { title: "Contenido", icon: "contenido", items: [
    { href: "/admin/noticias", label: "Noticias", resource: "noticias" },
    { href: "/admin/videos", label: "Videos", resource: "videos" },
  ] },
  { title: "Administración", icon: "configuracion", items: [
    { href: "/admin/usuarios", label: "Usuarios", resource: "usuarios" },
    { href: "/admin/auditoria", label: "Auditoría", resource: "auditoria" },
    { href: "/admin/configuracion", label: "Configuración del sitio", resource: "configuracion" },
  ] },
];
export const DELEGADO_NAV: AdminNavGroup[] = [
  { title: "", icon: "home", items: [{ href: "/admin/mi-equipo", label: "Mi equipo" }] },
  { title: "Participación", icon: "torneo", items: [
    { href: "/inscripcion", label: "Inscribir equipo" }, { href: "/historico", label: "Histórico de ligas" },
  ] },
];
