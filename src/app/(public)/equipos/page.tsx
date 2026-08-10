import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { computeStandings } from "@/lib/stats";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";

export const metadata: Metadata = { title: "Equipos" };
export const dynamic = "force-dynamic";

export default async function EquiposPage() {
  const [teams, standings] = await Promise.all([
    prisma.team.findMany({
      where: { status: "ACTIVO" },
      include: { _count: { select: { players: true } } },
      orderBy: { name: "asc" },
    }),
    computeStandings(),
  ]);

  const standingsByTeam = new Map(standings.map((row) => [row.teamId, row]));

  return (
    <div>
      <PageHeader title="Equipos" subtitle="Planteles participantes del torneo." />
      <div className="container-page py-8">
        {teams.length === 0 ? (
          <div className="card p-6">
            <EmptyState title="Sin datos registrados" hint="Todavía no hay equipos cargados." />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {teams.map((team) => {
              const row = standingsByTeam.get(team.id);
              return (
                <Link key={team.id} href={`/equipos/${team.id}`} className="card flex flex-col gap-3 p-5 hover:border-[var(--color-navy-700)]">
                  <div className="flex items-center gap-3">
                    {team.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={team.logoUrl}
                        alt={`Escudo de ${team.name}`}
                        className="h-11 w-11 shrink-0 rounded-full border border-[var(--color-gray-200)] object-contain bg-white"
                      />
                    ) : (
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-navy-100)] text-sm font-extrabold text-[var(--color-navy-900)]">
                        {team.shortName.slice(0, 3).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-[var(--color-navy-900)]">{team.name}</p>
                      <p className="text-xs text-[var(--color-gray-500)]">{team._count.players} jugadores</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="rounded-lg bg-[var(--color-gray-50)] py-2">
                      <p className="text-[0.65rem] text-[var(--color-gray-500)]">PJ</p>
                      <p className="font-bold text-[var(--color-navy-900)]">{row?.pj ?? 0}</p>
                    </div>
                    <div className="rounded-lg bg-[var(--color-gray-50)] py-2">
                      <p className="text-[0.65rem] text-[var(--color-gray-500)]">Pts</p>
                      <p className="font-bold text-[var(--color-navy-900)]">{row?.pts ?? 0}</p>
                    </div>
                    <div className="rounded-lg bg-[var(--color-gray-50)] py-2">
                      <p className="text-[0.65rem] text-[var(--color-gray-500)]">GF</p>
                      <p className="font-bold text-[var(--color-navy-900)]">{row?.gf ?? 0}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
