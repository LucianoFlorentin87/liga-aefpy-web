import { prisma } from "@/lib/db";
import { InfoBar } from "@/components/InfoBar";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { Logo } from "@/components/Logo";

// Settings and maintenance mode are read at request time, never during build.
export const dynamic = "force-dynamic";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const settings = await prisma.tournamentSettings.findUnique({ where: { id: "settings" } });

  // Modo mantenimiento (/admin/configuracion): corta todo el sitio público acá,
  // en un solo lugar — el panel de administración vive en otro árbol de rutas
  // (src/app/admin/**) y no pasa por este layout, así que sigue andando normal.
  if (settings?.maintenanceMode) {
    return (
      <div className="league-site flex min-h-screen flex-col bg-[var(--background)]">
        <header className="league-header border-b border-white/10 bg-[var(--color-navy-950)]">
          <div className="mx-auto flex h-16 max-w-[82rem] items-center px-4">
            <Logo size={38} variant="light" showTagline={false} name={settings.orgName} />
          </div>
        </header>
        <main className="flex flex-1 items-center justify-center px-4 py-12">
          <section aria-labelledby="maintenance-title" className="card w-full max-w-lg space-y-4 p-6 text-center sm:p-9">
            <div className="mx-auto w-fit rounded-md border border-[var(--color-gray-200)] px-3 py-1 text-xs font-bold uppercase tracking-widest text-[var(--color-gray-500)]">
              Liga AEFPY
            </div>
            <h1 id="maintenance-title" className="text-2xl font-extrabold text-[var(--color-navy-900)]">Sitio en mantenimiento</h1>
            <p className="text-sm leading-7 text-[var(--color-gray-600)]">{settings.maintenanceMessage}</p>
            <div aria-hidden="true" className="mx-auto h-1 w-16 rounded-full bg-[var(--arena-accent)]" />
          </section>
        </main>
        <footer className="px-4 py-5 text-center text-xs text-[var(--color-gray-500)]">
          {settings.orgName} · Sitio temporalmente no disponible
        </footer>
      </div>
    );
  }

  return (
    <div className="league-site flex min-h-screen flex-1 flex-col">
      <a href="#main-content" className="league-skip-link">Saltar al contenido</a>
      <InfoBar />
      <PublicHeader />
      <main id="main-content" tabIndex={-1} className="flex-1 bg-[var(--background)]">{children}</main>
      <PublicFooter />
    </div>
  );
}
