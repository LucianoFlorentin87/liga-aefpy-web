import Link from "next/link";
import { seasonAdminDb } from "@/lib/db";
import { formatDateShort } from "@/lib/format";
export const dynamic = "force-dynamic";
export const metadata = { title: "Histórico de ligas" };
export default async function HistoryPage() {
  const seasons = await seasonAdminDb.season.findMany({ where: { status: "FINALIZADA" }, select: { id: true, name: true, slug: true, endedAt: true, _count: { select: { teams: true, matches: true } } }, orderBy: { endedAt: "desc" } });
  return <div className="container-page py-12"><header className="registration-hero"><p className="arena-overline">La historia de la liga</p><h1>Cada edición.<br /><em>Su historia.</em></h1><p>Equipos, planteles, resultados y estadísticas conservados al cierre de cada liga.</p></header>
    {seasons.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{seasons.map(season => <Link key={season.id} href={"/historico/" + season.slug} className="card p-6 transition-colors hover:border-[var(--color-red-accent)]"><span className="arena-overline">Finalizada {season.endedAt ? "/ " + formatDateShort(season.endedAt) : ""}</span><h2 className="mt-5 text-2xl font-extrabold">{season.name}</h2><p className="mt-3 text-sm text-[var(--color-gray-500)]">{season._count.teams} equipos / {season._count.matches} partidos</p><span className="mt-6 inline-block text-sm font-bold">Explorar histórico ↗</span></Link>)}</div> : <div className="card p-8"><h2 className="section-title">El histórico empezará al cerrar la primera liga.</h2><p className="mt-3 text-sm text-[var(--color-gray-500)]">La competición actual continúa disponible en la portada.</p><Link className="btn btn-primary mt-5" href="/">Ver liga actual</Link></div>}
  </div>;
}
