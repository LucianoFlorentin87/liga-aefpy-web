import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/svg+xml"]);
const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

/**
 * Guarda un logo subido en /public/uploads/teams. Devuelve la URL pública
 * relativa o null si no se subió ningún archivo válido.
 *
 * Nota: esto escribe en el filesystem local, por lo que sólo persiste en
 * hosting tradicional (Node/VM) o en desarrollo. En una función serverless
 * (Vercel/Netlify) el filesystem es efímero — ver README > "Subida de
 * archivos en producción" para la alternativa (un bucket de almacenamiento).
 */
export async function saveTeamLogo(file: File | null, teamId: string): Promise<string | null> {
  if (!file || file.size === 0) return null;
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Formato de imagen no soportado (usá PNG, JPG, WEBP o SVG).");
  }
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error("El logo no puede superar los 2MB.");
  }

  const uploadsDir = path.join(process.cwd(), "public", "uploads", "teams");
  await mkdir(uploadsDir, { recursive: true });

  const ext = file.type === "image/svg+xml" ? "svg" : file.type.split("/")[1];
  const fileName = `${teamId}-${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadsDir, fileName), buffer);

  return `/uploads/teams/${fileName}`;
}
