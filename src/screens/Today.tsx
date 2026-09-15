import { useState } from 'react'
import type { Day, Place, Session } from '../types'
import { PLACE_LABEL } from '../types'
import { CYCLE } from '../data/routine'
import { actions, useRoutine, useStore } from '../lib/store'
import { stats } from '../lib/progression'
import { longDate, relativeDay, volumeLabel } from '../lib/format'
import { PlacePicker } from '../components/PlacePicker'
import { ExerciseImage } from '../components/ExerciseImage'
import { Stat } from '../components/ui'
import { emptySession } from './Workout'

export function Today({ onStart }: { onStart: (day: Day) => void }) {
  const state = useStore()
  const routine = useRoutine()
  const i = state.settings.cycleIndex
  const slot = CYCLE[i]
  const day = slot.kind === 'workout' ? routine.find((d) => d.id === slot.dayId)! : null
  const s = stats(state.sessions)
  const active = state.active
  const activeDay = active ? routine.find((d) => d.id === active.dayId) : null

  // Primero se elige el día, luego dónde se entrena
  const [picking, setPicking] = useState<Day | null>(null)
  const start = (d: Day) => setPicking(d)
  const go = (place: Place) => {
    if (!picking) return
    actions.setSettings({ lastPlace: place })
    actions.setActive(emptySession(picking.id, place))
    onStart(picking)
    setPicking(null)
  }

  // Entrenos guardados antes de que existiera gym/casa: hay que clasificarlos
  const unplaced = state.sessions.filter((x): x is Session & { finishedAt: string } => !!x.finishedAt && !x.place)

  return (
    <div className="px-4 pb-6" style={{ paddingTop: 'calc(var(--safe-t) + 1rem)' }}>
      <header className="mb-5">
        <div className="label text-[10px] text-ink-400">
          {new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
        <h1 className="display text-4xl mt-1 leading-none">Hoy</h1>
      </header>

      {/* Entrenos sin lugar */}
      {unplaced.length > 0 && (
        <div className="mb-4 rounded-md border border-blood-500/40 bg-blood-500/[0.07] p-4 edge-blood animate-pop">
          <div className="display text-lg leading-none">¿Dónde entrenaste?</div>
          <p className="text-xs text-ink-400 mt-1.5 mb-3 leading-relaxed">
            {unplaced.length === 1 ? 'Este entreno se guardó' : 'Estos entrenos se guardaron'} antes de separar gym y casa.
            Hasta que {unplaced.length === 1 ? 'lo clasifiques' : 'los clasifiques'}, no {unplaced.length === 1 ? 'cuenta' : 'cuentan'} para las sugerencias de peso.
          </p>
          <div className="space-y-2">
            {unplaced.map((x) => {
              const d = routine.find((r) => r.id === x.dayId)
              return (
                <div key={x.id} className="flex items-center gap-2 rounded-sm bg-ink-900 p-2 pl-3">
                  <div className="flex-1 min-w-0">
                    <div className="display text-[15px] leading-none">{d?.name ?? x.dayId} <span className="text-ink-400 text-xs">— Hoja {d?.sheet}</span></div>
                    <div className="text-[11px] text-ink-400 capitalize mt-1">{longDate(x.finishedAt)} · {x.sets.filter((z) => z.done).length} series</div>
                  </div>
                  {(['gym', 'casa'] as const).map((p) => (
                    <button key={p} onClick={() => actions.updateSession(x.id, { place: p })}
                            className="h-10 px-3 rounded-sm bg-ink-800 border border-ink-700 label text-[10px] text-bone active:bg-blood-500">
                      {PLACE_LABEL[p]}
                    </button>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Entreno sin terminar */}
      {active && activeDay && (
        <button onClick={() => onStart(activeDay)}
                className="w-full mb-4 flex items-center gap-3 rounded-md border p-4 text-left animate-pop"
                style={{ borderColor: `${activeDay.hex}55`, background: `${activeDay.hex}12` }}>
          <span className="h-2.5 w-2.5 rounded-full pulse-soft shrink-0" style={{ background: activeDay.hex }} />
          <div className="flex-1 min-w-0">
            <div className="display text-lg leading-none">Entreno en curso</div>
            <div className="text-xs text-ink-400">{activeDay.name} · Hoja {activeDay.sheet} · {PLACE_LABEL[active.place ?? 'gym']} · {active.sets.filter((x) => x.done).length} series hechas</div>
          </div>
          <span className="text-sm font-bold shrink-0" style={{ color: activeDay.hex }}>Continuar ›</span>
        </button>
      )}

      {/* Tarjeta principal */}
      {day ? (
        <div className="rounded-md overflow-hidden border border-ink-800 bg-ink-850 mb-4">
          <div className="relative h-40">
            <div className="absolute inset-0 grid grid-cols-3 gap-px opacity-70">
              {day.exercises.slice(0, 3).map((ex) => (
                <ExerciseImage key={ex.id} dbName={ex.dbName} autoplay={false} className="h-full w-full" />
              ))}
            </div>
            <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(6,6,7,0.35) 0%, rgba(6,6,7,0.82) 55%, #101013 100%)' }} />
            <div className="absolute inset-0 flex flex-col justify-end p-5">
              <div className="label text-[10px] text-blood-300" style={{ textShadow: '0 1px 12px rgba(0,0,0,0.9)' }}>
                Día {i + 1} de 9 — Hoja {day.sheet}
              </div>
              <div className="display text-[3.25rem] leading-[0.92] mt-1" style={{ textShadow: '0 2px 24px rgba(0,0,0,0.85)' }}>{day.name}</div>
              <div className="text-sm text-ink-400 mt-1">
                {day.exercises.length} ejercicios · {day.exercises.reduce((a, e) => a + e.sets, 0)} series
              </div>
            </div>
          </div>

          <div className="p-3 pt-0">
            <div className="flex gap-1.5 overflow-x-auto pb-3 pt-3">
              {day.exercises.map((ex) => (
                <div key={ex.id} className="shrink-0 w-[74px]">
                  <ExerciseImage dbName={ex.dbName} autoplay={false} className="h-[74px] w-[74px] rounded" />
                  <div className="mt-1 text-[10px] leading-tight text-ink-400 line-clamp-2">{ex.name}</div>
                </div>
              ))}
            </div>
            {!active && (
              <button onClick={() => start(day)}
                      className="w-full h-14 rounded-sm bg-blood-500 text-bone display text-xl tracking-[0.2em] active:bg-blood-400 active:scale-[.99] transition-all">
                Empezar
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-md border border-ink-800 bg-ink-850 p-8 text-center mb-4">
          <div className="display text-6xl text-ink-700 mb-2 leading-none">Off</div>
          <div className="display text-3xl">Día de descanso</div>
          <div className="text-sm text-ink-400 mt-1.5 leading-relaxed">
            Día {i + 1} de 9. Descansar es parte del plan: aquí es donde crece el músculo.
          </div>
          <button onClick={() => actions.advanceCycle(1)}
                  className="mt-5 w-full h-12 rounded-sm bg-ink-800 label text-[10px] text-ink-200">
            Marcar descanso como hecho →
          </button>
        </div>
      )}

      {/* Ciclo de 9 días */}
      <div className="rounded-md border border-ink-800 bg-ink-850 p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="label text-[10px] text-ink-400">Ciclo de 9 días</div>
          <div className="flex gap-1">
            <button onClick={() => actions.advanceCycle(-1)} className="h-7 w-7 rounded-sm bg-ink-800 text-ink-400 text-sm" aria-label="Día anterior">‹</button>
            <button onClick={() => actions.advanceCycle(1)} className="h-7 w-7 rounded-sm bg-ink-800 text-ink-400 text-sm" aria-label="Día siguiente">›</button>
          </div>
        </div>
        <div className="flex gap-1.5">
          {CYCLE.map((sl, idx) => {
            const d = sl.kind === 'workout' ? routine.find((x) => x.id === sl.dayId) : null
            const isNow = idx === i
            return (
              <button key={idx} onClick={() => actions.setCycleIndex(idx)}
                      className={`flex-1 rounded-sm py-2.5 px-0.5 border transition-all ${
                        isNow ? 'bg-blood-500 border-blood-400' : 'bg-ink-800 border-transparent'
                      }`}>
                <div className={`label leading-none ${d ? 'text-[8px]' : 'text-[9px]'} ${
                  isNow ? 'text-bone' : 'text-ink-400'
                }`}>
                  {d ? d.short : 'Off'}
                </div>
                <div className={`label text-[7px] mt-1 leading-none ${isNow ? 'text-bone/70' : 'text-ink-600'}`}>
                  {d ? d.sheet : '—'}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Resumen */}
      <div className="flex gap-2">
        <Stat label="Entrenos" value={s.count} sub={s.last ? relativeDay(s.last) : 'aún ninguno'} />
        <Stat label="Series" value={s.totalSets} sub="en total" />
        <Stat label="Volumen" value={volumeLabel(s.totalVolume)} sub="kg levantados" />
      </div>

      {/* Entrenar otro día */}
      <details className="mt-4 rounded-md border border-ink-800 bg-ink-850 overflow-hidden">
        <summary className="px-4 py-3.5 text-sm font-semibold text-ink-200 cursor-pointer list-none flex items-center justify-between">
          Entrenar otro día <span className="text-ink-400">+</span>
        </summary>
        <div className="px-3 pb-3 grid grid-cols-2 gap-2">
          {routine.map((d) => (
            <button key={d.id} onClick={() => start(d)} disabled={!!active}
                    className="rounded bg-ink-900 border border-ink-800 p-3 text-left disabled:opacity-40">
              <div className="text-sm font-bold" style={{ color: d.hex }}>{d.name}</div>
              <div className="text-[11px] text-ink-400">Hoja {d.sheet} · {d.exercises.length} ejercicios</div>
            </button>
          ))}
        </div>
      </details>
      <PlacePicker open={!!picking} onClose={() => setPicking(null)} onPick={go} last={state.settings.lastPlace}
                   title={picking ? `${picking.name} — ¿dónde?` : undefined} />
    </div>
  )
}
