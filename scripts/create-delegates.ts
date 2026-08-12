/**
 * Crea una cuenta de usuario DELEGADO para cada equipo activo que todavía
 * no tenga una, con una contraseña temporal generada al azar.
 *
 * Uso (desde tu computadora, con DATABASE_URL/DIRECT_URL de producción en
 * el .env, igual que con create-superadmin):
 *   npm run create:delegates
 *
 * Es seguro correrlo más de una vez: sólo crea cuentas para los equipos
 * que todavía no tienen ningún usuario DELEGADO asignado. A los equipos
 * que ya tienen uno los lista aparte, sin tocarlos.
 *
 * Las contraseñas se muestran UNA SOLA VEZ acá en la consola — no quedan
 * guardadas en ningún lado en texto plano (se guarda sólo el hash), así
 * que copialas antes de cerrar la terminal. Recomendale a cada delegado
 * cambiarla la primera vez que entre, desde "Mi cuenta" en el panel.
 */
import { randomInt } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Sin caracteres ambiguos (0/O, 1/l/I) para que se puedan transcribir a mano
// sin errores.
const PASSWORD_CHARS = "23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ";

function generatePassword(length = 10): string {
  let password = "";
  for (let i = 0; i < length; i++) {
    password += PASSWORD_CHARS[randomInt(PASSWORD_CHARS.length)];
  }
  return password;
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // saca acentos (marcas diacríticas combinadas)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 20);
}

async function uniqueUsername(base: string): Promise<string> {
  let candidate = `delegado.${base}`;
  let suffix = 2;
  while (await prisma.user.findUnique({ where: { username: candidate } })) {
    candidate = `delegado.${base}${suffix}`;
    suffix++;
  }
  return candidate;
}

async function main() {
  console.log("== Crear cuentas de Delegado por equipo — Liga AEFPY ==\n");

  const role = await prisma.role.findUnique({ where: { key: "DELEGADO" } });
  if (!role) {
    console.error(
      "No existe el rol DELEGADO todavía. Corré primero `npm run db:seed` (o desplegá la migración correspondiente) antes de este script.",
    );
    process.exit(1);
  }

  const teams = await prisma.team.findMany({
    where: { status: "ACTIVO" },
    orderBy: { name: "asc" },
    include: { delegateUsers: { select: { username: true } } },
  });

  if (teams.length === 0) {
    console.log("No hay equipos activos cargados todavía en /admin/equipos.");
    return;
  }

  const created: { team: string; username: string; password: string }[] = [];
  const skipped: { team: string; username: string }[] = [];

  for (const team of teams) {
    if (team.delegateUsers.length > 0) {
      skipped.push({ team: team.name, username: team.delegateUsers[0].username });
      continue;
    }

    const base = slugify(team.shortName) || slugify(team.name) || "equipo";
    const username = await uniqueUsername(base);
    const email = `${username}@ligaaefpy.local`;
    const password = generatePassword();
    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.user.create({
      data: {
        firstName: "Delegado",
        lastName: team.name,
        email,
        username,
        passwordHash,
        roleId: role.id,
        status: "ACTIVO",
        mustChangePassword: true,
        teamId: team.id,
      },
    });

    created.push({ team: team.name, username, password });
  }

  if (created.length > 0) {
    console.log("Cuentas nuevas creadas (guardá esto ahora, no se puede volver a mostrar):\n");
    const teamWidth = Math.max(6, ...created.map((c) => c.team.length));
    const userWidth = Math.max(7, ...created.map((c) => c.username.length));
    console.log(`${"Equipo".padEnd(teamWidth)}  ${"Usuario".padEnd(userWidth)}  Contraseña`);
    console.log(`${"-".repeat(teamWidth)}  ${"-".repeat(userWidth)}  ${"-".repeat(10)}`);
    for (const c of created) {
      console.log(`${c.team.padEnd(teamWidth)}  ${c.username.padEnd(userWidth)}  ${c.password}`);
    }
    console.log(
      "\nCada delegado entra en /admin/login con su usuario y esa contraseña, y cae directo en /admin/mi-equipo.",
    );
  }

  if (skipped.length > 0) {
    console.log("\nEquipos que ya tenían un delegado asignado (no se tocaron):");
    for (const s of skipped) {
      console.log(`  - ${s.team} → usuario existente: ${s.username}`);
    }
  }

  if (created.length === 0 && skipped.length === teams.length) {
    console.log("\nTodos los equipos activos ya tienen un delegado asignado.");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
