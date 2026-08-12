import Link from "next/link";
import { prisma } from "@/lib/db";
import { computeStandings, computeScorers, computeDiscipline, getNextMatch, getRecentResults } from "@/lib/stats";
import { NextMatchCard } from "@/components/NextMatchCard";
import { ResultsList } from "@/components/ResultsList";
import { StandingsTable } from "@/components/StandingsTable";
import { ScorersTable } from "@/components/ScorersTable";
import { DisciplineTable } from "@/components/DisciplineTable";
import { VideoPlayer } from "@/components/VideoPlayer";
import { formatDateShort } from "@/lib/format";

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
  const [nextMatch, recentResults, standings, scorers, discipline, settings, featuredVideos] = await Promise.all([
    getNextMatch(),
    getRecentResults(5),
    computeStandings(),
    computeScorers(),
    computeDiscipline(),
    prisma.tournamentSettings.findUnique({ where: { id: "settings" } }),
    prisma.video.findMany({ where: { featured: true }, orderBy: { createdAt: "desc" }, take: 7 }),
  ]);
  // El destacado más reciente se ve grande arriba de todo; el resto (si hay
  // más de uno) va en la franja más chica, más abajo.
  const [primaryVideo, ...videos] = featuredVideos;

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
        <section className="bg-[var(--color-red-600)]">
          <div className="container-page grid gap-8 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-14">
            <div className="relative">
              <div
                className="overflow-hidden rounded-lg"
                style={{ clipPath: "polygon(0 28px, 28px 0, 100% 0, 100% calc(100% - 28px), calc(100% - 28px) 100%, 0 100%)" }}
              >
                <VideoPlayer url={primaryVideo.url} title={primaryVideo.title} />
              </div>
              <div
                className="pointer-events-none absolute -top-3 -left-3 h-8 w-8 bg-white"
                style={{ clipPath: "polygon(0 0, 100% 0, 0 100%)" }}
              />
              <div
                className="pointer-events-none absolute -bottom-3 -right-3 h-8 w-8 bg-white"
                style={{ clipPath: "polygon(100% 0, 100% 100%, 0 100%)" }}
              />
            </div>
            <div>
              <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-[0.7rem] font-bold uppercase tracking-wide text-[var(--color-red-700)]">
                Video destacado
              </span>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-white/70">
                {formatDateShort(primaryVideo.createdAt)}
              </p>
              <h2 className="mt-2 text-2xl font-extrabold leading-tight text-white sm:text-3xl">{primaryVideo.title}</h2>
              <Link
                href="/videos"
                className="mt-5 inline-flex items-center rounded-full border border-white/30 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white hover:bg-white/10"
              >
                Ver todos los videos
              </Link>
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
