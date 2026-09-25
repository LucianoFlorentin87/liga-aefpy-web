import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { Logo } from "@/components/Logo";
import { RequestPasswordResetForm } from "@/components/admin/RequestPasswordResetForm";

export const metadata: Metadata = { title: "Recuperar contraseña" };
export const dynamic = "force-dynamic";

export default async function RecuperarContrasenaPage() {
  const settings = await prisma.tournamentSettings.findUnique({ where: { id: "settings" } });

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-navy-950)] px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <Logo
            size={44}
            variant="light"
            name={settings?.orgName ?? "Liga AEFPY"}
            tagline={settings?.orgTagline ?? "Asociación de Efootball Paraguay"}
          />
        </div>
        <div className="card p-6">
          <p className="eyebrow">Panel de administración</p>
          <h1 className="mt-1 text-lg font-extrabold text-[var(--color-navy-900)]">Recuperar contraseña</h1>
          <p className="mt-1 mb-5 text-sm text-[var(--color-gray-500)]">
            Ingresá el correo de tu cuenta y te mandamos un enlace para elegir una nueva contraseña.
          </p>
          <RequestPasswordResetForm />
        </div>
        <p className="mt-4 text-center text-xs text-white/60">
          <Link href="/admin/login" className="hover:text-white">
            ← Volver a ingresar
          </Link>
        </p>
      </div>
    </div>
  );
}
