import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ROLES: { key: "SUPERADMIN" | "ADMINISTRADOR" | "CARGA_DATOS"; name: string; description: string }[] = [
  {
    key: "SUPERADMIN",
    name: "Superadmin",
    description: "Acceso total: usuarios, torneo, estadísticas y configuración del sistema.",
  },
  {
    key: "ADMINISTRADOR",
    name: "Administrador",
    description:
      "Gestiona equipos, jugadores, partidos, resultados, goles, tarjetas, sanciones y reglamento. No gestiona usuarios.",
  },
  {
    key: "CARGA_DATOS",
    name: "Carga de datos",
    description: "Sólo puede cargar resultados, goles y tarjetas de partidos existentes.",
  },
];

async function main() {
  for (const role of ROLES) {
    await prisma.role.upsert({
      where: { key: role.key },
      update: { name: role.name, description: role.description },
      create: role,
    });
  }

  await prisma.tournamentSettings.upsert({
    where: { id: "settings" },
    update: {},
    create: {
      id: "settings",
      tournamentName: "Torneo Exa Frutos",
      standingsCriteria: "PTS,DG,GF",
      rulesContent: "",
    },
  });

  console.log("Roles y configuración inicial del torneo listos.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
