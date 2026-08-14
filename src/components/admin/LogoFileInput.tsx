"use client";

import { useState } from "react";

const ALLOWED_LOGO_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/svg+xml"]);
const MAX_LOGO_BYTES = 2 * 1024 * 1024;

/**
 * Input de archivo para el logo del equipo, con validación en el navegador
 * (tipo y tamaño) ANTES de mandarlo al servidor. Si un archivo pasa el
 * límite del server action, Next.js lo rechaza sin pasar por nuestro
 * try/catch y el usuario ve una pantalla de error genérica en vez de un
 * mensaje claro — validando acá nunca se llega a esa situación.
 */
export function LogoFileInput({ label = "Logo (opcional, PNG/JPG/WEBP/SVG, máx. 2MB)" }: { label?: string }) {
  const [error, setError] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setError(null);
      return;
    }
    if (!ALLOWED_LOGO_TYPES.has(file.type)) {
      setError("Formato no soportado — usá PNG, JPG, WEBP o SVG.");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setError(`El archivo pesa ${(file.size / 1024 / 1024).toFixed(1)}MB, el máximo es 2MB.`);
      e.target.value = "";
      return;
    }
    setError(null);
  }

  return (
    <div>
      <label className="field-label">{label}</label>
      <input
        name="logo"
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        onChange={handleChange}
        className="input"
      />
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
