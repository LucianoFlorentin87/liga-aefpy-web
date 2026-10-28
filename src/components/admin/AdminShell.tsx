"use client";
import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AdminNavGroup } from "@/lib/admin-nav";
import { AdminNavIcon } from "@/components/admin/AdminNavIcon";
import { ThemeToggle } from "@/components/ThemeToggle";
import { logoutAction } from "@/app/admin/actions";

function SidebarNav({ groups, onNavigate }: { groups: AdminNavGroup[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  const [search, setSearch] = useState("");
  const normalize = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const term = normalize(search.trim());
  const filtered = groups.map(group => ({ ...group, items: group.items.filter(item => !term || normalize(item.label + " " + group.title).includes(term)) })).filter(group => group.items.length > 0);
  return <><label className="admin-nav-search"><span className="sr-only">Buscar en el menú</span><input type="search" placeholder="Buscar sección…" value={search} onChange={event => setSearch(event.target.value)} onKeyDown={event => { if (event.key === "Escape" && search) { setSearch(""); event.stopPropagation(); } }} /></label><nav aria-label="Navegación del panel" className="admin-sidebar-nav">
    {filtered.map((group, index) => <section key={group.title || index}>
      {group.title && <h2><AdminNavIcon icon={group.icon} /><span>{group.title}</span></h2>}
      {group.items.map(item => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        return <Link key={item.href} href={item.href} onClick={() => { setSearch(""); onNavigate?.(); }} aria-current={active ? "page" : undefined}><span>{item.label}</span><span aria-hidden="true">↗</span></Link>;
      })}
    </section>)}
    {!filtered.length && <p role="status" className="px-3 text-xs text-white/60">No se encontraron secciones.</p>}
  </nav></>;
}
function SidebarBrand({ roleLabel, orgTagline }: { roleLabel: string; orgTagline: string }) {
  return <div className="admin-sidebar-brand"><span className="admin-brand-mark">AEFPY<span> / CONTROL</span></span><p>{roleLabel}</p><small>{orgTagline}</small></div>;
}
export function AdminShell({ navGroups, userLabel, roleLabel, orgName, orgTagline, seasonName, seasonStatus, children }: {
  navGroups: AdminNavGroup[]; userLabel: string; roleLabel: string; orgName: string; orgTagline: string; seasonName: string; seasonStatus: string; children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const menuId = useId();
  useEffect(() => {
    if (!mobileOpen) return;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const drawer = drawerRef.current;
    const focusables = () => Array.from(drawer?.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled])') || []);
    focusables()[0]?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") { setMobileOpen(false); toggleRef.current?.focus(); }
      if (event.key === "Tab") {
        const items = focusables(); const first = items[0]; const last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    }
    const desktop = window.matchMedia("(min-width: 1024px)");
    const onDesktop = () => { if (desktop.matches) setMobileOpen(false); };
    desktop.addEventListener("change", onDesktop);
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = oldOverflow; document.removeEventListener("keydown", onKey); desktop.removeEventListener("change", onDesktop); };
  }, [mobileOpen]);

  const sidebar = <><SidebarBrand roleLabel={roleLabel} orgTagline={orgTagline} /><div className="admin-sidebar-season"><span>Liga actual</span><strong>{seasonName}</strong><small><i />{seasonStatus === "INSCRIPCION" ? "Inscripciones" : "En curso"}</small></div><SidebarNav groups={navGroups} onNavigate={() => setMobileOpen(false)} /><Link href="/" className="admin-back-site">Ver sitio público <span aria-hidden="true">↗</span></Link></>;
  return <div className="admin-arena">
    <a href="#admin-main" className="league-skip-link">Saltar al contenido</a>
    <header className="admin-topbar">
      <div className="flex min-w-0 items-center gap-3"><button ref={toggleRef} type="button" aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"} aria-expanded={mobileOpen} aria-controls={menuId} onClick={() => setMobileOpen(value => !value)} className="admin-icon-button lg:hidden"><svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7h16M4 12h16M4 17h16" /></svg></button>
        <Link href="/" className="admin-topbar-brand" aria-label={orgName + " · sitio público"}><Image src="/logo-liga-aefpy.png" alt="" width={32} height={32} /><span>{orgName}</span></Link><span className="admin-role-tag">{roleLabel}</span>
      </div>
      <div className="flex shrink-0 items-center gap-1 sm:gap-3">
        <div className="hidden text-right md:block"><p className="text-xs font-bold">{userLabel}</p><p className="text-[0.65rem] text-[var(--color-gray-500)]">{roleLabel}</p></div>
        <ThemeToggle className="admin-theme-toggle text-[var(--color-gray-600)]" />
        <Link href="/admin/cuenta" className="admin-icon-button" aria-label="Mi cuenta"><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="4" /><path d="M4 22v-2a8 8 0 0 1 16 0v2" /></svg><span className="hidden sm:inline">Cuenta</span></Link>
        <form action={logoutAction}><button type="submit" className="admin-icon-button" aria-label="Cerrar sesión"><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M10 3H4v18h6M14 7l5 5-5 5M8 12h12" /></svg><span className="hidden sm:inline">Salir</span></button></form>
      </div>
    </header>
    <div className="admin-frame">
      <aside className="admin-sidebar hidden lg:flex">{sidebar}</aside>
      {mobileOpen && <div className="admin-mobile-layer lg:hidden"><button className="admin-drawer-backdrop" aria-label="Cerrar navegación" onClick={() => { setMobileOpen(false); toggleRef.current?.focus(); }} /><aside id={menuId} ref={drawerRef} role="dialog" aria-modal="true" aria-label="Menú del panel" className="admin-sidebar admin-mobile-sidebar"><button className="admin-drawer-close" onClick={() => { setMobileOpen(false); toggleRef.current?.focus(); }}>Cerrar menú <span aria-hidden="true">×</span></button>{sidebar}</aside></div>}
      <main id="admin-main" tabIndex={-1} className="admin-main">{children}</main>
    </div>
  </div>;
}
