import { NextRequest, NextResponse } from "next/server";
import { chromium, type Browser, type Page } from "playwright";
import { requireEfhubSearchAccess } from "@/lib/permissions";

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

// Lanzar Chromium de cero tardaba 1-3s en cada búsqueda. Como esto corre
// como servidor Node persistente en Render (no funciones serverless), se
// puede reusar la misma instancia del navegador entre requests — cada
// búsqueda sólo abre/cierra su propio contexto (liviano), no el browser
// entero. Si queda 5 minutos sin uso se cierra solo, para no dejar
// Chromium consumiendo RAM de más todo el tiempo.
let browserPromise: Promise<Browser> | null = null;
let idleTimer: ReturnType<typeof setTimeout> | null = null;
const IDLE_CLOSE_MS = 5 * 60 * 1000;

function scheduleIdleClose() {
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    const promise = browserPromise;
    browserPromise = null;
    idleTimer = null;
    promise?.then((browser) => browser.close()).catch(() => undefined);
  }, IDLE_CLOSE_MS);
}

async function getBrowser(): Promise<Browser> {
  if (browserPromise) {
    const browser = await browserPromise;
    if (browser.isConnected()) return browser;
    browserPromise = null;
  }
  browserPromise = chromium.launch({ headless: true });
  return browserPromise;
}

// Cache corta en memoria: las cartas de eFHUB no cambian de un minuto a
// otro, y es común que se repita la misma búsqueda (varios admins, o el
// mismo admin probando de nuevo) — evita repetir el scrape entero.
type EfhubCacheEntry = { cards: EfhubCardResult[]; expiresAt: number };
const searchCache = new Map<string, EfhubCacheEntry>();
const CACHE_TTL_MS = 10 * 60 * 1000;

function getCached(key: string): EfhubCardResult[] | null {
  const entry = searchCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    searchCache.delete(key);
    return null;
  }
  return entry.cards;
}

function setCached(key: string, cards: EfhubCardResult[]) {
  searchCache.set(key, { cards, expiresAt: Date.now() + CACHE_TTL_MS });
}

// Nombres comunes (ej. "Neymar") pueden tener más cartas de las que caben
// en la primera página de resultados — eFHUB pagina con números de página
// ("1", "2", …) y una flecha "siguiente", no scroll infinito. Sin avanzar
// esas páginas, las cartas de más allá de la primera nunca llegan al DOM.
async function goToNextPage(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const candidates = Array.from(document.querySelectorAll<HTMLElement>("button, a, [role='button']"));
    const next = candidates.find((el) => {
      if ((el as HTMLButtonElement).disabled || el.getAttribute("aria-disabled") === "true") return false;
      const label = (el.getAttribute("aria-label") || "").toLowerCase();
      if (label.includes("next") || label.includes("siguiente")) return true;
      const text = (el.innerText || el.textContent || "").trim();
      return text === "›" || text === ">" || text === "»";
    });
    if (!next) return false;
    next.click();
    return true;
  });
}

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
        sourceUrl: `https://efhub.com/es/players/${efhubId}`,
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
  await requireEfhubSearchAccess();

  const search = request.nextUrl.searchParams.get("q")?.trim();
  if (!search || search.length < 2) {
    return NextResponse.json({ cards: [] });
  }

  const cacheKey = search.toLowerCase();
  const cached = getCached(cacheKey);
  if (cached) {
    return NextResponse.json({ cards: cached });
  }

  let context;

  try {
    const browser = await getBrowser();
    context = await browser.newContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/153.0.0.0 Safari/537.36",
      viewport: { width: 1440, height: 900 },
    });
    const page = await context.newPage();

    // El "/es/" es necesario: sin locale, eFHUB muestra otro catálogo de
    // cartas (por idioma/región) y quedan afuera resultados que sí
    // aparecen buscando manualmente en el sitio.
    const url = `https://efhub.com/es/players?search=${encodeURIComponent(search)}`;
    let cards: EfhubCardResult[] = [];

    // eFHUB carga parte de los resultados dinámicamente. Reintentamos si
    // la primera carga todavía no contiene las tarjetas.
    for (let attempt = 1; attempt <= 3 && cards.length === 0; attempt++) {
      try {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
      } catch {
        // sigue igual al próximo intento
      }

      try {
        await page.waitForSelector('a[href*="/players/"]', { timeout: 10000 });
        await page.waitForTimeout(500); // deja asentar el resto de las tarjetas que cargan después de la primera
      } catch {
        // sigue igual, se reintenta el scrape con lo que haya
      }

      cards = await scrapeCards(page);

      if (cards.length === 0 && attempt < 3) {
        await page.reload({ waitUntil: "domcontentloaded", timeout: 20000 }).catch(() => undefined);
      }
    }

    // Recorre el resto de las páginas de resultados (eFHUB pagina de a
    // ~24 cartas) hasta agotarlas, hasta un tope de seguridad, o hasta que
    // una página ya no sume cartas nuevas.
    const seenIds = new Set(cards.map((c) => c.efhubId));
    for (let page_i = 0; page_i < 6; page_i++) {
      const moved = await goToNextPage(page).catch(() => false);
      if (!moved) break;

      await page.waitForTimeout(700);
      await page.waitForSelector('a[href*="/players/"]', { timeout: 8000 }).catch(() => undefined);

      const more = await scrapeCards(page);
      const newCards = more.filter((c) => !seenIds.has(c.efhubId));
      if (newCards.length === 0) break;

      for (const c of newCards) seenIds.add(c.efhubId);
      cards = cards.concat(newCards);
    }

    if (cards.length > 0) setCached(cacheKey, cards.slice(0, 60));
    return NextResponse.json({ cards: cards.slice(0, 60) });
  } catch (error) {
    // Si el browser reusado quedó en mal estado, se descarta para que la
    // próxima búsqueda lance uno nuevo en vez de repetir el mismo error.
    browserPromise = null;
    return NextResponse.json(
      { error: "No se pudo consultar eFHUB.", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  } finally {
    if (context) await context.close();
    scheduleIdleClose();
  }
}
