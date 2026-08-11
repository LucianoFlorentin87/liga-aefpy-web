import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/PageHeader";
import { FixtureList } from "@/components/FixtureList";
import { getFanSession } from "@/lib/fan-auth";
import type { PredictionTally, PredictionChoice } from "@/components/PredictionWidget";

export const metadata: Metadata = { title: "Fixture" };
export const dynamic = "force-dynamic";

export default async function FixturePage() {
  const [matches, fan] = await Promise.all([
    prisma.match.findMany({
      orderBy: [{ matchday: "asc" }, { date: "asc" }, { time: "asc" }],
      include: { homeTeam: true, awayTeam: true },
    }),
    getFanSession(),
  ]);

  const matchIds = matches
    .filter((m) => m.status === "PROGRAMADO" || m.status === "REPROGRAMADO")
    .map((m) => m.id);

  const predictionsByMatch: Record<string, PredictionTally> = {};
  if (matchIds.length > 0) {
    const allPredictions = await prisma.prediction.findMany({
      where: { matchId: { in: matchIds } },
      select: { matchId: true, choice: true, userId: true },
    });
    for (const matchId of matchIds) {
      predictionsByMatch[matchId] = { counts: { LOCAL: 0, EMPATE: 0, VISITANTE: 0 }, ownChoice: null };
    }
    for (const p of allPredictions) {
      const tally = predictionsByMatch[p.matchId];
      const choice = p.choice as PredictionChoice;
      tally.counts[choice] += 1;
      if (fan && p.userId === fan.sub) tally.ownChoice = choice;
    }
  }

  return (
    <div>
      <PageHeader title="Fixture" subtitle="Todos los partidos del torneo, agrupados por jornada." />
      <div className="container-page py-8">
        <FixtureList matches={matches} fanLoggedIn={!!fan} predictionsByMatch={predictionsByMatch} />
      </div>
    </div>
  );
}
