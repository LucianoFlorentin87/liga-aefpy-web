import { formatDate } from "@/lib/format";

type NextMatch = {
  matchday: number;
  date: Date;
  time: string;
  venue: string;
  homeTeam: { name: string };
  awayTeam: { name: string };
} | null;

export function NextMatchCard({ match }: { match: NextMatch }) {
  if (!match) {
    return (
      <div className="card bg-[var(--color-navy-900)] p-6 text-center text-white">
        <p className="eyebrow !text-red-300">Próximo partido</p>
        <p className="mt-2 text-lg font-bold">Próximamente</p>
        <p className="mt-1 text-sm text-white/70">Todavía no hay un próximo partido programado.</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden bg-[var(--color-navy-900)] text-white">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
        <span className="eyebrow !text-red-300">Próximo partido</span>
        <span className="badge badge-navy !bg-white/10 !text-white">Jornada {match.matchday}</span>
      </div>
      <div className="grid grid-cols-3 items-center gap-3 px-5 py-6 text-center">
        <div className="text-base font-bold leading-tight sm:text-lg">{match.homeTeam.name}</div>
        <div className="text-sm font-semibold text-white/70">vs</div>
        <div className="text-base font-bold leading-tight sm:text-lg">{match.awayTeam.name}</div>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-white/10 px-5 py-3 text-xs text-white/80">
        <span className="capitalize">{formatDate(match.date)}</span>
        <span>{match.time} hs</span>
        <span>{match.venue}</span>
      </div>
    </div>
  );
}
