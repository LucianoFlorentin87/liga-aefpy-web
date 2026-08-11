import "server-only";
import { uploadToStorage } from "@/lib/supabase-admin";

const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/svg+xml"]);
const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

/**
 * Sube un logo de equipo a Supabase Storage (bucket "uploads", carpeta
 * "teams/") y devuelve su URL pública, o null si no se subió ningún
 * archivo válido. Persiste entre deploys y reinicios del servidor (a
 * diferencia de guardarlo en el filesystem local de Render).
 */
export async function saveTeamLogo(file: File | null, teamId: string): Promise<string | null> {
  if (!file || file.size === 0) return null;
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Formato de imagen no soportado (usá PNG, JPG, WEBP o SVG).");
  }
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error("El logo no puede superar los 2MB.");
  }

  const ext = file.type === "image/svg+xml" ? "svg" : file.type.split("/")[1];
  const fileName = `teams/${teamId}-${Date.now()}.${ext}`;
  return uploadToStorage(fileName, file);
}

const MAX_PDF_SIZE_BYTES = 15 * 1024 * 1024; // 15MB

/**
 * Sube el PDF del reglamento a Supabase Storage (bucket "uploads", carpeta
 * "reglamento/") y devuelve su URL pública, o null si no se subió ningún
 * archivo válido.
 */
export async function saveRulesPdf(file: File | null): Promise<string | null> {
  if (!file || file.size === 0) return null;
  if (file.type !== "application/pdf") {
    throw new Error("El archivo debe ser un PDF.");
  }
  if (file.size > MAX_PDF_SIZE_BYTES) {
    throw new Error("El PDF no puede superar los 15MB.");
  }

  const fileName = `reglamento/reglamento-${Date.now()}.pdf`;
  return uploadToStorage(fileName, file);
}
