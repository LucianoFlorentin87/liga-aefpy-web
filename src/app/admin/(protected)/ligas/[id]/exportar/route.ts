import { seasonAdminDb } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requirePermission("temporadas");
  const { id } = await params;
  const season = await seasonAdminDb.season.findFirst({ where: { id, status: "FINALIZADA" }, select: { slug: true, archive: true } });
  if (!season?.archive) return new Response("Histórico no disponible", { status: 404 });
  return new Response(JSON.stringify(season.archive, null, 2), { headers: {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Disposition": 'attachment; filename="' + season.slug.replace(/[^a-z0-9-]/g, "") + '-historico.json"',
    "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff",
  } });
}
