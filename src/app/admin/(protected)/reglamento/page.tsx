import { currentRegulation } from "@/lib/regulations";
import { seasonAdminDb } from "@/lib/db";
import { publishRegulation } from "./publication-actions";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { RulesEditor } from "@/components/admin/RulesEditor";
import { RegulationUploadForm } from "./RegulationUploadForm";

export const metadata: Metadata = { title: "Reglamento" };
export const dynamic = "force-dynamic";

export default async function AdminReglamentoPage() {
  const {session}=await requirePermission("reglamento");
  const publication=await currentRegulation();
  const acceptances=publication?await seasonAdminDb.regulationAcceptance.findMany({where:{publicationId:publication.id},orderBy:{acceptedAt:"desc"}}):[];

  const settings = await prisma.tournamentSettings.findUnique({ where: { id: "settings" } });
  const history = settings?.currentSeasonId ? await seasonAdminDb.regulationPublication.findMany({ where: { seasonId: settings.currentSeasonId }, orderBy: [{effectiveAt:"desc"},{publishedAt:"desc"}] }) : [];
  const season = settings?.currentSeasonId ? await seasonAdminDb.season.findUnique({where:{id:settings.currentSeasonId},select:{status:true}}) : null;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-extrabold text-[var(--color-navy-900)]">Reglamento</h1>
        <p className="text-sm text-[var(--color-gray-500)]">Publicación oficial por edición y registro de aceptaciones de los delegados.</p>
      </div>
      {session.role === "SUPERADMIN" && season?.status === "INSCRIPCION" && <RegulationUploadForm />}
      {history.length > 0 && <section className="card p-5 space-y-2"><h2 className="font-bold">Historial de versiones de esta edición</h2><ul className="space-y-2">{history.map(item => <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 border-b pb-2"><span>Versión {item.version} · {new Intl.DateTimeFormat("es-PY",{timeZone:"America/Asuncion",dateStyle:"short",timeStyle:"short"}).format(item.effectiveAt)}</span><a href={item.pdfUrl} target="_blank" rel="noreferrer" className="underline">Consultar PDF</a></li>)}</ul></section>}
      {publication ? <section className="card p-5 space-y-3"><h2 className="font-bold">Versión {publication.version} publicada y conservada</h2><p>Vigencia: {new Intl.DateTimeFormat('es-PY',{timeZone:'America/Asuncion',dateStyle:'long',timeStyle:'short'}).format(publication.effectiveAt)} (Paraguay).</p><a className="underline" href={publication.pdfUrl}>Consultar documento adoptado</a><p>Esta versión y sus aceptaciones no se sobrescriben. Un cambio requiere publicar una nueva versión.</p><h3 className="font-semibold">Aceptaciones registradas: {acceptances.length}</h3>{acceptances.length===0?<p>Todavía no hay aceptaciones. Cada delegado debe confirmarla personalmente.</p>:<div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr><th>Delegado / Usuario</th><th>Equipo</th><th>Versión</th><th>Fecha y hora (Paraguay)</th></tr></thead><tbody>{acceptances.map(a=><tr key={a.id}><td className="p-2">{a.delegateName} / {a.username}</td><td>{a.teamName}</td><td>{publication.version}</td><td>{new Intl.DateTimeFormat('es-PY',{timeZone:'America/Asuncion',dateStyle:'short',timeStyle:'short'}).format(a.acceptedAt)}</td></tr>)}</tbody></table></div>}</section> : <>{session.role==='SUPERADMIN'&&<form action={publishRegulation} className="card p-5 space-y-3"><h2 className="font-bold">Adoptar v1.1 para la edición actual</h2><p>Publica el PDF verificado con vigencia inmediata y solicita aceptación expresa a cada delegado. No registra aceptaciones en nombre de los participantes.</p><button className="rounded-lg bg-[var(--color-navy-950)] text-white p-3">Publicar v1.1 y habilitar aceptación</button></form>}<RulesEditor initialContent={settings?.rulesContent ?? ""} rulesPdfUrl={settings?.rulesPdfUrl ?? null} /></>}
    </div>
  );
}
