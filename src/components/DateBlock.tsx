import { formatDateBlock } from "@/lib/format";

/** Fecha apilada (mes chico arriba, día grande abajo) — reemplaza el texto de fecha
 *  en línea en fixture/resultados por un bloque visual, como un sello de entrada. */
export function DateBlock({ date }: { date: Date | string }) {
  const { day, month } = formatDateBlock(date);
  return (
    <div className="flex w-14 shrink-0 flex-col items-center justify-center rounded-lg border border-[var(--color-gray-200)] bg-[var(--color-gray-50)] py-1.5 text-center">
      <span className="text-[0.58rem] font-bold uppercase tracking-wide text-[var(--color-gray-500)]">{month}</span>
      <span className="stat-figure text-2xl text-[var(--color-navy-900)]">{day}</span>
    </div>
  );
}
