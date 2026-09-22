import "server-only";
import { prisma } from "@/lib/db";
import { playerFullName, getMatchScore } from "@/lib/format";

export type StandingsRow = {
  teamId: string;
  teamName: string;
  teamShortName: string;
  teamStatus: string;
  logoUrl: string | null;
  pj: number;
  pg: number;
  pe: number;
  pp: number;
  gf: number;
  gc: number;
  dg: number;
  pts: number;
  /** Puntos sumados/restados manualmente (Art. 9/11 del reglamento), ya incluidos en `pts`. */
  pointAdjustment: number;
};

const DEFAULT_CRITERIA = ["PTS", "DG", "GF"];

/** Estados de equipo que siguen contando en la tabla de posiciones: ACTIVO
 *  y RETIRADO (un equipo que abandonó la liga conserva los puntos que ya
 *  sumó). INACTIVO es el único que desaparece del todo. */
const STANDINGS_TEAM_STATUSES: ("ACTIVO" | "RETIRADO")[] = ["ACTIVO", "RETIRADO"];

function parseCriteria(raw: string | undefined): string[] {
  const list = (raw ?? "").split(",").map((c) => c.trim().toUpperCase()).filter(Boolean);
  return list.length > 0 ? list : DEFAULT_CRITERIA;
}

function compareByCriteria(a: StandingsRow, b: StandingsRow, criteria: string[]): number {
  for (const key of criteria) {
    let diff = 0;
    if (key === "PTS") diff = b.pts - a.pts;
    else if (key === "DG") diff = b.dg - a.dg;
    else if (key === "GF") diff = b.gf - a.gf;
    else if (key === "PG") diff = b.pg - a.pg;
    if (diff !== 0) return diff;
  }
  return a.teamName.localeCompare(b.teamName, "es");
}

type TeamLite = { id: string; name: string; shortName: string; logoUrl: string | null; status: string };
type FinishedMatch = Awaited<ReturnType<typeof fetchFinishedMatches>>[number];
type PointAdjustmentRow = Awaited<ReturnType<typeof prisma.pointAdjustment.findMany>>[number];

function fetchFinishedMatches() {
  return prisma.match.findMany({ where: { status: "FINALIZADO" }, include: { goals: true } });
}

function buildStandingsRows(
  teams: TeamLite[],
  finishedMatches: FinishedMatch[],
  pointAdjustments: PointAdjustmentRow[],
  criteria: string[],
): StandingsRow[] {
  const rows = new Map<string, StandingsRow>();
  for (const team of teams) {
    rows.set(team.id, {
      teamId: team.id,
      teamName: team.name,
      teamShortName: team.shortName,
      teamStatus: team.status,
      logoUrl: team.logoUrl,
      pj: 0,
      pg: 0,
      pe: 0,
      pp: 0,
      gf: 0,
      gc: 0,
      dg: 0,
      pts: 0,
      pointAdjustment: 0,
    });
  }

  for (const match of finishedMatches) {
    const home = rows.get(match.homeTeamId);
    const away = rows.get(match.awayTeamId);
    if (!home || !away) continue; // equipo inactivo/eliminado: se excluye de la tabla

    const { home: homeGoals, away: awayGoals } = getMatchScore(match);

    home.pj += 1;
    away.pj += 1;
    home.gf += homeGoals;
    home.gc += awayGoals;
    away.gf += awayGoals;
    away.gc += homeGoals;

    if (homeGoals > awayGoals) {
      home.pg += 1;
      home.pts += 3;
      away.pp += 1;
    } else if (homeGoals < awayGoals) {
      away.pg += 1;
      away.pts += 3;
      home.pp += 1;
    } else {
      home.pe += 1;
      away.pe += 1;
      home.pts += 1;
      away.pts += 1;
    }
  }

  for (const adjustment of pointAdjustments) {
    const row = rows.get(adjustment.teamId);
    if (!row) continue;
    row.pointAdjustment += adjustment.points;
    row.pts += adjustment.points;
  }

  for (const row of rows.values()) {
    row.dg = row.gf - row.gc;
  }

  return Array.from(rows.values()).sort((a, b) => compareByCriteria(a, b, criteria));
}

/** Calcula la tabla de posiciones a partir de los partidos finalizados. */
export async function computeStandings(): Promise<StandingsRow[]> {
  const [teams, settings] = await Promise.all([
    prisma.team.findMany({ where: { status: { in: STANDINGS_TEAM_STATUSES } } }),
    prisma.tournamentSettings.findUnique({ where: { id: "settings" } }),
  ]);

  const [finishedMatches, pointAdjustments] = await Promise.all([
    fetchFinishedMatches(),
    prisma.pointAdjustment.findMany(),
  ]);

  const criteria = parseCriteria(settings?.standingsCriteria);
  return buildStandingsRows(teams, finishedMatches, pointAdjustments, criteria);
}

export type PositionTrend = "up" | "down" | "same" | null;
export type StandingsRowWithTrend = StandingsRow & { trend: PositionTrend };

/**
 * Igual que computeStandings, pero con la flechita de tendencia por equipo:
 * compara la posición actual contra la que tenía antes de la última vez que
 * se cargaron/actualizaron resultados (match.updatedAt), no contra la fecha
 * programada del partido (match.date) ni contra la jornada. La fecha del
 * partido es un dato editable que puede no coincidir con cuándo se cargó el
 * resultado en el sistema (se cargan resultados atrasados, por lote, etc.),
 * así que no sirve para saber qué es "lo nuevo de hoy" — lo único confiable
 * es cuándo se tocó el registro por última vez. Si el equipo todavía no
 * tenía partidos cargados antes de esa última tanda de carga (recién
 * arrancó la temporada, o se sumó después), no hay "antes" real con qué
 * comparar — se deja sin flecha (trend: null) en vez de mostrar algo
 * engañoso.
 *
 * Nota: los ajustes de puntos manuales (Art. 9/11) no están ubicados en el
 * tiempo, así que se aplican igual en el cálculo "antes" y "ahora" — una
 * simplificación razonable para un caso que es raro de por sí.
 */
export async function computeStandingsWithTrend(): Promise<StandingsRowWithTrend[]> {
  const [teams, settings] = await Promise.all([
    prisma.team.findMany({ where: { status: { in: STANDINGS_TEAM_STATUSES } } }),
    prisma.tournamentSettings.findUnique({ where: { id: "settings" } }),
  ]);

  const [finishedMatches, pointAdjustments] = await Promise.all([
    fetchFinishedMatches(),
    prisma.pointAdjustment.findMany(),
  ]);

  const criteria = parseCriteria(settings?.standingsCriteria);
  const current = buildStandingsRows(teams, finishedMatches, pointAdjustments, criteria);

  // Se agrupa por día calendario (UTC) de la última modificación del
  // partido, no por el instante exacto — varios resultados cargados uno
  // atrás del otro en la misma sesión de carga deben quedar en el mismo
  // "lote de hoy".
  const dayKey = (d: Date) => d.toISOString().slice(0, 10);

  const latestUpdateDay = finishedMatches.reduce<string | null>((max, m) => {
    const key = dayKey(m.updatedAt);
    return max === null || key > max ? key : max;
  }, null);
  if (latestUpdateDay === null) {
    return current.map((row) => ({ ...row, trend: null }));
  }

  const previousMatches = finishedMatches.filter((m) => dayKey(m.updatedAt) < latestUpdateDay);
  const previous = buildStandingsRows(teams, previousMatches, pointAdjustments, criteria);
  const previousIndexByTeam = new Map(previous.map((row, i) => [row.teamId, i]));
  const previousRowByTeam = new Map(previous.map((row) => [row.teamId, row]));

  return current.map((row, i) => {
    const prevIndex = previousIndexByTeam.get(row.teamId);
    const prevRow = previousRowByTeam.get(row.teamId);
    let trend: PositionTrend = null;
    if (prevIndex !== undefined && prevRow && prevRow.pj > 0) {
      trend = i < prevIndex ? "up" : i > prevIndex ? "down" : "same";
    }
    return { ...row, trend };
  });
}

export type MatchOdds = { homeWinPct: number; drawPct: number; awayWinPct: number };

const MIN_MATCHES_FOR_ODDS = 2;

/**
 * "Favorito según rendimiento": probabilidad de cada resultado calculada a
 * partir de las tasas de victoria/empate/derrota de ambos equipos en
 * partidos finalizados de la liga — un indicador propio, separado del voto
 * de los hinchas (PredictionWidget). Se oculta (null) si algún equipo
 * todavía jugó menos de MIN_MATCHES_FOR_ODDS partidos: con muestra tan
 * chica el cálculo no dice nada confiable.
 */
export function computeMatchOdds(home: StandingsRow, away: StandingsRow): MatchOdds | null {
  if (home.pj < MIN_MATCHES_FOR_ODDS || away.pj < MIN_MATCHES_FOR_ODDS) return null;

  const homeWinRate = home.pg / home.pj;
  const homeDrawRate = home.pe / home.pj;
  const homeLossRate = home.pp / home.pj;
  const awayWinRate = away.pg / away.pj;
  const awayDrawRate = away.pe / away.pj;
  const awayLossRate = away.pp / away.pj;

  // El favoritismo de cada equipo combina su propia tasa de victorias con la
  // tasa de derrotas del rival (un equipo gana más seguido contra rivales
  // que pierden seguido), y el empate promedia la tendencia al empate de
  // los dos.
  const rawHomeWin = (homeWinRate + awayLossRate) / 2;
  const rawAwayWin = (awayWinRate + homeLossRate) / 2;
  const rawDraw = (homeDrawRate + awayDrawRate) / 2;
  const total = rawHomeWin + rawAwayWin + rawDraw || 1;

  return {
    homeWinPct: Math.round((rawHomeWin / total) * 100),
    drawPct: Math.round((rawDraw / total) * 100),
    awayWinPct: Math.round((rawAwayWin / total) * 100),
  };
}

export type ScorerRow = {
  playerId: string;
  playerName: string;
  teamName: string;
  teamId: string;
  goals: number;
  matchesPlayed: number;
  average: number;
};

/** Goleadores calculados a partir de los goles registrados en partidos finalizados. */
export async function computeScorers(): Promise<ScorerRow[]> {
  const goals = await prisma.matchGoal.findMany({
    where: { match: { status: "FINALIZADO" } },
    include: { player: { include: { team: true } } },
  });

  const participations = await prisma.matchParticipation.findMany({
    where: { match: { status: "FINALIZADO" } },
  });

  const matchesPlayedByPlayer = new Map<string, Set<string>>();
  for (const p of participations) {
    if (!matchesPlayedByPlayer.has(p.playerId)) matchesPlayedByPlayer.set(p.playerId, new Set());
    matchesPlayedByPlayer.get(p.playerId)!.add(p.matchId);
  }

  const byPlayer = new Map<string, ScorerRow>();
  for (const g of goals) {
    const existing = byPlayer.get(g.playerId);
    if (existing) {
      existing.goals += 1;
    } else {
      byPlayer.set(g.playerId, {
        playerId: g.playerId,
        playerName: playerFullName(g.player),
        teamName: g.player.team.name,
        teamId: g.player.teamId,
        goals: 1,
        matchesPlayed: matchesPlayedByPlayer.get(g.playerId)?.size ?? 0,
        average: 0,
      });
    }
  }

  const rows = Array.from(byPlayer.values()).map((row) => ({
    ...row,
    matchesPlayed: matchesPlayedByPlayer.get(row.playerId)?.size ?? row.matchesPlayed,
    average: (matchesPlayedByPlayer.get(row.playerId)?.size ?? 0) > 0
      ? row.goals / (matchesPlayedByPlayer.get(row.playerId)?.size ?? 1)
      : row.goals,
  }));

  rows.sort((a, b) => b.goals - a.goals || a.playerName.localeCompare(b.playerName, "es"));
  return rows;
}

export type DisciplineRow = {
  playerId: string;
  playerName: string;
  teamName: string;
  teamId: string;
  matchesPlayed: number;
  yellowCards: number;
  redCards: number;
  sanctionsCount: number;
};

/** Disciplina calculada a partir de las tarjetas registradas en partidos finalizados. */
export async function computeDiscipline(): Promise<DisciplineRow[]> {
  const cards = await prisma.matchCard.findMany({
    where: { match: { status: "FINALIZADO" } },
    include: { player: { include: { team: true } } },
  });

  const participations = await prisma.matchParticipation.findMany({
    where: { match: { status: "FINALIZADO" } },
  });
  const matchesPlayedByPlayer = new Map<string, Set<string>>();
  for (const p of participations) {
    if (!matchesPlayedByPlayer.has(p.playerId)) matchesPlayedByPlayer.set(p.playerId, new Set());
    matchesPlayedByPlayer.get(p.playerId)!.add(p.matchId);
  }

  const sanctionCounts = await prisma.sanction.groupBy({
    by: ["playerId"],
    _count: { _all: true },
  });
  const sanctionCountByPlayer = new Map(sanctionCounts.map((s) => [s.playerId, s._count._all]));

  const byPlayer = new Map<string, DisciplineRow>();
  for (const c of cards) {
    let row = byPlayer.get(c.playerId);
    if (!row) {
      row = {
        playerId: c.playerId,
        playerName: playerFullName(c.player),
        teamName: c.player.team.name,
        teamId: c.player.teamId,
        matchesPlayed: matchesPlayedByPlayer.get(c.playerId)?.size ?? 0,
        yellowCards: 0,
        redCards: 0,
        sanctionsCount: sanctionCountByPlayer.get(c.playerId) ?? 0,
      };
      byPlayer.set(c.playerId, row);
    }
    if (c.type === "AMARILLA") row.yellowCards += 1;
    else row.redCards += 1;
  }

  const rows = Array.from(byPlayer.values());
  rows.sort(
    (a, b) =>
      b.redCards - a.redCards ||
      b.yellowCards - a.yellowCards ||
      a.playerName.localeCompare(b.playerName, "es"),
  );
  return rows;
}

/** Próximo partido programado (el más cercano en el futuro que no fue jugado). */
export async function getNextMatch() {
  return prisma.match.findFirst({
    where: { status: { in: ["PROGRAMADO", "REPROGRAMADO"] } },
    orderBy: [{ date: "asc" }, { time: "asc" }],
    include: { homeTeam: true, awayTeam: true },
  });
}

export async function getUpcomingMatches(limit = 8) {
  return prisma.match.findMany({
    where: { status: { in: ["PROGRAMADO", "REPROGRAMADO"] } },
    orderBy: [{ date: "asc" }, { time: "asc" }],
    take: limit,
    include: { homeTeam: true, awayTeam: true },
  });
}

export async function getRecentResults(limit = 5) {
  return prisma.match.findMany({
    where: { status: "FINALIZADO" },
    orderBy: [{ date: "desc" }, { time: "desc" }],
    take: limit,
    include: { homeTeam: true, awayTeam: true, goals: true },
  });
}
