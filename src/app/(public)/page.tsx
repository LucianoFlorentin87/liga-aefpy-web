import Link from "next/link";
import { prisma } from "@/lib/db";
import { computeStandings, computeScorers, computeDiscipline, getNextMatch, getRecentResults } from "@/lib/stats";
import { NextMatchCard } from "@/components/NextMatchCard";
import { ResultsList } from "@/components/ResultsList";
import { StandingsTable } from "@/components/StandingsTable";
import { ScorersTable } from "@/components/ScorersTable";
import { DisciplineTable } from "@/components/DisciplineTable";
import { VideoPlayer } from "@/components/VideoPlayer";

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
  const [nextMatch, recentResults, standings, scorers, discipline, settings, primaryVideo, videos] = await Promise.all([
    getNextMatch(),
    getRecentResults(5),
    computeStandings(),
    computeScorers(),
    computeDiscipline(),
    prisma.tournamentSettings.findUnique({ where: { id: "settings" } }),
    prisma.video.findFirst({ where: { isPrimary: true } }),
    prisma.video.findMany({ where: { featured: true, isPrimary: false }, orderBy: { createdAt: "desc" }, take: 6 }),
  ]);

  return (
    <div>
      <section className="bg-[var(--color-navy-950)]">
        <div className="container-page grid gap-8 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-16">
          <div>
            <p className="eyebrow">Asociación de Efootball Paraguay</p>
            <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl italic tracking-tight text-white sm:text-5xl">
              Liga AEFPY <span className="text-[var(--color-red-500)]">2026</span>
            </h1>
            <p className="mt-2 text-base font-medium text-white/70">
              {settings?.tournamentName &&
              !["Torneo Exa Frutos", "Liga AEFPY"].includes(settings.tournamentName)
                ? settings.tournamentName
                : "Torneo de Fútbol"}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {QUICK_LINKS.map((link) => (
                <Link key={link.href} href={link.href} className="btn border border-white/20 !bg-white/5 !text-white hover:!bg-white/10">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <NextMatchCard match={nextMatch} />
        </div>
      </section>

      {primaryVideo && (
        <section className="container-page pt-10">
          <div className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="section-title">{primaryVideo.title}</h2>
              <Link href="/videos" className="text-xs font-semibold text-[var(--color-red-600)] hover:underline">
                Ver todos
              </Link>
            </div>
            <div className="mx-auto max-w-3xl">
              <VideoPlayer url={primaryVideo.url} title={primaryVideo.title} />
            </div>
          </div>
        </section>
      )}

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

        {videos.length > 0 && (
          <div className="card p-5 lg:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="section-title">Videos</h2>
              <Link href="/videos" className="text-xs font-semibold text-[var(--color-red-600)] hover:underline">
                Ver todos
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {videos.map((video) => (
                <div key={video.id} className="flex flex-col gap-2">
                  <VideoPlayer url={video.url} title={video.title} />
                  <p className="text-sm font-semibold text-[var(--color-navy-900)]">{video.title}</p>
                </div>
              ))}
            </div>
          </div>
        )}

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
