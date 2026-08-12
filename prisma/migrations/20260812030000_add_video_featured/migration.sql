-- Marcador manual para elegir qué videos aparecen en el inicio.
ALTER TABLE "videos" ADD COLUMN "featured" BOOLEAN NOT NULL DEFAULT false;
