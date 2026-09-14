import { useMemo, useState } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { Exercise } from '../types'
import { useRoutine, useStore } from '../lib/store'
import { history, personalRecord, suggest, lastPerformance } from '../lib/progression'
import { kg as fmtKg, relativeDay, volumeLabel } from '../lib/format'
import { ExerciseImage } from '../components/ExerciseImage'
import { Empty } from '../components/ui'

type Metric = 'maxKg' | 'volume'

export function Progress() {
  const state = useStore()
  const routine = useRoutine()
  const [metric, setMetric] = useState<Metric>('maxKg')
  const [query, setQuery] = useState('')

  // Un ejercicio puede repetirse en varios días: lo listo una sola vez por id
  const all = useMemo(() => {
    const seen = new Map<string, { ex: Exercise; dayName: string; hex: string }>()
    for (const d of routine) for (const ex of d.exercises) {
      if (!seen.has(ex.id)) seen.set(ex.id, { ex, dayName: `${d.name} ${d.sheet}`, hex: d.hex })
    }
    return [...seen.values()]
  }, [routine])

  const withData = all
    .map((e) => ({ ...e, data: history(state.sessions, e.ex.id) }))
    .filter((e) => e.data.length > 0)
    .filter((e) => e.ex.name.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => b.data.length - a.data.length)

  if (state.sessions.filter((s) => s.finishedAt).length === 0) {
    return <Empty icon="—" title="Aún no hay progreso que mostrar" sub="Termina tu primer entreno y aquí verás cómo suben tus pesos ejercicio por ejercicio." />
  }

  return (
    <div className="px-4 pb-6" style={{ paddingTop: 'calc(var(--safe-t) + 1rem)' }}>
      <h1 className="display text-4xl mb-5 leading-none">Progreso</h1>

      <div className="flex gap-2 mb-4">
        <input
          value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar ejercicio…"
          className="flex-1 h-11 rounded bg-ink-850 border border-ink-800 px-4 outline-none focus:ring-2 focus:ring-white/20 placeholder:text-ink-600"
        />
      </div>

      <div className="flex gap-1 p-1 rounded bg-ink-850 border border-ink-800 mb-4">
        {([['maxKg', 'Peso máximo'], ['volume', 'Volumen']] as const).map(([k, label]) => (
          <button key={k} onClick={() => setMetric(k)}
                  className={`flex-1 h-9 rounded-sm label text-[9px] transition-colors ${metric === k ? 'bg-bone text-ink-950' : 'text-ink-400'}`}>
            {label}
          </button>
        ))}
      </div>

      {withData.length === 0 && <Empty icon="—" title="Sin resultados" sub="Ningún ejercicio registrado coincide con esa búsqueda." />}

      <div className="space-y-3">
        {withData.map(({ ex, dayName, hex, data }) => {
          const pr = personalRecord(state.sessions, ex.id)
          const last = lastPerformance(state.sessions, ex.id)
          const tip = suggest(ex, last?.sets ?? null)
          const first = data[0][metric]
          const now = data[data.length - 1][metric]
          const delta = first > 0 ? Math.round(((now - first) / first) * 100) : 0

          return (
            <div key={ex.id} className="rounded-md border border-ink-800 bg-ink-850 p-3">
              <div className="flex items-center gap-3 mb-3">
                <ExerciseImage dbName={ex.dbName} autoplay={false} className="h-12 w-12 shrink-0 rounded-sm" />
                <div className="flex-1 min-w-0">
                  <div className="display text-[15px] leading-[1.1] line-clamp-2">{ex.name}</div>
                  <div className="text-[11px] text-ink-400">{dayName} · {data.length} {data.length === 1 ? 'sesión' : 'sesiones'}</div>
                </div>
                {data.length > 1 && (
                  <div className={`text-right shrink-0 ${delta > 0 ? 'text-blood-300' : delta < 0 ? 'text-ink-400' : 'text-ink-400'}`}>
                    <div className="numeral text-base">{delta > 0 ? '+' : ''}{delta}%</div>
                    <div className="text-[10px] text-ink-400">desde el inicio</div>
                  </div>
                )}
              </div>

              <div className="h-28 -ml-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data} margin={{ top: 6, right: 10, bottom: 0, left: 0 }}>
                    <CartesianGrid stroke="#212127" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" hide />
                    <YAxis width={38} tick={{ fill: '#8b8b99', fontSize: 10 }} axisLine={false} tickLine={false} domain={['dataMin - 2', 'dataMax + 2']} />
                    <Tooltip
                      contentStyle={{ background: '#101013', border: '1px solid #32323a', borderRadius: 2, fontSize: 12 }}
                      labelStyle={{ color: '#8b8b99' }}
                      formatter={(v) => [metric === 'maxKg' ? `${Number(v)} kg` : volumeLabel(Number(v)), metric === 'maxKg' ? 'Peso máx' : 'Volumen']}
                    />
                    <Line type="monotone" dataKey={metric} stroke={hex} strokeWidth={2.5}
                          dot={{ r: 3, fill: hex, strokeWidth: 0 }} activeDot={{ r: 5 }}
                          isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="flex gap-2 mt-2 text-[11px]">
                {pr && (
                  <div className="flex-1 rounded-sm bg-ink-900 px-2.5 py-2">
                    <div className="label text-[8px] text-ink-400">Récord</div>
                    <div className="numeral text-sm mt-1">{fmtKg(pr.kg)} kg × {pr.reps}</div>
                  </div>
                )}
                {last && (
                  <div className="flex-1 rounded-sm bg-ink-900 px-2.5 py-2">
                    <div className="label text-[8px] text-ink-400">Última vez</div>
                    <div className="font-bold mt-0.5">{relativeDay(last.session.finishedAt!)}</div>
                  </div>
                )}
                <div className="flex-1 rounded-sm px-2.5 py-2" style={{ background: tip.kind === 'up' ? 'rgba(193,18,31,0.14)' : '#0b0b0d' }}>
                  <div className="label text-[8px] text-ink-400">Siguiente</div>
                  <div className="font-bold tabular-nums mt-0.5" style={{ color: tip.kind === 'up' ? '#f2555f' : undefined }}>
                    {tip.kind === 'up' ? `↑ ${fmtKg(tip.kg)} kg` : tip.kind === 'hold' ? `${fmtKg(tip.kg)} kg` : '—'}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
