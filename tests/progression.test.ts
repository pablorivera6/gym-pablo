import { test } from 'node:test'
import assert from 'node:assert/strict'
import { lastPerformance, suggest, personalRecord, history, volume } from '../src/lib/progression.ts'
import type { Exercise, Session } from '../src/types.ts'

const ex: Exercise = { id: 'e1', name: 'Press', dbName: 'x', sets: 2, repMin: 8, repMax: 10 }
const iso = (daysAgo: number) => new Date(Date.now() - daysAgo * 86400000).toISOString()
const session = (id: string, place: Session['place'], daysAgo: number, kg: number, reps: number[]): Session => ({
  id, dayId: 'a-pull', place, startedAt: iso(daysAgo), finishedAt: iso(daysAgo), notes: {},
  sets: reps.map((r, i) => ({ exerciseId: 'e1', setIndex: i, kg, reps: r, done: true })),
})

// Más reciente primero, como las guarda la app
const sessions = [
  session('casa-1', 'casa', 1, 20, [10, 10]),   // ayer en casa: mancuernas livianas
  session('gym-1', 'gym', 4, 60, [9, 8]),       // hace 4 días en el gym
]

test('la última vez en el GYM ignora el entreno de ayer en casa', () => {
  const last = lastPerformance(sessions, 'e1', 'gym')
  assert.equal(last?.session.id, 'gym-1')
  assert.deepEqual(suggest(ex, last!.sets), { kind: 'hold', kg: 60, missing: 3 })
})

test('la última vez en CASA sugiere subir sobre el peso de casa', () => {
  const last = lastPerformance(sessions, 'e1', 'casa')
  assert.equal(last?.session.id, 'casa-1')
  assert.deepEqual(suggest(ex, last!.sets), { kind: 'up', kg: 22.5, from: 20 })
})

test('primera vez en un lugar nuevo: no hereda los pesos del otro', () => {
  const soloGym = [session('gym-1', 'gym', 4, 60, [9, 8])]
  assert.equal(lastPerformance(soloGym, 'e1', 'casa'), null)
})

test('los entrenos sin lugar asignado no cuentan hasta que se clasifiquen', () => {
  const viejo = [session('old', undefined, 2, 50, [10, 10])]
  assert.equal(lastPerformance(viejo, 'e1', 'gym'), null)
  assert.equal(lastPerformance(viejo, 'e1', 'casa'), null)
})

test('récord e historial separados por lugar', () => {
  assert.equal(personalRecord(sessions, 'e1', 'gym')?.kg, 60)
  assert.equal(personalRecord(sessions, 'e1', 'casa')?.kg, 20)
  assert.equal(history(sessions, 'e1', 'gym').length, 1)
})

test('series con campos vacíos no rompen los cálculos', () => {
  const rara: Session = { ...session('r', 'gym', 0, 40, [10]), sets: [
    { exerciseId: 'e1', setIndex: 0, kg: null, reps: 10, done: true },
    { exerciseId: 'e1', setIndex: 1, kg: 40, reps: null, done: true },
  ] }
  assert.equal(volume(rara.sets), 0)
  // una serie sin reps no cuenta como hecha para la progresión
  assert.deepEqual(lastPerformance([rara], 'e1', 'gym')?.sets.map((s) => s.reps), [10])
})
