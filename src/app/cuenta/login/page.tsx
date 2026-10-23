import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getFanSession } from "@/lib/fan-auth";
import { prisma } from "@/lib/db";
import { Logo } from "@/components/Logo";
import { AuthScreen, AuthCard } from "@/components/AuthScreen";
import { FanLoginForm } from "@/components/FanLoginForm";

export const metadata: Metadata = { title: "Ingresar" };

export default async function FanLoginPage() {
  const session = await getFanSession();
  if (session) redirect("/fixture");

  const settings = await prisma.tournamentSettings.findUnique({ where: { id: "settings" } });

  return (
    <AuthScreen>
      <div className="mb-6 flex justify-center">
        <Logo
          size={44}
          variant="light"
          name={settings?.orgName ?? "Liga AEFPY"}
          tagline={settings?.orgTagline ?? "Asociación de Efootball Paraguay"}
        />
      </div>
      <AuthCard>
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-red-300)]">Cuenta de hincha</p>
        <h1 className="mt-1 text-2xl font-extrabold text-white">Bienvenido de nuevo</h1>
        <p className="mt-1 mb-6 text-sm text-white/60">Entrá a tu cuenta para votar en cada jornada.</p>
        <FanLoginForm />
        <p className="mt-5 text-center text-xs text-white/60">
          ¿Todavía no tenés cuenta?{" "}
          <Link href="/cuenta/registro" className="font-semibold text-[var(--color-red-300)] hover:text-white">
            Registrate
          </Link>
        </p>
      </AuthCard>
      <p className="mt-5 text-center text-xs text-white/50">
        <Link href="/" className="hover:text-white">
          ← Volver al sitio
        </Link>
      </p>
    </AuthScreen>
  );
}
