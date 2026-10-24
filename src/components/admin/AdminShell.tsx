"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AdminNavGroup } from "@/lib/admin-nav";
import { AdminNavIcon } from "@/components/admin/AdminNavIcon";
import { ThemeToggle } from "@/components/ThemeToggle";
import { logoutAction } from "@/app/admin/actions";

function isGroupActive(pathname: string, group: AdminNavGroup) {
  return group.items.some((item) => pathname === item.href || pathname.startsWith(item.href + "/"));
}

/**
 * Cabecera de marca del sidebar: degradado navy con acento rojo y el
 * divisor de color debajo del título — mismo patrón que el "hero" de
 * cabecera de IT Tools, llevado a la paleta navy/rojo propia en vez del
 * verde de la referencia.
 */
function SidebarBrandHero({ orgTagline }: { orgTagline: string }) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-[var(--color-navy-950)] via-[var(--color-navy-900)] to-[var(--color-navy-800)] px-4 py-6 text-center">
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{ background: "radial-gradient(circle at 25% 15%, var(--color-red-accent), transparent 55%)" }}
      />
      <div className="relative">
        <Image
          src="/logo-liga-aefpy.png"
          alt=""
          width={40}
          height={40}
          className="mx-auto shrink-0 rounded-lg"
        />
        <p className="mt-2.5 text-[0.7rem] font-bold uppercase tracking-[0.14em] text-white">
          Panel de Administración
        </p>
        <div className="mx-auto mt-2 h-[3px] w-10 rounded-full bg-[var(--color-red-accent)]" />
        <p className="mt-2 text-[0.65rem] text-white/60">{orgTagline}</p>
      </div>
    </div>
  );
}

function NavLink({ item, pathname, onNavigate }: { item: AdminNavGroup["items"][number]; pathname: string; onNavigate?: () => void }) {
  const active = pathname === item.href || pathname.startsWith(item.href + "/");
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={`rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-[var(--color-navy-950)] text-white"
          : "text-[var(--color-gray-700)] hover:bg-[var(--color-gray-100)]"
      }`}
    >
      {item.label}
    </Link>
  );
}

/** Categoría colapsable del menú — chevron + línea de acento, igual patrón que el árbol de herramientas de IT Tools. */
function NavGroupSection({ group, pathname, onNavigate }: { group: AdminNavGroup; pathname: string; onNavigate?: () => void }) {
  const [open, setOpen] = useState(true);

  if (!group.title) {
    return (
      <div className="flex flex-col gap-0.5">
        {group.items.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} />
        ))}
      </div>
    );
  }

  const active = isGroupActive(pathname, group);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1 text-[0.65rem] font-bold uppercase tracking-widest text-[var(--color-gray-500)] hover:text-[var(--color-gray-700)]"
      >
        <AdminNavIcon icon={group.icon} className={active ? "text-[var(--color-red-accent)]" : "text-[var(--color-gray-400)]"} />
        <span className="flex-1 text-left">{group.title}</span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="ml-[0.95rem] mt-1 flex flex-col gap-0.5 border-l border-[var(--color-gray-200)] pl-2.5">
          {group.items.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} />
          ))}
        </div>
      )}
    </div>
  );
}

function SidebarNav({ groups, onNavigate }: { groups: AdminNavGroup[]; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-4 px-3 py-4">
      {groups.map((group, i) => (
        <NavGroupSection key={i} group={group} pathname={pathname} onNavigate={onNavigate} />
      ))}
    </nav>
  );
}

export function AdminShell({
  navGroups,
  userLabel,
  roleLabel,
  orgName,
  orgTagline,
  children,
}: {
  navGroups: AdminNavGroup[];
  userLabel: string;
  roleLabel: string;
  orgName: string;
  orgTagline: string;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--color-gray-50)]">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[var(--color-gray-200)] bg-[var(--color-surface)] px-4">
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
          <span className="text-sm font-extrabold uppercase tracking-tight text-[var(--color-navy-900)]">{orgName}</span>
          <span className="hidden text-sm font-semibold text-[var(--color-gray-500)] sm:inline">
            Panel de Administración
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-[var(--color-navy-900)]">{userLabel}</p>
            <p className="text-xs text-[var(--color-gray-500)]">{roleLabel}</p>
          </div>
          <ThemeToggle className="text-[var(--color-gray-600)] hover:bg-[var(--color-gray-100)]" />
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
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-60 shrink-0 overflow-y-auto border-r border-[var(--color-gray-200)] bg-[var(--color-surface)] lg:block">
          <SidebarBrandHero orgTagline={orgTagline} />
          <SidebarNav groups={navGroups} />
        </aside>

        {mobileOpen && (
          <div className="fixed inset-0 top-16 z-20 lg:hidden">
            <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
            <aside className="relative h-full w-64 overflow-y-auto bg-[var(--color-surface)] shadow-xl">
              <SidebarBrandHero orgTagline={orgTagline} />
              <SidebarNav groups={navGroups} onNavigate={() => setMobileOpen(false)} />
            </aside>
          </div>
        )}

        <main className="min-w-0 flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
