import Image from "next/image";

/**
 * Logo oficial de la liga. Se usa en header, footer, login y dashboard —
 * mantiene proporciones originales (imagen cuadrada), nunca se deforma.
 * name/tagline son editables desde /admin/configuracion; cada caller los
 * pasa desde TournamentSettings (no hay default hardcodeado más allá del
 * de la base de datos, para que todos los lugares queden consistentes).
 */
export function Logo({
  size = 40,
  withWordmark = true,
  showTagline = true,
  variant = "dark",
  name = "Liga AEFPY",
  tagline = "Asociación de Efootball Paraguay",
}: {
  size?: number;
  withWordmark?: boolean;
  /** Mostrar la línea de tagline debajo del wordmark. Desactivalo en layouts angostos (ej. header con mucha navegación) para evitar que el texto se corte en varias líneas. */
  showTagline?: boolean;
  /** Color del texto: "dark" para fondos claros, "light" para fondos oscuros (ej. login). */
  variant?: "dark" | "light";
  /** Nombre de la organización (wordmark). Viene de TournamentSettings.orgName. */
  name?: string;
  /** Bajada debajo del wordmark. Viene de TournamentSettings.orgTagline. */
  tagline?: string;
}) {
  return (
    <span className="inline-flex shrink-0 items-center gap-2.5">
      <Image
        src="/logo-exa-frutos.png"
        alt={name}
        width={size}
        height={size}
        className="shrink-0 rounded-lg"
        priority
      />
      {withWordmark && (
        <span className="leading-tight">
          <span
            className={`block whitespace-nowrap text-sm font-extrabold uppercase tracking-tight ${
              variant === "light" ? "text-white" : "text-[var(--color-navy-900)]"
            }`}
          >
            {name}
          </span>
          {showTagline && (
            <span
              className={`block whitespace-nowrap text-[0.65rem] font-medium uppercase tracking-wider ${
                variant === "light" ? "text-white/70" : "text-[var(--color-gray-500)]"
              }`}
            >
              {tagline}
            </span>
          )}
        </span>
      )}
    </span>
  );
}
