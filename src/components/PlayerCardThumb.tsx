import Image from "next/image";

// Proporción ancho/alto aproximada de una carta real de eFootball (más
// alta que ancha, como en eFHUB). Con object-contain nunca se recorta la
// carta aunque el archivo original no calce exacto con esta proporción.
const CARD_ASPECT_RATIO = 3 / 4;

export function PlayerCardThumb({
  name,
  cardImageUrl,
  size = 40,
}: {
  name: string;
  cardImageUrl?: string | null;
  size?: number;
}) {
  const width = size;
  const height = Math.round(size / CARD_ASPECT_RATIO);

  if (cardImageUrl) {
    return (
      <span
        className="relative shrink-0 overflow-hidden rounded-md bg-[var(--color-gray-100)]"
        style={{ width, height }}
      >
        {/* unoptimized: la imagen la sirve directo el CDN de eFHUB (dominio
            externo, fuera de nuestro control) — igual que TeamCrest con los
            logos subidos por delegados, no hay nada que ganar optimizándola
            y evita que el decoder de Next rompa la página si el formato es
            raro. */}
        <Image src={cardImageUrl} alt={name} fill unoptimized sizes={`${width}px`} className="object-contain" />
      </span>
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
      style={{ width, height, fontSize: width * 0.36 }}
    >
      <span className="font-extrabold leading-none">{initials || "?"}</span>
    </span>
  );
}
