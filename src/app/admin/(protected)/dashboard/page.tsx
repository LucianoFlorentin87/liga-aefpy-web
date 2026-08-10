import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/permissions";
import { can } from "@/lib/permissions";
import { StatCard } from "@/components/admin/StatCard";
import { EmptyState } from "@/components/EmptyState";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { session } = await requireAuth();

  const [
    teams,
    players,
    matches,
    playedMatches,
    upcomingMatches,
    goals,
    yellowCards,
    redCards,
    users,
    recentActivity,
  ] = await Promise.all([
    prisma.team.count({ where: { status: "ACTIVO" } }),
    prisma.player.count({ where: { status: "ACTIVO" } }),
    prisma.match.count(),
    prisma.match.count({ where: { status: "FINALIZADO" } }),
    prisma.match.count({ where: { status: { in: ["PROGRAMADO", "REPROGRAMADO"] } } }),
    prisma.matchGoal.count(),
    prisma.matchCard.count({ where: { type: "AMARILLA" } }),
    prisma.matchCard.count({ where: { type: "ROJA" } }),
    can(session.role, "usuarios") ? prisma.user.count() : Promise.resolve(null),
    prisma.activityLog.findMany({ orderBy: { createdAt: "desc" }, take: 12 }),
  ]);

  const cards = [
    { label: "Equipos", value: teams },
    { label: "Jugadores", value: players },
    { label: "Partidos", value: matches },
    { label: "Partidos jugados", value: playedMatches },
    { label: "Próximos partidos", value: upcomingMatches },
    { label: "Goles", value: goals },
    { label: "Tarjetas amarillas", value: yellowCards },
    { label: "Tarjetas rojas", value: redCards },
    ...(users !== null ? [{ label: "Usuarios", value: users }] : []),
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-extrabold text-[var(--color-navy-900)]">
          Hola, {session.firstName} 👋
        </h1>
        <p className="text-sm text-[var(--color-gray-500)]">Resumen general del torneo.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {cards.map((c) => (
          <StatCard key={c.label} label={c.label} value={c.value} />
        ))}
      </div>

      <div className="card p-5">
        <h2 className="section-title mb-3">Actividad reciente</h2>
        {recentActivity.length === 0 ? (
          <EmptyState title="Sin datos registrados" hint="Todavía no hay actividad en el sistema." />
        ) : (
          <ul className="flex flex-col divide-y divide-[var(--color-gray-100)]">
            {recentActivity.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                <span className="text-[var(--color-gray-800)]">{entry.message}</span>
                <span className="shrink-0 text-xs text-[var(--color-gray-400)]">
                  {new Intl.DateTimeFormat("es-PY", { dateStyle: "short", timeStyle: "short" }).format(entry.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
