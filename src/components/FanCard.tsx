import Image from "next/image";

/**
 * Carnet de hincha que se arma en vivo mientras se completa el registro —
 * puramente visual (no persiste nada, los datos reales los maneja el form
 * de siempre vía server action). El nombre se actualiza letra a letra; sin
 * nombre todavía, muestra un placeholder para que la tarjeta nunca se vea
 * vacía/rota antes de empezar a escribir.
 */
export function FanCard({ firstName, lastName }: { firstName: string; lastName: string }) {
  const name = `${firstName} ${lastName}`.trim();
  const today = new Intl.DateTimeFormat("es-PY", { day: "2-digit", month: "short", year: "numeric" }).format(new Date());

  return (
    // via-[#0f2347] (no var(--color-navy-900)): navy-900 se aclara en modo
    // oscuro (es el color de texto principal) — mismo problema y misma
    // solución que el degradé del hero del inicio.
    <div className="animate-rise relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--color-navy-800)] via-[#0f2347] to-[var(--color-navy-950)] p-5 text-white shadow-lg">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{ background: "radial-gradient(circle at 85% 0%, var(--color-red-600), transparent 55%)" }}
      />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="eyebrow !text-red-300">Carnet de hincha</p>
          <p className="mt-1 text-[0.65rem] text-white/60">Liga AEFPY · Asociación de Efootball Paraguay</p>
        </div>
        <Image src="/logo-liga-aefpy.png" alt="" width={32} height={32} className="shrink-0 rounded-lg" />
      </div>
      <p className="heading-heavy relative mt-8 min-h-9 text-xl text-white sm:text-2xl">
        {name || <span className="text-white/35">Tu nombre acá</span>}
      </p>
      <div className="relative mt-4 flex items-end justify-between border-t border-white/15 pt-3 text-[0.65rem] text-white/60">
        <span>Miembro desde {today}</span>
        <span className="font-mono tracking-wide">N° ----</span>
      </div>
    </div>
  );
}
