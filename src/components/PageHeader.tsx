export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="border-b border-[var(--color-gray-200)] bg-[var(--color-surface)]">
      <div className="container-page py-6">
        <h1 className="heading-heavy text-2xl text-[var(--color-navy-900)] sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-[var(--color-gray-500)]">{subtitle}</p>}
      </div>
    </div>
  );
}
