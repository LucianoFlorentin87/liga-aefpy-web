import Link from "next/link";
import { Logo } from "@/components/Logo";
import { PUBLIC_NAV_ITEMS } from "@/components/PublicNav";
import { MobileMenuButton } from "@/components/MobileMenuButton";
import { getVoterIdentity } from "@/lib/voter";
import { logoutFanAction } from "@/app/(public)/cuenta/actions";
import { logoutAction as logoutStaffAction } from "@/app/admin/actions";

export async function PublicHeader() {
  const voter = await getVoterIdentity();

  return (
    <header className="relative border-b border-white/10 bg-[var(--color-navy-950)]">
      <div className="mx-auto flex h-16 max-w-[82rem] items-center justify-between gap-4 px-4">
        <Link href="/" className="flex shrink-0 items-center">
          <Logo size={38} variant="light" showTagline={false} />
        </Link>

        <nav className="hidden xl:flex items-center gap-1">
          {PUBLIC_NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-[0.83rem] font-semibold text-white/75 hover:bg-white/10 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

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
          <Link
            href="/admin"
            className="hidden xl:inline-flex items-center rounded-full border border-[var(--color-red-500)]/50 px-3.5 py-1.5 text-[0.72rem] font-bold uppercase tracking-wide text-[var(--color-red-500)] hover:bg-[var(--color-red-500)]/10"
          >
            Administración
          </Link>
          <MobileMenuButton voter={voter} />
        </div>
      </div>
    </header>
  );
}
