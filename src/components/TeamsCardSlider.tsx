"use client";

import Link from "next/link";
import { TeamCrest } from "@/components/TeamCrest";
import { SliderArrowButton } from "@/components/SliderArrowButton";
import { useHorizontalScroller } from "@/lib/useHorizontalScroller";

type TeamLite = { id: string; name: string; shortName: string; logoUrl: string | null };

export function TeamsCardSlider({ teams }: { teams: TeamLite[] }) {
  const { ref, canScrollLeft, canScrollRight, progress, onScroll, scroll } = useHorizontalScroller(teams);
  const showArrows = teams.length > 5;

  if (teams.length === 0) return null;

  const thumbWidthPct = Math.max(15, Math.min(100, (6 / teams.length) * 100));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-stretch gap-2">
        {showArrows && <SliderArrowButton dir={-1} onClick={() => scroll(-1)} visible={canScrollLeft} label="Ver equipos anteriores" />}

        <div
          ref={ref}
          onScroll={onScroll}
          className="flex flex-1 snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {teams.map((team) => (
            <Link
              key={team.id}
              href={`/equipos/${team.id}`}
              title={team.name}
              className="flex w-32 shrink-0 snap-start flex-col items-center gap-3 rounded-xl border border-[var(--color-gray-200)] bg-gradient-to-br from-white to-[var(--color-gray-100)] p-4 text-center shadow-sm transition-colors hover:border-[var(--color-red-500)]"
            >
              <TeamCrest name={team.name} shortName={team.shortName} logoUrl={team.logoUrl} size={56} />
              <span className="text-xs font-extrabold uppercase leading-tight text-[var(--color-navy-900)]">
                {team.shortName}
              </span>
            </Link>
          ))}
        </div>

        {showArrows && <SliderArrowButton dir={1} onClick={() => scroll(1)} visible={canScrollRight} label="Ver más equipos" />}
      </div>

      {showArrows && (
        <div className="h-1 w-24 overflow-hidden rounded-full bg-[var(--color-gray-200)]">
          <div
            className="h-full rounded-full bg-[var(--color-red-500)] transition-[margin]"
            style={{ width: `${thumbWidthPct}%`, marginLeft: `${progress * (100 - thumbWidthPct)}%` }}
          />
        </div>
      )}
    </div>
  );
}
