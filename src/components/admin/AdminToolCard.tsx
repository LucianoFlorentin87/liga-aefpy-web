import Link from "next/link";
import type { AdminNavIconKey } from "@/lib/admin-nav";
import { AdminNavIcon } from "@/components/admin/AdminNavIcon";

/**
 * Tarjeta de acceso rápido estilo "tool card": ícono, título y borde que se
 * resalta en hover — el mismo patrón de grilla de herramientas del panel,
 * aplicado como lanzador de secciones en el dashboard.
 */
export function AdminToolCard({ href, label, icon, category }: { href: string; label: string; icon: AdminNavIconKey; category: string }) {
  return (
    <Link
      href={href}
      className="admin-tool-card group flex flex-col gap-2 rounded-xl border-2 border-[var(--color-gray-200)] bg-[var(--color-surface)] p-3.5 transition-colors hover:border-[var(--color-red-accent)]"
    >
      <div className="flex items-center justify-between">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-gray-100)] text-[var(--color-gray-500)] group-hover:bg-[var(--color-red-100)] group-hover:text-[var(--color-red-accent)]">
          <AdminNavIcon icon={icon} className="h-[18px] w-[18px]" />
        </span>
        <span className="text-[0.6rem] font-bold uppercase tracking-widest text-[var(--color-gray-500)]">{category}</span>
      </div>
      <span className="text-sm font-semibold text-[var(--color-navy-900)]">{label}</span>
    </Link>
  );
}
