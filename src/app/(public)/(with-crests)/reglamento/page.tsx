import { currentRegulation } from "@/lib/regulations";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";

export const metadata: Metadata = { title: "Reglamento" };
export const dynamic = "force-dynamic";

export default async function ReglamentoPage() {
  const settings = await prisma.tournamentSettings.findUnique({ where: { id: "settings" } });
  const publication=await currentRegulation();
  const pdfUrl = publication?.pdfUrl ?? settings?.rulesPdfUrl ?? null;
  const content = settings?.rulesContent?.trim() ?? "";

  return (
    <div>
      <PageHeader title="Reglamento" subtitle="Reglamento oficial del torneo." />
      <div className="container-page py-8">
        {!publication && <aside className="card mb-6 p-5" aria-label="Reglamento v1.1 para consulta">
          <h2 className="font-bold">Reglamento v1.1 - Documento para consulta</h2>
          <p className="mt-2 text-sm">Versión del 29 de octubre de 2026. Pendiente de adopción oficial para esta edición; su disponibilidad no reemplaza el reglamento vigente.</p>
          <a className="mt-3 inline-block underline font-semibold" href="/documentos/Reglamento_AEFPY_v1.1.pdf" target="_blank" rel="noreferrer">Consultar PDF v1.1</a>
        </aside>}
        {publication && <div className="card mb-6 p-5"><h2 className="font-bold">Reglamento vigente - Versión {publication.version}</h2><p className="mt-2 text-sm">Adoptado para esta edición desde {new Intl.DateTimeFormat("es-PY",{timeZone:"America/Asuncion",dateStyle:"long",timeStyle:"short"}).format(publication.effectiveAt)} (Paraguay). Cada delegado registra su aceptación con su propia cuenta al ingresar a su perfil.</p></div>}
        {pdfUrl ? (
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--color-gray-200)] px-4 py-2.5">
              <span className="text-xs font-semibold text-[var(--color-gray-500)]">Documento oficial (PDF)</span>
              <a href={pdfUrl} target="_blank" rel="noreferrer" className="text-xs font-semibold text-[var(--color-red-accent)] hover:underline">
                Abrir en una pestaña nueva ↗
              </a>
            </div>
            <iframe src={pdfUrl} title="Reglamento oficial" className="h-[80vh] w-full" />
          </div>
        ) : content ? (
          <div className="card p-6">
            <div className="flex flex-col gap-4 text-sm leading-relaxed text-[var(--color-gray-800)]">
              {content.split(/\n{2,}/).map((paragraph, i) => (
                <p key={i} className="whitespace-pre-wrap">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        ) : (
          <div className="card p-6">
            <EmptyState title="Próximamente" hint="El reglamento todavía no fue publicado por la organización." />
          </div>
        )}
      </div>
    </div>
  );
}
