import "server-only";
import { uploadToStorage } from "@/lib/supabase-admin";

const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

async function validateImageSignature(file: File): Promise<void> {
  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const starts = (...signature: number[]) => signature.every((value, i) => bytes[i] === value);
  const png = starts(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
  const jpeg = starts(0xff, 0xd8, 0xff);
  const webp = starts(0x52, 0x49, 0x46, 0x46) &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  if (!((file.type === "image/png" && png) ||
    (file.type === "image/jpeg" && jpeg) ||
    (file.type === "image/webp" && webp))) {
    throw new Error("El contenido del archivo no coincide con un formato de imagen permitido.");
  }
}

async function validatePdfSignature(file: File): Promise<void> {
  const bytes = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  if (String.fromCharCode(...bytes) !== "%PDF-") {
    throw new Error("El archivo no tiene una cabecera PDF válida.");
  }
}

/**
 * Sube un logo de equipo a Supabase Storage (bucket "uploads", carpeta
 * "teams/") y devuelve su URL pública, o null si no se subió ningún
 * archivo válido. Persiste entre deploys y reinicios del servidor (a
 * diferencia de guardarlo en el filesystem local de Render).
 */
export async function saveTeamLogo(file: File | null, teamId: string): Promise<string | null> {
  if (!file || file.size === 0) return null;
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Formato de imagen no soportado (usá PNG, JPG o WEBP).");
  }
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error("El logo no puede superar los 2MB.");
  }

  await validateImageSignature(file);
  const ext = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
  const fileName = `teams/${teamId}-${Date.now()}.${ext}`;
  return uploadToStorage(fileName, file);
}

/**
 * Sube la imagen de portada de una noticia a Supabase Storage (bucket
 * "uploads", carpeta "news/") y devuelve su URL pública, o null si no se
 * subió ningún archivo válido. Sólo para noticias redactadas a mano — las
 * importadas desde una fuente externa (ej. Konami) guardan directo la URL
 * de la imagen original en vez de resubirla, igual que EfhubCard.cardImageUrl.
 */
export async function saveNewsImage(file: File | null): Promise<string | null> {
  if (!file || file.size === 0) return null;
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Formato de imagen no soportado (usá PNG, JPG o WEBP).");
  }
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error("La imagen no puede superar los 2MB.");
  }

  await validateImageSignature(file);
  const ext = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
  const fileName = `news/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
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

  await validatePdfSignature(file);
  const fileName = `reglamento/reglamento-${Date.now()}.pdf`;
  return uploadToStorage(fileName, file);
}
