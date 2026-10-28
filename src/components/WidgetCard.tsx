import Link from "next/link";
import type { ReactNode } from "react";

/** Encabezado compartido para los paneles de información. */
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
      <div className="flex min-h-16 items-center justify-between gap-3 border-b border-[var(--color-gray-200)] px-4 py-2">
        <h2 className="border-l-3 border-[var(--color-red-accent)] pl-3 text-sm font-extrabold text-[var(--color-navy-900)]">{title}</h2>
        <Link
          href={href}
          aria-label={ariaLabel}
          className="league-widget-link"
        >
          <span>Ver todo</span>
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>
      <div className={bodyClassName}>{children}</div>
    </div>
  );
}
