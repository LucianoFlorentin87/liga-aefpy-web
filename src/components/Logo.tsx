/**
 * Marca provisoria de la Asociación Exa Frutos.
 *
 * No se recibió el archivo de logo oficial de la asociación, así que este
 * componente dibuja un monograma simple ("EF" + balón) como placeholder,
 * en vez de inventar o reutilizar cualquier otro escudo. Es el ÚNICO lugar
 * del proyecto donde hay que reemplazar el gráfico: apenas se tenga el
 * archivo real (SVG o PNG con fondo transparente), cambiar el <svg> de acá
 * por un <Image src="/logo-exa-frutos.png" .../> — todo el resto del sitio
 * (header, footer, login, dashboard) consume este mismo componente.
 */
export function Logo({ size = 40, withWordmark = true }: { size?: number; withWordmark?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        aria-hidden="true"
        className="shrink-0"
      >
        <circle cx="24" cy="24" r="23" fill="var(--color-navy-900)" stroke="var(--color-red-600)" strokeWidth="2" />
        <path
          d="M24 10l6.5 4.7-2.5 7.6h-8l-2.5-7.6z"
          fill="#fff"
          opacity="0.9"
        />
        <text
          x="24"
          y="34"
          textAnchor="middle"
          fontSize="13"
          fontWeight="700"
          fill="#fff"
          fontFamily="Arial, sans-serif"
        >
          EF
        </text>
      </svg>
      {withWordmark && (
        <span className="leading-tight">
          <span className="block text-sm font-extrabold tracking-tight text-[var(--color-navy-900)]">
            EXA FRUTOS
          </span>
          <span className="block text-[0.65rem] font-medium uppercase tracking-wider text-[var(--color-gray-500)]">
            Asociación de Exalumnos
          </span>
        </span>
      )}
    </span>
  );
}
