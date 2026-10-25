import Link from "next/link";
import { prisma } from "@/lib/db";
import { Logo } from "@/components/Logo";
import { PublicNavMenu } from "@/components/PublicNavMenu";
import { MobileMenuButton } from "@/components/MobileMenuButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getAccountVoter } from "@/lib/voter";
import { logoutFanAction } from "@/app/(public)/(with-crests)/cuenta/actions";
import { logoutAction as logoutStaffAction } from "@/app/admin/actions";

export async function PublicHeader() {
  const [voter, settings] = await Promise.all([
    getAccountVoter(),
    prisma.tournamentSettings.findUnique({ where: { id: "settings" } }),
  ]);

  return (
    <header className="relative border-b border-white/10 bg-[var(--color-navy-950)]">
      <div className="mx-auto flex h-16 max-w-[82rem] items-center justify-between gap-4 px-4">
        <Link href="/" className="flex shrink-0 items-center">
          <Logo size={38} variant="light" showTagline={false} name={settings?.orgName ?? "Liga AEFPY"} />
        </Link>

        <PublicNavMenu />

        <div className="flex items-center gap-2">
          {voter ? (
            <div className="hidden xl:flex items-center gap-2">
              <span className="text-[0.78rem] font-semibold text-white/80">
                Hola, {voter.firstName}
                {voter.kind === "staff" && " (Delegado)"}
              </span>
              <form action={voter.kind === "fan" ? logoutFanAction : logoutStaffAction}>
                <button
                  type="submit"
                  className="inline-flex items-center rounded-full border border-white/20 px-3.5 py-1.5 text-[0.72rem] font-bold uppercase tracking-wide text-white/75 hover:bg-white/10 hover:text-white"
                >
                  Salir
                </button>
              </form>
            </div>
          ) : (
            <div className="hidden xl:flex items-center gap-2">
              <Link
                href="/cuenta/login"
                className="inline-flex items-center rounded-full border border-white/20 px-3.5 py-1.5 text-[0.72rem] font-bold uppercase tracking-wide text-white/75 hover:bg-white/10 hover:text-white"
              >
                Ingresar
              </Link>
              <Link
                href="/cuenta/registro"
                className="inline-flex items-center rounded-full bg-[var(--color-red-600)] px-3.5 py-1.5 text-[0.72rem] font-bold uppercase tracking-wide text-white hover:bg-[var(--color-red-700)]"
              >
                Registrarme
              </Link>
            </div>
          )}
          {/* text-red-300 fijo (no var(--color-red-300)): el header se
              mantiene navy-950 en los dos temas, y la variable de red-300
              se oscurece en modo oscuro pensada para fondos que sí se
              aclaran ahí — sobre un fondo que no cambia, necesita el mismo
              rojo claro fijo que ya usa NextMatchCard. */}
          <Link
            href="/admin"
            className="hidden xl:inline-flex items-center rounded-full border border-red-300/50 px-3.5 py-1.5 text-[0.72rem] font-bold uppercase tracking-wide text-red-300 hover:bg-[var(--color-red-500)]/10"
          >
            Administración
          </Link>
          <ThemeToggle className="text-white/75 hover:bg-white/10 hover:text-white" />
          <MobileMenuButton voter={voter} />
        </div>
      </div>
    </header>
  );
}
