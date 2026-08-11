import Image from "next/image";

export function TeamCrest({
  name,
  shortName,
  logoUrl,
  size = 24,
}: {
  name: string;
  shortName: string;
  logoUrl?: string | null;
  size?: number;
}) {
  if (logoUrl) {
    return (
      <Image
        src={logoUrl}
        alt={name}
        width={size}
        height={size}
        className="shrink-0 rounded-full border border-[var(--color-gray-200)] bg-white object-contain"
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
