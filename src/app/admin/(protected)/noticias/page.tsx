import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { NewsManager } from "@/components/admin/NewsManager";

export const metadata: Metadata = { title: "Noticias" };
export const dynamic = "force-dynamic";

export default async function AdminNoticiasPage() {
  await requirePermission("noticias");

  const news = await prisma.news.findMany({ orderBy: { publishedAt: "desc" } });

  return <NewsManager news={news} />;
}
