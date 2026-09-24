import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { computeStandings } from "@/lib/stats";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { SocialIcons } from "@/components/SocialIcons";
import { TeamCrest } from "@/components/TeamCrest";
import { PlayerCardThumb } from "@/components/PlayerCardThumb";
import { ActiveStatusBadge } from "@/components/StatusBadge";
import { playerFullName } from "@/lib/format";

export const metadata: Metadata = { title: "Equipos" };
export const dynamic = "force-dynamic";

// Cuántas cartas de jugadores se muestran como preview en la tarjeta de
// cada equipo — priorizando a los que ya tienen una carta de eFHUB
// elegida, para no mostrar huecos vacíos mientras se van cargando de a
// poco (ver PlayerCardThumb).
const PLAYER_PREVIEW_COUNT = 4;

export default async function EquiposPage() {
  const [teams, standings] = await Promise.all([
    prisma.team.findMany({
      // RETIRADO también se muestra (con su récord acumulado) — sólo
      // desaparece un equipo si queda INACTIVO.
      where: { status: { in: ["ACTIVO", "RETIRADO"] } },
      include: {
        _count: { select: { players: true } },
        players: {
          where: { status: "ACTIVO" },
          orderBy: { jerseyNumber: "asc" },
          select: { id: true, firstName: true, lastName: true, efhubCard: { select: { cardImageUrl: true } } },
        },
      },
      orderBy: { name: "asc" },
    }),
    computeStandings(),
  ]);

  const standingsByTeam = new Map(standings.map((row) => [row.teamId, row]));
  const positionByTeam = new Map(standings.map((row, index) => [row.teamId, index + 1]));

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
              const position = positionByTeam.get(team.id);
              const previewPlayers = [...team.players]
                .sort((a, b) => (b.efhubCard?.cardImageUrl ? 1 : 0) - (a.efhubCard?.cardImageUrl ? 1 : 0))
                .slice(0, PLAYER_PREVIEW_COUNT);
              return (
                <div
                  key={team.id}
                  className="flex flex-col gap-3 rounded-xl border border-[var(--color-gray-200)] bg-gradient-to-br from-white to-[var(--color-gray-100)] p-5 shadow-sm transition-colors hover:border-[var(--color-navy-700)]"
                >
                  <Link href={`/equipos/${team.id}`} className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <TeamCrest name={team.name} shortName={team.shortName} logoUrl={team.logoUrl} size={44} variant="clean" />
                      <div className="min-w-0">
                        {position && (
                          <p className="text-[0.65rem] font-bold uppercase tracking-wide text-[var(--color-gray-500)]">
                            #{position} en la tabla
                          </p>
                        )}
                        <p className="flex min-w-0 items-center gap-1.5 text-base font-extrabold uppercase text-[var(--color-navy-900)]">
                          <span className="truncate">{team.name}</span>
                          {team.status === "RETIRADO" && <span className="shrink-0"><ActiveStatusBadge status="RETIRADO" /></span>}
                        </p>
                        <p className="text-xs text-[var(--color-gray-500)]">
                          {team._count.players} jugadores
                          {team.gamertag && <span className="text-[var(--color-gray-400)]"> · 🎮 {team.gamertag}</span>}
                        </p>
                      </div>
                    </div>
                    {previewPlayers.length > 0 && (
                      <div className="flex gap-1.5">
                        {previewPlayers.map((p) => (
                          <PlayerCardThumb
                            key={p.id}
                            name={playerFullName(p)}
                            cardImageUrl={p.efhubCard?.cardImageUrl}
                            size={40}
                          />
                        ))}
                      </div>
                    )}
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="rounded-lg border border-[var(--color-gray-200)] bg-white py-2">
                        <p className="text-[0.65rem] text-[var(--color-gray-500)]">PJ</p>
                        <p className="font-bold text-[var(--color-navy-900)]">{row?.pj ?? 0}</p>
                      </div>
                      <div className="rounded-lg border border-[var(--color-gray-200)] bg-white py-2">
                        <p className="text-[0.65rem] text-[var(--color-gray-500)]">Pts</p>
                        <p className="font-bold text-[var(--color-navy-900)]">{row?.pts ?? 0}</p>
                      </div>
                      <div className="rounded-lg border border-[var(--color-gray-200)] bg-white py-2">
                        <p className="text-[0.65rem] text-[var(--color-gray-500)]">GF</p>
                        <p className="font-bold text-[var(--color-navy-900)]">{row?.gf ?? 0}</p>
                      </div>
                    </div>
                  </Link>
                  <SocialIcons team={team} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
