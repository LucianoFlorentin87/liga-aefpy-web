"use client";

import { useState, useSyncExternalStore } from "react";
import { detectVideoPlatform, getYouTubeEmbedId, getTwitchEmbedTarget, VIDEO_PLATFORM_LABEL } from "@/lib/video";

const noopSubscribe = () => () => {};
function useHostname(): string | null {
  return useSyncExternalStore(noopSubscribe, () => window.location.hostname, () => null);
}

export function VideoPlayer({ url, title }: { url: string; title: string }) {
  const [playing, setPlaying] = useState(false);
  const platform = detectVideoPlatform(url);
  const hostname = useHostname();
  const youtubeId = platform === "YOUTUBE" ? getYouTubeEmbedId(url) : null;
  const twitchTarget = platform === "TWITCH" ? getTwitchEmbedTarget(url) : null;
  let embedUrl: string | null = youtubeId ? "https://www.youtube.com/embed/" + youtubeId + "?autoplay=1" : null;
  if (twitchTarget && hostname) {
    const params = new URLSearchParams({ parent: hostname, muted: "true", autoplay: "true" });
    if ("channel" in twitchTarget) params.set("channel", twitchTarget.channel);
    else params.set("video", twitchTarget.video);
    embedUrl = "https://player.twitch.tv/?" + params.toString();
  }

  if (playing && embedUrl) return <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
    <iframe src={embedUrl} title={title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen className="h-full w-full" />
  </div>;

  if (youtubeId || twitchTarget) return <button type="button" onClick={() => setPlaying(true)} disabled={Boolean(twitchTarget && !hostname)} className="arena-video-cover" aria-label={"Reproducir " + title}>
    {youtubeId && /* Miniatura externa; no descarga el reproductor hasta pulsar. */
      // eslint-disable-next-line @next/next/no-img-element
      <img src={"https://i.ytimg.com/vi/" + youtubeId + "/hqdefault.jpg"} alt="" loading="lazy" width={480} height={360} />}
    <span className="arena-video-play" aria-hidden="true">▶</span>
    <span className="arena-video-caption">Ver partido <span aria-hidden="true">↗</span></span>
  </button>;

  return <a href={url} target="_blank" rel="noopener noreferrer" className="arena-video-cover arena-video-fallback"><span>▶ {platform === "OTRO" ? "Ver video" : "Ver en " + VIDEO_PLATFORM_LABEL[platform]}</span><span>{title}</span></a>;
}
