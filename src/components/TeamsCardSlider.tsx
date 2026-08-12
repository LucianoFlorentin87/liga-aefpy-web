"use client";

import { useRef } from "react";
import Link from "next/link";
import { TeamCrest } from "@/components/TeamCrest";

type TeamLite = { id: string; name: string; shortName: string; logoUrl: string | null };

export function TeamsCardSlider({ teams }: { teams: TeamLite[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  function scroll(dir: 1 | -1) {
    scrollerRef.current?.scrollBy({ left: dir * 220, behavior: "smooth" });
  }

  if (teams.length === 0) return null;

  return (
    <div className="relative">
      <div
        ref={scrollerRef}
        className="flex gap-3 overflow-x-auto scroll-smooth pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {teams.map((team) => (
          <Link
            key={team.id}
            href={`/equipos/${team.id}`}
            title={team.name}
            className="card flex w-32 shrink-0 flex-col items-center gap-3 p-4 text-center transition-colors hover:border-[var(--color-red-500)]"
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
