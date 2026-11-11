import { getMatchScore } from './format';
import type { StandingsRow } from './stats';
type TeamLite = { id: string; name: string; shortName: string; logoUrl: string | null; status: string };
type FinishedMatch = { homeTeamId:string; awayTeamId:string; forfeitedTeamId:string|null; goals:{teamId:string}[]; officialHomeScore?:number|null; officialAwayScore?:number|null };
type PointAdjustmentRow = { teamId:string; points:number };
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

export function buildStandingsRows(
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
