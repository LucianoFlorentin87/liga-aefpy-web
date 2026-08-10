import Link from "next/link";
import { Logo } from "@/components/Logo";
import { PUBLIC_NAV_ITEMS } from "@/components/PublicNav";
import { MobileMenuButton } from "@/components/MobileMenuButton";

export function PublicHeader() {
  return (
    <header className="relative border-b border-[var(--color-gray-200)] bg-white/95 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center">
          <Logo size={38} />
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {PUBLIC_NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-[0.83rem] font-semibold text-[var(--color-gray-700)] hover:bg-[var(--color-gray-100)] hover:text-[var(--color-navy-900)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/admin" className="hidden md:inline-flex btn btn-ghost !px-3 !py-1.5 text-[0.78rem]">
            Administración
          </Link>
          <MobileMenuButton />
        </div>
      </div>
    </header>
  );
}
