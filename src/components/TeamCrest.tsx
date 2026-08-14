import Image from "next/image";

export function TeamCrest({
  name,
  shortName,
  logoUrl,
  size = 24,
  variant = "clean",
  shadow = false,
}: {
  name: string;
  shortName: string;
  logoUrl?: string | null;
  size?: number;
  /** "clean" (default): el escudo solo, sin círculo ni borde.
   *  "circle": fondo blanco + borde circular — usar sólo sobre fondos oscuros,
   *  donde un escudo con fondo transparente puede perderse (ej. NextMatchCard). */
  variant?: "circle" | "clean";
  /** Sombra proyectada (sigue el contorno del escudo, no un cuadrado) para
   *  que un escudo "clean" con fondo transparente no se pierda contra un
   *  fondo blanco liso (ej. TeamLogosBar). No hace falta cuando ya hay
   *  contraste de por sí (tarjetas con borde, fondos oscuros, variant="circle"). */
  shadow?: boolean;
}) {
  if (logoUrl) {
    return (
      // unoptimized: los logos los suben delegados con archivos de origen muy
      // variado (bajados de wikis, editores distintos, metadata rara). El
      // optimizador de imágenes de Next en self-hosted (sin `sharp` instalado)
      // usa un decoder de respaldo que puede tirar una excepción sin capturar
      // con ciertos PNG — eso rompía la página entera después de subir un
      // logo válido. A este tamaño (chico, ya servido desde Supabase) no hay
      // nada que optimizar igual, así que se sirve el archivo tal cual.
      <Image
        src={logoUrl}
        alt={name}
        width={size}
        height={size}
        unoptimized
        className={`shrink-0 object-contain ${variant === "circle" ? "rounded-full border border-[var(--color-gray-200)] bg-white" : ""} ${shadow ? "drop-shadow-[0_1px_3px_rgba(15,23,42,0.35)]" : ""}`}
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
