"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { TeamCrest } from "@/components/TeamCrest";

type TeamLite = { id: string; name: string; shortName: string; logoUrl: string | null };

export function TeamsCardSlider({ teams }: { teams: TeamLite[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  function scroll(dir: 1 | -1) {
    scrollerRef.current?.scrollBy({ left: dir * 240, behavior: "smooth" });
  }

  function handleScroll() {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setProgress(max > 0 ? el.scrollLeft / max : 0);
  }

  if (teams.length === 0) return null;

  const thumbWidthPct = Math.max(15, Math.min(100, (6 / teams.length) * 100));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-stretch gap-2">
        <div
          ref={scrollerRef}
          onScroll={handleScroll}
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

        {teams.length > 5 && (
          <button
            type="button"
            onClick={() => scroll(1)}
            aria-label="Ver más equipos"
            className="hidden h-9 w-9 shrink-0 items-center justify-center self-center rounded-full bg-[var(--color-red-600)] text-white shadow-md hover:bg-[var(--color-red-700)] sm:flex"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>

      {teams.length > 5 && (
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
