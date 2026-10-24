import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Noticias" };
export const dynamic = "force-dynamic";

export default async function NoticiasPage() {
  const news = await prisma.news.findMany({ orderBy: { publishedAt: "desc" } });

  return (
    <div>
      <PageHeader title="Noticias" subtitle="Novedades de la liga y del mundo eFootball." />
      <div className="container-page py-8">
        {news.length === 0 ? (
          <div className="card p-6">
            <EmptyState title="Sin datos registrados" hint="Todavía no hay noticias cargadas." />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {news.map((item) => (
              <Link
                key={item.id}
                href={`/noticias/${item.id}`}
                className="card flex flex-col overflow-hidden p-0 transition hover:shadow-md"
              >
                {item.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element -- imagen externa (Konami) o subida, sin dominio fijo
                  <img src={item.imageUrl} alt={item.title} className="h-40 w-full object-cover" />
                )}
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-gray-500)]">
                    {formatDate(item.publishedAt)}
                    {item.sourceName && ` · ${item.sourceName}`}
                  </p>
                  <p className="font-bold text-[var(--color-navy-900)]">{item.title}</p>
                  <p className="line-clamp-3 text-sm text-[var(--color-gray-600)]">{item.excerpt}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
