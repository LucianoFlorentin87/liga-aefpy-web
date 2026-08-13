type SocialLinksData = {
  instagramUrl: string | null;
  facebookUrl: string | null;
  youtubeUrl: string | null;
  twitchUrl: string | null;
  discordUrl: string | null;
  tiktokUrl: string | null;
};

const ICONS: Record<keyof SocialLinksData, { label: string; path: React.ReactNode }> = {
  instagramUrl: {
    label: "Instagram",
    path: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
      </>
    ),
  },
  facebookUrl: {
    label: "Facebook",
    path: <path d="M15 8h-2a2 2 0 0 0-2 2v10M8 13h5M13 3v18" />,
  },
  youtubeUrl: {
    label: "YouTube",
    path: (
      <>
        <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
        <path d="M10.5 9.2v5.6l5-2.8-5-2.8z" fill="currentColor" stroke="none" />
      </>
    ),
  },
  twitchUrl: {
    label: "Twitch",
    path: (
      <>
        <path d="M4 3h16v11l-4 4h-4l-3 3v-3H4V3z" />
        <path d="M13 7v4M17 7v4" />
      </>
    ),
  },
  discordUrl: {
    label: "Discord",
    path: (
      <>
        <path d="M6 8.5C8 7 10 6.5 12 6.5s4 .5 6 2C19.5 12 20 15.5 20 17.5c-1.5 1.2-3 1.8-3 1.8l-.8-1.5" />
        <path d="M6 8.5C4.5 12 4 15.5 4 17.5c1.5 1.2 3 1.8 3 1.8l.8-1.5" />
        <circle cx="9.5" cy="13" r="1.2" fill="currentColor" stroke="none" />
        <circle cx="14.5" cy="13" r="1.2" fill="currentColor" stroke="none" />
      </>
    ),
  },
  tiktokUrl: {
    label: "TikTok",
    path: <path d="M15 4v9.5a3.5 3.5 0 1 1-3.5-3.5c.2 0 .4 0 .5.03V7.2A6.3 6.3 0 0 0 8 13.5 6.3 6.3 0 0 0 20.5 15V9.8A6 6 0 0 1 15 4z" />,
  },
};

const ORDER: (keyof SocialLinksData)[] = ["instagramUrl", "facebookUrl", "youtubeUrl", "twitchUrl", "discordUrl", "tiktokUrl"];

/** Franja compacta de íconos (sin texto) para espacios chicos, como las tarjetas de /equipos. */
export function SocialIcons({ team, size = 26 }: { team: SocialLinksData; size?: number }) {
  const links = ORDER.filter((key) => team[key]);
  if (links.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {links.map((key) => {
        const icon = ICONS[key];
        return (
          <a
            key={key}
            href={team[key]!}
            target="_blank"
            rel="noopener noreferrer"
            title={icon.label}
            aria-label={icon.label}
            style={{ width: size, height: size }}
            className="flex shrink-0 items-center justify-center rounded-full border border-[var(--color-gray-200)] text-[var(--color-gray-600)] hover:border-[var(--color-red-300)] hover:text-[var(--color-red-600)]"
          >
            <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              {icon.path}
            </svg>
          </a>
        );
      })}
    </div>
  );
}
