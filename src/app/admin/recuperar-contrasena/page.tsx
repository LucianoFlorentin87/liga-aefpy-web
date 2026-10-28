import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { AuthScreen, AuthCard } from "@/components/AuthScreen";
import { RequestPasswordResetForm } from "@/components/admin/RequestPasswordResetForm";
export const metadata: Metadata = { title: "Recuperar contraseña" };
export const dynamic = "force-dynamic";

export default async function RecuperarContrasenaPage() {
  const settings = await prisma.tournamentSettings.findUnique({ where: { id: "settings" } });
  return <AuthScreen orgName={settings?.orgName} orgTagline={settings?.orgTagline} mode="recovery"><AuthCard>
    <p className="auth-eyebrow">Administradores y delegados</p>
    <h1 className="auth-title">Recuperá tu acceso.</h1>
    <p className="auth-description">Ingresá el correo de tu cuenta para recibir un enlace y elegir una nueva contraseña.</p>
    <RequestPasswordResetForm />
    <p className="auth-secondary"><Link href="/admin/login">← Volver a ingresar</Link></p>
  </AuthCard></AuthScreen>;
}
