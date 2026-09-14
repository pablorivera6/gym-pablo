/** Iconos de la barra inferior. Trazo fino, coherente entre sí. */
const base = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round' } as const

export function Icon({ name, className = '' }: { name: 'hoy' | 'progreso' | 'historial' | 'ajustes'; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...base}>
      {name === 'hoy' && (
        <>
          <rect x="2.6" y="8.4" width="3.4" height="7.2" rx="1.3" />
          <rect x="18" y="8.4" width="3.4" height="7.2" rx="1.3" />
          <path d="M6 12h12" />
          <path d="M8.6 6.8v10.4M15.4 6.8v10.4" />
        </>
      )}
      {name === 'progreso' && (
        <>
          <path d="M3.5 19.5h17" />
          <path d="M5.5 15.5l4-4.5 3.5 3 5.5-7" />
          <path d="M14.5 7h4v4" />
        </>
      )}
      {name === 'historial' && (
        <>
          <rect x="4.5" y="3.5" width="15" height="17" rx="2.5" />
          <path d="M8.5 8.5h7M8.5 12h7M8.5 15.5h4" />
        </>
      )}
      {name === 'ajustes' && (
        <>
          <path d="M4 7h10M18.5 7H20M4 12h3M11 12h9M4 17h8M16.5 17H20" />
          <circle cx="16" cy="7" r="2.1" />
          <circle cx="9" cy="12" r="2.1" />
          <circle cx="14" cy="17" r="2.1" />
        </>
      )}
    </svg>
  )
}
