import Link from "next/link";
import { Logo } from "@/components/Logo";
import { PUBLIC_NAV_ITEMS } from "@/components/PublicNav";

export function PublicFooter() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-[var(--color-navy-950)]">
      <div className="container-page flex flex-col gap-6 py-8 md:flex-row md:items-start md:justify-between">
        <div>
          <Logo size={34} variant="light" />
          <p className="mt-3 max-w-xs text-[0.8rem] leading-relaxed text-white/60">
            Torneo oficial organizado por la Liga AEFPY (Asociación de Efootball Paraguay).
          </p>
        </div>

        <nav className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-[0.8rem] sm:grid-cols-3">
          {PUBLIC_NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className="text-white/60 hover:text-white">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="border-t border-white/10 py-4">
        <p className="container-page text-center text-[0.72rem] text-white/40">
          © {new Date().getFullYear()} Liga AEFPY — Asociación de Efootball Paraguay
        </p>
      </div>
    </footer>
  );
}
