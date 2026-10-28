import "server-only";
import { Prisma } from "@prisma/client";
import { seasonAdminDb } from "@/lib/db";
import { computeStandingsWithTrend, computeScorers, computeDiscipline } from "@/lib/stats";
import { getMatchScore, playerFullName } from "@/lib/format";
import type { StandingsRowWithTrend, ScorerRow, DisciplineRow } from "@/lib/stats";

export type PublicArchive = {
  version: 1; name: string; closedAt: string; pendingMatches: number;
  standings: StandingsRowWithTrend[]; scorers: ScorerRow[]; discipline: DisciplineRow[];
  rulesContent: string; rulesPdfUrl: string | null;
  matches: { id: string; matchday: number; date: string; time: string; venue: string; status: string; homeName: string; awayName: string; homeScore: number; awayScore: number; forfeited: boolean; goals: { player: string; minute: number; team: string }[] }[];
  teams: { id: string; name: string; shortName: string; logoUrl: string | null; players: { name: string; jerseyNumber: number; position: string }[] }[];
  videos: { id: string; title: string; url: string }[];
};
/** Called while the lifecycle transaction holds the exclusive league write lock. */
export async function captureLeagueArchive(seasonId: string, name: string, settings: { rulesContent: string; rulesPdfUrl: string | null; standingsCriteria: string }) {
  const [teams, players, matches, sanctions, adjustments, videos, news, standings, scorers, discipline, registrations] = await Promise.all([
    seasonAdminDb.team.findMany({ where: { seasonId }, orderBy: { name: "asc" } }),
    seasonAdminDb.player.findMany({ where: { seasonId }, include: { efhubCard: true } }),
    seasonAdminDb.match.findMany({ where: { seasonId }, orderBy: [{ matchday: "asc" }, { date: "asc" }], include: { homeTeam: true, awayTeam: true, goals: { include: { player: true, team: true } }, cards: true, participations: true, predictions: true } }),
    seasonAdminDb.sanction.findMany({ where: { seasonId } }),
    seasonAdminDb.pointAdjustment.findMany({ where: { seasonId } }),
    seasonAdminDb.video.findMany({ where: { seasonId } }),
    seasonAdminDb.news.findMany({ where: { seasonId } }),
    computeStandingsWithTrend(), computeScorers(seasonId), computeDiscipline(seasonId),
    seasonAdminDb.leagueRegistration.findMany({ where: { seasonId }, select: { id: true, teamName: true, shortName: true, gamertag: true, delegateFirstName: true, delegateLastName: true, email: true, phone: true, username: true, userId: true, status: true, createdAt: true, reviewedAt: true, reviewedById: true, reviewNote: true, teamId: true } }),
  ]);
  const publicData: PublicArchive = {
    version: 1, name, closedAt: new Date().toISOString(), pendingMatches: matches.filter(match => match.status !== "FINALIZADO").length,
    standings, scorers, discipline, rulesContent: settings.rulesContent, rulesPdfUrl: settings.rulesPdfUrl,
    teams: teams.map(team => ({ id: team.id, name: team.name, shortName: team.shortName, logoUrl: team.logoUrl, players: players.filter(player => player.teamId === team.id).map(player => ({ name: playerFullName(player), jerseyNumber: player.jerseyNumber, position: player.position })) })),
    matches: matches.map(match => { const score = getMatchScore(match); return { id: match.id, matchday: match.matchday, date: match.date.toISOString(), time: match.time, venue: match.venue, status: match.status, homeName: match.homeTeam.name, awayName: match.awayTeam.name, homeScore: score.home, awayScore: score.away, forfeited: Boolean(match.forfeitedTeamId), goals: match.goals.map(goal => ({ player: playerFullName(goal.player), minute: goal.minute, team: goal.team.name })) }; }),
    videos: videos.map(video => ({ id: video.id, title: video.title, url: video.url })),
  };
  const archive = { version: 1, public: publicData, private: { teams, players, matches, sanctions, pointAdjustments: adjustments, videos, news, registrations, settings } };
  return JSON.parse(JSON.stringify(archive)) as Prisma.InputJsonObject;
}
export function publicArchiveFrom(value: Prisma.JsonValue): PublicArchive | null {
  if (!value || typeof value !== "object" || Array.isArray(value) || value.version !== 1) return null;
  const data = value.public;
  if (!data || typeof data !== "object" || Array.isArray(data) || data.version !== 1) return null;
  if (!Array.isArray(data.standings) || !Array.isArray(data.matches) || !Array.isArray(data.teams)) return null;
  // Only this explicitly whitelisted public branch is passed to public components.
  return data as unknown as PublicArchive;
}
