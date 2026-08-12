type SocialLinksData = {
  instagramUrl: string | null;
  facebookUrl: string | null;
  youtubeUrl: string | null;
  twitchUrl: string | null;
  discordUrl: string | null;
  tiktokUrl: string | null;
};

const SOCIAL_PLATFORMS: { key: keyof SocialLinksData; label: string }[] = [
  { key: "instagramUrl", label: "Instagram" },
  { key: "facebookUrl", label: "Facebook" },
  { key: "youtubeUrl", label: "YouTube" },
  { key: "twitchUrl", label: "Twitch" },
  { key: "discordUrl", label: "Discord" },
  { key: "tiktokUrl", label: "TikTok" },
];

/** Links a las redes/streaming cargadas por el equipo. No muestra nada si no hay ninguna. */
export function SocialLinks({ team }: { team: SocialLinksData }) {
  const links = SOCIAL_PLATFORMS.filter((p) => team[p.key]);
  if (links.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {links.map((p) => (
        <a
          key={p.key}
          href={team[p.key]!}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-full border border-[var(--color-gray-200)] px-3 py-1 text-xs font-semibold text-[var(--color-gray-700)] hover:border-[var(--color-red-300)] hover:text-[var(--color-red-600)]"
        >
          {p.label}
          <span aria-hidden="true">↗</span>
        </a>
      ))}
    </div>
  );
}
