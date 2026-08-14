import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { positionLabel } from "@/lib/format";
import { EmptyState } from "@/components/EmptyState";
import { SocialLinks } from "@/components/SocialLinks";
import { TeamCrest } from "@/components/TeamCrest";

export const dynamic = "force-dynamic";

export default async function EquipoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const team = await prisma.team.findUnique({
    where: { id },
    include: {
      players: {
        orderBy: [{ jerseyNumber: "asc" }],
        include: {
          goals: { where: { match: { status: "FINALIZADO" } } },
          cards: { where: { match: { status: "FINALIZADO" } } },
        },
      },
    },
  });

  if (!team) notFound();

  return (
    <div>
      <div className="border-b border-[var(--color-gray-200)] bg-white">
        <div className="container-page py-8">
          <Link href="/equipos" className="text-xs font-semibold text-[var(--color-gray-500)] hover:text-[var(--color-navy-900)]">
            ← Volver a equipos
          </Link>
          <div className="mt-3 flex items-center gap-4">
            <TeamCrest name={team.name} shortName={team.shortName} logoUrl={team.logoUrl} size={56} />
            <div>
              <h1 className="text-xl font-extrabold text-[var(--color-navy-900)] sm:text-2xl">{team.name}</h1>
              <p className="text-sm text-[var(--color-gray-500)]">{team.players.length} jugadores en plantel</p>
              {(team.homeVenue || team.gamertag) && (
                <p className="mt-1 flex flex-wrap gap-x-3 text-xs text-[var(--color-gray-500)]">
                  {team.homeVenue && <span>🏟️ {team.homeVenue}</span>}
                  {team.gamertag && <span>🎮 {team.gamertag}</span>}
                </p>
              )}
            </div>
          </div>
          <div className="mt-4">
            <SocialLinks team={team} />
          </div>
        </div>
      </div>

      <div className="container-page py-8">
        <div className="card p-3 sm:p-5">
          {team.players.length === 0 ? (
            <EmptyState title="Sin datos registrados" hint="Todavía no hay jugadores cargados para este equipo." />
          ) : (
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>N°</th>
                    <th>Jugador</th>
                    <th>Posición</th>
                    <th className="text-center">Goles</th>
                    <th className="text-center">🟨</th>
                    <th className="text-center">🟥</th>
                  </tr>
                </thead>
                <tbody>
                  {team.players.map((player) => (
                    <tr key={player.id}>
                      <td className="font-bold text-[var(--color-gray-500)]">{player.jerseyNumber}</td>
                      <td className="font-semibold text-[var(--color-navy-900)]">
                        {player.firstName} {player.lastName}
                      </td>
                      <td>{positionLabel(player.position)}</td>
                      <td className="text-center font-bold text-[var(--color-red-600)]">{player.goals.length}</td>
                      <td className="text-center">{player.cards.filter((c) => c.type === "AMARILLA").length}</td>
                      <td className="text-center">{player.cards.filter((c) => c.type === "ROJA").length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
