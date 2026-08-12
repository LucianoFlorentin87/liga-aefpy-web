import Link from "next/link";
import { prisma } from "@/lib/db";
import { TeamCrest } from "@/components/TeamCrest";

export async function TeamLogosBar() {
  const teams = await prisma.team.findMany({
    where: { status: "ACTIVO" },
    orderBy: { name: "asc" },
    select: { id: true, name: true, shortName: true, logoUrl: true },
  });

  if (teams.length === 0) return null;

  return (
    <div className="border-b border-[var(--color-gray-200)] bg-white">
      <div className="mx-auto flex max-w-[82rem] items-center gap-5 overflow-x-auto px-4 py-2.5">
        {teams.map((team) => (
          <Link key={team.id} href={`/equipos/${team.id}`} title={team.name} className="shrink-0">
            <TeamCrest name={team.name} shortName={team.shortName} logoUrl={team.logoUrl} size={28} />
          </Link>
        ))}
      </div>
    </div>
  );
}
