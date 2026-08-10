import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { SanctionsManager } from "@/components/admin/SanctionsManager";

export const metadata: Metadata = { title: "Sanciones" };
export const dynamic = "force-dynamic";

export default async function SancionesPage() {
  await requirePermission("sanciones");

  const [sanctions, players] = await Promise.all([
    prisma.sanction.findMany({
      orderBy: { startDate: "desc" },
      include: { player: true, team: true },
    }),
    prisma.player.findMany({
      where: { status: "ACTIVO" },
      orderBy: [{ team: { name: "asc" } }, { lastName: "asc" }],
      include: { team: true },
    }),
  ]);

  return <SanctionsManager sanctions={sanctions} players={players} />;
}
