import { prisma } from "@/lib/db";
import { Logo } from "@/components/Logo";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { TeamLogosBar } from "@/components/TeamLogosBar";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const settings = await prisma.tournamentSettings.findUnique({ where: { id: "settings" } });

  // Modo mantenimiento (/admin/configuracion): corta todo el sitio público acá,
  // en un solo lugar — el panel de administración vive en otro árbol de rutas
  // (src/app/admin/**) y no pasa por este layout, así que sigue andando normal.
  if (settings?.maintenanceMode) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-navy-950)] px-4 py-10">
        <div className="w-full max-w-sm text-center">
          <div className="mb-6 flex justify-center">
            <Logo
              size={44}
              variant="light"
              name={settings.orgName}
              tagline={settings.orgTagline}
            />
          </div>
          <div className="card p-6">
            <p className="eyebrow">Sitio en mantenimiento</p>
            <h1 className="mt-1 text-lg font-extrabold text-[var(--color-navy-900)]">Volvemos pronto</h1>
            <p className="mt-3 text-sm text-[var(--color-gray-500)]">{settings.maintenanceMessage}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <TeamLogosBar />
      <PublicHeader />
      <main className="flex-1 bg-[var(--background)]">{children}</main>
      <PublicFooter />
    </>
  );
}
