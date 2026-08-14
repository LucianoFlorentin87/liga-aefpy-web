-- El apellido del jugador pasa a ser opcional: muchos gamertags/jugadores
-- de eFootball se cargan sólo con nombre (apodo).
ALTER TABLE "players" ALTER COLUMN "lastName" DROP NOT NULL;
