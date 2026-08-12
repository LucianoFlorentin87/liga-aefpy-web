import ExcelJS from "exceljs";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { formatDateShort } from "@/lib/format";
import { generatePassword, slugify, suggestUsername } from "@/lib/delegate-suggestions";

export const dynamic = "force-dynamic";

/**
 * Exporta un Excel con los equipos y los datos de su delegado. Para los
 * equipos que YA tienen una cuenta DELEGADO, muestra su usuario real
 * (nunca la contraseña: se guarda hasheada, no se puede recuperar). Para
 * los que todavía no tienen cuenta, sugiere un usuario y una contraseña
 * temporal — no crea nada en la base, es sólo una propuesta para que se
 * cargue manualmente en /admin/usuarios (o corriendo `npm run
 * create:delegates`, que crea exactamente esas cuentas sugeridas).
 */
export async function GET() {
  await requirePermission("usuarios");

  const [teams, existingUsers] = await Promise.all([
    prisma.team.findMany({
      orderBy: { name: "asc" },
      include: {
        delegateUsers: {
          select: { username: true, email: true, status: true, lastLoginAt: true },
        },
      },
    }),
    prisma.user.findMany({ select: { username: true } }),
  ]);

  const takenUsernames = new Set(existingUsers.map((u) => u.username));

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
    { header: "Usuario", key: "username", width: 22 },
    { header: "Contraseña sugerida", key: "password", width: 20 },
    { header: "Correo de la cuenta", key: "email", width: 28 },
    { header: "Estado de la cuenta", key: "accountStatus", width: 22 },
    { header: "Último ingreso", key: "lastLoginAt", width: 16 },
  ];

  const headerRow = sheet.getRow(1);
  headerRow.font = { name: "Arial", bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1B2A4A" } };
  headerRow.alignment = { vertical: "middle", horizontal: "left" };
  headerRow.height = 22;

  const SUGGESTED_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF6D9" } };

  for (const team of teams) {
    const delegate = team.delegateUsers[0];
    const hasAccount = !!delegate;

    let username: string;
    let password: string;
    let email: string;
    let accountStatus: string;

    if (delegate) {
      username = delegate.username;
      password = "—"; // ya existe, no se puede recuperar
      email = delegate.email;
      accountStatus = delegate.status === "ACTIVO" ? "Activa" : "Inactiva";
    } else {
      const base = slugify(team.shortName) || slugify(team.name) || "equipo";
      username = suggestUsername(base, takenUsernames);
      password = generatePassword();
      email = `${username}@ligaaefpy.local`;
      accountStatus = "Sugerido (todavía no existe)";
    }

    const row = sheet.addRow({
      team: team.name,
      shortName: team.shortName,
      delegateName: team.delegateName || "—",
      delegatePhone: team.delegatePhone || "—",
      homeVenue: team.homeVenue || "—",
      username,
      password,
      email,
      accountStatus,
      lastLoginAt: delegate?.lastLoginAt ? formatDateShort(delegate.lastLoginAt) : hasAccount ? "Nunca" : "—",
    });
    row.font = { name: "Arial" };
    row.getCell("team").font = { name: "Arial", bold: true };

    if (!hasAccount) {
      row.eachCell((cell) => {
        cell.fill = SUGGESTED_FILL;
      });
    }
  }

  sheet.views = [{ state: "frozen", ySplit: 1 }];

  const notes = [
    "Filas resaltadas en amarillo: usuario y contraseña SUGERIDOS, todavía no existen como cuenta. Cargalos en /admin/usuarios (o corré `npm run create:delegates`, que crea exactamente estas cuentas) para que queden activos.",
    "Las contraseñas de cuentas que ya existen no se pueden exportar (se guardan encriptadas). Para cambiarlas, usá \"Restablecer clave\" en /admin/usuarios.",
  ];
  for (const note of notes) {
    const noteRow = sheet.addRow([]);
    noteRow.getCell(1).value = note;
    noteRow.getCell(1).font = { name: "Arial", italic: true, size: 9, color: { argb: "FF757575" } };
    sheet.mergeCells(noteRow.number, 1, noteRow.number, 10);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const today = new Date().toISOString().slice(0, 10);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="equipos-delegados-liga-aefpy-${today}.xlsx"`,
    },
  });
}
