import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/PageHeader";
import { FixtureList } from "@/components/FixtureList";

export const metadata: Metadata = { title: "Fixture" };
export const dynamic = "force-dynamic";

export default async function FixturePage() {
  const matches = await prisma.match.findMany({
    orderBy: [{ matchday: "asc" }, { date: "asc" }, { time: "asc" }],
    include: { homeTeam: true, awayTeam: true },
  });

  return (
    <div>
      <PageHeader title="Fixture" subtitle="Todos los partidos del torneo, agrupados por jornada." />
      <div className="container-page py-8">
        <FixtureList matches={matches} />
      </div>
    </div>
  );
}
