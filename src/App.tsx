import { Suspense, lazy, useEffect, useState } from 'react'
import type { Day } from './types'
import { Icon } from './components/Icons'
import { useRoutine, useStore } from './lib/store'
import { Today } from './screens/Today'
import { Workout } from './screens/Workout'
import { History } from './screens/History'
import { Settings } from './screens/Settings'

// Las gráficas pesan; se cargan solo al abrir la pestaña Progreso
const Progress = lazy(() => import('./screens/Progress').then((m) => ({ default: m.Progress })))

type Tab = 'hoy' | 'progreso' | 'historial' | 'ajustes'

const TABS: { id: Tab; label: string }[] = [
  { id: 'hoy', label: 'Hoy' },
  { id: 'progreso', label: 'Progreso' },
  { id: 'historial', label: 'Historial' },
  { id: 'ajustes', label: 'Ajustes' },
]

export default function App() {
  const [tab, setTab] = useState<Tab>('hoy')
  const [training, setTraining] = useState<Day | null>(null)
  const state = useStore()
  const routine = useRoutine()

  // Si había un entreno sin terminar (p.ej. se cerró la app), lo retomo
  useEffect(() => {
    if (state.active && !training) {
      const d = routine.find((x) => x.id === state.active!.dayId)
      if (d) setTraining(d)
    }
    // solo al montar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Mientras entreno, la pantalla del iPhone no debería apagarse
  useEffect(() => {
    if (!training || !('wakeLock' in navigator)) return
    let lock: WakeLockSentinel | null = null
    const acquire = async () => {
      try { lock = await navigator.wakeLock.request('screen') } catch { /* sin permiso, no pasa nada */ }
    }
    acquire()
    const onVisible = () => { if (document.visibilityState === 'visible') acquire() }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      lock?.release().catch(() => {})
    }
  }, [training])

  if (training) {
    return (
      <div className="min-h-full">
        <Workout day={training} onExit={() => setTraining(null)} />
      </div>
    )
  }

  return (
    <div className="min-h-full flex flex-col">
      <main className="flex-1" style={{ paddingBottom: 'calc(var(--safe-b) + 5.5rem)' }}>
        {tab === 'hoy' && <Today onStart={setTraining} />}
        {tab === 'progreso' && (
          <Suspense fallback={<div className="p-8 text-center text-ink-400 text-sm">Cargando gráficas…</div>}>
            <Progress />
          </Suspense>
        )}
        {tab === 'historial' && <History />}
        {tab === 'ajustes' && <Settings />}
      </main>

      <nav className="fixed bottom-0 inset-x-0 z-40 bg-ink-950/85 backdrop-blur-xl border-t border-ink-800"
           style={{ paddingBottom: 'var(--safe-b)' }}>
        <div className="flex">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
                    className="flex-1 flex flex-col items-center gap-1 py-2.5"
                    aria-current={tab === t.id ? 'page' : undefined}>
              <Icon name={t.id} className={`h-[22px] w-[22px] transition-colors ${tab === t.id ? 'text-blood-400' : 'text-ink-600'}`} />
              <span className={`label text-[9px] transition-colors ${tab === t.id ? 'text-bone' : 'text-ink-600'}`}>{t.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
