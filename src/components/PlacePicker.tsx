import type { Place } from '../types'
import { Sheet } from './ui'

/** "¿Dónde entrenas hoy?" — las máquinas cambian, así que los pesos se llevan aparte. */
export function PlacePicker({ open, onClose, onPick, last, title = '¿Dónde entrenas hoy?' }: {
  open: boolean
  onClose: () => void
  onPick: (p: Place) => void
  last?: Place
  title?: string
}) {
  const options: { id: Place; name: string; sub: string }[] = [
    { id: 'gym', name: 'Gym', sub: 'Máquinas y pesos del gimnasio' },
    { id: 'casa', name: 'Casa', sub: 'Tu equipo de casa' },
  ]
  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <p className="text-xs text-ink-400 mb-4 leading-relaxed">
        Cada lugar lleva sus propios pesos, récords y sugerencias de subida.
      </p>
      <div className="grid grid-cols-2 gap-2">
        {options.map((o) => (
          <button key={o.id} onClick={() => onPick(o.id)}
                  className={`flex flex-col justify-start rounded-sm border p-4 text-left active:scale-[.98] transition-all ${
                    last === o.id ? 'border-blood-500 bg-blood-500/10' : 'border-ink-700 bg-ink-850'
                  }`}>
            <div className="display text-4xl leading-none">{o.name}</div>
            <div className="text-[11px] text-ink-400 mt-2 leading-snug">{o.sub}</div>
            {last === o.id && <div className="label text-[8px] text-blood-300 mt-2">La última vez</div>}
          </button>
        ))}
      </div>
    </Sheet>
  )
}
