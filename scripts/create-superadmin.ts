/**
 * Crea (o vuelve a crear) el usuario Superadmin inicial.
 *
 * Uso interactivo:
 *   npm run create:superadmin
 *
 * Uso no interactivo (CI / scripts), vía variables de entorno:
 *   SUPERADMIN_FIRST_NAME="Ana" SUPERADMIN_LAST_NAME="Pérez" \
 *   SUPERADMIN_EMAIL="ana@example.com" SUPERADMIN_USERNAME="ana.perez" \
 *   SUPERADMIN_PASSWORD="una-contraseña-de-al-menos-8-caracteres" \
 *   npm run create:superadmin -- --yes
 *
 * La contraseña nunca queda escrita en el código: se pide por consola o se
 * lee de una variable de entorno que vos definís al momento de ejecutar.
 */
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function prompt(question: string, envValue?: string): Promise<string> {
  if (envValue) return envValue;
  const rl = createInterface({ input: stdin, output: stdout });
  const answer = await rl.question(question);
  rl.close();
  return answer.trim();
}

async function main() {
  console.log("== Crear Superadmin — Liga AEFPY ==\n");

  const firstName = await prompt("Nombre: ", process.env.SUPERADMIN_FIRST_NAME);
  const lastName = await prompt("Apellido: ", process.env.SUPERADMIN_LAST_NAME);
  const email = await prompt("Correo: ", process.env.SUPERADMIN_EMAIL);
  const username = await prompt("Usuario: ", process.env.SUPERADMIN_USERNAME);
  const password = await prompt("Contraseña (mínimo 8 caracteres): ", process.env.SUPERADMIN_PASSWORD);

  if (!firstName || !lastName || !email || !username || !password) {
    console.error("\nTodos los campos son obligatorios.");
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("\nLa contraseña debe tener al menos 8 caracteres.");
    process.exit(1);
  }

  const role = await prisma.role.findUnique({ where: { key: "SUPERADMIN" } });
  if (!role) {
    console.error(
      "\nNo existe el rol SUPERADMIN todavía. Corré primero `npm run db:seed` para crear los roles base.",
    );
    process.exit(1);
  }

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });
  if (existing) {
    console.error(`\nYa existe un usuario con ese correo o usuario (${existing.username}).`);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      firstName,
      lastName,
      email,
      username,
      passwordHash,
      roleId: role.id,
      status: "ACTIVO",
      mustChangePassword: true,
    },
  });

  console.log(`\nSuperadmin "${user.username}" creado correctamente. Ya podés ingresar en /admin/login.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
