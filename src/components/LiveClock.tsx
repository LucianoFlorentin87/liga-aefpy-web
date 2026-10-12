"use client";

import { useEffect, useState } from "react";

const formatter = new Intl.DateTimeFormat("es-PY", {
  timeZone: "America/Asuncion",
  hour: "2-digit",
  minute: "2-digit",
});

/**
 * Hora local de Asunción (no la del navegador del visitante) — a propósito,
 * igual que la ubicación fija en InfoBar: es la hora de la organización.
 * Arranca en null y recién muestra algo tras montar en el cliente, para no
 * desincronizar el HTML del servidor con el del cliente (hydration
 * mismatch) si ambos corren en instantes distintos.
 */
export function LiveClock() {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    setTime(formatter.format(new Date()));
    const id = setInterval(() => setTime(formatter.format(new Date())), 15_000);
    return () => clearInterval(id);
  }, []);

  return <span suppressHydrationWarning>{time ?? "--:--"}</span>;
}
