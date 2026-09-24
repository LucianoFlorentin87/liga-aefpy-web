import Image from "next/image";

export function PlayerCardThumb({
  name,
  cardImageUrl,
  size = 28,
}: {
  name: string;
  cardImageUrl?: string | null;
  size?: number;
}) {
  if (cardImageUrl) {
    return (
      // unoptimized: la imagen la sirve directo el CDN de eFHUB (dominio
      // externo, fuera de nuestro control) — igual que TeamCrest con los
      // logos subidos por delegados, no hay nada que ganar optimizándola
      // a este tamaño y evita que el decoder de Next rompa la página si
      // el formato es raro.
      <Image
        src={cardImageUrl}
        alt={name}
        width={size}
        height={size}
        unoptimized
        className="shrink-0 rounded-md object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-md bg-[var(--color-gray-100)] text-[var(--color-gray-500)]"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      <span className="font-extrabold leading-none">{initials || "?"}</span>
    </span>
  );
}
