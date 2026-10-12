"use client";

import { useActionState, useEffect, useState } from "react";
import type { News } from "@prisma/client";
import { formatDateShort } from "@/lib/format";
import { Modal } from "@/components/admin/Modal";
import { LogoFileInput } from "@/components/admin/LogoFileInput";
import {
  createNewsAction,
  updateNewsAction,
  deleteNewsAction,
  toggleNewsFeaturedAction,
  type FormState,
} from "@/app/admin/(protected)/noticias/actions";

const emptyState: FormState = {};

function toInputDate(date: Date) {
  return new Date(date).toISOString().slice(0, 10);
}

function NewsForm({ mode, item, onDone }: { mode: "create" | "edit"; item?: News; onDone: () => void }) {
  const action = mode === "create" ? createNewsAction : updateNewsAction;
  const [state, formAction, pending] = useActionState(action, emptyState);

  useEffect(() => {
    if (state.success) onDone();
  }, [state.success, onDone]);

  return (
    <form action={formAction} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {mode === "edit" && <input type="hidden" name="id" value={item!.id} />}
      {item?.imageUrl && <input type="hidden" name="externalImageUrl" value={item.imageUrl} />}

      <div className="sm:col-span-2">
        <label className="field-label">Título</label>
        <input name="title" required maxLength={150} defaultValue={item?.title} className="input" />
      </div>
      <div className="sm:col-span-2">
        <label className="field-label">Resumen (se ve en la lista de /noticias)</label>
        <textarea name="excerpt" required maxLength={300} rows={2} defaultValue={item?.excerpt} className="input" />
      </div>
      <div className="sm:col-span-2">
        <label className="field-label">Cuerpo completo (opcional)</label>
        <textarea name="body" maxLength={20000} rows={6} defaultValue={item?.body ?? ""} className="input" />
        <p className="mt-1 text-xs text-[var(--color-gray-500)]">
          Dejalo vacío si es sólo una tarjeta con link a la fuente (ver más abajo).
        </p>
      </div>
      <div>
        <label className="field-label">Fecha de publicación</label>
        <input
          name="publishedAt"
          type="date"
          required
          defaultValue={item ? toInputDate(item.publishedAt) : toInputDate(new Date())}
          className="input"
        />
      </div>
      <LogoFileInput label="Imagen de portada (opcional, PNG/JPG/WEBP/SVG, máx. 2MB)" />
      <div>
        <label className="field-label">Fuente (opcional — ej. &ldquo;Konami&rdquo;)</label>
        <input name="sourceName" maxLength={60} defaultValue={item?.sourceName ?? ""} className="input" />
      </div>
      <div>
        <label className="field-label">Link a la fuente (opcional)</label>
        <input name="sourceUrl" placeholder="https://…" defaultValue={item?.sourceUrl ?? ""} className="input" />
      </div>
      <div className="sm:col-span-2">
        <label className="flex items-center gap-2 text-sm font-medium text-[var(--color-gray-700)]">
          <input type="checkbox" name="featured" defaultChecked={item?.featured ?? false} className="h-4 w-4" />
          Destacada (aparece en el inicio)
        </label>
      </div>

      {state.error && <p className="field-error sm:col-span-2">{state.error}</p>}

      <div className="flex gap-2 sm:col-span-2">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Guardando…" : mode === "create" ? "Cargar noticia" : "Guardar cambios"}
        </button>
        <button type="button" onClick={onDone} className="btn btn-outline">
          Cancelar
        </button>
      </div>
    </form>
  );
}

export function NewsManager({ news }: { news: News[] }) {
  const [panel, setPanel] = useState<{ mode: "create" | "edit"; item?: News } | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-[var(--color-navy-900)]">Noticias</h1>
          <p className="text-sm text-[var(--color-gray-500)]">
            Se publican en /noticias. Redactá una propia o cargá una como tarjeta con link a una fuente externa.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setPanel({ mode: "create" })}>
          + Nueva noticia
        </button>
      </div>

      <Modal
        open={!!panel}
        onClose={() => setPanel(null)}
        title={panel?.mode === "create" ? "Cargar noticia" : "Editar noticia"}
      >
        {panel && <NewsForm mode={panel.mode} item={panel.item} onDone={() => setPanel(null)} />}
      </Modal>

      {news.length === 0 ? (
        <div className="card p-5">
          <p className="empty-state">
            <strong>Sin datos registrados</strong>
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {news.map((n) => (
            <div key={n.id} className="card flex flex-col gap-3 p-4">
              {n.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- imagen externa (Konami) o subida, sin dominio fijo para next/image
                <img src={n.imageUrl} alt={n.title} className="h-32 w-full rounded-lg object-cover" />
              )}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-[var(--color-navy-900)]">{n.title}</p>
                  <p className="text-xs text-[var(--color-gray-500)]">
                    {formatDateShort(n.publishedAt)}
                    {n.sourceName && ` · ${n.sourceName}`}
                  </p>
                </div>
                {n.featured && (
                  <span className="shrink-0 rounded-full bg-[var(--color-red-100)] px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-[var(--color-red-accent)]">
                    Destacada
                  </span>
                )}
              </div>
              <p className="line-clamp-2 text-sm text-[var(--color-gray-600)]">{n.excerpt}</p>
              <div className="flex flex-wrap gap-1.5">
                <button className="btn btn-ghost !px-2 !py-1 text-xs" onClick={() => setPanel({ mode: "edit", item: n })}>
                  Editar
                </button>
                <form action={toggleNewsFeaturedAction}>
                  <input type="hidden" name="id" value={n.id} />
                  <button className="btn btn-ghost !px-2 !py-1 text-xs">
                    {n.featured ? "Quitar de destacadas" : "Destacar"}
                  </button>
                </form>
                <form
                  action={deleteNewsAction}
                  onSubmit={(e) => {
                    if (!confirm(`¿Eliminar la noticia "${n.title}"?`)) e.preventDefault();
                  }}
                >
                  <input type="hidden" name="id" value={n.id} />
                  <button className="btn btn-danger !px-2 !py-1 text-xs">Eliminar</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
