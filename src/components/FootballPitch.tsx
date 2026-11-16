/** One proportional, decorative pitch shared by the homepage and access screens. */
export function FootballPitch({ className }: { className: "arena-pitch" | "auth-pitch" }) {
  return <div aria-hidden="true" className={className}>
    <svg className="football-pitch-markings" viewBox="-3 -3 111 74" fill="none" focusable="false">
      <g stroke="currentColor" strokeWidth="0.25">
        <path d="M0 0H105V68H0Z M52.5 0V68" />
        <circle cx="52.5" cy="34" r="9.15" />
        <path d="M0 13.84H16.5V54.16H0 M105 13.84H88.5V54.16H105 M0 24.84H5.5V43.16H0 M105 24.84H99.5V43.16H105" />
        <path d="M16.5 26.69A9.15 9.15 0 0 1 16.5 41.31 M88.5 26.69A9.15 9.15 0 0 0 88.5 41.31" />
        <path d="M0 1A1 1 0 0 0 1 0 M104 0A1 1 0 0 0 105 1 M105 67A1 1 0 0 0 104 68 M1 68A1 1 0 0 0 0 67" />
      </g>
      <g fill="currentColor"><circle cx="52.5" cy="34" r="0.3" /><circle cx="11" cy="34" r="0.3" /><circle cx="94" cy="34" r="0.3" /></g>
    </svg>
  </div>;
}
