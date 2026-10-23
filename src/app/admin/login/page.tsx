import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireActiveUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Logo } from "@/components/Logo";
import { AuthScreen, AuthCard } from "@/components/AuthScreen";
import { LoginForm } from "@/components/admin/LoginForm";

export const metadata: Metadata = { title: "Ingresar al panel" };

export default async function AdminLoginPage() {
  // requireActiveUser (no getSession crudo): si el rol de esta sesión ya no
  // coincide con el de la base (se lo cambiaron mientras tenía la sesión
  // abierta), no la tratamos como "ya logueado" — dejamos ver el formulario
  // para que inicie sesión de nuevo y le quede el rol nuevo. Si no, un JWT
  // viejo con un rol que ya no existe redirigía en bucle contra la página
  // que sí valida el rol contra la base (ver requireActiveUser en auth.ts).
  const result = await requireActiveUser();
  if (result) redirect(result.session.role === "DELEGADO" ? "/admin/mi-equipo" : "/admin/dashboard");

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
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-red-300)]">
          Panel de administración
        </p>
        <h1 className="mt-1 text-2xl font-extrabold text-white">Bienvenido de nuevo</h1>
        <p className="mt-1 mb-6 text-sm text-white/60">Acceso exclusivo para personal autorizado del torneo.</p>
        <LoginForm />
      </AuthCard>
      <p className="mt-5 text-center text-xs text-white/50">
        <Link href="/" className="hover:text-white">
          ← Volver al sitio público
        </Link>
      </p>
    </AuthScreen>
  );
}
