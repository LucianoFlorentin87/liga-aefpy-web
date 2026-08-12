export type VideoPlatform = "YOUTUBE" | "TWITCH" | "OTRO";

export function detectVideoPlatform(url: string): VideoPlatform {
  try {
    const host = new URL(url).hostname.replace(/^www\.|^m\./, "");
    if (host === "youtube.com" || host === "youtu.be") return "YOUTUBE";
    if (host === "twitch.tv") return "TWITCH";
  } catch {
    // URL inválida: se trata como "otro" y se muestra sólo el link.
  }
  return "OTRO";
}

export const VIDEO_PLATFORM_LABEL: Record<VideoPlatform, string> = {
  YOUTUBE: "YouTube",
  TWITCH: "Twitch",
  OTRO: "Otra plataforma",
};

/** Extrae el ID de video de las formas habituales de URL de YouTube. */
export function getYouTubeEmbedId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.replace(/^www\./, "") === "youtu.be") {
      return u.pathname.slice(1).split("/")[0] || null;
    }
    if (u.pathname.startsWith("/embed/")) return u.pathname.split("/embed/")[1]?.split("/")[0] || null;
    if (u.pathname.startsWith("/live/")) return u.pathname.split("/live/")[1]?.split("/")[0] || null;
    if (u.pathname.startsWith("/shorts/")) return u.pathname.split("/shorts/")[1]?.split("/")[0] || null;
    const v = u.searchParams.get("v");
    if (v) return v;
    return null;
  } catch {
    return null;
  }
}

/** Distingue un canal en vivo (twitch.tv/canal) de un VOD (twitch.tv/videos/123). */
export function getTwitchEmbedTarget(url: string): { channel: string } | { video: string } | null {
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length === 0) return null;
    if (parts[0] === "videos" && parts[1]) return { video: parts[1] };
    if (parts.length === 1) return { channel: parts[0] };
    return null;
  } catch {
    return null;
  }
}
