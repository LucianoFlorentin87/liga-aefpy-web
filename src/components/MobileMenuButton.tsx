"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PUBLIC_NAV_GROUPS } from "@/components/PublicNav";
import { logoutFanAction } from "@/app/(public)/(with-crests)/cuenta/actions";
import { logoutAction as logoutStaffAction } from "@/app/admin/actions";
import type { AccountVoterIdentity } from "@/lib/voter";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
}

export function MobileMenuButton({ voter }: { voter: AccountVoterIdentity | null }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const menuId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="xl:hidden">
      <button
        ref={buttonRef}
        aria-controls={menuId}
        type="button"
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/20 text-white"
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
          </svg>
        )}
      </button>

      {open && (
        <div id={menuId} className="league-mobile-menu absolute inset-x-0 top-full z-40 border-t border-[var(--color-gray-200)] bg-[var(--color-surface)] shadow-lg">
          <nav aria-label="Navegación principal móvil" className="container-page flex flex-col py-2">
            {PUBLIC_NAV_GROUPS.map((entry) =>
              "items" in entry ? (
                <div key={entry.label} className="py-1">
                  <p className="px-2 pb-1 text-[0.7rem] font-bold uppercase tracking-wide text-[var(--color-gray-500)]">
                    {entry.label}
                  </p>
                  {entry.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      aria-current={isActive(pathname, item.href) ? "page" : undefined}
                      className={`block rounded-lg px-4 py-3 text-[0.95rem] font-medium hover:bg-[var(--color-gray-50)] ${
                        isActive(pathname, item.href) ? "text-[var(--color-red-accent)]" : "text-[var(--color-gray-900)]"
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              ) : (
                <Link
                  key={entry.href}
                  href={entry.href}
                  onClick={() => setOpen(false)}
                  aria-current={isActive(pathname, entry.href) ? "page" : undefined}
                  className={`rounded-lg px-2 py-3 text-[0.95rem] font-medium hover:bg-[var(--color-gray-50)] ${
                    isActive(pathname, entry.href) ? "text-[var(--color-red-accent)]" : "text-[var(--color-gray-900)]"
                  }`}
                >
                  {entry.label}
                </Link>
              ),
            )}

            <div className="mt-1 flex flex-col border-t border-[var(--color-gray-100)] pt-1">
              {voter ? (
                <>
                  <span className="px-2 py-2 text-[0.85rem] font-semibold text-[var(--color-gray-500)]">
                    Hola, {voter.firstName}
                    {voter.kind === "staff" && " (Delegado)"}
                  </span>
                  <form action={voter.kind === "fan" ? logoutFanAction : logoutStaffAction}>
                    <button
                      type="submit"
                      onClick={() => setOpen(false)}
                      className="w-full rounded-lg px-2 py-3 text-left text-[0.95rem] font-medium text-[var(--color-gray-900)] hover:bg-[var(--color-gray-50)]"
                    >
                      Salir
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link
                    href="/cuenta/login"
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-2 py-3 text-[0.95rem] font-medium text-[var(--color-gray-900)] hover:bg-[var(--color-gray-50)]"
                  >
                    Ingresar
                  </Link>
                  <Link
                    href="/cuenta/registro"
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-2 py-3 text-[0.95rem] font-bold text-[var(--color-red-accent)] hover:bg-[var(--color-gray-50)]"
                  >
                    Registrarme
                  </Link>
                </>
              )}
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="mt-1 rounded-lg px-2 py-3 text-[0.85rem] font-semibold text-[var(--color-gray-500)] hover:bg-[var(--color-gray-50)]"
              >
                Administración
              </Link>
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
