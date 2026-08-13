import { FaInstagram, FaFacebook, FaYoutube, FaTwitch, FaDiscord, FaTiktok } from "react-icons/fa6";
import type { IconType } from "react-icons";

type SocialLinksData = {
  instagramUrl: string | null;
  facebookUrl: string | null;
  youtubeUrl: string | null;
  twitchUrl: string | null;
  discordUrl: string | null;
  tiktokUrl: string | null;
};

const PLATFORMS: { key: keyof SocialLinksData; label: string; Icon: IconType }[] = [
  { key: "instagramUrl", label: "Instagram", Icon: FaInstagram },
  { key: "facebookUrl", label: "Facebook", Icon: FaFacebook },
  { key: "youtubeUrl", label: "YouTube", Icon: FaYoutube },
  { key: "twitchUrl", label: "Twitch", Icon: FaTwitch },
  { key: "discordUrl", label: "Discord", Icon: FaDiscord },
  { key: "tiktokUrl", label: "TikTok", Icon: FaTiktok },
];

/** Franja compacta de íconos (sin texto) para espacios chicos, como las tarjetas de /equipos. */
export function SocialIcons({ team, size = 26 }: { team: SocialLinksData; size?: number }) {
  const links = PLATFORMS.filter((p) => team[p.key]);
  if (links.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {links.map(({ key, label, Icon }) => (
        <a
          key={key}
          href={team[key]!}
          target="_blank"
          rel="noopener noreferrer"
          title={label}
          aria-label={label}
          style={{ width: size, height: size }}
          className="flex shrink-0 items-center justify-center rounded-full border border-[var(--color-gray-200)] text-[var(--color-gray-600)] hover:border-[var(--color-red-300)] hover:text-[var(--color-red-600)]"
        >
          <Icon size={size * 0.55} />
        </a>
      ))}
    </div>
  );
}
