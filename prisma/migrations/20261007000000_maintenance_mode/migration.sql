-- Modo mantenimiento del sitio público — ver TournamentSettings en schema.prisma.
ALTER TABLE "tournament_settings" ADD COLUMN "maintenanceMode" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "tournament_settings" ADD COLUMN "maintenanceMessage" TEXT NOT NULL DEFAULT 'Estamos haciendo tareas de mantenimiento. Volvemos pronto.';
