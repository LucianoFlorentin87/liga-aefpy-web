import Link from "next/link";
import { Logo } from "@/components/Logo";
import { PUBLIC_NAV_ITEMS } from "@/components/PublicNav";

export function PublicFooter() {
  return (
    <footer className="mt-auto border-t border-[var(--color-gray-200)] bg-white">
      <div className="container-page flex flex-col gap-6 py-8 md:flex-row md:items-start md:justify-between">
        <div>
          <Logo size={34} />
          <p className="mt-3 max-w-xs text-[0.8rem] leading-relaxed text-[var(--color-gray-500)]">
            Torneo de Fútbol de Exalumnos del Colegio Nacional Juan Manuel Frutos, organizado por
            la Asociación de Exalumnos Exa Frutos.
          </p>
        </div>

        <nav className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-[0.8rem] sm:grid-cols-3">
          {PUBLIC_NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className="text-[var(--color-gray-600)] hover:text-[var(--color-navy-900)]">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="border-t border-[var(--color-gray-100)] py-4">
        <p className="container-page text-center text-[0.72rem] text-[var(--color-gray-500)]">
          © {new Date().getFullYear()} Asociación de Exalumnos Exa Frutos — Torneo Exa Frutos
        </p>
      </div>
    </footer>
  );
}
