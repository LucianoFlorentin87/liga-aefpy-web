import ExcelJS from "exceljs";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { formatDateShort } from "@/lib/format";

export const dynamic = "force-dynamic";

/**
 * Exporta un Excel con los equipos y los datos de su delegado (usuario y
 * correo de la cuenta del panel, si tiene una asignada). Las contraseñas
 * NUNCA se incluyen: se guardan hasheadas y no se pueden recuperar — para
 * asignar o cambiar una hay que usar "Restablecer clave" en /admin/usuarios.
 */
export async function GET() {
  await requirePermission("usuarios");

  const teams = await prisma.team.findMany({
    orderBy: { name: "asc" },
    include: {
      delegateUsers: {
        select: { username: true, email: true, status: true, lastLoginAt: true },
      },
    },
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Liga AEFPY";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Equipos y delegados");

  sheet.columns = [
    { header: "Equipo", key: "team", width: 26 },
    { header: "Abreviatura", key: "shortName", width: 12 },
    { header: "Delegado (contacto)", key: "delegateName", width: 22 },
    { header: "Teléfono", key: "delegatePhone", width: 16 },
    { header: "Cancha", key: "homeVenue", width: 22 },
    { header: "Usuario del panel", key: "username", width: 20 },
    { header: "Correo de la cuenta", key: "email", width: 26 },
    { header: "Estado de la cuenta", key: "accountStatus", width: 18 },
    { header: "Último ingreso", key: "lastLoginAt", width: 16 },
  ];

  const headerRow = sheet.getRow(1);
  headerRow.font = { name: "Arial", bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1B2A4A" } };
  headerRow.alignment = { vertical: "middle", horizontal: "left" };
  headerRow.height = 22;

  for (const team of teams) {
    const delegate = team.delegateUsers[0];
    const row = sheet.addRow({
      team: team.name,
      shortName: team.shortName,
      delegateName: team.delegateName || "—",
      delegatePhone: team.delegatePhone || "—",
      homeVenue: team.homeVenue || "—",
      username: delegate?.username ?? "Sin cuenta asignada",
      email: delegate?.email ?? "—",
      accountStatus: delegate ? (delegate.status === "ACTIVO" ? "Activa" : "Inactiva") : "—",
      lastLoginAt: delegate?.lastLoginAt ? formatDateShort(delegate.lastLoginAt) : delegate ? "Nunca" : "—",
    });
    row.font = { name: "Arial" };
    row.getCell("team").font = { name: "Arial", bold: true };
  }

  sheet.views = [{ state: "frozen", ySplit: 1 }];

  const noteRow = sheet.addRow([]);
  noteRow.getCell(1).value =
    "Las contraseñas no se pueden exportar (se guardan encriptadas). Para asignar o restablecer una, usá \"Restablecer clave\" en /admin/usuarios.";
  noteRow.getCell(1).font = { name: "Arial", italic: true, size: 9, color: { argb: "FF757575" } };
  sheet.mergeCells(noteRow.number, 1, noteRow.number, 9);

  const buffer = await workbook.xlsx.writeBuffer();
  const today = new Date().toISOString().slice(0, 10);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="equipos-delegados-liga-aefpy-${today}.xlsx"`,
    },
  });
}
