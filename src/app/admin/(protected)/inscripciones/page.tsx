import Link from "next/link";
import { getCurrentSeason, prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { LeagueActionForm } from "@/components/LeagueActionForm";
import { reviewLeagueRegistration, reinstateLeagueRegistration } from "./actions";
import { registrationIsOpen } from "@/lib/league-validation";
import { formatDateShort } from "@/lib/format";
export const dynamic = "force-dynamic";
export const metadata = { title: "Inscripciones" };

export default async function RegistrationsPage() {
  await requirePermission("inscripciones");
  const season = await getCurrentSeason();
  const requests = await prisma.leagueRegistration.findMany({
    orderBy: [{ createdAt: "desc" }],
    select: { id: true, teamId: true, teamName: true, shortName: true, gamertag: true, delegateFirstName: true, delegateLastName: true, email: true, phone: true, username: true, status: true, createdAt: true, reviewNote: true },
  });
  return <div className="admin-page-stack">
    <header className="admin-page-heading"><p className="arena-overline">{season.name}</p><h1>Inscripciones.</h1><p>Revisá los equipos y vinculá a cada delegado con su panel.</p></header>
    <div className="admin-season-strip"><div><span>Formulario para compartir</span><h2 className="break-all">/inscripcion/{season.slug}</h2></div><Link href={"/inscripcion/" + season.slug}>Abrir formulario ↗</Link></div>
    <div className="flex flex-wrap gap-3 text-sm">{[["PENDIENTE", "Pendientes"], ["APROBADA", "Aprobadas con equipo"], ["RECHAZADA", "Rechazadas"]].map(([key, label]) => <span key={key} className="badge badge-gray">{label}: {requests.filter(item => item.status === key && (key !== "APROBADA" || item.teamId)).length}</span>)}<span className="badge badge-gray">Equipos eliminados: {requests.filter(item => item.status === "APROBADA" && !item.teamId).length}</span></div>
    {!requests.length && <div className="card p-8"><h2 className="section-title">Sin solicitudes todavía</h2><p className="mt-2 text-sm text-[var(--color-gray-500)]">Las inscripciones aparecerán aquí cuando se envíe el formulario público.</p></div>}
    <div className="grid gap-5 xl:grid-cols-2">{requests.map(request => <article key={request.id} className="card p-5">
      <div className="flex items-start justify-between gap-3"><div><p className="arena-overline">{request.shortName} / {formatDateShort(request.createdAt)}</p><h2 className="mt-2 text-xl font-extrabold">{request.teamName}</h2></div><span className="badge badge-gray">{request.status === "APROBADA" && !request.teamId ? "EQUIPO ELIMINADO" : request.status}</span></div>
      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 text-sm"><div><dt className="text-xs text-[var(--color-gray-500)]">Delegado</dt><dd>{request.delegateFirstName} {request.delegateLastName}</dd></div><div><dt className="text-xs text-[var(--color-gray-500)]">Usuario / Gamertag</dt><dd>{request.username} / {request.gamertag}</dd></div><div className="min-w-0"><dt className="text-xs text-[var(--color-gray-500)]">Correo</dt><dd className="break-all">{request.email}</dd></div><div><dt className="text-xs text-[var(--color-gray-500)]">Teléfono</dt><dd>{request.phone}</dd></div></dl>
      {request.status === "APROBADA" && !request.teamId && <div className="mt-5 space-y-3"><p className="text-sm">La aprobación original se conserva como historial, pero el equipo fue eliminado. La reincorporación reutiliza esta inscripción y sus datos, sin exigir otro nombre ni correo.</p>{registrationIsOpen(season) ? <LeagueActionForm action={reinstateLeagueRegistration} buttonLabel="Aprobar reincorporación"><input type="hidden" name="registrationId" value={request.id} /><label className="flex items-start gap-3"><input type="checkbox" name="confirm" required className="mt-1" /><span>Confirmo la reincorporación de {request.teamName} en esta liga y la vinculación de su delegado. Si su cuenta fue eliminada, se recuperará con el mismo correo y usuario; deberá elegir una nueva contraseña por correo.</span></label></LeagueActionForm> : <p className="text-sm">La reincorporación estará disponible únicamente mientras las inscripciones de esta liga estén abiertas.</p>}</div>}
      {request.status === "PENDIENTE" && season.status === "INSCRIPCION" ? <LeagueActionForm action={reviewLeagueRegistration} buttonLabel="Guardar revisión">
        <input type="hidden" name="registrationId" value={request.id} />
        <label className="league-field mt-5">Decisión<select name="decision" className="input" required defaultValue=""><option value="" disabled>Seleccioná una opción</option><option value="APROBAR">Aprobar equipo y habilitar delegado</option><option value="RECHAZAR">Rechazar solicitud</option></select></label>
        <label className="league-field">Nota para el delegado (opcional)<textarea name="note" maxLength={500} rows={2} className="input" /></label>
      </LeagueActionForm> : request.reviewNote && <p className="mt-4 text-sm text-[var(--color-gray-500)]">{request.reviewNote}</p>}
    </article>)}</div>
  </div>;
}
