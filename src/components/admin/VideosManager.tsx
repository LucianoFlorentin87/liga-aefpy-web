"use client";

import { useActionState, useEffect, useState } from "react";
import type { Video } from "@prisma/client";
import { VideoPlayer } from "@/components/VideoPlayer";
import { detectVideoPlatform, VIDEO_PLATFORM_LABEL } from "@/lib/video";
import { createVideoAction, updateVideoAction, deleteVideoAction, type FormState } from "@/app/admin/(protected)/videos/actions";

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
          <p className="text-sm text-[var(--color-gray-500)]">Se publican automáticamente en /videos y en el inicio.</p>
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
              <div>
                <p className="font-semibold text-[var(--color-navy-900)]">{v.title}</p>
                <p className="text-xs text-[var(--color-gray-500)]">{VIDEO_PLATFORM_LABEL[detectVideoPlatform(v.url)]}</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button className="btn btn-ghost !px-2 !py-1 text-xs" onClick={() => setPanel({ mode: "edit", video: v })}>
                  Editar
                </button>
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
