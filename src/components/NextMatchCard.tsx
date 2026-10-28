import Link from "next/link";
import { formatDate } from "@/lib/format";
import { TeamCrest } from "@/components/TeamCrest";

type NextMatch = {
  matchday: number; date: Date; time: string; venue: string;
  homeTeam: { name: string; shortName: string; logoUrl: string | null };
  awayTeam: { name: string; shortName: string; logoUrl: string | null };
} | null;

export function NextMatchCard({ match }: { match: NextMatch }) {
  return (
    <article className="arena-match">
      <div className="arena-match-heading"><span>Próximo encuentro</span><span>{match ? "Jornada " + match.matchday : "Fixture"}</span></div>
      {match ? <>
        <div className="arena-match-teams">
          <div><TeamCrest name={match.homeTeam.name} shortName={match.homeTeam.shortName} logoUrl={match.homeTeam.logoUrl} size={88} /><h2>{match.homeTeam.name}</h2><span>Local</span></div>
          <span className="arena-versus" aria-label="contra">VS</span>
          <div><TeamCrest name={match.awayTeam.name} shortName={match.awayTeam.shortName} logoUrl={match.awayTeam.logoUrl} size={88} /><h2>{match.awayTeam.name}</h2><span>Visitante</span></div>
        </div>
        <div className="arena-match-time"><b>{match.time}<small> h</small></b><div><span>{formatDate(match.date)}</span><span>{match.venue}</span></div></div>
      </> : <div className="arena-match-empty"><span aria-hidden="true">↗</span><h2>La próxima fecha<br />está por venir.</h2><p>No hay encuentros futuros programados. Consultá el fixture para ver las fechas y los partidos pendientes.</p></div>}
      <Link href="/fixture" className="arena-match-footer">Ver fixture completo <span aria-hidden="true">↗</span></Link>
    </article>
  );
}
