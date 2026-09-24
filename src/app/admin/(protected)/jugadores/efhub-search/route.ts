import { NextRequest, NextResponse } from "next/server";
import { chromium, type Page } from "playwright";
import { requirePermission } from "@/lib/permissions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type EfhubCardResult = {
  efhubId: string;
  name: string;
  overall: number | null;
  position: string | null;
  cardType: string | null;
  playstyle: string | null;
  club: string | null;
  league: string | null;
  nationality: string | null;
  cardImageUrl: string | null;
  playerImageUrl: string | null;
  sourceUrl: string;
};

async function scrapeCards(page: Page): Promise<EfhubCardResult[]> {
  return page.evaluate(() => {
    const results: EfhubCardResult[] = [];
    const seen = new Set<string>();

    const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href*="/players/"]'));

    for (const link of links) {
      const href = link.getAttribute("href");
      if (!href) continue;

      const match = href.match(/\/players\/(\d+)/);
      if (!match) continue;

      const efhubId = match[1];
      if (seen.has(efhubId)) continue;
      seen.add(efhubId);

      const text = (link.innerText || link.textContent || "").replace(/\s+/g, " ").trim();

      const images = Array.from(link.querySelectorAll<HTMLImageElement>("img"));
      const imageUrls = images
        .map((img) => img.currentSrc || img.src || img.getAttribute("data-src") || "")
        .filter(Boolean);

      const ratingMatch = text.match(/\b(5[0-9]|6[0-9]|7[0-9]|8[0-9]|9[0-9]|10[0-9])\b/);
      const positionMatch = text.match(/\b(GK|CB|LB|RB|DMF|CMF|AMF|LMF|RMF|LWF|RWF|SS|CF)\b/i);

      let name = text;
      if (ratingMatch) name = name.replace(ratingMatch[0], "");
      if (positionMatch) name = name.replace(positionMatch[0], "");
      name = name.replace(/\s+/g, " ").trim();

      results.push({
        efhubId,
        name,
        overall: ratingMatch ? Number(ratingMatch[0]) : null,
        position: positionMatch?.[0] || null,
        cardType: null,
        playstyle: null,
        club: null,
        league: null,
        nationality: null,
        cardImageUrl: imageUrls[0] || null,
        playerImageUrl: imageUrls[1] || null,
        sourceUrl: `https://efhub.com/players/${efhubId}`,
      });
    }

    return results;
  });
}

/**
 * Busca cartas de eFootball en eFHUB (efhub.com) por nombre, para que el
 * admin le pueda elegir a un jugador su carta exacta. Usa Playwright
 * porque eFHUB no tiene una API pública — ver también
 * prisma/migrations/20260924000000_efhub_cards y el modelo EfhubCard.
 */
export async function GET(request: NextRequest) {
  await requirePermission("jugadores");

  const search = request.nextUrl.searchParams.get("q")?.trim();
  if (!search || search.length < 2) {
    return NextResponse.json({ cards: [] });
  }

  let browser;

  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/153.0.0.0 Safari/537.36",
      viewport: { width: 1440, height: 900 },
    });

    const url = `https://efhub.com/players?search=${encodeURIComponent(search)}`;
    let cards: EfhubCardResult[] = [];

    // eFHUB carga parte de los resultados dinámicamente. Reintentamos si
    // la primera carga todavía no contiene las tarjetas.
    for (let attempt = 1; attempt <= 3 && cards.length === 0; attempt++) {
      try {
        await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
      } catch {
        // sigue igual al próximo intento
      }

      try {
        await page.waitForSelector('a[href*="/players/"]', { timeout: 15000 });
      } catch {
        // sigue igual, se reintenta el scrape con lo que haya
      }

      await page.waitForTimeout(1500 + attempt * 500);
      cards = await scrapeCards(page);

      if (cards.length === 0 && attempt < 3) {
        await page.reload({ waitUntil: "domcontentloaded", timeout: 30000 }).catch(() => undefined);
        await page.waitForTimeout(2000);
      }
    }

    return NextResponse.json({ cards: cards.slice(0, 30) });
  } catch (error) {
    return NextResponse.json(
      { error: "No se pudo consultar eFHUB.", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  } finally {
    if (browser) await browser.close();
  }
}
