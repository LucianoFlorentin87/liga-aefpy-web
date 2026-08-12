-- Video grande destacado arriba de todo en el inicio (a lo sumo uno a la vez).
ALTER TABLE "videos" ADD COLUMN "isPrimary" BOOLEAN NOT NULL DEFAULT false;
