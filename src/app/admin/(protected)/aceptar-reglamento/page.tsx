import Link from 'next/link';
import { requireAuth } from '@/lib/permissions';
import { delegateRegulationState } from '@/lib/regulations';
import { acceptRegulation } from './actions';
export const dynamic='force-dynamic';
export const metadata={title:'Aceptar reglamento'};
const dt=(d:Date)=>new Intl.DateTimeFormat('es-PY',{timeZone:'America/Asuncion',dateStyle:'long',timeStyle:'short'}).format(d);
export default async function AcceptRules({searchParams}:{searchParams:Promise<{error?:string}>}){
 const {user,session}=await requireAuth();const {publication,acceptance}=await delegateRegulationState(user.id);const {error}=await searchParams;
 return <section className="card max-w-4xl p-6 space-y-5"><h1 className="text-2xl font-bold">Reglamento y aceptación</h1>
 {error&&<p role="alert" className="border border-red-400 rounded-lg p-3">{error}</p>}
 {!publication?<p>El reglamento de esta edición todavía no fue adoptado oficialmente. No se solicita aceptación.</p>:<>
 <p>Versión {publication.version} · Vigente desde {dt(publication.effectiveAt)} (Paraguay).</p>
 <a className="underline font-semibold" href={publication.pdfUrl} target="_blank" rel="noreferrer">Abrir o descargar el reglamento completo (PDF)</a>
 <iframe src={publication.pdfUrl} title={`Reglamento versión ${publication.version}`} className="w-full h-[60vh] border rounded-xl"/>
 {acceptance?<div role="status"><p className="font-semibold">Aceptación registrada el {dt(acceptance.acceptedAt)} (Paraguay).</p><p>{acceptance.delegateName} · Usuario {acceptance.username} · {acceptance.teamName}</p><Link href="/admin/mi-equipo" className="underline">Volver a mi equipo</Link></div>:session.role==='DELEGADO'?<form action={acceptRegulation} className="space-y-4"><input type="hidden" name="publicationId" value={publication.id}/><label className="flex items-start gap-3"><input type="checkbox" name="accept" required className="mt-1"/><span>{publication.acceptanceText}</span></label><p className="text-sm">La casilla comienza desmarcada. Se guardarán tu usuario, nombre, equipo, edición, versión y fecha y hora de aceptación, vinculados al documento publicado. No se aceptará en tu nombre.</p><button className="rounded-lg bg-[var(--color-navy-950)] text-white px-5 py-3 font-semibold">Aceptar reglamento y continuar</button></form>:<p>Ingresá con tu cuenta de delegado para registrar tu propia aceptación.</p>}
 </>}
 <p className="text-sm">Si no estás de acuerdo, podés salir sin aceptar. Conservás acceso a tus expedientes para ejercer defensa o solicitar revisión.</p><Link className="underline" href="/admin/comite">Mis reclamos, defensa y resoluciones</Link>
 </section>;
}
