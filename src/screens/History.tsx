import { useState } from 'react'
import type { LoggedSet, Session } from '../types'
import { PLACE_LABEL } from '../types'
import { actions, useRoutine, useStore } from '../lib/store'
import { setsOf, volume } from '../lib/progression'
import { duration, kg as fmtKg, longDate, clockTime, volumeLabel } from '../lib/format'
import { Empty, Sheet } from '../components/ui'
import { NumField } from '../components/NumField'

const sameSet = (a: LoggedSet, b: LoggedSet) =>
  a.exerciseId === b.exerciseId && a.setIndex === b.setIndex && a.side === b.side

export function History() {
  const state = useStore()
  const routine = useRoutine()
  // Guardo el id, no la sesión: así el detalle refleja las correcciones al instante
  const [detailId, setDetailId] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const done = state.sessions.filter((s) => s.finishedAt)
  const detail = done.find((s) => s.id === detailId) ?? null

  if (done.length === 0) {
    return <Empty icon="—" title="Todavía no hay entrenos guardados" sub="Cuando termines uno, aparecerá aquí con todas tus series." />
  }

  const dayOf = (s: Session) => routine.find((d) => d.id === s.dayId)
  const detailDay = detail ? dayOf(detail) : null

  const editSet = (target: LoggedSet, patch: Partial<LoggedSet>) => {
    if (!detail) return
    actions.updateSession(detail.id, { sets: detail.sets.map((x) => (sameSet(x, target) ? { ...x, ...patch } : x)) })
  }
  const removeSet = (target: LoggedSet) => {
    if (!detail) return
    actions.updateSession(detail.id, { sets: detail.sets.filter((x) => !sameSet(x, target)) })
  }
  const close = () => { setDetailId(null); setEditing(false) }

  return (
    <div className="px-4 pb-6" style={{ paddingTop: 'calc(var(--safe-t) + 1rem)' }}>
      <h1 className="display text-4xl mb-5 leading-none">Historial</h1>

      <div className="space-y-2">
        {done.map((s) => {
          const d = dayOf(s)
          const doneSets = s.sets.filter((x) => x.done)
          return (
            <button key={s.id} onClick={() => setDetailId(s.id)}
                    className="w-full flex items-center gap-3 rounded-md border border-ink-800 bg-ink-850 p-3.5 text-left active:scale-[.985] transition-transform">
              <div className="h-11 w-11 shrink-0 rounded-sm flex items-center justify-center display text-base text-ink-950"
                   style={{ background: d?.hex ?? '#8b8b99' }}>
                {d?.sheet ?? '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="display text-lg leading-none">{d?.name ?? s.dayId}</span>
                  {s.place
                    ? <span className="label text-[8px] text-ink-200 border border-ink-600 rounded-sm px-1.5 py-[1px]">{PLACE_LABEL[s.place]}</span>
                    : <span className="label text-[8px] text-blood-300 border border-blood-500/50 rounded-sm px-1.5 py-[1px]">¿Lugar?</span>}
                </div>
                <div className="text-[11px] text-ink-400 mt-1">
                  <span className="capitalize">{longDate(s.finishedAt!)}</span> · {clockTime(s.startedAt)} · {duration(s.startedAt, s.finishedAt!)}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="numeral text-base">{volumeLabel(volume(s.sets))}</div>
                <div className="text-[10px] text-ink-400">{doneSets.length} series</div>
              </div>
            </button>
          )
        })}
      </div>

      <Sheet open={!!detail} onClose={close} title={detailDay ? `${detailDay.name} · Hoja ${detailDay.sheet}` : 'Entreno'}>
        {detail && (
          <>
            <div className="text-xs text-ink-400 mb-3">
              <span className="capitalize">{longDate(detail.finishedAt!)}</span> · {duration(detail.startedAt, detail.finishedAt!)} · {volumeLabel(volume(detail.sets))}
            </div>

            {/* Lugar: se puede cambiar si te equivocaste */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {(['gym', 'casa'] as const).map((p) => (
                <button key={p} onClick={() => actions.updateSession(detail.id, { place: p })}
                        className={`h-11 rounded-sm border display text-lg tracking-wide ${
                          detail.place === p ? 'bg-blood-500 border-blood-400 text-bone' : 'bg-ink-850 border-ink-800 text-ink-400'
                        }`}>
                  {PLACE_LABEL[p]}
                </button>
              ))}
            </div>

            <button onClick={() => setEditing((e) => !e)}
                    className={`w-full h-10 mb-4 rounded-sm border label text-[10px] ${
                      editing ? 'bg-bone text-ink-950 border-bone' : 'bg-ink-850 text-ink-200 border-ink-700'
                    }`}>
              {editing ? 'Listo' : 'Corregir series'}
            </button>

            <div className="space-y-3">
              {detailDay?.exercises.map((ex) => {
                // En modo corrección muestro todo lo que tenga algún dato, incluso lo no marcado
                const sets = editing
                  ? detail.sets.filter((x) => x.exerciseId === ex.id && (x.done || x.kg != null || x.reps != null))
                      .sort((a, b) => a.setIndex - b.setIndex || (a.side ?? '').localeCompare(b.side ?? ''))
                  : setsOf(detail, ex.id)
                if (!sets.length) return null
                return (
                  <div key={ex.id} className="rounded bg-ink-850 border border-ink-800 p-3">
                    <div className="display text-[15px] mb-2">{ex.name}</div>
                    {editing ? (
                      <div className="space-y-1.5">
                        {sets.map((s) => {
                          const suspicious = s.done && (s.kg === 0 || s.kg == null || s.reps == null)
                          return (
                            <div key={`${s.setIndex}${s.side ?? ''}`}
                                 className={`grid grid-cols-[2.2rem_1fr_1fr_auto_auto] gap-1.5 items-center rounded-sm p-1 ${suspicious ? 'bg-blood-500/15 ring-1 ring-blood-500/50' : ''}`}>
                              <span className="text-xs text-ink-400 pl-1 tabular-nums">{s.setIndex + 1}{s.side}</span>
                              <NumField decimal label="Kilos" value={s.kg} placeholder="kg" onChange={(kg) => editSet(s, { kg })}
                                className="h-10 w-full rounded-sm bg-ink-800 text-center font-bold tabular-nums outline-none focus:ring-2 focus:ring-white/25 placeholder:text-ink-600" />
                              <NumField label="Repeticiones" value={s.reps} placeholder="reps" onChange={(reps) => editSet(s, { reps })}
                                className="h-10 w-full rounded-sm bg-ink-800 text-center font-bold tabular-nums outline-none focus:ring-2 focus:ring-white/25 placeholder:text-ink-600" />
                              <button onClick={() => editSet(s, { done: !s.done })} aria-label={s.done ? 'Desmarcar' : 'Marcar hecha'}
                                      className={`h-10 w-10 rounded-sm font-bold ${s.done ? 'bg-blood-500 text-bone' : 'bg-ink-800 text-ink-600'}`}>✓</button>
                              <button onClick={() => removeSet(s)} aria-label="Borrar serie"
                                      className="h-10 w-9 rounded-sm bg-ink-800 text-ink-400">✕</button>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {sets.map((s, i) => (
                          <span key={i} className={`rounded-sm px-2 py-1 text-xs font-mono tabular-nums ${s.kg === 0 ? 'bg-blood-500/15 text-blood-300' : 'bg-ink-800'}`}>
                            {s.side && <b className="text-ink-400 mr-1">{s.side}</b>}{fmtKg(s.kg ?? 0)} × {s.reps}
                          </span>
                        ))}
                      </div>
                    )}
                    {detail.notes[ex.id] && (
                      <div className="mt-2 text-xs text-ink-400 italic border-l-2 border-ink-700 pl-2">{detail.notes[ex.id]}</div>
                    )}
                  </div>
                )
              })}
            </div>

            {editing && (
              <p className="text-[11px] text-ink-400 mt-3 leading-relaxed">
                En rojo: series marcadas con 0 kg o sin dato. Si fueron con peso, corrígelas; si de verdad fueron sin peso, déjalas.
              </p>
            )}

            <button
              onClick={() => { if (confirm('¿Borrar este entreno del historial?')) { actions.deleteSession(detail.id); close() } }}
              className="w-full mt-5 py-3 text-sm text-blood-300 font-medium">
              Borrar este entreno
            </button>
          </>
        )}
      </Sheet>
    </div>
  )
}
