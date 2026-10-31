// Íconos de trazo fino, sin emojis. Heredan el color del texto.
const paths: Record<string, React.ReactNode> = {
  chart: <path d="M3 18l6-7 4 4 8-10" />,
  dollar: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M15 9.5c-.6-1-1.7-1.5-3-1.5-1.7 0-3 .9-3 2.2 0 3 6 1.6 6 4.6 0 1.3-1.3 2.2-3 2.2-1.4 0-2.6-.6-3.1-1.6M12 6v2M12 16v2" />
    </>
  ),
  swap: <path d="M4 8h13l-3-3M20 16H7l3 3" />,
  gauge: (
    <>
      <path d="M4 16a8 8 0 1 1 16 0" />
      <path d="M12 16l4-5" />
    </>
  ),
  news: (
    <>
      <path d="M5 4h11l3 3v13H5z" />
      <path d="M8 9h8M8 13h8M8 17h5" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>
  ),
  alert: (
    <>
      <path d="M12 4l9 16H3z" />
      <path d="M12 10v4M12 17v.01" />
    </>
  ),
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
};

export function Icon({ name, size = 18, className = "" }: { name: string; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
      {paths[name] ?? paths.arrow}
    </svg>
  );
}
