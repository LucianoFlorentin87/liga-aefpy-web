import type { PermissionResource } from "@/lib/permissions";

export type AdminNavItem = {
  href: string;
  label: string;
  resource?: PermissionResource; // si falta, visible para cualquier usuario autenticado
};

export type AdminNavGroup = {
  title: string;
  items: AdminNavItem[];
};

export const ADMIN_NAV: AdminNavGroup[] = [
  {
    title: "",
    items: [{ href: "/admin/dashboard", label: "Dashboard" }],
  },
  {
    title: "Torneo",
    items: [
      { href: "/admin/equipos", label: "Equipos", resource: "equipos" },
      { href: "/admin/jugadores", label: "Jugadores", resource: "jugadores" },
      { href: "/admin/partidos", label: "Partidos", resource: "partidos" },
      { href: "/admin/resultados", label: "Resultados", resource: "resultados" },
      { href: "/admin/posiciones", label: "Posiciones" },
    ],
  },
  {
    title: "Estadísticas",
    items: [
      { href: "/admin/goleadores", label: "Goleadores" },
      { href: "/admin/disciplina", label: "Disciplina" },
      { href: "/admin/sanciones", label: "Sanciones", resource: "sanciones" },
      { href: "/admin/ajustes-puntos", label: "Ajustes de puntos", resource: "ajustesPuntos" },
    ],
  },
  {
    title: "Configuración",
    items: [
      { href: "/admin/usuarios", label: "Usuarios", resource: "usuarios" },
      { href: "/admin/reglamento", label: "Reglamento", resource: "reglamento" },
      { href: "/admin/configuracion", label: "Configuración del torneo", resource: "configuracion" },
    ],
  },
];
