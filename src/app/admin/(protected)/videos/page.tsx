import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { VideosManager } from "@/components/admin/VideosManager";

export const metadata: Metadata = { title: "Videos" };
export const dynamic = "force-dynamic";

export default async function AdminVideosPage() {
  await requirePermission("videos");

  const videos = await prisma.video.findMany({ orderBy: { createdAt: "desc" } });

  return <VideosManager videos={videos} />;
}
