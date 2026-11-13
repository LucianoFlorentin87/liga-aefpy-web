'use client';
import { useActionState } from 'react';
import { publishUploadedRegulation, type PublishUploadState } from './upload-actions';

const initial: PublishUploadState = {};
export function RegulationUploadForm() {
  const [state, action, pending] = useActionState(publishUploadedRegulation, initial);
  return <form action={action} encType="multipart/form-data" className="card p-5 space-y-4">
    <h2 className="text-lg font-bold">Publicar nueva versión del reglamento</h2>
    <p className="text-sm">Subí el PDF definitivo. La versión anterior y sus aceptaciones quedarán conservadas. Solo se permite publicar durante la inscripción.</p>
    <label className="block text-sm font-semibold" htmlFor="reg-version">Nueva versión</label>
    <input id="reg-version" name="version" type="text" required pattern="[1-9][0-9]{0,2}[.][0-9]{1,3}" placeholder="1.2" className="w-full rounded-lg border p-3" />
    <label className="block text-sm font-semibold" htmlFor="reg-pdf">Documento PDF (máximo 15 MB)</label>
    <input id="reg-pdf" name="rulesPdf" type="file" accept="application/pdf,.pdf" required className="block w-full rounded-lg border p-3" />
    <label className="flex items-start gap-2 text-sm"><input type="checkbox" name="confirm" required className="mt-1" /><span>Confirmo que este PDF es definitivo y que los delegados deberán aceptar expresamente esta nueva versión.</span></label>
    {state.error && <p role="alert" className="text-red-700">{state.error}</p>}
    {state.success && <p role="status" className="text-green-700">{state.success}</p>}
    <button disabled={pending} className="rounded-lg bg-[var(--color-navy-950)] px-5 py-3 text-white disabled:opacity-50">{pending ? 'Publicando…' : 'Publicar nueva versión'}</button>
  </form>;
}
