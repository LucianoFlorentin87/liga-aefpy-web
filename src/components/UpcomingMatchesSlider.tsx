"use client";

import { useRef } from "react";
import { TeamCrest } from "@/components/TeamCrest";
import { formatDateBadge } from "@/lib/format";

type UpcomingMatch = {
  id: string;
  matchday: number;
  date: Date;
  time: string;
  homeTeam: { name: string; shortName: string; logoUrl: string | null };
  awayTeam: { name: string; shortName: string; logoUrl: string | null };
};

function TeamRow({ team }: { team: UpcomingMatch["homeTeam"] }) {
  return (
    <div className="flex items-center gap-2">
      <TeamCrest name={team.name} shortName={team.shortName} logoUrl={team.logoUrl} size={22} />
      <span className="truncate text-sm font-bold text-[var(--color-navy-900)]">{team.shortName}</span>
    </div>
  );
}

export function UpcomingMatchesSlider({ matches }: { matches: UpcomingMatch[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  function scroll(dir: 1 | -1) {
    scrollerRef.current?.scrollBy({ left: dir * 260, behavior: "smooth" });
  }

  if (matches.length === 0) return null;

  return (
    <div className="relative">
      <div
        ref={scrollerRef}
        className="flex gap-3 overflow-x-auto scroll-smooth pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {matches.map((m) => (
          <div key={m.id} className="card flex w-60 shrink-0 flex-col gap-3 p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[0.65rem] font-bold uppercase tracking-wide text-[var(--color-gray-500)]">
                {formatDateBadge(m.date)}
              </span>
              <span className="badge badge-navy shrink-0">Jornada {m.matchday}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 flex-col gap-2">
                <TeamRow team={m.homeTeam} />
                <TeamRow team={m.awayTeam} />
              </div>
              <span className="shrink-0 text-base font-extrabold text-[var(--color-navy-900)]">{m.time}</span>
            </div>
          </div>
        ))}
      </div>

      {matches.length > 2 && (
        <button
          type="button"
          onClick={() => scroll(1)}
          aria-label="Ver más partidos"
          className="absolute right-0 top-1/2 hidden h-9 w-9 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full bg-[var(--color-red-600)] text-white shadow-md hover:bg-[var(--color-red-700)] sm:flex"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
    </div>
  );
}
