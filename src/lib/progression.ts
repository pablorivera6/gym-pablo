import type { Exercise, LoggedSet, Session } from '../types'

/** Series de un ejercicio en una sesión, solo las realmente completadas */
export function setsOf(session: Session, exerciseId: string): LoggedSet[] {
  return session.sets
    .filter((s) => s.exerciseId === exerciseId && s.done && s.reps > 0)
    .sort((a, b) => a.setIndex - b.setIndex)
}

/** La última sesión TERMINADA en la que se hizo este ejercicio */
export function lastPerformance(sessions: Session[], exerciseId: string) {
  for (const s of sessions) {
    if (!s.finishedAt) continue
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
export function suggest(ex: Exercise, last: LoggedSet[] | null): Suggestion {
  if (!last || last.length === 0) return { kind: 'first' }

  const kg = Math.max(...last.map((s) => s.kg))
  const working = last.filter((s) => s.kg === kg)
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

/** Volumen total de una sesión: suma de kg × reps */
export function volume(sets: LoggedSet[]): number {
  return sets.reduce((a, s) => a + (s.done ? s.kg * s.reps : 0), 0)
}

/** Récord de peso para un ejercicio en todo el historial */
export function personalRecord(sessions: Session[], exerciseId: string) {
  let best: { kg: number; reps: number; date: string } | null = null
  for (const s of sessions) {
    if (!s.finishedAt) continue
    for (const set of setsOf(s, exerciseId)) {
      if (!best || set.kg > best.kg || (set.kg === best.kg && set.reps > best.reps)) {
        best = { kg: set.kg, reps: set.reps, date: s.finishedAt }
      }
    }
  }
  return best
}

/** Serie histórica para graficar: un punto por sesión */
export function history(sessions: Session[], exerciseId: string) {
  return sessions
    .filter((s) => s.finishedAt && setsOf(s, exerciseId).length > 0)
    .map((s) => {
      const sets = setsOf(s, exerciseId)
      return {
        date: s.finishedAt!.slice(0, 10),
        ts: new Date(s.finishedAt!).getTime(),
        maxKg: Math.max(...sets.map((x) => x.kg)),
        volume: Math.round(volume(sets)),
        topReps: Math.max(...sets.map((x) => x.reps)),
      }
    })
    .sort((a, b) => a.ts - b.ts)
}

/** Racha: días seguidos (del ciclo) sin saltarse entreno, aproximado por sesiones recientes */
export function stats(sessions: Session[]) {
  const done = sessions.filter((s) => s.finishedAt)
  const totalVolume = done.reduce((a, s) => a + volume(s.sets), 0)
  const totalSets = done.reduce((a, s) => a + s.sets.filter((x) => x.done).length, 0)
  const last = done[0]?.finishedAt
  return { count: done.length, totalVolume, totalSets, last }
}
