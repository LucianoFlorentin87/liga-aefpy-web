import Link from "next/link";
import { prisma } from "@/lib/db";
import {
  computeStandings,
  computeScorers,
  computeDiscipline,
  getNextMatch,
  getRecentResults,
  getUpcomingMatches,
} from "@/lib/stats";
import { NextMatchCard } from "@/components/NextMatchCard";
import { ResultsList } from "@/components/ResultsList";
import { StandingsWidget } from "@/components/StandingsWidget";
import { ScorersTable } from "@/components/ScorersTable";
import { DisciplineTable } from "@/components/DisciplineTable";
import { VideoPlayer } from "@/components/VideoPlayer";
import { UpcomingMatchesSlider } from "@/components/UpcomingMatchesSlider";
import { TeamsCardSlider } from "@/components/TeamsCardSlider";
import { WidgetCard } from "@/components/WidgetCard";
import { formatDateShort } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [nextMatch, upcomingMatches, recentResults, standings, scorers, discipline, settings, featuredVideos, teams] =
    await Promise.all([
      getNextMatch(),
      getUpcomingMatches(8),
      getRecentResults(5),
      computeStandings(),
      computeScorers(),
      computeDiscipline(),
      prisma.tournamentSettings.findUnique({ where: { id: "settings" } }),
      prisma.video.findMany({ where: { featured: true }, orderBy: { createdAt: "desc" }, take: 7 }),
      prisma.team.findMany({
        where: { status: "ACTIVO" },
        orderBy: { name: "asc" },
        select: { id: true, name: true, shortName: true, logoUrl: true },
      }),
    ]);
  // El destacado más reciente se ve grande arriba de todo; el resto (si hay
  // más de uno) va en la franja más chica, más abajo.
  const [primaryVideo, ...videos] = featuredVideos;

  return (
    <div>
      <section className="bg-gradient-to-br from-[var(--color-navy-800)] via-[var(--color-navy-900)] to-[var(--color-navy-950)]">
        <div className="container-page grid gap-8 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-16">
          <div>
            <p className="eyebrow">{settings?.orgTagline || "Asociación de Efootball Paraguay"}</p>
            <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl italic tracking-tight text-white sm:text-5xl">
              {settings?.orgName || "Liga AEFPY"} <span className="text-[var(--color-red-500)]">2026</span>
            </h1>
            <p className="mt-2 text-base font-medium text-white/70">{settings?.heroSubtitle || "Torneo de Fútbol"}</p>
          </div>
          <NextMatchCard match={nextMatch} />
        </div>
      </section>

      {upcomingMatches.length > 0 && (
        <section className="container-page py-8">
          <WidgetCard title="Próximos partidos" href="/fixture" ariaLabel="Ver todos los partidos">
            <UpcomingMatchesSlider matches={upcomingMatches} />
          </WidgetCard>
        </section>
      )}

      {primaryVideo && (
        <section className="bg-gradient-to-br from-[var(--color-red-500)] via-[var(--color-red-600)] to-[var(--color-red-700)]">
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
        <WidgetCard title="Últimos resultados" href="/resultados" ariaLabel="Ver todos los resultados">
          <ResultsList matches={recentResults} />
        </WidgetCard>

        <StandingsWidget rows={standings} limit={6} />

        {videos.length > 0 && (
          <WidgetCard title="Videos" href="/videos" ariaLabel="Ver todos los videos" className="lg:col-span-2">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {videos.map((video) => (
                <div key={video.id} className="flex flex-col gap-2">
                  <VideoPlayer url={video.url} title={video.title} />
                  <p className="text-sm font-semibold text-[var(--color-navy-900)]">{video.title}</p>
                </div>
              ))}
            </div>
          </WidgetCard>
        )}

        <WidgetCard title="Máximos goleadores" href="/goleadores" ariaLabel="Ver todos los goleadores">
          <ScorersTable rows={scorers} limit={5} />
        </WidgetCard>

        <WidgetCard title="Resumen de disciplina" href="/disciplina" ariaLabel="Ver todo el resumen de disciplina">
          <DisciplineTable rows={discipline} limit={5} />
        </WidgetCard>
      </section>

      {teams.length > 0 && (
        <section className="container-page pb-10">
          <WidgetCard title="Equipos" href="/equipos" ariaLabel="Ver todos los equipos">
            <TeamsCardSlider teams={teams} />
          </WidgetCard>
        </section>
      )}
    </div>
  );
}
