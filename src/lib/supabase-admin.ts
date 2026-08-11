import "server-only";
import { createClient } from "@supabase/supabase-js";

const STORAGE_BUCKET = "uploads";

let cachedClient: ReturnType<typeof createClient> | null = null;

/**
 * Cliente de Supabase con la clave secreta (acceso total, bypassea RLS).
 * SOLO se usa en el servidor (server actions) para subir archivos al bucket
 * de Storage — nunca se expone al cliente. Requiere SUPABASE_URL y
 * SUPABASE_SECRET_KEY en las variables de entorno.
 */
function getSupabaseAdmin() {
  if (cachedClient) return cachedClient;

  const url = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secretKey) {
    throw new Error(
      "Subida de archivos no configurada: falta SUPABASE_URL o SUPABASE_SECRET_KEY en las variables de entorno.",
    );
  }

  cachedClient = createClient(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return cachedClient;
}

/**
 * Sube un archivo al bucket público "uploads" de Supabase Storage y
 * devuelve su URL pública. `path` es la ruta dentro del bucket, ej.
 * "teams/abc123-1234.png" o "reglamento/reglamento-1234.pdf".
 */
export async function uploadToStorage(path: string, file: File): Promise<string> {
  const supabase = getSupabaseAdmin();
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, buffer, {
    contentType: file.type,
    upsert: true,
  });
  if (error) {
    throw new Error(`No se pudo subir el archivo a Supabase Storage: ${error.message}`);
  }

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
