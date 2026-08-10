import Link from "next/link";
import { prisma } from "@/lib/db";
import { computeStandings, computeScorers, computeDiscipline, getNextMatch, getRecentResults } from "@/lib/stats";
import { NextMatchCard } from "@/components/NextMatchCard";
import { ResultsList } from "@/components/ResultsList";
import { StandingsTable } from "@/components/StandingsTable";
import { ScorersTable } from "@/components/ScorersTable";
import { DisciplineTable } from "@/components/DisciplineTable";

export const dynamic = "force-dynamic";

const QUICK_LINKS = [
  { href: "/fixture", label: "Fixture" },
  { href: "/resultados", label: "Resultados" },
  { href: "/posiciones", label: "Posiciones" },
  { href: "/goleadores", label: "Goleadores" },
  { href: "/disciplina", label: "Disciplina" },
  { href: "/equipos", label: "Equipos" },
];

export default async function HomePage() {
  const [nextMatch, recentResults, standings, scorers, discipline, settings] = await Promise.all([
    getNextMatch(),
    getRecentResults(5),
    computeStandings(),
    computeScorers(),
    computeDiscipline(),
    prisma.tournamentSettings.findUnique({ where: { id: "settings" } }),
  ]);

  return (
    <div>
      <section className="border-b border-[var(--color-gray-200)] bg-white">
        <div className="container-page grid gap-8 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-14">
          <div>
            <p className="eyebrow">Asociación de Exalumnos Exa Frutos</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[var(--color-navy-900)] sm:text-4xl">
              TORNEO EXA FRUTOS
            </h1>
            <p className="mt-2 text-base font-medium text-[var(--color-gray-600)]">
              {settings?.tournamentName && settings.tournamentName !== "Torneo Exa Frutos"
                ? settings.tournamentName
                : "Torneo de Fútbol de Exalumnos"}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {QUICK_LINKS.map((link) => (
                <Link key={link.href} href={link.href} className="btn btn-outline">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <NextMatchCard match={nextMatch} />
        </div>
      </section>

      <section className="container-page grid gap-6 py-10 lg:grid-cols-2">
        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="section-title">Últimos resultados</h2>
            <Link href="/resultados" className="text-xs font-semibold text-[var(--color-red-600)] hover:underline">
              Ver todos
            </Link>
          </div>
          <ResultsList matches={recentResults} />
        </div>

        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="section-title">Tabla de posiciones</h2>
            <Link href="/posiciones" className="text-xs font-semibold text-[var(--color-red-600)] hover:underline">
              Ver completa
            </Link>
          </div>
          <StandingsTable rows={standings} limit={5} />
        </div>

        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="section-title">Máximos goleadores</h2>
            <Link href="/goleadores" className="text-xs font-semibold text-[var(--color-red-600)] hover:underline">
              Ver todos
            </Link>
          </div>
          <ScorersTable rows={scorers} limit={5} />
        </div>

        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="section-title">Resumen de disciplina</h2>
            <Link href="/disciplina" className="text-xs font-semibold text-[var(--color-red-600)] hover:underline">
              Ver todo
            </Link>
          </div>
          <DisciplineTable rows={discipline} limit={5} />
        </div>
      </section>
    </div>
  );
}
