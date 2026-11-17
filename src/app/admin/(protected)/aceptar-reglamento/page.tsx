import Link from 'next/link';
import { requireAuth } from '@/lib/permissions';
import { delegateRegulationState } from '@/lib/regulations';
import { acceptRegulation } from './actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Aceptar reglamento' };
const dt = (d: Date) => new Intl.DateTimeFormat('es-PY', { timeZone: 'America/Asuncion', dateStyle: 'long', timeStyle: 'short' }).format(d);

export default async function AcceptRules({ searchParams }: { searchParams: Promise<{ error?: string; motivo?: string }> }) {
  const { user, session } = await requireAuth();
  const { publication, acceptance } = await delegateRegulationState(user.id);
  const { error, motivo } = await searchParams;
  return <section className="space-y-5 w-full min-w-0">
    <header className="space-y-2">
      <h1 className="text-2xl font-bold">Reglamento y aceptación</h1>
      {publication && <p>Versión {publication.version} · Vigente desde {dt(publication.effectiveAt)} (Paraguay).</p>}
    </header>
    {error && <p role="alert" className="field-error">{error}</p>}
    {!publication ? <p className="card p-5">El reglamento de esta edición todavía no fue adoptado oficialmente. No se solicita aceptación.</p> : <div className="regulation-workspace">
      <div className="card p-3 sm:p-4 min-w-0 space-y-3">
        <a className="btn btn-outline" href={publication.pdfUrl} target="_blank" rel="noreferrer">Abrir o descargar PDF ↗</a>
        <iframe src={publication.pdfUrl} title={`Reglamento versión ${publication.version}`} className="regulation-document w-full border rounded-lg" />
      </div>
      <aside className="card p-5 space-y-5 regulation-acceptance" aria-label="Estado de aceptación">
        {acceptance ? <div role="status" className="space-y-3">
          <h2 className="text-lg font-bold">Aceptación registrada</h2>
          <p>{dt(acceptance.acceptedAt)} (Paraguay).</p>
          <p>{acceptance.delegateName} · Usuario {acceptance.username} · {acceptance.teamName}</p>
          {session.role === 'DELEGADO' && <Link href="/admin/mi-equipo" className="btn btn-primary w-full">Ir a mi equipo</Link>}
        </div> : session.role === 'DELEGADO' ? <>
          <div className="space-y-2">
            <h2 className="text-lg font-bold">Antes de entrar a Mi equipo</h2>
            <p>{motivo === 'mi-equipo' ? 'Llegaste aquí porque todavía no registraste tu aceptación de la versión vigente.' : 'Todavía no registraste tu aceptación de la versión vigente.'} Revisá el documento y, si estás de acuerdo, marcá la casilla para continuar.</p>
            <p className="text-sm">Después podrás gestionar tus jugadores, cartas eFHUB, escudo y datos del equipo.</p>
          </div>
          <form action={acceptRegulation} className="space-y-4">
            <input type="hidden" name="publicationId" value={publication.id} />
            <label className="flex items-start gap-3"><input type="checkbox" name="accept" required className="mt-1" /><span>{publication.acceptanceText}</span></label>
            <p className="text-sm">La casilla comienza desmarcada. Se guardarán tu usuario, nombre, equipo, edición, versión y fecha y hora de aceptación, vinculados al documento publicado. No se aceptará en tu nombre.</p>
            <button className="btn btn-primary w-full">Aceptar reglamento e ir a mi equipo</button>
          </form>
        </> : <p>Ingresá con tu cuenta de delegado para registrar tu propia aceptación.</p>}
        <div className="space-y-3 border-t border-[var(--color-gray-200)] pt-4 text-sm">
          <p>Si no estás de acuerdo, podés salir sin aceptar. Conservás acceso a tus expedientes para ejercer defensa o solicitar revisión.</p>
          <Link className="underline" href="/admin/comite">Mis reclamos, defensa y resoluciones</Link>
        </div>
      </aside>
    </div>}
  </section>;
}
