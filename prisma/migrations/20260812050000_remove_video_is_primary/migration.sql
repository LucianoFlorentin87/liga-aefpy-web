-- Simplificación: un solo marcador ("featured"). El video grande de arriba
-- ahora se deriva automáticamente (el destacado más reciente), sin un
-- segundo casillero separado que resultaba confuso.
ALTER TABLE "videos" DROP COLUMN "isPrimary";
