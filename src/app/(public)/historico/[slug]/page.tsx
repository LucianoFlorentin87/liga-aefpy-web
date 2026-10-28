import Link from "next/link";
import { notFound } from "next/navigation";
import { seasonAdminDb } from "@/lib/db";
import { publicArchiveFrom } from "@/lib/league-archive";
import { StandingsTable } from "@/components/StandingsTable";
import { ScorersTable } from "@/components/ScorersTable";
import { DisciplineTable } from "@/components/DisciplineTable";
import { TeamCrest } from "@/components/TeamCrest";
import { VideoPlayer } from "@/components/VideoPlayer";
import { formatDateShort, matchStatusLabel } from "@/lib/format";
export const dynamic = "force-dynamic";
export const metadata = { title: "Histórico de liga" };
export default async function HistoricalLeaguePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const season = await seasonAdminDb.season.findFirst({ where: { slug, status: "FINALIZADA" }, select: { archive: true } });
  const history = season?.archive ? publicArchiveFrom(season.archive) : null;
  if (!history) notFound();
  return <div className="container-page space-y-8 py-10">
    <header className="registration-hero"><Link href="/historico" className="text-sm underline">← Todas las ligas</Link><p className="arena-overline mt-6">Histórico / Solo lectura</p><h1>{history.name}</h1><p>Cierre: {formatDateShort(history.closedAt)}. Los datos reflejan el estado de esta liga al finalizar.</p></header>
    {history.pendingMatches > 0 && <p className="league-warning">La organización cerró esta edición con {history.pendingMatches} partidos sin finalizar. Sus estados se conservan sin asignar resultados nuevos.</p>}
    <nav aria-label="Secciones del histórico" className="flex flex-wrap gap-3 text-sm font-bold">{[["tabla","Clasificación"],["partidos","Partidos"],["goleadores","Goleadores"],["equipos","Planteles"],["disciplina","Disciplina"]].map(([id,label]) => <a className="btn btn-outline" key={id} href={"#" + id}>{label}</a>)}</nav>
    <section id="tabla" className="card p-4"><h2 className="section-title mb-4">Clasificación al cierre</h2><StandingsTable rows={history.standings} /></section>
    <section id="partidos" className="card p-4"><h2 className="section-title mb-4">Partidos y resultados</h2>{history.matches.length ? <ul className="divide-y divide-[var(--color-gray-200)]">{history.matches.map(match => <li key={match.id} className="py-4"><details><summary className="cursor-pointer text-sm"><span className="font-bold">{match.homeName} {match.status === "FINALIZADO" ? match.homeScore + " – " + match.awayScore : "vs"} {match.awayName}</span><span className="ml-2 text-xs text-[var(--color-gray-500)]">J{match.matchday} / {formatDateShort(match.date)} / {matchStatusLabel(match.status)}{match.forfeited ? " / Por abandono" : ""}</span></summary><div className="mt-3 text-xs text-[var(--color-gray-500)]"><p>{match.time} h · {match.venue}</p>{match.goals.length > 0 ? <ul className="mt-2">{match.goals.map((goal,index) => <li key={index}>{goal.minute}′ {goal.player} ({goal.team})</li>)}</ul> : <p className="mt-2">Sin goles individuales registrados.</p>}</div></details></li>)}</ul> : <p className="text-sm text-[var(--color-gray-500)]">No se registraron partidos en esta liga.</p>}</section>
    <section id="goleadores" className="card p-4"><h2 className="section-title mb-4">Goleadores</h2><ScorersTable rows={history.scorers} /></section>
    <section id="equipos"><h2 className="section-title mb-4">Equipos y planteles archivados</h2><div className="grid gap-4 sm:grid-cols-2">{history.teams.map(team => <article key={team.id} className="card p-5"><div className="flex items-center gap-3"><TeamCrest name={team.name} shortName={team.shortName} logoUrl={team.logoUrl} size={40} /><h3 className="font-bold">{team.name}</h3></div><ul className="mt-4 divide-y divide-[var(--color-gray-100)]">{team.players.map((player,index) => <li key={index} className="flex justify-between gap-3 py-2 text-sm"><span>{player.jerseyNumber}. {player.name}</span><span className="text-xs text-[var(--color-gray-500)]">{player.position}</span></li>)}</ul>{!team.players.length && <p className="mt-3 text-sm text-[var(--color-gray-500)]">Sin jugadores registrados.</p>}</article>)}</div></section>
    <section id="disciplina" className="card p-4"><h2 className="section-title mb-4">Disciplina</h2><DisciplineTable rows={history.discipline} /></section>
    {history.videos.length > 0 && <section><h2 className="section-title mb-4">Videos de la edición</h2><div className="grid gap-5 sm:grid-cols-2">{history.videos.map(video => <article key={video.id}><VideoPlayer title={video.title} url={video.url} /><h3 className="mt-2 text-sm font-bold">{video.title}</h3></article>)}</div></section>}
    {(history.rulesContent || history.rulesPdfUrl) && <section className="card p-5"><h2 className="section-title mb-4">Reglamento de esta edición</h2><p className="whitespace-pre-wrap text-sm">{history.rulesContent}</p>{history.rulesPdfUrl && <a href={history.rulesPdfUrl} className="btn btn-outline mt-4" target="_blank" rel="noopener noreferrer">Ver reglamento PDF ↗</a>}</section>}
  </div>;
}
