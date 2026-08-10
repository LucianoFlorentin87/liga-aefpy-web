import Image from "next/image";

/**
 * Logo oficial de la Asociación Exa Frutos (Liga AEFPY).
 * Se usa en header, footer, login y dashboard — mantiene proporciones
 * originales (imagen cuadrada), nunca se deforma.
 */
export function Logo({
  size = 40,
  withWordmark = true,
  variant = "dark",
}: {
  size?: number;
  withWordmark?: boolean;
  /** Color del texto: "dark" para fondos claros, "light" para fondos oscuros (ej. login). */
  variant?: "dark" | "light";
}) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <Image
        src="/logo-exa-frutos.png"
        alt="Asociación Exa Frutos"
        width={size}
        height={size}
        className="shrink-0 rounded-lg"
        priority
      />
      {withWordmark && (
        <span className="leading-tight">
          <span
            className={`block text-sm font-extrabold tracking-tight ${
              variant === "light" ? "text-white" : "text-[var(--color-navy-900)]"
            }`}
          >
            EXA FRUTOS
          </span>
          <span
            className={`block text-[0.65rem] font-medium uppercase tracking-wider ${
              variant === "light" ? "text-white/70" : "text-[var(--color-gray-500)]"
            }`}
          >
            Asociación de Exalumnos
          </span>
        </span>
      )}
    </span>
  );
}
