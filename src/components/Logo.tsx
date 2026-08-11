import Image from "next/image";

/**
 * Logo oficial de la Liga AEFPY (Asociación de Efootball Paraguay).
 * Se usa en header, footer, login y dashboard — mantiene proporciones
 * originales (imagen cuadrada), nunca se deforma.
 */
export function Logo({
  size = 40,
  withWordmark = true,
  showTagline = true,
  variant = "dark",
}: {
  size?: number;
  withWordmark?: boolean;
  /** Mostrar la línea "Asociación de Efootball Paraguay" debajo del wordmark. Desactivalo en layouts angostos (ej. header con mucha navegación) para evitar que el texto se corte en varias líneas. */
  showTagline?: boolean;
  /** Color del texto: "dark" para fondos claros, "light" para fondos oscuros (ej. login). */
  variant?: "dark" | "light";
}) {
  return (
    <span className="inline-flex shrink-0 items-center gap-2.5">
      <Image
        src="/logo-exa-frutos.png"
        alt="Liga AEFPY"
        width={size}
        height={size}
        className="shrink-0 rounded-lg"
        priority
      />
      {withWordmark && (
        <span className="leading-tight">
          <span
            className={`block whitespace-nowrap text-sm font-extrabold tracking-tight ${
              variant === "light" ? "text-white" : "text-[var(--color-navy-900)]"
            }`}
          >
            LIGA AEFPY
          </span>
          {showTagline && (
            <span
              className={`block whitespace-nowrap text-[0.65rem] font-medium uppercase tracking-wider ${
                variant === "light" ? "text-white/70" : "text-[var(--color-gray-500)]"
              }`}
            >
              Asociación de Efootball Paraguay
            </span>
          )}
        </span>
      )}
    </span>
  );
}
