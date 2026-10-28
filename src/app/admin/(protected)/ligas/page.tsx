import Link from "next/link";
import { getCurrentSeason, prisma, seasonAdminDb } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { LeagueActionForm } from "@/components/LeagueActionForm";
import { closeAndCreateLeague, startLeague, updateLeague } from "./actions";
import { formatDateShort } from "@/lib/format";
export const dynamic = "force-dynamic";
export const metadata = { title: "Ligas y temporadas" };

export default async function LeaguesPage() {
  await requirePermission("temporadas");
  const season = await getCurrentSeason();
  const [teams, matches, pending, playing, waiting, history] = await Promise.all([
    prisma.team.count({ where: { status: "ACTIVO" } }), prisma.match.count(),
    prisma.match.count({ where: { status: { not: "FINALIZADO" } } }),
    prisma.match.count({ where: { status: "EN_CURSO" } }),
    prisma.leagueRegistration.count({ where: { status: "PENDIENTE" } }),
    seasonAdminDb.season.findMany({ where: { status: "FINALIZADA" }, select: { id: true, name: true, slug: true, endedAt: true }, orderBy: { endedAt: "desc" } }),
  ]);
  return <div className="admin-page-stack">
    <header className="admin-page-heading"><p className="arena-overline">Control del torneo / Superadministrador</p><h1>Ligas y temporadas.</h1><p>Cerrá una edición, conservá su histórico y prepará la siguiente.</p></header>
    <div className="admin-season-strip"><div><span>Liga actual</span><h2>{season.name}</h2></div><strong>{season.status === "EN_CURSO" ? "En curso" : "Inscripciones"}</strong><Link href={"/inscripcion/" + season.slug}>Formulario público ↗</Link></div>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{[["Equipos activos", teams], ["Partidos", matches], ["Pendientes", pending], ["Solicitudes pendientes", waiting]].map(([label, value]) => <div className="card p-4" key={label}><p className="text-xs text-[var(--color-gray-500)]">{label}</p><b className="text-3xl tabular-nums">{value}</b></div>)}</div>
    <div className="grid gap-6 xl:grid-cols-2">
      <section className="card p-5"><h2 className="section-title mb-4">Configuración de la liga</h2>
        <LeagueActionForm action={updateLeague} buttonLabel="Guardar configuración">
          <input type="hidden" name="seasonId" value={season.id} />
          <label className="league-field">Nombre de esta liga<input name="name" required minLength={3} maxLength={100} defaultValue={season.name} className="input" /></label>
          {season.status === "INSCRIPCION" && <label className="league-checkbox"><input name="registrationOpen" type="checkbox" defaultChecked={season.registrationOpen} />Aceptar nuevas solicitudes de inscripción</label>}
          {season.status === "INSCRIPCION" && <label className="league-field">Fecha límite de inscripción (opcional)<input name="deadline" type="date" className="input" defaultValue={season.registrationDeadline ? new Intl.DateTimeFormat("en-CA", { timeZone: "America/Asuncion", year: "numeric", month: "2-digit", day: "2-digit" }).format(season.registrationDeadline) : ""} /></label>}
        </LeagueActionForm>
      </section>
      <section className="card p-5"><h2 className="section-title mb-3">Inscripción y comienzo</h2><p className="text-sm text-[var(--color-gray-500)]">Cada equipo tiene un delegado. Las cuentas nuevas se habilitan al aprobar la solicitud; los delegados existentes conservan su cuenta.</p>
        <div className="mt-4 flex flex-wrap gap-3"><Link className="btn btn-outline" href="/admin/inscripciones">Revisar solicitudes</Link><Link className="btn btn-outline" href={"/inscripcion/" + season.slug}>Ver inscripción ↗</Link></div>
        {season.status === "INSCRIPCION" && <LeagueActionForm action={startLeague} buttonLabel="Iniciar esta liga"><input type="hidden" name="seasonId" value={season.id} /><p className="mt-5 text-xs text-[var(--color-gray-500)]">Se necesitan al menos dos equipos aprobados y ninguna solicitud pendiente. Al iniciar se cierran las inscripciones.</p></LeagueActionForm>}
      </section>
    </div>
    <section className="card p-5"><p className="arena-overline">Cambio de edición</p><h2 className="section-title mt-2 mb-3">Finalizar esta liga y abrir la siguiente</h2>
      <p className="max-w-3xl text-sm text-[var(--color-gray-500)]">Se conservarán equipos, planteles, partidos, goles, tarjetas, sanciones, ajustes de puntos, predicciones y contenido. El histórico quedará en modo de solo lectura. La nueva liga comenzará sin equipos ni resultados.</p>
      {playing > 0 && <p className="league-warning mt-4">Hay {playing} partidos en curso. Deben resolverse antes de finalizar.</p>}
      <LeagueActionForm action={closeAndCreateLeague} buttonLabel="Archivar liga actual y abrir inscripciones" danger>
        <input type="hidden" name="currentSeasonId" value={season.id} />
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <label className="league-field">Nombre de la próxima liga<input name="name" required minLength={3} maxLength={100} placeholder="Ej.: Liga Apertura 2027" className="input" /></label>
          <label className="league-field">Cierre de inscripción (opcional)<input name="deadline" type="date" className="input" /><span className="text-xs font-normal text-[var(--color-gray-500)]">Hasta el final de ese día, hora de Paraguay.</span></label>
          <label className="league-field">Escribí «{season.name}» para confirmar<input name="confirmName" required autoComplete="off" className="input" /></label>
        </div>
        {pending > 0 && <label className="league-checkbox league-warning"><input name="acknowledgePending" type="checkbox" required />Confirmo el cierre con {pending} partidos sin finalizar. Se conservarán con su estado actual, sin inventar resultados.</label>}
      </LeagueActionForm>
    </section>
    <section className="card p-5"><h2 className="section-title mb-4">Ligas anteriores</h2>{history.length ? <ul className="divide-y divide-[var(--color-gray-200)]">{history.map(item => <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div><b>{item.name}</b><p className="text-xs text-[var(--color-gray-500)]">{item.endedAt ? formatDateShort(item.endedAt) : ""}</p></div><div className="flex gap-4 text-sm"><Link className="underline" href={"/historico/" + item.slug}>Ver histórico</Link><a className="underline" href={"/admin/ligas/" + item.id + "/exportar"}>Descargar archivo completo</a></div></li>)}</ul> : <p className="text-sm text-[var(--color-gray-500)]">Todavía no se cerró ninguna liga.</p>}</section>
  </div>;
}
