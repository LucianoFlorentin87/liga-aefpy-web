import type { MetadataRoute } from "next";

// Crawlers conocidos de IA que scrapean sitios para entrenar modelos o
// reconstruir páginas (no son buscadores como Google/Bing, que sí dejamos
// pasar para que el sitio se pueda encontrar). Bloquearlos acá no es una
// protección técnica infalible — cualquiera puede visitar la página a mano
// e igual copiarla — pero frena el scraping automático masivo y deja
// constancia explícita de que no está autorizado.
const AI_SCRAPER_BOTS = [
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "ClaudeBot",
  "Claude-Web",
  "anthropic-ai",
  "CCBot",
  "Google-Extended",
  "Bytespider",
  "PerplexityBot",
  "Perplexity-User",
  "Applebot-Extended",
  "Amazonbot",
  "Diffbot",
  "cohere-ai",
  "YouBot",
  "Omgilibot",
  "Omgili",
  "FacebookBot",
  "ImagesiftBot",
  "magpie-crawler",
  "Meta-ExternalAgent",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Buscadores y todo lo demás: pueden indexar el sitio público, pero
      // no el panel de administración ni las cuentas de hinchas.
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/", "/cuenta"],
      },
      ...AI_SCRAPER_BOTS.map((userAgent) => ({ userAgent, disallow: "/" })),
    ],
  };
}
