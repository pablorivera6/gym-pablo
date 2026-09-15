import type { LoggedSet } from '../types'

/**
 * Texto de un campo -> número. Vacío o inválido es null ("sin valor"), nunca 0.
 * Acepta la coma decimal del teclado en español.
 */
export function parseNum(text: string): number | null {
  const t = text.trim().replace(',', '.')
  if (t === '' || t === '.') return null
  const n = Number(t.endsWith('.') ? t.slice(0, -1) : t)
  if (!Number.isFinite(n) || n < 0) return null
  return n
}

/** Número -> texto del campo. Sin valor se muestra vacío para que se vea el placeholder. */
export const fieldText = (n: number | null | undefined) => (n == null ? '' : String(n))

/** Normaliza un valor guardado (puede venir de un respaldo viejo o editado a mano). */
function toNum(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) && v >= 0 ? v : null
  if (typeof v === 'string') return parseNum(v)
  return null
}

/**
 * Repara una serie guardada por la versión anterior, que rellenaba con 0 los
 * campos que el usuario nunca tocó. En una serie NO marcada ese 0 era relleno;
 * en una marcada no lo toco, porque 0 kg puede ser real.
 */
export function sanitizeSet(s: LoggedSet): LoggedSet {
  let kg = toNum(s.kg)
  let reps = toNum(s.reps)
  if (!s.done) {
    if (kg === 0) kg = null
    if (reps === 0) reps = null
  }
  return { ...s, kg, reps, done: !!s.done }
}
