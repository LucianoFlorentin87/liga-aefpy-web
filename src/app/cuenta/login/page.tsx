import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getFanSession } from "@/lib/fan-auth";
import { prisma } from "@/lib/db";
import { AuthScreen, AuthCard } from "@/components/AuthScreen";
import { FanLoginForm } from "@/components/FanLoginForm";
export const metadata: Metadata = { title: "Ingresar" };

export default async function FanLoginPage() {
  const session = await getFanSession();
  if (session) redirect("/fixture");
  const settings = await prisma.tournamentSettings.findUnique({ where: { id: "settings" } });
  return <AuthScreen orgName={settings?.orgName} orgTagline={settings?.orgTagline} mode="fan">
    <AuthCard>
      <p className="auth-eyebrow">Cuenta de hincha</p>
      <h1 className="auth-title">Volvé a la liga.</h1>
      <p className="auth-description">Ingresá para votar en los partidos de cada jornada.</p>
      <FanLoginForm />
      <p className="auth-secondary">¿Todavía no tenés cuenta? <Link href="/cuenta/registro">Registrate ↗</Link></p>
    </AuthCard>
    <p className="auth-account-note">¿Sos administrador o delegado? <Link href="/admin/login">Ingresá al panel ↗</Link></p>
  </AuthScreen>;
}
