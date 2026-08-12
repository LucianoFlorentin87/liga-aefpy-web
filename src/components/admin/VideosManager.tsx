"use client";

import { useActionState, useEffect, useState } from "react";
import type { Video } from "@prisma/client";
import { VideoPlayer } from "@/components/VideoPlayer";
import { detectVideoPlatform, VIDEO_PLATFORM_LABEL } from "@/lib/video";
import {
  createVideoAction,
  updateVideoAction,
  deleteVideoAction,
  toggleVideoFeaturedAction,
  toggleVideoPrimaryAction,
  type FormState,
} from "@/app/admin/(protected)/videos/actions";

const emptyState: FormState = {};

function VideoForm({ mode, video, onDone }: { mode: "create" | "edit"; video?: Video; onDone: () => void }) {
  const action = mode === "create" ? createVideoAction : updateVideoAction;
  const [state, formAction, pending] = useActionState(action, emptyState);

  useEffect(() => {
    if (state.success) onDone();
  }, [state.success, onDone]);

  return (
    <form action={formAction} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {mode === "edit" && <input type="hidden" name="id" value={video!.id} />}
      <div>
        <label className="field-label">Título</label>
        <input name="title" required maxLength={120} defaultValue={video?.title} className="input" />
      </div>
      <div>
        <label className="field-label">Link (YouTube, Twitch, etc.)</label>
        <input name="url" required placeholder="https://…" defaultValue={video?.url} className="input" />
      </div>
      <div className="sm:col-span-2 flex flex-col gap-2">
        <label className="flex items-center gap-2 text-sm font-medium text-[var(--color-gray-700)]">
          <input type="checkbox" name="featured" defaultChecked={video?.featured ?? false} className="h-4 w-4" />
          Destacado (aparece en el inicio)
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-[var(--color-gray-700)]">
          <input type="checkbox" name="isPrimary" defaultChecked={video?.isPrimary ?? false} className="h-4 w-4" />
          Video principal (grande, arriba de todo — reemplaza al anterior si había uno)
        </label>
      </div>

      {state.error && <p className="field-error sm:col-span-2">{state.error}</p>}

      <div className="flex gap-2 sm:col-span-2">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Guardando…" : mode === "create" ? "Cargar video" : "Guardar cambios"}
        </button>
        <button type="button" onClick={onDone} className="btn btn-outline">
          Cancelar
        </button>
      </div>
    </form>
  );
}

export function VideosManager({ videos }: { videos: Video[] }) {
  const [panel, setPanel] = useState<{ mode: "create" | "edit"; video?: Video } | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-[var(--color-navy-900)]">Videos</h1>
          <p className="text-sm text-[var(--color-gray-500)]">
            Se publican en /videos. El &ldquo;principal&rdquo; se ve grande arriba de todo en el inicio; los
            &ldquo;destacados&rdquo; aparecen en la franja más abajo.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setPanel({ mode: "create" })}>
          + Nuevo video
        </button>
      </div>

      {panel && (
        <div className="card p-5">
          <h2 className="section-title mb-4">{panel.mode === "create" ? "Cargar video" : "Editar video"}</h2>
          <VideoForm mode={panel.mode} video={panel.video} onDone={() => setPanel(null)} />
        </div>
      )}

      {videos.length === 0 ? (
        <div className="card p-5">
          <p className="empty-state">
            <strong>Sin datos registrados</strong>
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((v) => (
            <div key={v.id} className="card flex flex-col gap-3 p-4">
              <VideoPlayer url={v.url} title={v.title} />
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-[var(--color-navy-900)]">{v.title}</p>
                  <p className="text-xs text-[var(--color-gray-500)]">{VIDEO_PLATFORM_LABEL[detectVideoPlatform(v.url)]}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {v.isPrimary && (
                    <span className="rounded-full bg-[var(--color-navy-900)] px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-white">
                      Principal
                    </span>
                  )}
                  {v.featured && (
                    <span className="rounded-full bg-[var(--color-red-100)] px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-[var(--color-red-700)]">
                      Destacado
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button className="btn btn-ghost !px-2 !py-1 text-xs" onClick={() => setPanel({ mode: "edit", video: v })}>
                  Editar
                </button>
                <form action={toggleVideoPrimaryAction}>
                  <input type="hidden" name="id" value={v.id} />
                  <button className="btn btn-ghost !px-2 !py-1 text-xs">
                    {v.isPrimary ? "Quitar como principal" : "Marcar como principal"}
                  </button>
                </form>
                <form action={toggleVideoFeaturedAction}>
                  <input type="hidden" name="id" value={v.id} />
                  <button className="btn btn-ghost !px-2 !py-1 text-xs">
                    {v.featured ? "Quitar de destacados" : "Destacar"}
                  </button>
                </form>
                <form
                  action={deleteVideoAction}
                  onSubmit={(e) => {
                    if (!confirm(`¿Eliminar el video "${v.title}"?`)) e.preventDefault();
                  }}
                >
                  <input type="hidden" name="id" value={v.id} />
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
