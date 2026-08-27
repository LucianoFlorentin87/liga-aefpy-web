import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/PageHeader";
import { FixtureList } from "@/components/FixtureList";
import { getVoterIdentity } from "@/lib/voter";
import type { PredictionTally, PredictionChoice } from "@/components/PredictionWidget";
import { computeStandings, computeMatchOdds, type MatchOdds } from "@/lib/stats";

export const metadata: Metadata = { title: "Fixture" };
export const dynamic = "force-dynamic";

export default async function FixturePage() {
  const [matches, voter, standings] = await Promise.all([
    prisma.match.findMany({
      orderBy: [{ matchday: "asc" }, { date: "asc" }, { time: "asc" }],
      include: { homeTeam: true, awayTeam: true, goals: true },
    }),
    getVoterIdentity(),
    computeStandings(),
  ]);

  const standingsByTeamId = new Map(standings.map((s) => [s.teamId, s]));

  const matchIds = matches
    .filter((m) => m.status === "PROGRAMADO" || m.status === "REPROGRAMADO")
    .map((m) => m.id);

  const oddsByMatch: Record<string, MatchOdds | null> = {};
  for (const match of matches) {
    if (!matchIds.includes(match.id)) continue;
    const home = standingsByTeamId.get(match.homeTeamId);
    const away = standingsByTeamId.get(match.awayTeamId);
    oddsByMatch[match.id] = home && away ? computeMatchOdds(home, away) : null;
  }

  const predictionsByMatch: Record<string, PredictionTally> = {};
  if (matchIds.length > 0) {
    const allPredictions = await prisma.prediction.findMany({
      where: { matchId: { in: matchIds } },
      select: { matchId: true, choice: true, fanUserId: true, staffUserId: true, anonId: true },
    });
    for (const matchId of matchIds) {
      predictionsByMatch[matchId] = { counts: { LOCAL: 0, EMPATE: 0, VISITANTE: 0 }, ownChoice: null };
    }
    for (const p of allPredictions) {
      const tally = predictionsByMatch[p.matchId];
      const choice = p.choice as PredictionChoice;
      tally.counts[choice] += 1;
      const isOwnVote =
        voter &&
        ((voter.kind === "fan" && p.fanUserId === voter.id) ||
          (voter.kind === "staff" && p.staffUserId === voter.id) ||
          (voter.kind === "anon" && p.anonId === voter.id));
      if (isOwnVote) tally.ownChoice = choice;
    }
  }

  return (
    <div>
      <PageHeader title="Fixture" subtitle="Todos los partidos del torneo, agrupados por jornada." />
      <div className="container-page py-8">
        <FixtureList matches={matches} predictionsByMatch={predictionsByMatch} oddsByMatch={oddsByMatch} />
      </div>
    </div>
  );
}
