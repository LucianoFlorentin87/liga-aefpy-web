import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { RulesEditor } from "@/components/admin/RulesEditor";

export const metadata: Metadata = { title: "Reglamento" };
export const dynamic = "force-dynamic";

export default async function AdminReglamentoPage() {
  await requirePermission("reglamento");

  const settings = await prisma.tournamentSettings.findUnique({ where: { id: "settings" } });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-extrabold text-[var(--color-navy-900)]">Reglamento</h1>
        <p className="text-sm text-[var(--color-gray-500)]">Se publica automáticamente en /reglamento.</p>
      </div>
      <div className="card p-5">
        <RulesEditor initialContent={settings?.rulesContent ?? ""} />
      </div>
    </div>
  );
}
