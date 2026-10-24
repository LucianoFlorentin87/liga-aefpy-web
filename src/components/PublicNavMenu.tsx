"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PUBLIC_NAV_GROUPS, type PublicNavLink } from "@/components/PublicNav";

const LINK_CLASSES = "rounded-lg px-2.5 py-2 text-[0.8rem] font-semibold text-white/75 hover:bg-white/10 hover:text-white";
const ACTIVE_LINK_CLASSES = "rounded-lg px-2.5 py-2 text-[0.8rem] font-semibold bg-white/10 text-white";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
}

function NavGroup({ label, items, pathname }: { label: string; items: PublicNavLink[]; pathname: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const groupActive = items.some((item) => isActive(pathname, item.href));

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1 ${groupActive ? ACTIVE_LINK_CLASSES : LINK_CLASSES}`}
      >
        {label}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full z-30 mt-1 min-w-[10rem] rounded-lg border border-white/10 bg-[var(--color-navy-950)] p-1.5 shadow-xl"
        >
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className={`block rounded-md px-3 py-2 text-[0.8rem] font-semibold ${
                isActive(pathname, item.href) ? "bg-white/10 text-white" : "text-white/75 hover:bg-white/10 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/** Nav de escritorio: ≤5 ítems de primer nivel ("Competición" y "Contenido"
 *  agrupan lo que antes eran 10 links planos), con estado activo visible —
 *  hallazgo del audit de diseño del inicio. */
export function PublicNavMenu() {
  const pathname = usePathname();

  return (
    <nav className="hidden xl:flex items-center gap-1">
      {PUBLIC_NAV_GROUPS.map((entry) =>
        "items" in entry ? (
          <NavGroup key={entry.label} label={entry.label} items={entry.items} pathname={pathname} />
        ) : (
          <Link
            key={entry.href}
            href={entry.href}
            aria-current={isActive(pathname, entry.href) ? "page" : undefined}
            className={isActive(pathname, entry.href) ? ACTIVE_LINK_CLASSES : LINK_CLASSES}
          >
            {entry.label}
          </Link>
        ),
      )}
    </nav>
  );
}
