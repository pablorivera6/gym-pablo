import { useEffect, useMemo, useState } from 'react'
import type { Day, Exercise } from '../types'
import { actions, useRoutine } from '../lib/store'
import { getMeta, loadCatalog, type CatalogEntry } from '../lib/meta'
import { ExerciseImage } from '../components/ExerciseImage'
import { Sheet } from '../components/ui'

/** Editor de la rutina: series, rango de reps, orden, quitar y añadir ejercicios. */
export function RoutineEditor() {
  const routine = useRoutine()
  const [dayId, setDayId] = useState<Day['id']>(routine[0].id)
  const [adding, setAdding] = useState(false)
  const day = routine.find((d) => d.id === dayId)!

  const update = (fn: (d: Day) => Day) =>
    actions.setRoutine(routine.map((d) => (d.id === dayId ? fn(d) : d)))

  const patchEx = (id: string, patch: Partial<Exercise>) =>
    update((d) => ({ ...d, exercises: d.exercises.map((e) => (e.id === id ? { ...e, ...patch } : e)) }))

  const move = (i: number, dir: -1 | 1) =>
    update((d) => {
      const next = [...d.exercises]
      const j = i + dir
      if (j < 0 || j >= next.length) return d
      ;[next[i], next[j]] = [next[j], next[i]]
      return { ...d, exercises: next }
    })

  const remove = (id: string) =>
    update((d) => ({ ...d, exercises: d.exercises.filter((e) => e.id !== id) }))

  const add = (entry: CatalogEntry) => {
    const name = entry.name
    actions.addMeta(name, { slug: '', images: entry.images, primary: entry.primary, secondary: entry.secondary, equipment: entry.equipment, instructions: [] })
    const isolation = entry.primary.length <= 1
    update((d) => ({
      ...d,
      exercises: [...d.exercises, {
        id: `${d.id}-x${Date.now()}`,
        name,
        dbName: name,
        sets: 2,
        repMin: 8,
        repMax: 10,
        isolation,
      }],
    }))
    setAdding(false)
  }

  return (
    <div>
      {/* Selector de día */}
      <div className="flex gap-1.5 overflow-x-auto pb-3 -mx-1 px-1">
        {routine.map((d) => (
          <button key={d.id} onClick={() => setDayId(d.id)}
                  className={`shrink-0 rounded px-3 py-2 border text-left transition-all ${dayId === d.id ? '' : 'opacity-50'}`}
                  style={{ background: dayId === d.id ? `${d.hex}1f` : '#1e1e25', borderColor: dayId === d.id ? `${d.hex}66` : 'transparent' }}>
            <div className="text-xs font-bold leading-none" style={{ color: d.hex }}>{d.name}</div>
            <div className="text-[10px] text-ink-400 mt-1 leading-none">Hoja {d.sheet}</div>
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {day.exercises.map((ex, i) => (
          <div key={ex.id} className="rounded bg-ink-850 border border-ink-800 p-2.5">
            <div className="flex items-center gap-2.5">
              <ExerciseImage dbName={ex.dbName} autoplay={false} className="h-10 w-10 shrink-0 rounded-sm" />
              <div className="flex-1 min-w-0">
                <input value={ex.name} onChange={(e) => patchEx(ex.id, { name: e.target.value })}
                       className="w-full bg-transparent font-semibold text-sm outline-none focus:bg-ink-800 rounded px-1 -ml-1" />
                <div className="text-[10px] text-ink-400 px-0 mt-0.5 truncate">{getMeta(ex.dbName)?.primary.join(', ') || '—'}</div>
              </div>
              <div className="flex flex-col gap-0.5 shrink-0">
                <button onClick={() => move(i, -1)} disabled={i === 0}
                        className="h-6 w-6 rounded-md bg-ink-800 text-ink-400 text-[11px] disabled:opacity-25" aria-label="Subir">▲</button>
                <button onClick={() => move(i, 1)} disabled={i === day.exercises.length - 1}
                        className="h-6 w-6 rounded-md bg-ink-800 text-ink-400 text-[11px] disabled:opacity-25" aria-label="Bajar">▼</button>
              </div>
            </div>

            <div className="flex items-center gap-1.5 mt-2.5">
              <NumBox label="Series" value={ex.sets} min={1} max={10} onChange={(v) => patchEx(ex.id, { sets: v })} />
              <NumBox label="Rep mín" value={ex.repMin} min={1} max={50} onChange={(v) => patchEx(ex.id, { repMin: v, repMax: Math.max(v, ex.repMax) })} />
              <NumBox label="Rep máx" value={ex.repMax} min={1} max={50} onChange={(v) => patchEx(ex.id, { repMax: Math.max(v, ex.repMin) })} />
              <button onClick={() => { if (confirm(`¿Quitar "${ex.name}" de ${day.name}?`)) remove(ex.id) }}
                      className="h-[42px] w-9 rounded-sm bg-ink-800 text-rose-400 text-sm shrink-0" aria-label="Quitar">✕</button>
            </div>

            <div className="flex flex-wrap gap-1.5 mt-2">
              <Chip on={!!ex.tempo} onClick={() => patchEx(ex.id, { tempo: !ex.tempo })}>Tempo</Chip>
              <Chip on={!!ex.toFailure} onClick={() => patchEx(ex.id, { toFailure: !ex.toFailure })}>Al fallo</Chip>
              <Chip on={!!ex.perSide} onClick={() => patchEx(ex.id, { perSide: !ex.perSide })}>Cada lado</Chip>
              <Chip on={!!ex.isolation} onClick={() => patchEx(ex.id, { isolation: !ex.isolation })}>Aislamiento</Chip>
            </div>
          </div>
        ))}
      </div>

      <button onClick={() => setAdding(true)}
              className="w-full mt-3 h-12 rounded border border-dashed border-ink-700 text-sm font-semibold text-ink-400">
        + Añadir ejercicio a {day.name}
      </button>

      <p className="text-[11px] text-ink-400 mt-4 leading-relaxed">
        Los cambios se guardan solos. El historial de un ejercicio se conserva aunque cambies series o reps;
        solo se pierde el vínculo si lo quitas y vuelves a añadirlo.
      </p>

      <Sheet open={adding} onClose={() => setAdding(false)} title="Añadir ejercicio">
        <Picker onPick={add} />
      </Sheet>
    </div>
  )
}

function Picker({ onPick }: { onPick: (e: CatalogEntry) => void }) {
  const [q, setQ] = useState('')
  const [catalog, setCatalog] = useState<CatalogEntry[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadCatalog().then(setCatalog).catch((e: Error) => setError(e.message))
  }, [])

  const results = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!catalog || t.length < 2) return []
    return catalog.filter((e) => e.name.toLowerCase().includes(t)).slice(0, 40)
  }, [q, catalog])

  return (
    <div>
      <input autoFocus value={q} onChange={(e) => setQ(e.target.value)}
             placeholder="Buscar en 876 ejercicios (en inglés)…"
             className="w-full h-12 rounded bg-ink-850 border border-ink-800 px-4 outline-none focus:ring-2 focus:ring-white/20 placeholder:text-ink-600" />
      <p className="text-[11px] text-ink-400 mt-2 mb-3">
        Escribe en inglés: <i>curl, squat, press, row, raise, extension…</i> Después puedes renombrarlo en español.
      </p>
      {error && <p className="text-sm text-rose-400 py-4">{error} — necesitas internet la primera vez que buscas.</p>}
      {!catalog && !error && <p className="text-sm text-ink-400 py-4">Cargando catálogo…</p>}
      <div className="space-y-1.5">
        {results.map((e) => (
          <button key={e.name} onClick={() => onPick(e)}
                  className="w-full flex items-center gap-3 rounded bg-ink-850 border border-ink-800 p-2.5 text-left">
            <img src={e.images[0]} alt="" loading="lazy" className="h-11 w-11 shrink-0 rounded-sm object-cover bg-white" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">{e.name}</div>
              <div className="text-[11px] text-ink-400 truncate">{e.equipment} · {e.primary.join(', ')}</div>
            </div>
            <span className="text-ink-600 text-lg shrink-0">+</span>
          </button>
        ))}
        {catalog && q.trim().length >= 2 && results.length === 0 && (
          <p className="text-sm text-ink-400 text-center py-6">Nada encontrado. Prueba con otra palabra en inglés.</p>
        )}
      </div>
    </div>
  )
}

function NumBox({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <label className="flex-1 rounded-sm bg-ink-900 px-2 py-1">
      <span className="block text-[9px] uppercase tracking-wider text-ink-400 font-bold">{label}</span>
      <input type="number" inputMode="numeric" value={value} min={min} max={max}
             onChange={(e) => { const v = Number(e.target.value); if (v >= min && v <= max) onChange(v) }}
             className="w-full bg-transparent font-bold tabular-nums outline-none text-sm" />
    </label>
  )
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
            className={`rounded-sm px-2.5 py-1 text-[11px] font-semibold border transition-colors ${
              on ? 'bg-white text-ink-950 border-white' : 'bg-ink-900 text-ink-400 border-ink-700'
            }`}>
      {children}
    </button>
  )
}
