"use client";

import { useSyncExternalStore } from "react";
import { detectVideoPlatform, getYouTubeEmbedId, getTwitchEmbedTarget, VIDEO_PLATFORM_LABEL } from "@/lib/video";

const noopSubscribe = () => () => {};

/** Hostname del navegador — null durante el render en el servidor (no existe `window` ahí). */
function useHostname(): string | null {
  return useSyncExternalStore(
    noopSubscribe,
    () => window.location.hostname,
    () => null,
  );
}

/** Embebe YouTube/Twitch cuando se puede reconocer la URL; si no, muestra un link para verlo en la plataforma original. */
export function VideoPlayer({ url, title }: { url: string; title: string }) {
  const platform = detectVideoPlatform(url);
  // Twitch exige que el embed declare el hostname exacto donde corre la
  // página ("parent") — sólo se conoce en el navegador, nunca en el server.
  const hostname = useHostname();

  if (platform === "YOUTUBE") {
    const id = getYouTubeEmbedId(url);
    if (id) {
      return (
        <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
          <iframe
            src={`https://www.youtube.com/embed/${id}`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="h-full w-full"
          />
        </div>
      );
    }
  }

  if (platform === "TWITCH") {
    const target = getTwitchEmbedTarget(url);
    if (target && hostname) {
      const params = new URLSearchParams({ parent: hostname, muted: "true" });
      if ("channel" in target) params.set("channel", target.channel);
      else params.set("video", target.video);
      return (
        <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
          <iframe
            src={`https://player.twitch.tv/?${params.toString()}`}
            title={title}
            allowFullScreen
            className="h-full w-full"
          />
        </div>
      );
    }
    if (target && !hostname) {
      // Todavía no sabemos el hostname (primer render en el servidor): placeholder breve.
      return <div className="aspect-video w-full animate-pulse rounded-lg bg-[var(--color-gray-100)]" />;
    }
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-lg bg-[var(--color-gray-100)] text-sm font-semibold text-[var(--color-gray-600)] hover:bg-[var(--color-gray-200)]"
    >
      <span>▶ {platform === "OTRO" ? "Ver video" : `Ver en ${VIDEO_PLATFORM_LABEL[platform]}`}</span>
    </a>
  );
}
