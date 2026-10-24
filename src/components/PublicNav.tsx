/**
 * Agrupado en ≤5 ítems de primer nivel (antes eran 10 planos, sin
 * indicador de página activa — hallazgo del audit de diseño del inicio).
 * "Competición" y "Contenido" son grupos desplegables; el resto son links
 * directos. Mismo dato lo consumen el nav de escritorio (PublicNavMenu) y
 * el menú mobile (MobileMenuButton).
 */
export type PublicNavLink = { href: string; label: string };
export type PublicNavEntry = PublicNavLink | { label: string; items: PublicNavLink[] };

export const PUBLIC_NAV_GROUPS: PublicNavEntry[] = [
  { href: "/", label: "Inicio" },
  {
    label: "Competición",
    items: [
      { href: "/fixture", label: "Fixture" },
      { href: "/resultados", label: "Resultados" },
      { href: "/posiciones", label: "Posiciones" },
      { href: "/goleadores", label: "Goleadores" },
      { href: "/disciplina", label: "Disciplina" },
    ],
  },
  { href: "/equipos", label: "Equipos" },
  {
    label: "Contenido",
    items: [
      { href: "/videos", label: "Videos" },
      { href: "/noticias", label: "Noticias" },
    ],
  },
  { href: "/reglamento", label: "Reglamento" },
];

/** Todas las páginas en una sola lista (sin agrupar) — para el footer, donde
 *  mostrar un mapa completo del sitio es lo esperado, a diferencia del nav
 *  principal donde agrupar reduce la carga de decisión. */
export const PUBLIC_NAV_FLAT: PublicNavLink[] = PUBLIC_NAV_GROUPS.flatMap((entry) =>
  "items" in entry ? entry.items : [entry],
);
