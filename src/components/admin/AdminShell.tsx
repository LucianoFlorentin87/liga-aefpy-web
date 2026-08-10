"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AdminNavGroup } from "@/lib/admin-nav";
import { Logo } from "@/components/Logo";
import { logoutAction } from "@/app/admin/actions";

function SidebarNav({ groups, onNavigate }: { groups: AdminNavGroup[]; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-5 px-3 py-4">
      {groups.map((group, i) => (
        <div key={i}>
          {group.title && (
            <p className="mb-1.5 px-2 text-[0.65rem] font-bold uppercase tracking-widest text-[var(--color-gray-500)]">
              {group.title}
            </p>
          )}
          <div className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={`rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-[var(--color-navy-900)] text-white"
                      : "text-[var(--color-gray-700)] hover:bg-[var(--color-gray-100)]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function AdminShell({
  navGroups,
  userLabel,
  roleLabel,
  children,
}: {
  navGroups: AdminNavGroup[];
  userLabel: string;
  roleLabel: string;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--color-gray-50)]">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[var(--color-gray-200)] bg-white px-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Abrir menú"
            onClick={() => setMobileOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-gray-300)] text-[var(--color-navy-900)] lg:hidden"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            </svg>
          </button>
          <Logo size={32} />
          <span className="hidden text-sm font-semibold text-[var(--color-gray-500)] sm:inline">
            Panel de Administración
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-[var(--color-navy-900)]">{userLabel}</p>
            <p className="text-xs text-[var(--color-gray-500)]">{roleLabel}</p>
          </div>
          <Link href="/admin/cuenta" className="btn btn-ghost !px-2.5 !py-1.5 text-xs">
            Mi cuenta
          </Link>
          <form action={logoutAction}>
            <button type="submit" className="btn btn-outline !px-3 !py-1.5 text-xs">
              Cerrar sesión
            </button>
          </form>
        </div>
      </header>

      <div className="mx-auto flex max-w-[100rem]">
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-60 shrink-0 overflow-y-auto border-r border-[var(--color-gray-200)] bg-white lg:block">
          <SidebarNav groups={navGroups} />
        </aside>

        {mobileOpen && (
          <div className="fixed inset-0 top-16 z-20 lg:hidden">
            <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
            <aside className="relative h-full w-64 overflow-y-auto bg-white shadow-xl">
              <SidebarNav groups={navGroups} onNavigate={() => setMobileOpen(false)} />
            </aside>
          </div>
        )}

        <main className="min-w-0 flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
