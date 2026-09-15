import type { Exercise, LoggedSet, Place, Session } from '../types'

/** Una serie que de verdad se hizo: marcada y con repeticiones */
type DoneSet = LoggedSet & { reps: number }

const kgOf = (s: LoggedSet) => s.kg ?? 0

/** Series de un ejercicio en una sesión, solo las realmente completadas */
export function setsOf(session: Session, exerciseId: string): DoneSet[] {
  return session.sets
    .filter((s): s is DoneSet => s.exerciseId === exerciseId && s.done && s.reps != null && s.reps > 0)
    .sort((a, b) => a.setIndex - b.setIndex)
}

/** Sesiones terminadas en un lugar. Las que no tienen lugar asignado no cuentan. */
const finishedAt = (sessions: Session[], place: Place) =>
  sessions.filter((s) => s.finishedAt && s.place === place)

/** La última sesión TERMINADA en ese lugar en la que se hizo este ejercicio */
export function lastPerformance(sessions: Session[], exerciseId: string, place: Place) {
  for (const s of finishedAt(sessions, place)) {
    const sets = setsOf(s, exerciseId)
    if (sets.length) return { session: s, sets }
  }
  return null
}

/** Cuánto sube: aislamiento 1.25 kg, compuesto 2.5 kg */
export const increment = (ex: Exercise) => (ex.isolation ? 1.25 : 2.5)

export type Suggestion =
  | { kind: 'first' }
  | { kind: 'up'; kg: number; from: number }
  | { kind: 'hold'; kg: number; missing: number }

/**
 * Doble progresión: si en la última sesión completaste TODAS las series
 * en el tope del rango, sube el peso y vuelve al piso del rango.
 * Si no, mantén el peso hasta llegar al tope.
 */
export function suggest(ex: Exercise, last: DoneSet[] | null): Suggestion {
  if (!last || last.length === 0) return { kind: 'first' }

  const kg = Math.max(...last.map(kgOf))
  const working = last.filter((s) => kgOf(s) === kg)
  const enoughSets = working.length >= ex.sets
  const allAtTop = working.every((s) => s.reps >= ex.repMax)

  if (enoughSets && allAtTop) {
    return { kind: 'up', kg: round(kg + increment(ex)), from: kg }
  }
  const missing = working.reduce((acc, s) => acc + Math.max(0, ex.repMax - s.reps), 0)
  return { kind: 'hold', kg, missing }
}

/** Redondea a múltiplos de 0.25 kg para no mostrar decimales feos */
export const round = (n: number) => Math.round(n * 4) / 4

/** Volumen total: suma de kg × reps de las series hechas */
export function volume(sets: LoggedSet[]): number {
  return sets.reduce((a, s) => a + (s.done && s.kg != null && s.reps != null ? s.kg * s.reps : 0), 0)
}

/** Récord de peso para un ejercicio en ese lugar */
export function personalRecord(sessions: Session[], exerciseId: string, place: Place) {
  let best: { kg: number; reps: number; date: string } | null = null
  for (const s of finishedAt(sessions, place)) {
    for (const set of setsOf(s, exerciseId)) {
      const k = kgOf(set)
      if (!best || k > best.kg || (k === best.kg && set.reps > best.reps)) {
        best = { kg: k, reps: set.reps, date: s.finishedAt! }
      }
    }
  }
  return best
}

/** Serie histórica para graficar: un punto por sesión en ese lugar */
export function history(sessions: Session[], exerciseId: string, place: Place) {
  return finishedAt(sessions, place)
    .filter((s) => setsOf(s, exerciseId).length > 0)
    .map((s) => {
      const sets = setsOf(s, exerciseId)
      return {
        date: s.finishedAt!.slice(0, 10),
        ts: new Date(s.finishedAt!).getTime(),
        maxKg: Math.max(...sets.map(kgOf)),
        volume: Math.round(volume(sets)),
        topReps: Math.max(...sets.map((x) => x.reps)),
      }
    })
    .sort((a, b) => a.ts - b.ts)
}

/** Totales generales, de todos los lugares */
export function stats(sessions: Session[]) {
  const done = sessions.filter((s) => s.finishedAt)
  const totalVolume = done.reduce((a, s) => a + volume(s.sets), 0)
  const totalSets = done.reduce((a, s) => a + s.sets.filter((x) => x.done).length, 0)
  const last = done[0]?.finishedAt
  return { count: done.length, totalVolume, totalSets, last }
}
