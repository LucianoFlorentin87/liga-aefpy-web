import { registrationIsOpen } from "@/lib/league-validation";
import Link from "next/link";
import { prisma, getCurrentSeason } from "@/lib/db";
import { computeStandingsWithTrend, computeScorers, computeDiscipline, getNextMatch, getRecentResults, getUpcomingMatches } from "@/lib/stats";
import { NextMatchCard } from "@/components/NextMatchCard";
import { ResultsList } from "@/components/ResultsList";
import { StandingsWidget } from "@/components/StandingsWidget";
import { DisciplineWidget } from "@/components/DisciplineWidget";
import { VideoPlayer } from "@/components/VideoPlayer";
import { UpcomingMatchesSlider } from "@/components/UpcomingMatchesSlider";
import { TeamsCardSlider } from "@/components/TeamsCardSlider";
import { WidgetCard } from "@/components/WidgetCard";
import { TeamCrest } from "@/components/TeamCrest";
import { PlayerCardThumb } from "@/components/PlayerCardThumb";
import { formatDateShort } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [nextMatch, upcomingMatches, recentResults, standings, scorers, discipline, settings, featuredVideos, teams] = await Promise.all([
    getNextMatch(), getUpcomingMatches(8), getRecentResults(5), computeStandingsWithTrend(), computeScorers(), computeDiscipline(),
    prisma.tournamentSettings.findUnique({ where: { id: "settings" } }),
    prisma.video.findMany({ where: { featured: true }, orderBy: { createdAt: "desc" }, take: 4 }),
    prisma.team.findMany({ where: { status: "ACTIVO" }, orderBy: { name: "asc" }, select: { id: true, name: true, shortName: true, logoUrl: true } }),
  ]);
  const season = await getCurrentSeason();
  const [primaryVideo, ...videos] = featuredVideos;
  const leaders = standings.slice(0, 3);

  return (
    <div className="league-home">
      {season.status === "INSCRIPCION" && <div className="bg-[var(--color-surface)] border-b border-[var(--color-gray-200)]"><div className="container-page flex flex-wrap items-center justify-between gap-3 py-4"><div><p className="arena-overline">{registrationIsOpen(season) ? "Inscripciones abiertas" : "Inscripciones en revisión"}</p><strong className="text-sm">{season.name}</strong></div><Link href={"/inscripcion/" + season.slug} className="arena-section-link">Inscribí tu equipo ↗</Link></div></div>}
      <section className="arena-hero">
        <div aria-hidden="true" className="arena-pitch"><span /><span /><span /></div>
        <div className="container-page arena-hero-grid">
          <div className="league-enter arena-intro">
            <p className="arena-kicker"><span /> {settings?.orgTagline || "Asociación de Efootball Paraguay"}</p>
            <p className="arena-edition">{settings?.orgName || "Liga AEFPY"} / {season.name}</p>
            <h1 className="arena-headline">La liga.<br /><em>Tu juego.</em></h1>
            <p className="arena-description">{settings?.heroSubtitle || "Cada fecha cuenta. Seguí los partidos, los protagonistas y la carrera por el título."}</p>
            <nav aria-label="Accesos rápidos del torneo" className="arena-actions">
              <Link className="arena-button" href="/fixture">Explorar fixture <span aria-hidden="true">↗</span></Link>
              <Link className="arena-text-link" href="/resultados">Ver resultados <span aria-hidden="true">→</span></Link>
            </nav>
          </div>
          <div className="league-enter league-enter-delayed arena-match-wrap"><NextMatchCard match={nextMatch} /></div>
        </div>
        <div className="container-page arena-bottomline">
          <span>Competición. Comunidad. eFootball.</span>
          <span><b>{teams.length}</b> equipos <i aria-hidden="true">/</i> <b>{standings.length}</b> en la clasificación</span>
        </div>
      </section>

      {upcomingMatches.length > 0 && <section className="arena-schedule">
        <div className="container-page">
          <div className="arena-section-heading"><div><p className="arena-overline">En agenda</p><h2>La próxima jugada.</h2></div><Link href="/fixture" className="arena-section-link">Todo el fixture <span aria-hidden="true">↗</span></Link></div>
          <UpcomingMatchesSlider matches={upcomingMatches} />
        </div>
      </section>}

      <section className="container-page arena-section">
        <div className="arena-section-heading"><div><p className="arena-overline">La pelea por el título</p><h2>Arriba de todos.</h2></div><Link href="/posiciones" className="arena-section-link">Clasificación completa <span aria-hidden="true">↗</span></Link></div>
        {leaders.length > 0 && <ol className="arena-podium" aria-label="Primeros puestos de la clasificación">
          {leaders.map((team, index) => <li key={team.teamId} className={index === 0 ? "arena-leader arena-leader-first" : "arena-leader"}>
            <Link href={"/equipos/" + team.teamId}>
              <span className="arena-rank" aria-hidden="true">0{index + 1}</span>
              <span className="arena-leader-label">{index === 0 ? "Líder del torneo" : "Puesto " + (index + 1)}</span>
              <div className="arena-leader-team"><TeamCrest name={team.teamName} shortName={team.teamShortName} logoUrl={team.logoUrl} size={64} /><h3>{team.teamName}</h3></div>
              <div className="arena-leader-stats"><span><b>{team.pts}</b> PTS</span><span>{team.pj} PJ <i aria-hidden="true">/</i> {team.dg > 0 ? "+" : ""}{team.dg} DG</span></div>
            </Link>
          </li>)}
        </ol>}
        <div className="arena-data-grid"><WidgetCard title="Últimos resultados" href="/resultados" ariaLabel="Ver todos los resultados"><ResultsList matches={recentResults} /></WidgetCard><StandingsWidget rows={standings} limit={10} /></div>
      </section>

      {scorers.length > 0 && <section className="arena-scorers-section">
        <div className="container-page arena-section">
          <div className="arena-section-heading"><div><p className="arena-overline">Los protagonistas</p><h2>Instinto de gol.</h2></div><Link href="/goleadores" className="arena-section-link">Todos los goleadores <span aria-hidden="true">↗</span></Link></div>
          <ol className="arena-scorer-grid" aria-label="Máximos goleadores">
            {scorers.slice(0, 4).map((player, index) => <li key={player.playerId} className="arena-scorer">
              <div className="arena-scorer-top"><span>0{index + 1}</span><span>Goleador</span></div>
              <div className="arena-player-art"><span aria-hidden="true">{String(player.goals).padStart(2, "0")}</span><PlayerCardThumb name={player.playerName} cardImageUrl={player.cardImageUrl} size={108} /></div>
              <div className="arena-player-info"><h3>{player.playerName}</h3><p>{player.teamName}</p><strong>{player.goals} <span>goles</span></strong></div>
            </li>)}
          </ol>
        </div>
      </section>}

      {primaryVideo && <section className="container-page arena-section">
        <div className="arena-section-heading"><div><p className="arena-overline">Dentro de la cancha</p><h2>Volvé a vivirlo.</h2></div><Link href="/videos" className="arena-section-link">Todos los videos <span aria-hidden="true">↗</span></Link></div>
        <div className="arena-media-grid"><div className="arena-featured-video"><VideoPlayer url={primaryVideo.url} title={primaryVideo.title} /><div><span className="arena-overline">Destacado / {formatDateShort(primaryVideo.createdAt)}</span><h3>{primaryVideo.title}</h3></div></div>
          {videos.length > 0 && <div className="arena-video-list">{videos.map(video => <article key={video.id}><VideoPlayer url={video.url} title={video.title} /><h3>{video.title}</h3></article>)}</div>}
        </div>
      </section>}

      <section className="container-page arena-section arena-final-grid">
        <div><div className="arena-section-heading"><div><p className="arena-overline">Identidad de liga</p><h2>Nuestros clubes.</h2></div><Link href="/equipos" className="arena-section-link">Ver equipos ↗</Link></div>
          {teams.length > 0 ? <TeamsCardSlider teams={teams} /> : <p className="text-sm text-[var(--color-gray-500)]">Los equipos aparecerán aquí cuando estén registrados.</p>}
        </div>
        <DisciplineWidget rows={discipline} limit={5} />
      </section>
    </div>
  );
}
