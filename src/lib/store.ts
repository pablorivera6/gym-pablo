import { useSyncExternalStore } from 'react'
import type { AppState, Day, ExerciseMeta, Session, Settings } from '../types'
import { registerMeta } from './meta'
import { ROUTINE, CYCLE } from '../data/routine'

const KEY = 'gym-pablo:v1'
const VERSION = 1

const EMPTY: AppState = {
  version: VERSION,
  settings: { cycleIndex: 0, restSeconds: 120, vibrate: true },
  sessions: [],
  active: null,
  customRoutine: null,
  customMeta: {},
}

function read(): AppState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return EMPTY
    const parsed = JSON.parse(raw) as Partial<AppState>
    return {
      ...EMPTY,
      ...parsed,
      settings: { ...EMPTY.settings, ...parsed.settings },
      sessions: parsed.sessions ?? [],
      customMeta: parsed.customMeta ?? {},
    }
  } catch {
    return EMPTY
  }
}

let state: AppState = typeof localStorage === 'undefined' ? EMPTY : read()
registerMeta(state.customMeta)
const listeners = new Set<() => void>()

function commit(next: AppState) {
  state = next
  registerMeta(next.customMeta)
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch (e) {
    console.error('No pude guardar en localStorage', e)
  }
  listeners.forEach((l) => l())
}

export function useStore(): AppState {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb) },
    () => state,
    () => EMPTY,
  )
}

export const getState = () => state

export const actions = {
  setSettings(patch: Partial<Settings>) {
    commit({ ...state, settings: { ...state.settings, ...patch } })
  },
  setActive(session: Session | null) {
    commit({ ...state, active: session })
  },
  /** Guarda la sesión terminada y avanza el ciclo un día */
  finishActive() {
    if (!state.active) return
    const done = { ...state.active, finishedAt: new Date().toISOString() }
    const wasCurrentDay = currentSlotDayId() === done.dayId
    commit({
      ...state,
      active: null,
      sessions: [done, ...state.sessions],
      settings: wasCurrentDay ? { ...state.settings, cycleIndex: nextIndex(state.settings.cycleIndex) } : state.settings,
    })
  },
  discardActive() {
    commit({ ...state, active: null })
  },
  deleteSession(id: string) {
    commit({ ...state, sessions: state.sessions.filter((s) => s.id !== id) })
  },
  advanceCycle(delta: number) {
    const n = 9
    commit({ ...state, settings: { ...state.settings, cycleIndex: ((state.settings.cycleIndex + delta) % n + n) % n } })
  },
  setCycleIndex(i: number) {
    commit({ ...state, settings: { ...state.settings, cycleIndex: i } })
  },
  setRoutine(routine: Day[] | null) {
    commit({ ...state, customRoutine: routine })
  },
  /** Guarda fotos y músculos de un ejercicio añadido desde el catálogo */
  addMeta(dbName: string, meta: ExerciseMeta) {
    commit({ ...state, customMeta: { ...state.customMeta, [dbName]: meta } })
  },
  replaceAll(next: AppState) {
    commit({ ...EMPTY, ...next, version: VERSION })
  },
}

const nextIndex = (i: number) => (i + 1) % 9

function currentSlotDayId() {
  const slot = CYCLE[state.settings.cycleIndex]
  return slot?.kind === 'workout' ? slot.dayId : null
}

/** Rutina efectiva: la personalizada si existe, si no la de fábrica */
export function useRoutine(): Day[] {
  const s = useStore()
  return s.customRoutine ?? ROUTINE
}
export const getRoutine = () => state.customRoutine ?? ROUTINE
