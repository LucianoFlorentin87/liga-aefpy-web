export function SliderArrowButton({
  dir,
  onClick,
  visible,
  label,
}: {
  dir: 1 | -1;
  onClick: () => void;
  visible: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      disabled={!visible}
      className={`hidden h-9 w-9 shrink-0 items-center justify-center self-center rounded-full bg-[var(--color-red-600)] text-white shadow-md transition-opacity hover:bg-[var(--color-red-700)] sm:flex ${
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d={dir === 1 ? "M9 6l6 6-6 6" : "M15 6l-6 6 6 6"} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
