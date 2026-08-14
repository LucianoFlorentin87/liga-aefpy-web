import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { positionLabel, formatDateShort, playerFullName } from "@/lib/format";
import { StatCard } from "@/components/admin/StatCard";
import { SanctionStatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";

export const dynamic = "force-dynamic";

export default async function PlayerStatsPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("jugadores");
  const { id } = await params;

  const player = await prisma.player.findUnique({
    where: { id },
    include: {
      team: true,
      goals: { include: { match: true }, orderBy: { minute: "asc" } },
      cards: { include: { match: true }, orderBy: { minute: "asc" } },
      sanctions: { orderBy: { startDate: "desc" } },
      participations: true,
    },
  });

  if (!player) notFound();

  const matchesPlayed = player.participations.length;
  const starts = player.participations.filter((p) => p.isStarter).length;
  const yellow = player.cards.filter((c) => c.type === "AMARILLA").length;
  const red = player.cards.filter((c) => c.type === "ROJA").length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/jugadores" className="text-xs font-semibold text-[var(--color-gray-500)] hover:text-[var(--color-navy-900)]">
          ← Volver a jugadores
        </Link>
        <h1 className="mt-1 text-xl font-extrabold text-[var(--color-navy-900)]">{playerFullName(player)}</h1>
        <p className="text-sm text-[var(--color-gray-500)]">
          {player.team.name} · N° {player.jerseyNumber} · {positionLabel(player.position)}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Partidos" value={matchesPlayed} />
        <StatCard label="Titularidades" value={starts} />
        <StatCard label="Goles" value={player.goals.length} />
        <StatCard label="Amarillas" value={yellow} />
        <StatCard label="Rojas" value={red} />
      </div>

      <div className="card p-5">
        <h2 className="section-title mb-3">Sanciones</h2>
        {player.sanctions.length === 0 ? (
          <EmptyState title="Sin datos registrados" hint="Este jugador no tiene sanciones registradas." />
        ) : (
          <ul className="flex flex-col divide-y divide-[var(--color-gray-100)]">
            {player.sanctions.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <div>
                  <p className="font-medium text-[var(--color-navy-900)]">{s.reason}</p>
                  <p className="text-xs text-[var(--color-gray-500)]">
                    {s.matchesCount} partido(s) · desde {formatDateShort(s.startDate)}
                    {s.endDate ? ` hasta ${formatDateShort(s.endDate)}` : ""}
                  </p>
                </div>
                <SanctionStatusBadge status={s.status} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
