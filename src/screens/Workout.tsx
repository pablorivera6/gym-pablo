import { useState } from 'react'
import type { Day, Exercise, LoggedSet, Place, Session } from '../types'
import { PLACE_LABEL } from '../types'
import { actions, useStore } from '../lib/store'
import { getMeta } from '../lib/meta'
import { lastPerformance, setsOf, suggest } from '../lib/progression'
import { kg as fmtKg, relativeDay, repRange } from '../lib/format'
import { ExerciseImage } from '../components/ExerciseImage'
import { RestTimer } from '../components/RestTimer'
import { Badge, Sheet } from '../components/ui'
import { NumField } from '../components/NumField'

type Row = { setIndex: number; side?: 'L' | 'R' }

/** Las filas de series que se muestran (duplicadas si el ejercicio es por lado) */
function rowsFor(ex: Exercise, extra: number): Row[] {
  const total = ex.sets + extra
  const out: Row[] = []
  for (let i = 0; i < total; i++) {
    if (ex.perSide) out.push({ setIndex: i, side: 'L' }, { setIndex: i, side: 'R' })
    else out.push({ setIndex: i })
  }
  return out
}

const find = (session: Session, exId: string, r: Row) =>
  session.sets.find((s) => s.exerciseId === exId && s.setIndex === r.setIndex && s.side === r.side)

export function Workout({ day, onExit }: { day: Day; onExit: () => void }) {
  const state = useStore()
  const session = state.active
  const [open, setOpen] = useState<string | null>(day.exercises[0]?.id ?? null)
  const [extra, setExtra] = useState<Record<string, number>>({})
  const [noteFor, setNoteFor] = useState<Exercise | null>(null)
  const [confirmFinish, setConfirmFinish] = useState(false)
  /** fila a la que le falta un dato al intentar marcarla */
  const [needs, setNeeds] = useState<string | null>(null)

  if (!session) return null
  // Entrenos empezados antes de esta versión: se asumen en el gym hasta que lo cambies arriba
  const place: Place = session.place ?? 'gym'

  const patch = (exId: string, r: Row, data: Partial<LoggedSet>) => {
    const existing = find(session, exId, r)
    const base: LoggedSet = existing ?? { exerciseId: exId, setIndex: r.setIndex, side: r.side, kg: null, reps: null, done: false }
    const next = { ...base, ...data }
    actions.setActive({
      ...session,
      sets: existing
        ? session.sets.map((s) => (s === existing ? next : s))
        : [...session.sets, next],
    })
  }

  const doneCount = session.sets.filter((s) => s.done).length
  const totalRows = day.exercises.reduce((a, ex) => a + rowsFor(ex, extra[ex.id] ?? 0).length, 0)
  const pct = totalRows ? (doneCount / totalRows) * 100 : 0

  return (
    <div className="min-h-full pb-32">
      {/* Cabecera fija con progreso */}
      <header className="sticky top-0 z-30 bg-ink-950/90 backdrop-blur-xl border-b border-ink-800"
              style={{ paddingTop: 'var(--safe-t)' }}>
        <div className="flex items-center gap-3 px-4 h-14">
          <button onClick={onExit} className="h-9 w-9 -ml-1 rounded-sm bg-ink-850 text-ink-200 text-lg" aria-label="Volver">‹</button>
          <div className="flex-1 min-w-0">
            <div className="display text-xl leading-none truncate">
              {day.name} <span className="text-ink-400 text-sm">— Hoja {day.sheet}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <button onClick={() => actions.setPlaceOfActive(place === 'gym' ? 'casa' : 'gym')}
                      className="label text-[9px] text-blood-300 border border-blood-500/40 rounded-sm px-1.5 py-[1px]"
                      aria-label={`Entrenando en ${PLACE_LABEL[place]}. Tocar para cambiar`}>
                {PLACE_LABEL[place]} ⇄
              </button>
              <span className="label text-[9px] text-ink-400">{doneCount} / {totalRows} series</span>
            </div>
          </div>
          <button onClick={() => setConfirmFinish(true)}
                  className="h-9 px-4 rounded-sm bg-blood-500 label text-[10px] text-bone active:bg-blood-400">
            Terminar
          </button>
        </div>
        <div className="h-1 bg-ink-850">
          <div className="h-full bg-blood-500 transition-[width] duration-300" style={{ width: `${pct}%` }} />
        </div>
      </header>

      <div className="px-4 pt-4 space-y-3">
        {day.exercises.map((ex, i) => {
          const isOpen = open === ex.id
          const rows = rowsFor(ex, extra[ex.id] ?? 0)
          const logged = rows.map((r) => find(session, ex.id, r))
          const doneHere = logged.filter((s) => s?.done).length
          const complete = doneHere === rows.length
          const meta = getMeta(ex.dbName)
          const last = lastPerformance(state.sessions, ex.id, place)
          const tip = suggest(ex, last?.sets ?? null)

          return (
            <section key={ex.id}
                     className={`rounded-md border overflow-hidden transition-colors ${
                       complete ? 'border-blood-500/35 bg-blood-500/[0.04] edge-blood' : 'border-ink-800 bg-ink-850'
                     }`}>
              {/* Fila cabecera, siempre visible */}
              <button onClick={() => setOpen(isOpen ? null : ex.id)} className="w-full flex items-center gap-3 p-3 text-left">
                <ExerciseImage dbName={ex.dbName} autoplay={false} className="h-14 w-14 shrink-0 rounded" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-1.5">
                    <span className="text-[11px] font-bold text-ink-400 tabular-nums pt-1">{i + 1}</span>
                    <span className="display text-[15px] leading-[1.1] line-clamp-2">{ex.name}</span>
                  </div>
                  <div className="text-xs text-ink-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                    <span className="tabular-nums font-medium">{ex.sets} × {repRange(ex.repMin, ex.repMax)}</span>
                    {ex.tempo && <span className="text-ink-200">· Tempo</span>}
                    {ex.toFailure && <span className="text-blood-300">· Al fallo</span>}
                    {ex.perSide && <span>· cada lado</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex gap-1">
                    {rows.map((_r, ri) => (
                      <span key={ri} className="h-1.5 w-1.5 rounded-full"
                            style={{ background: logged[ri]?.done ? '#c1121f' : '#212127' }} />
                    ))}
                  </div>
                  <span className={`text-ink-400 text-xs transition-transform ${isOpen ? 'rotate-90' : ''}`}>›</span>
                </div>
              </button>

              {isOpen && (
                <div className="px-3 pb-3 animate-slide-up">
                  {/* Foto grande + info */}
                  <div className="flex gap-3 mb-3">
                    <ExerciseImage dbName={ex.dbName} className="h-32 w-32 shrink-0 rounded" />
                    <div className="flex-1 min-w-0 flex flex-col gap-1.5 pt-0.5">
                      {meta && (
                        <>
                          <div className="flex flex-wrap gap-1">
                            <Badge>{meta.equipment}</Badge>
                            {meta.primary.slice(0, 2).map((m) => <Badge key={m} tone="sky">{m}</Badge>)}
                          </div>
                          {meta.secondary.length > 0 && (
                            <div className="text-[11px] text-ink-400">También: {meta.secondary.slice(0, 3).join(', ')}</div>
                          )}
                        </>
                      )}
                      {ex.alt && <div className="text-[11px] text-ink-400 italic">{ex.alt}</div>}
                      {ex.note && <div className="text-[11px] text-ink-200">— {ex.note}</div>}
                      {ex.tempo && <div className="text-[11px] text-ink-400">Tempo: baja lento y controla la excéntrica.</div>}
                    </div>
                  </div>

                  {/* Última vez + sugerencia */}
                  <div className="rounded bg-ink-900 border border-ink-800 p-3 mb-3">
                    {last ? (
                      <>
                        <div className="label text-[9px] text-ink-400 mb-2">
                          Última vez en {PLACE_LABEL[place]} — {relativeDay(last.session.finishedAt!)}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {last.sets.map((s, k) => (
                            <span key={k} className="rounded-sm bg-ink-800 px-2 py-1 text-xs font-mono tabular-nums">
                              {s.side && <b className="text-ink-400 mr-1">{s.side}</b>}
                              {fmtKg(s.kg ?? 0)} × {s.reps}
                            </span>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="text-xs text-ink-400">Primera vez que registras este ejercicio en {PLACE_LABEL[place].toLowerCase()}. Anota tu peso y la próxima te digo si subir.</div>
                    )}

                    {tip.kind === 'up' && (
                      <div className="mt-3 flex items-center gap-2.5 rounded-sm bg-blood-500/12 border border-blood-500/30 px-3 py-2.5">
                        <span className="display text-2xl leading-none text-blood-400">↑</span>
                        <div className="text-xs">
                          <b className="display text-base text-blood-300 tracking-wide">Sube a {fmtKg(tip.kg)} kg</b>
                          <div className="text-blood-300/65 mt-0.5">Completaste {ex.repMax} reps en todas las series con {fmtKg(tip.from)} kg.</div>
                        </div>
                      </div>
                    )}
                    {tip.kind === 'hold' && (
                      <div className="mt-3 flex items-center gap-2.5 rounded-sm bg-ink-800 px-3 py-2.5">
                        <span className="display text-2xl leading-none text-ink-600">=</span>
                        <div className="text-xs">
                          <b className="display text-base text-ink-200 tracking-wide">Mantén {fmtKg(tip.kg)} kg</b>
                          <div className="text-ink-400">Te faltan {tip.missing} reps para llegar a {ex.repMax} en todas las series.</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Series */}
                  <div className="space-y-1.5">
                    <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-2 px-1 label text-[9px] text-ink-400">
                      <span className="w-14 pl-2">Serie</span><span className="text-center">Kg</span><span className="text-center">Reps</span><span className="w-11 text-center">✓</span>
                    </div>
                    {rows.map((r, ri) => {
                      const s = logged[ri]
                      const key = `${ex.id}:${r.setIndex}:${r.side ?? ''}`
                      const prev = last?.sets.find((x) => x.setIndex === r.setIndex && x.side === r.side)
                      const hintKg = tip.kind === 'up' || tip.kind === 'hold' ? tip.kg : prev?.kg ?? undefined
                      const hintReps = prev?.reps
                      const missing = needs === key && !s?.done
                      const field = 'h-11 w-full rounded-sm bg-ink-800 text-center font-bold tabular-nums outline-none focus:ring-2 focus:ring-white/25 placeholder:text-ink-600 placeholder:font-normal'
                      return (
                        <div key={ri} className={`grid grid-cols-[auto_1fr_1fr_auto] gap-2 items-center rounded p-1.5 transition-colors ${
                          missing ? 'bg-blood-500/20 ring-1 ring-blood-500' : s?.done ? 'bg-blood-500/10' : 'bg-ink-900'
                        }`}>
                          <div className="w-14 pl-2 text-sm font-semibold tabular-nums text-ink-200">
                            {r.setIndex + 1}{r.side && <span className="text-ink-400 text-xs ml-0.5">{r.side}</span>}
                          </div>
                          <NumField decimal label={`Kilos serie ${r.setIndex + 1}`}
                            value={s?.kg} onChange={(kg) => patch(ex.id, r, { kg })}
                            placeholder={hintKg !== undefined ? fmtKg(hintKg) : 'kg'}
                            className={field} />
                          <NumField label={`Repeticiones serie ${r.setIndex + 1}`}
                            value={s?.reps} onChange={(reps) => patch(ex.id, r, { reps })}
                            placeholder={hintReps !== undefined ? String(hintReps) : `${ex.repMin === ex.repMax ? ex.repMax : `${ex.repMin}-${ex.repMax}`}`}
                            className={field} />
                          <button
                            onClick={() => {
                              if (s?.done) { patch(ex.id, r, { done: false }); return }
                              // Campo vacío = uso lo que muestra el placeholder, pero solo si
                              // viene de datos reales; nunca invento 0 kg ni reps.
                              const kg = s?.kg ?? hintKg ?? null
                              const reps = s?.reps ?? hintReps ?? null
                              if (kg == null || reps == null) {
                                setNeeds(key)
                                setTimeout(() => setNeeds((k) => (k === key ? null : k)), 1600)
                                return
                              }
                              setNeeds(null)
                              patch(ex.id, r, { done: true, kg, reps })
                              if (state.settings.vibrate && 'vibrate' in navigator) navigator.vibrate(20)
                            }}
                            className={`h-11 w-11 rounded-sm text-lg font-bold transition-colors ${
                              s?.done ? 'bg-blood-500 text-bone' : 'bg-ink-800 text-ink-600'
                            }`}
                            aria-label={s?.done ? 'Desmarcar serie' : 'Marcar serie hecha'}
                          >✓</button>
                          {missing && (
                            <div className="col-span-4 px-2 pb-1 label text-[9px] text-blood-300">
                              {[s?.kg == null && hintKg === undefined && 'los kg', s?.reps == null && hintReps === undefined && 'las reps']
                                .filter(Boolean).join(' y ').replace(/^/, 'Escribe ')} para marcarla
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  <div className="flex gap-2 mt-2">
                    <button onClick={() => setExtra((x) => ({ ...x, [ex.id]: (x[ex.id] ?? 0) + 1 }))}
                            className="flex-1 h-10 rounded-sm bg-ink-900 label text-[9px] text-ink-400 border border-ink-800">
                      + Serie extra
                    </button>
                    <button onClick={() => setNoteFor(ex)}
                            className="flex-1 h-10 rounded-sm bg-ink-900 label text-[9px] text-ink-400 border border-ink-800">
                      {session.notes[ex.id] ? 'Ver nota' : 'Añadir nota'}
                    </button>
                  </div>

                  <div className="mt-2">
                    <RestTimer seconds={state.settings.restSeconds} vibrate={state.settings.vibrate} accent={day.hex} />
                  </div>
                </div>
              )}
            </section>
          )
        })}

        <button onClick={() => setConfirmFinish(true)}
                className="w-full h-16 rounded-sm bg-blood-500 text-bone display text-2xl tracking-[0.18em] active:bg-blood-400 active:scale-[.99] transition-all">
          Terminar entreno
        </button>
      </div>

      {/* Nota por ejercicio */}
      <Sheet open={!!noteFor} onClose={() => setNoteFor(null)} title={noteFor?.name ?? ''}>
        <textarea
          autoFocus
          value={noteFor ? session.notes[noteFor.id] ?? '' : ''}
          onChange={(e) => noteFor && actions.setActive({ ...session, notes: { ...session.notes, [noteFor.id]: e.target.value } })}
          placeholder="Cómo se sintió, ajuste de máquina, molestias…"
          className="w-full h-36 rounded bg-ink-850 border border-ink-800 p-3 outline-none focus:ring-2 focus:ring-white/20 resize-none"
        />
        {noteFor && getMeta(noteFor.dbName)?.instructions.length ? (
          <div className="mt-4">
            <div className="label text-[9px] text-ink-400 mb-2">Cómo se hace</div>
            <ol className="space-y-1.5 text-sm text-ink-200 list-decimal pl-5">
              {getMeta(noteFor.dbName)!.instructions.map((t, i) => <li key={i} className="leading-relaxed">{t}</li>)}
            </ol>
          </div>
        ) : null}
      </Sheet>

      {/* Confirmar terminar */}
      <Sheet open={confirmFinish} onClose={() => setConfirmFinish(false)} title="¿Terminar entreno?">
        <p className="text-sm text-ink-400 mb-4">
          Llevas <b className="text-white tabular-nums">{doneCount} de {totalRows}</b> series marcadas.
          Al terminar se guarda en el historial y el ciclo avanza al siguiente día.
        </p>
        <div className="space-y-2">
          <button onClick={() => { actions.finishActive(); onExit() }}
                  className="w-full py-4 rounded-sm bg-blood-500 text-bone display text-lg tracking-[0.15em]">
            Guardar y terminar
          </button>
          <button onClick={() => setConfirmFinish(false)} className="w-full py-3.5 rounded bg-ink-850 font-semibold text-ink-200">
            Seguir entrenando
          </button>
          <button onClick={() => { if (confirm('¿Descartar este entreno sin guardar?')) { actions.discardActive(); onExit() } }}
                  className="w-full py-3 text-sm text-rose-400 font-medium">
            Descartar sin guardar
          </button>
        </div>
      </Sheet>
    </div>
  )
}

export const emptySession = (dayId: Day['id'], place: Place): Session => ({
  id: `${Date.now()}`,
  dayId,
  place,
  startedAt: new Date().toISOString(),
  sets: [],
  notes: {},
})

export { setsOf }
