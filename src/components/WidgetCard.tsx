import Link from "next/link";
import type { ReactNode } from "react";

/** Encabezado unificado (degradé navy + botón circular blanco) para todas las tarjetas del inicio. */
export function WidgetCard({
  title,
  href,
  ariaLabel,
  bodyClassName = "p-4",
  className,
  children,
}: {
  title: string;
  href: string;
  ariaLabel: string;
  /** Clases del contenedor de contenido — pasar "" para layouts que necesitan ir de borde a borde (ej. una tabla). */
  bodyClassName?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`card overflow-hidden ${className ?? ""}`}>
      <div className="flex items-center justify-between bg-gradient-to-br from-[var(--color-navy-700)] via-[var(--color-navy-800)] to-[var(--color-navy-950)] px-4 py-3">
        <h2 className="text-sm font-extrabold uppercase tracking-wide text-white">{title}</h2>
        <Link
          href={href}
          aria-label={ariaLabel}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-[var(--color-navy-900)] shadow hover:bg-[var(--color-gray-100)]"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>
      <div className={bodyClassName}>{children}</div>
    </div>
  );
}
