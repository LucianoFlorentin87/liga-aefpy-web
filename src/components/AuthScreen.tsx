import type { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";

type AuthMode = "staff" | "fan" | "recovery";
const COPY = {
  staff: { eyebrow: "Centro de control", first: "Tu liga.", second: "Bajo control.", description: "Equipos, planteles y cada fecha del torneo. Todo empieza desde tu panel.", footer: "Administradores / Delegados" },
  fan: { eyebrow: "La comunidad de la liga", first: "Tu liga.", second: "Tu pasión.", description: "Seguí a los protagonistas y participá con tus predicciones en cada jornada.", footer: "Comunidad / eFootball" },
  recovery: { eyebrow: "Recuperá tu acceso", first: "Volvé.", second: "Al juego.", description: "Recuperá el acceso a tu cuenta y seguí gestionando tu lugar en la liga.", footer: "Acceso al panel / eFootball" },
};

/** Shared visual shell; authentication and redirect decisions stay in each page. */
export function AuthScreen({ children, orgName = "Liga AEFPY", orgTagline = "Asociación de Efootball Paraguay", mode = "staff" }: {
  children: ReactNode; orgName?: string; orgTagline?: string; mode?: AuthMode;
}) {
  const copy = COPY[mode];
  return <div className="auth-screen auth-palette">
    <header className="auth-topbar"><Link href="/" aria-label={orgName + " · inicio"}><Logo size={38} variant="light" showTagline={false} name={orgName} /></Link><Link href="/" className="auth-back-link"><span aria-hidden="true">↖</span> Volver a la liga</Link></header>
    <div className="auth-layout">
      <aside className="auth-story">
        <div aria-hidden="true" className="auth-pitch"><span /><span /></div>
        <p className="auth-eyebrow"><i aria-hidden="true" />{copy.eyebrow}</p>
        <p className="auth-display">{copy.first}<br /><em>{copy.second}</em></p>
        <p className="auth-story-description">{copy.description}</p>
        <p className="auth-story-tagline">{orgTagline}</p>
      </aside>
      <main className="auth-main">{children}</main>
    </div>
    <footer className="auth-footer"><span>{orgName} / eFootball Paraguay</span><span>{copy.footer}</span></footer>
  </div>;
}
export function AuthCard({ children }: { children: ReactNode }) {
  return <div className="auth-card auth-palette">{children}</div>;
}
