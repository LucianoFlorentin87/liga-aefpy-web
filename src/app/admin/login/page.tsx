import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireActiveUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AuthScreen, AuthCard } from "@/components/AuthScreen";
import { LoginForm } from "@/components/admin/LoginForm";
export const metadata: Metadata = { title: "Ingresar al panel" };

export default async function AdminLoginPage() {
  // Revalidate the role against the database before treating a session as signed in.
  const result = await requireActiveUser();
  if (result) redirect(result.session.role === "DELEGADO" ? "/admin/mi-equipo" : "/admin/dashboard");
  const settings = await prisma.tournamentSettings.findUnique({ where: { id: "settings" } });
  return <AuthScreen orgName={settings?.orgName} orgTagline={settings?.orgTagline} mode="staff">
    <AuthCard>
      <p className="auth-eyebrow">Administradores y delegados</p>
      <h1 className="auth-title">Entrá al panel.</h1>
      <p className="auth-description">Usá tu cuenta para gestionar la liga o tu equipo.</p>
      <LoginForm />
      <p className="auth-secondary">¿Querés participar con tu equipo? <Link href="/inscripcion">Ver inscripciones ↗</Link></p>
    </AuthCard>
    <p className="auth-account-note">Tu acceso y tus permisos dependen del rol asignado por la organización.</p>
  </AuthScreen>;
}
