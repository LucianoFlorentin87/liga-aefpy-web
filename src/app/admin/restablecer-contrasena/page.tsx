import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { Logo } from "@/components/Logo";
import { CompletePasswordResetForm } from "@/components/admin/CompletePasswordResetForm";

export const metadata: Metadata = { title: "Restablecer contraseña" };

export default async function RestablecerContrasenaPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
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
          <h1 className="mt-1 text-lg font-extrabold text-[var(--color-navy-900)]">Elegir nueva contraseña</h1>

          {token ? (
            <>
              <p className="mt-1 mb-5 text-sm text-[var(--color-gray-500)]">
                Elegí tu nueva contraseña. Va a reemplazar la anterior.
              </p>
              <CompletePasswordResetForm token={token} />
            </>
          ) : (
            <p className="mt-1 text-sm text-[var(--color-gray-500)]">
              Este enlace no es válido.{" "}
              <Link href="/admin/recuperar-contrasena" className="font-semibold text-[var(--color-red-accent)] hover:underline">
                Pedí uno nuevo
              </Link>
              .
            </p>
          )}
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
