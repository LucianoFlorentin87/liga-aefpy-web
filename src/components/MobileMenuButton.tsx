"use client";

import { useState } from "react";
import Link from "next/link";
import { PUBLIC_NAV_ITEMS } from "@/components/PublicNav";

export function MobileMenuButton() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--color-gray-300)] text-[var(--color-navy-900)]"
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
        <div className="absolute inset-x-0 top-full z-40 border-t border-[var(--color-gray-200)] bg-white shadow-lg">
          <nav className="container-page flex flex-col py-2">
            {PUBLIC_NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-3 text-[0.95rem] font-medium text-[var(--color-gray-900)] hover:bg-[var(--color-gray-50)]"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="mt-1 rounded-lg px-2 py-3 text-[0.85rem] font-semibold text-[var(--color-gray-500)] hover:bg-[var(--color-gray-50)]"
            >
              Administración
            </Link>
          </nav>
        </div>
      )}
    </div>
  );
}
