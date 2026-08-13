"use client";

import { TeamCrest } from "@/components/TeamCrest";
import { SliderArrowButton } from "@/components/SliderArrowButton";
import { formatDateBadge } from "@/lib/format";
import { useHorizontalScroller } from "@/lib/useHorizontalScroller";

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
  const { ref, canScrollLeft, canScrollRight, onScroll, scroll } = useHorizontalScroller(matches);
  const showArrows = matches.length > 2;

  if (matches.length === 0) return null;

  return (
    <div className="flex items-stretch gap-2">
      {showArrows && <SliderArrowButton dir={-1} onClick={() => scroll(-1)} visible={canScrollLeft} label="Ver partidos anteriores" />}

      <div
        ref={ref}
        onScroll={onScroll}
        className="flex flex-1 snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {matches.map((m) => (
          <div
            key={m.id}
            className="flex w-60 shrink-0 snap-start flex-col gap-3 rounded-xl border border-[var(--color-gray-200)] bg-gradient-to-br from-white to-[var(--color-gray-100)] p-4 shadow-sm"
          >
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

      {showArrows && <SliderArrowButton dir={1} onClick={() => scroll(1)} visible={canScrollRight} label="Ver más partidos" />}
    </div>
  );
}
