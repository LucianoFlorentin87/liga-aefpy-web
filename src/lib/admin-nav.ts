import type { PermissionResource } from "@/lib/permissions";

export type AdminNavItem = {
  href: string;
  label: string;
  resource?: PermissionResource; // si falta, visible para cualquier usuario autenticado
};

/** Ícono representativo del grupo — uno por categoría (no por ítem), ver AdminNavIcon. */
export type AdminNavIconKey = "home" | "torneo" | "estadisticas" | "configuracion";

export type AdminNavGroup = {
  title: string;
  icon: AdminNavIconKey;
  items: AdminNavItem[];
};

export const ADMIN_NAV: AdminNavGroup[] = [
  {
    title: "",
    icon: "home",
    items: [{ href: "/admin/dashboard", label: "Dashboard" }],
  },
  {
    title: "Torneo",
    icon: "torneo",
    items: [
      { href: "/admin/ligas", label: "Ligas y temporadas", resource: "temporadas" },
      { href: "/admin/inscripciones", label: "Inscripciones", resource: "inscripciones" },
      { href: "/admin/equipos", label: "Equipos", resource: "equipos" },
      { href: "/admin/jugadores", label: "Jugadores", resource: "jugadores" },
      { href: "/admin/partidos", label: "Partidos", resource: "partidos" },
      { href: "/admin/resultados", label: "Resultados", resource: "resultados" },
      { href: "/admin/posiciones", label: "Posiciones" },
    ],
  },
  {
    title: "Estadísticas",
    icon: "estadisticas",
    items: [
      { href: "/admin/goleadores", label: "Goleadores" },
      { href: "/admin/disciplina", label: "Disciplina" },
      { href: "/admin/sanciones", label: "Sanciones", resource: "sanciones" },
      { href: "/admin/ajustes-puntos", label: "Ajustes de puntos", resource: "ajustesPuntos" },
    ],
  },
  {
    title: "Configuración",
    icon: "configuracion",
    items: [
      { href: "/admin/usuarios", label: "Usuarios", resource: "usuarios" },
      { href: "/admin/auditoria", label: "Auditoría", resource: "auditoria" },
      { href: "/admin/reglamento", label: "Reglamento", resource: "reglamento" },
      { href: "/admin/videos", label: "Videos", resource: "videos" },
      { href: "/admin/noticias", label: "Noticias", resource: "noticias" },
      { href: "/admin/configuracion", label: "Configuración del torneo", resource: "configuracion" },
    ],
  },
];

/** Menú reducido para el rol DELEGADO: sólo ve el panel de su propio equipo. */
export const DELEGADO_NAV: AdminNavGroup[] = [
  {
    title: "",
    icon: "home",
    items: [{ href: "/admin/mi-equipo", label: "Mi equipo" }, { href: "/inscripcion", label: "Inscribir equipo" }, { href: "/historico", label: "Histórico de ligas" }],
  },
];
