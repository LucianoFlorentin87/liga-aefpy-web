import Image from "next/image";

export function TeamCrest({
  name,
  shortName,
  logoUrl,
  size = 24,
  variant = "clean",
}: {
  name: string;
  shortName: string;
  logoUrl?: string | null;
  size?: number;
  /** "clean" (default): el escudo solo, sin círculo ni borde.
   *  "circle": fondo blanco + borde circular — usar sólo sobre fondos oscuros,
   *  donde un escudo con fondo transparente puede perderse (ej. NextMatchCard). */
  variant?: "circle" | "clean";
}) {
  if (logoUrl) {
    return (
      <Image
        src={logoUrl}
        alt={name}
        width={size}
        height={size}
        className={`shrink-0 object-contain ${variant === "circle" ? "rounded-full border border-[var(--color-gray-200)] bg-white" : ""}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-[var(--color-navy-100)] text-[var(--color-navy-900)]"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      <span className="font-extrabold leading-none">{shortName.slice(0, 3).toUpperCase()}</span>
    </span>
  );
}
