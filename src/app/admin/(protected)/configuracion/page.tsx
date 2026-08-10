import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { SettingsForm } from "@/components/admin/SettingsForm";

export const metadata: Metadata = { title: "Configuración del torneo" };
export const dynamic = "force-dynamic";

export default async function ConfiguracionPage() {
  await requirePermission("configuracion");

  const settings = await prisma.tournamentSettings.findUnique({ where: { id: "settings" } });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-extrabold text-[var(--color-navy-900)]">Configuración del torneo</h1>
        <p className="text-sm text-[var(--color-gray-500)]">
          Estos valores se aplican en todo el sitio público (nombre del torneo, orden de la tabla de posiciones).
        </p>
      </div>
      <div className="card p-5">
        <SettingsForm
          tournamentName={settings?.tournamentName ?? "Torneo Exa Frutos"}
          standingsCriteria={settings?.standingsCriteria ?? "PTS,DG,GF"}
        />
      </div>
    </div>
  );
}
