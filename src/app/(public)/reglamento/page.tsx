import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";

export const metadata: Metadata = { title: "Reglamento" };
export const dynamic = "force-dynamic";

export default async function ReglamentoPage() {
  const settings = await prisma.tournamentSettings.findUnique({ where: { id: "settings" } });
  const content = settings?.rulesContent?.trim() ?? "";

  return (
    <div>
      <PageHeader title="Reglamento" subtitle="Reglamento oficial del torneo." />
      <div className="container-page py-8">
        <div className="card p-6">
          {content ? (
            <div className="flex flex-col gap-4 text-sm leading-relaxed text-[var(--color-gray-800)]">
              {content.split(/\n{2,}/).map((paragraph, i) => (
                <p key={i} className="whitespace-pre-wrap">
                  {paragraph}
                </p>
              ))}
            </div>
          ) : (
            <EmptyState title="Próximamente" hint="El reglamento todavía no fue publicado por la organización." />
          )}
        </div>
      </div>
    </div>
  );
}
