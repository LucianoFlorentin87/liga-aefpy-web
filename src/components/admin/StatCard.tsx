export function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="card p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-gray-500)]">{label}</p>
      <p className="mt-1 text-2xl font-extrabold text-[var(--color-navy-900)]">{value}</p>
    </div>
  );
}
