import Link from "next/link";
import { Logo } from "@/components/Logo";
import { PUBLIC_NAV_ITEMS } from "@/components/PublicNav";
import { MobileMenuButton } from "@/components/MobileMenuButton";

export function PublicHeader() {
  return (
    <header className="relative border-b border-white/10 bg-[var(--color-navy-950)]">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center">
          <Logo size={38} variant="light" />
        </Link>

        <nav className="hidden md:flex items-center gap-1">
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
          <Link
            href="/admin"
            className="hidden md:inline-flex items-center rounded-full border border-[var(--color-red-500)]/50 px-3.5 py-1.5 text-[0.72rem] font-bold uppercase tracking-wide text-[var(--color-red-500)] hover:bg-[var(--color-red-500)]/10"
          >
            Administración
          </Link>
          <MobileMenuButton />
        </div>
      </div>
    </header>
  );
}
