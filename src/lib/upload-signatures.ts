/** Checks the initial magic bytes; not a substitute for full decoding or malware scanning. */
export async function validateImageSignature(file: File): Promise<void> {
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

export async function validatePdfSignature(file: File): Promise<void> {
  const bytes = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  if (String.fromCharCode(...bytes) !== "%PDF-") {
    throw new Error("El archivo no tiene una cabecera PDF válida.");
  }
}
