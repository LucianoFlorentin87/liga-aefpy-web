-- Datos de contacto, redes/streaming y gamertag del equipo/delegado.
-- Todas nullable: no rompe equipos ya cargados.
ALTER TABLE "teams" ADD COLUMN "delegateEmail" TEXT;
ALTER TABLE "teams" ADD COLUMN "instagramUrl" TEXT;
ALTER TABLE "teams" ADD COLUMN "facebookUrl" TEXT;
ALTER TABLE "teams" ADD COLUMN "youtubeUrl" TEXT;
ALTER TABLE "teams" ADD COLUMN "twitchUrl" TEXT;
ALTER TABLE "teams" ADD COLUMN "discordUrl" TEXT;
ALTER TABLE "teams" ADD COLUMN "tiktokUrl" TEXT;
ALTER TABLE "teams" ADD COLUMN "gamertag" TEXT;
