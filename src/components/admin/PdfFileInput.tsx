"use client";

import { useState } from "react";

const MAX_PDF_BYTES = 15 * 1024 * 1024;

/**
 * Input de archivo para el PDF del reglamento, con validación en el navegador
 * (tipo y tamaño) ANTES de mandarlo al servidor — mismo motivo que
 * LogoFileInput: si el archivo supera el límite del server action, Next.js
 * lo rechaza sin pasar por nuestro try/catch y el usuario ve una pantalla de
 * error genérica en vez de un mensaje claro.
 */
export function PdfFileInput({ label = "Subir / reemplazar PDF (máx. 15MB)" }: { label?: string }) {
  const [error, setError] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setError(null);
      return;
    }
    if (file.type !== "application/pdf") {
      setError("Formato no soportado — el archivo debe ser un PDF.");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_PDF_BYTES) {
      setError(`El archivo pesa ${(file.size / 1024 / 1024).toFixed(1)}MB, el máximo es 15MB.`);
      e.target.value = "";
      return;
    }
    setError(null);
  }

  return (
    <div>
      <label className="field-label">{label}</label>
      <input name="rulesPdf" type="file" accept="application/pdf" onChange={handleChange} className="input" />
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
