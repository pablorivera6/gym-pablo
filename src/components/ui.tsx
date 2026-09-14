import type { ReactNode } from 'react'

export function Card({ children, className = '', onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`rounded-md bg-ink-850 border border-ink-800 ${onClick ? 'active:scale-[.985] transition-transform' : ''} ${className}`}
    >
      {children}
    </div>
  )
}

export function Badge({ children, tone = 'slate' }: { children: ReactNode; tone?: 'slate' | 'amber' | 'rose' | 'emerald' | 'sky' }) {
  const tones = {
    slate: 'bg-ink-800 text-ink-200 border-ink-700',
    amber: 'bg-ink-800 text-ink-200 border-ink-600',
    rose: 'bg-blood-500/15 text-blood-300 border-blood-500/30',
    emerald: 'bg-ink-800 text-ink-200 border-ink-600',
    sky: 'bg-bone/10 text-bone border-bone/20',
  }
  return (
    <span className={`inline-flex items-center gap-1 rounded-sm border px-2 py-[3px] label text-[8px] ${tones[tone]}`}>
      {children}
    </span>
  )
}

export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: string }) {
  return (
    <div className="flex-1 rounded bg-ink-850 border border-ink-800 px-3 py-3">
      <div className="label text-[9px] text-ink-400">{label}</div>
      <div className="numeral mt-1.5 text-2xl leading-none">{value}</div>
      {sub && <div className="mt-1 text-[11px] text-ink-400">{sub}</div>}
    </div>
  )
}

export function Empty({ icon, title, sub }: { icon: string; title: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-8">
      <div className="display text-5xl text-ink-700 mb-3 leading-none">{icon}</div>
      <div className="display text-lg text-ink-200">{title}</div>
      {sub && <div className="text-sm text-ink-400 mt-1 leading-relaxed">{sub}</div>}
    </div>
  )
}

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-h-[85vh] overflow-y-auto rounded-t-md bg-ink-900 border-t border-ink-700 animate-slide-up"
           style={{ paddingBottom: 'calc(var(--safe-b) + 1rem)' }}>
        <div className="sticky top-0 bg-ink-900/95 backdrop-blur px-5 pt-4 pb-3 flex items-center justify-between border-b border-ink-800">
          <h2 className="display text-xl">{title}</h2>
          <button onClick={onClose} className="h-9 w-9 rounded-sm bg-ink-800 text-ink-200 text-lg leading-none" aria-label="Cerrar">×</button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  )
}
