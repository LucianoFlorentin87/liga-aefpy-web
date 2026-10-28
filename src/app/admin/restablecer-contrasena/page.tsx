import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { AuthScreen, AuthCard } from "@/components/AuthScreen";
import { CompletePasswordResetForm } from "@/components/admin/CompletePasswordResetForm";
export const metadata: Metadata = { title: "Restablecer contraseña" };

export default async function RestablecerContrasenaPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const settings = await prisma.tournamentSettings.findUnique({ where: { id: "settings" } });
  return <AuthScreen orgName={settings?.orgName} orgTagline={settings?.orgTagline} mode="recovery"><AuthCard>
    <p className="auth-eyebrow">Seguridad de tu cuenta</p>
    <h1 className="auth-title">Nueva contraseña.</h1>
    {token ? <><p className="auth-description">Elegí una nueva contraseña para reemplazar la anterior.</p><CompletePasswordResetForm token={token} /></> : <p className="auth-description">Este enlace no es válido. <Link href="/admin/recuperar-contrasena" className="auth-inline-link">Pedí uno nuevo ↗</Link></p>}
    <p className="auth-secondary"><Link href="/admin/login">← Volver a ingresar</Link></p>
  </AuthCard></AuthScreen>;
}
