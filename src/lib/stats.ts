import "server-only";
import { prisma } from "@/lib/db";
import { playerFullName } from "@/lib/format";

export type StandingsRow = {
  teamId: string;
  teamName: string;
  teamShortName: string;
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

/** Calcula la tabla de posiciones a partir de los partidos finalizados. */
export async function computeStandings(): Promise<StandingsRow[]> {
  const [teams, settings] = await Promise.all([
    prisma.team.findMany({ where: { status: "ACTIVO" } }),
    prisma.tournamentSettings.findUnique({ where: { id: "settings" } }),
  ]);

  const [finishedMatches, pointAdjustments] = await Promise.all([
    prisma.match.findMany({
      where: { status: "FINALIZADO" },
      include: { goals: true },
    }),
    prisma.pointAdjustment.findMany(),
  ]);

  const rows = new Map<string, StandingsRow>();
  for (const team of teams) {
    rows.set(team.id, {
      teamId: team.id,
      teamName: team.name,
      teamShortName: team.shortName,
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

    const homeGoals = match.goals.filter((g) => g.teamId === match.homeTeamId).length;
    const awayGoals = match.goals.filter((g) => g.teamId === match.awayTeamId).length;

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

  const criteria = parseCriteria(settings?.standingsCriteria);
  return Array.from(rows.values()).sort((a, b) => compareByCriteria(a, b, criteria));
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
