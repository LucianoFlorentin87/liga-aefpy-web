import { formatDate } from "@/lib/format";
import { TeamCrest } from "@/components/TeamCrest";

type NextMatch = {
  matchday: number;
  date: Date;
  time: string;
  venue: string;
  homeTeam: { name: string; shortName: string; logoUrl: string | null };
  awayTeam: { name: string; shortName: string; logoUrl: string | null };
} | null;

export function NextMatchCard({ match }: { match: NextMatch }) {
  if (!match) {
    return (
      <div className="rounded-xl border border-white/15 bg-white/5 p-6 text-center text-white backdrop-blur-sm">
        <p className="eyebrow !text-red-300">Próximo partido</p>
        <p className="mt-2 text-lg font-bold">Próximamente</p>
        <p className="mt-1 text-sm text-white/70">Todavía no hay un próximo partido programado.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-white/15 bg-white/5 text-white backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
        <span className="eyebrow !text-red-300">Próximo partido</span>
        <span className="badge badge-navy !bg-white/10 !text-white">Jornada {match.matchday}</span>
      </div>
      {/* items-start: si el nombre de un equipo pasa a dos líneas (ej. "Bayer
          Leverkusen") y el otro no, items-center desalinearía los escudos
          verticalmente porque cada columna se centra según su propia altura.
          Con items-start ambos escudos quedan a la misma altura sin importar
          cuánto ocupe el nombre debajo; el "vs" se centra dentro de un
          bloque de la misma altura que el escudo (h-10 = size 40) para
          quedar a la altura de los escudos en vez de la del texto. */}
      <div className="grid grid-cols-3 items-start gap-3 px-5 py-6 text-center">
        <div className="flex flex-col items-center gap-2">
          <TeamCrest name={match.homeTeam.name} shortName={match.homeTeam.shortName} logoUrl={match.homeTeam.logoUrl} size={40} variant="circle" />
          <span className="text-base font-bold leading-tight sm:text-lg">{match.homeTeam.name}</span>
        </div>
        <div className="flex h-10 items-center justify-center text-sm font-semibold text-white/70">vs</div>
        <div className="flex flex-col items-center gap-2">
          <TeamCrest name={match.awayTeam.name} shortName={match.awayTeam.shortName} logoUrl={match.awayTeam.logoUrl} size={40} variant="circle" />
          <span className="text-base font-bold leading-tight sm:text-lg">{match.awayTeam.name}</span>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-white/10 px-5 py-3 text-xs text-white/80">
        <span className="capitalize">{formatDate(match.date)}</span>
        <span>{match.time} hs</span>
        <span>{match.venue}</span>
      </div>
    </div>
  );
}
