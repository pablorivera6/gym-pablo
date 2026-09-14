import { useState } from 'react'
import type { Session } from '../types'
import { actions, useRoutine, useStore } from '../lib/store'
import { setsOf, volume } from '../lib/progression'
import { duration, kg as fmtKg, longDate, clockTime, volumeLabel } from '../lib/format'
import { Empty, Sheet } from '../components/ui'

export function History() {
  const state = useStore()
  const routine = useRoutine()
  const [detail, setDetail] = useState<Session | null>(null)
  const done = state.sessions.filter((s) => s.finishedAt)

  if (done.length === 0) {
    return <Empty icon="—" title="Todavía no hay entrenos guardados" sub="Cuando termines uno, aparecerá aquí con todas tus series." />
  }

  const dayOf = (s: Session) => routine.find((d) => d.id === s.dayId)
  const detailDay = detail ? dayOf(detail) : null

  return (
    <div className="px-4 pb-6" style={{ paddingTop: 'calc(var(--safe-t) + 1rem)' }}>
      <h1 className="display text-4xl mb-5 leading-none">Historial</h1>

      <div className="space-y-2">
        {done.map((s) => {
          const d = dayOf(s)
          const doneSets = s.sets.filter((x) => x.done)
          return (
            <button key={s.id} onClick={() => setDetail(s)}
                    className="w-full flex items-center gap-3 rounded-md border border-ink-800 bg-ink-850 p-3.5 text-left active:scale-[.985] transition-transform">
              <div className="h-11 w-11 shrink-0 rounded-sm flex items-center justify-center display text-base text-ink-950"
                   style={{ background: d?.hex ?? '#8b8b99' }}>
                {d?.sheet ?? '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="display text-lg leading-none">{d?.name ?? s.dayId}</div>
                <div className="text-[11px] text-ink-400">
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

      <Sheet open={!!detail} onClose={() => setDetail(null)} title={detailDay ? `${detailDay.name} · Hoja ${detailDay.sheet}` : 'Entreno'}>
        {detail && (
          <>
            <div className="text-xs text-ink-400 mb-4">
              <span className="capitalize">{longDate(detail.finishedAt!)}</span> · {duration(detail.startedAt, detail.finishedAt!)} · {volumeLabel(volume(detail.sets))}
            </div>
            <div className="space-y-3">
              {detailDay?.exercises.map((ex) => {
                const sets = setsOf(detail, ex.id)
                if (!sets.length) return null
                return (
                  <div key={ex.id} className="rounded bg-ink-850 border border-ink-800 p-3">
                    <div className="display text-[15px] mb-2">{ex.name}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {sets.map((s, i) => (
                        <span key={i} className="rounded-sm bg-ink-800 px-2 py-1 text-xs font-mono tabular-nums">
                          {s.side && <b className="text-ink-400 mr-1">{s.side}</b>}{fmtKg(s.kg)} × {s.reps}
                        </span>
                      ))}
                    </div>
                    {detail.notes[ex.id] && (
                      <div className="mt-2 text-xs text-ink-400 italic border-l-2 border-ink-700 pl-2">{detail.notes[ex.id]}</div>
                    )}
                  </div>
                )
              })}
            </div>
            <button
              onClick={() => { if (confirm('¿Borrar este entreno del historial?')) { actions.deleteSession(detail.id); setDetail(null) } }}
              className="w-full mt-5 py-3 text-sm text-rose-400 font-medium">
              Borrar este entreno
            </button>
          </>
        )}
      </Sheet>
    </div>
  )
}
