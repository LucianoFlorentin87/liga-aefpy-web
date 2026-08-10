import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { LoginForm } from "@/components/admin/LoginForm";

export const metadata: Metadata = { title: "Ingresar al panel" };

export default async function AdminLoginPage() {
  const session = await getSession();
  if (session) redirect("/admin/dashboard");

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-navy-950)] px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <Logo size={44} variant="light" />
        </div>
        <div className="card p-6">
          <p className="eyebrow">Panel de administración</p>
          <h1 className="mt-1 text-lg font-extrabold text-[var(--color-navy-900)]">Ingresar</h1>
          <p className="mt-1 mb-5 text-sm text-[var(--color-gray-500)]">
            Acceso exclusivo para personal autorizado del torneo.
          </p>
          <LoginForm />
        </div>
        <p className="mt-4 text-center text-xs text-white/60">
          <Link href="/" className="hover:text-white">
            ← Volver al sitio público
          </Link>
        </p>
      </div>
    </div>
  );
}
