import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const news = await prisma.news.findUnique({ where: { id }, select: { title: true } });
  return { title: news?.title ?? "Noticia" };
}

export default async function NewsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const news = await prisma.news.findUnique({ where: { id } });

  if (!news) notFound();

  return (
    <div>
      <div className="border-b border-[var(--color-gray-200)] bg-[var(--color-navy-950)] text-white">
        <div className="container-page py-8">
          <Link href="/noticias" className="text-xs font-semibold text-white/70 hover:text-white">
            ← Volver a noticias
          </Link>
          <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-white/70">
            {formatDate(news.publishedAt)}
            {news.sourceName && ` · Fuente: ${news.sourceName}`}
          </p>
          <h1 className="mt-2 text-2xl font-extrabold sm:text-3xl">{news.title}</h1>
        </div>
      </div>

      <div className="container-page max-w-3xl py-8">
        {news.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- imagen externa (Konami) o subida, sin dominio fijo
          <img src={news.imageUrl} alt={news.title} className="mb-6 w-full rounded-xl object-cover" />
        )}

        <p className="text-base font-medium text-[var(--color-gray-700)]">{news.excerpt}</p>

        {news.body && (
          <div className="mt-6 whitespace-pre-line text-sm leading-relaxed text-[var(--color-navy-900)]">
            {news.body}
          </div>
        )}

        {news.sourceUrl && (
          <a
            href={news.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline mt-6 inline-flex w-fit"
          >
            Leer en {news.sourceName || "la fuente original"} →
          </a>
        )}
      </div>
    </div>
  );
}
