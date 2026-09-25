-- Jugadores elegidos a mano para la vista previa de cartas del equipo en
-- /equipos (hasta 4 por equipo, tope controlado en el server action).
ALTER TABLE "players" ADD COLUMN "featuredOnTeamCard" BOOLEAN NOT NULL DEFAULT false;
