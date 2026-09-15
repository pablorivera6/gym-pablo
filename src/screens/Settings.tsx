import { useRef, useState } from 'react'
import type { AppState } from '../types'
import { actions, getState, useStore } from '../lib/store'
import { ROUTINE } from '../data/routine'
import { stats } from '../lib/progression'
import { volumeLabel } from '../lib/format'
import { Sheet } from '../components/ui'
import { RoutineEditor } from './RoutineEditor'

export function Settings() {
  const state = useStore()
  const s = stats(state.sessions)
  const fileRef = useRef<HTMLInputElement>(null)
  const [editing, setEditing] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const exportBackup = async () => {
    const name = `gym-pablo-${new Date().toISOString().slice(0, 10)}.json`
    const blob = new Blob([JSON.stringify(getState(), null, 2)], { type: 'application/json' })
    // En el iPhone (app instalada) una descarga normal no hace nada: uso el menú Compartir
    const file = new File([blob], name, { type: 'application/json' })
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: 'Respaldo GYM Pablo' })
        return
      } catch (e) {
        if ((e as Error).name === 'AbortError') return // cerró el menú
      }
    }
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = name
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const importBackup = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text()) as Partial<AppState>
      if (!Array.isArray(parsed.sessions)) throw new Error('El archivo no tiene entrenos')
      if (!confirm(`Vas a reemplazar tus datos actuales por ${parsed.sessions.length} entrenos del respaldo. ¿Seguro?`)) return
      actions.replaceAll(parsed)
      setMsg('Respaldo restaurado ✓')
    } catch (e) {
      setMsg(`No pude leer el archivo: ${(e as Error).message}`)
    }
  }

  return (
    <div className="px-4 pb-6" style={{ paddingTop: 'calc(var(--safe-t) + 1rem)' }}>
      <h1 className="display text-4xl mb-5 leading-none">Ajustes</h1>

      <Group title="Entreno">
        <Field label="Descanso entre series">
          <div className="flex gap-1">
            {[60, 90, 120, 180, 240].map((v) => (
              <button key={v} onClick={() => actions.setSettings({ restSeconds: v })}
                      className={`h-9 px-3 rounded-sm numeral text-sm ${state.settings.restSeconds === v ? 'bg-bone text-ink-950' : 'bg-ink-800 text-ink-400'}`}>
                {v < 60 ? `${v}s` : `${v / 60}m`}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Vibrar al marcar series y al terminar el descanso">
          <Toggle on={state.settings.vibrate} onChange={(v) => actions.setSettings({ vibrate: v })} />
        </Field>
      </Group>

      <Group title="Rutina">
        <Row onClick={() => setEditing(true)} label="Editar rutina" sub="Series, repeticiones, orden y ejercicios" chevron />
        {state.customRoutine && (
          <Row onClick={() => { if (confirm('¿Volver a la rutina original de tus hojas?')) actions.setRoutine(null) }}
               label="Restaurar rutina original" sub="Deshace todos tus cambios" tone="rose" />
        )}
        <Row onClick={() => { if (confirm('¿Reiniciar el ciclo al día 1 (Pull, Hoja A)?')) actions.setCycleIndex(0) }}
             label="Reiniciar ciclo" sub={`Ahora vas por el día ${state.settings.cycleIndex + 1} de 9`} />
      </Group>

      <Group title="Tus datos">
        <div className="px-4 py-3 flex gap-2 text-center">
          <Mini label="Entrenos" value={String(s.count)} />
          <Mini label="Series" value={String(s.totalSets)} />
          <Mini label="Volumen" value={volumeLabel(s.totalVolume)} />
        </div>
        <Row onClick={exportBackup} label="Exportar respaldo" sub="Envíalo por AirDrop, WhatsApp o guárdalo en Archivos" chevron />
        <Row onClick={() => fileRef.current?.click()} label="Restaurar respaldo" sub="Reemplaza tus datos por los de un archivo" chevron />
        <input ref={fileRef} type="file" accept="application/json" className="hidden"
               onChange={(e) => { const f = e.target.files?.[0]; if (f) importBackup(f); e.target.value = '' }} />
        <Row onClick={() => { if (confirm('Esto borra TODOS tus entrenos. No se puede deshacer. ¿Seguro?')) { actions.replaceAll({ ...getState(), sessions: [], active: null }); setMsg('Historial borrado') } }}
             label="Borrar todo el historial" sub="No se puede deshacer" tone="rose" />
      </Group>

      <p className="text-[11px] text-ink-400 leading-relaxed px-1 mt-2">
        Tus datos se guardan solo en este iPhone, no salen a ningún servidor.
        Si borras Safari o desinstalas la app, se pierden — exporta un respaldo de vez en cuando.
        <br /><br />
        Fotos de ejercicios: <b>free-exercise-db</b> (dominio público).
        Rutina: {ROUTINE.reduce((a, d) => a + d.exercises.length, 0)} ejercicios en 7 días de entreno.
      </p>

      <Sheet open={editing} onClose={() => setEditing(false)} title="Editar rutina">
        <RoutineEditor />
      </Sheet>

      <Sheet open={!!msg} onClose={() => setMsg(null)} title="Listo">
        <p className="text-sm text-ink-200">{msg}</p>
        <button onClick={() => setMsg(null)} className="w-full mt-4 py-3 rounded bg-ink-850 font-semibold">Cerrar</button>
      </Sheet>
    </div>
  )
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-5">
      <div className="label text-[9px] text-ink-400 mb-2 px-1">{title}</div>
      <div className="rounded-md border border-ink-800 bg-ink-850 divide-y divide-ink-800 overflow-hidden">{children}</div>
    </section>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="px-4 py-3 flex items-center justify-between gap-3">
      <span className="text-sm text-ink-200 flex-1">{label}</span>
      {children}
    </div>
  )
}

function Row({ label, sub, onClick, tone, chevron }: { label: string; sub?: string; onClick: () => void; tone?: 'rose'; chevron?: boolean }) {
  return (
    <button onClick={onClick} className="w-full px-4 py-3.5 flex items-center gap-3 text-left active:bg-ink-800 transition-colors">
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-semibold ${tone === 'rose' ? 'text-rose-400' : ''}`}>{label}</div>
        {sub && <div className="text-[11px] text-ink-400 mt-0.5">{sub}</div>}
      </div>
      {chevron && <span className="text-ink-600">›</span>}
    </button>
  )
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!on)} role="switch" aria-checked={on}
            className={`h-7 w-12 shrink-0 rounded-sm p-0.5 transition-colors ${on ? 'bg-blood-500' : 'bg-ink-700'}`}>
      <span className={`block h-6 w-6 rounded-[2px] bg-bone transition-transform ${on ? 'translate-x-5' : ''}`} />
    </button>
  )
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1 rounded bg-ink-900 py-2.5">
      <div className="numeral text-xl leading-none">{value}</div>
      <div className="text-[10px] text-ink-400 mt-1">{label}</div>
    </div>
  )
}
