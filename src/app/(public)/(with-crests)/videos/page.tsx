import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { VideoPlayer } from "@/components/VideoPlayer";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Videos" };
export const dynamic = "force-dynamic";

export default async function VideosPage() {
  const videos = await prisma.video.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <PageHeader title="Videos" subtitle="Goles, resúmenes y transmisiones de la liga." />
      <div className="container-page py-8">
        {videos.length === 0 ? (
          <div className="card p-6">
            <EmptyState title="Sin datos registrados" hint="Todavía no hay videos cargados." />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((video) => (
              <div key={video.id} className="card flex flex-col gap-3 p-4">
                <VideoPlayer url={video.url} title={video.title} />
                <div>
                  <p className="font-semibold text-[var(--color-navy-900)]">{video.title}</p>
                  <p className="text-xs text-[var(--color-gray-500)] capitalize">{formatDate(video.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
