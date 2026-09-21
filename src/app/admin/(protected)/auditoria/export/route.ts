import ExcelJS from "exceljs";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { buildAuditWhere } from "@/lib/audit";

export const dynamic = "force-dynamic";

/** Exporta el historial de auditoría (con los mismos filtros de la página) a Excel. */
export async function GET(request: Request) {
  await requirePermission("auditoria");

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;
  const userId = searchParams.get("userId") ?? undefined;

  const entries = await prisma.activityLog.findMany({
    where: buildAuditWhere({ from, to, userId }),
    orderBy: { createdAt: "desc" },
    include: { user: { select: { firstName: true, lastName: true, username: true } } },
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Liga AEFPY";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Auditoría");
  sheet.columns = [
    { header: "Fecha y hora", key: "date", width: 20 },
    { header: "Usuario", key: "user", width: 24 },
    { header: "Acción", key: "message", width: 80 },
  ];

  const headerRow = sheet.getRow(1);
  headerRow.font = { name: "Arial", bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1B2A4A" } };
  headerRow.alignment = { vertical: "middle", horizontal: "left" };
  headerRow.height = 22;

  for (const entry of entries) {
    const row = sheet.addRow({
      date: new Intl.DateTimeFormat("es-PY", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "America/Asuncion",
      }).format(entry.createdAt),
      user: entry.user ? `${entry.user.firstName} ${entry.user.lastName} (${entry.user.username})` : "—",
      message: entry.message,
    });
    row.font = { name: "Arial" };
    row.alignment = { wrapText: true, vertical: "top" };
  }

  sheet.views = [{ state: "frozen", ySplit: 1 }];

  const buffer = await workbook.xlsx.writeBuffer();
  const today = new Date().toISOString().slice(0, 10);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="auditoria-liga-aefpy-${today}.xlsx"`,
    },
  });
}
