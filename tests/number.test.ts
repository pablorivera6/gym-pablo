import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseNum, fieldText, sanitizeSet } from '../src/lib/number.ts'

test('campo vacío es "sin valor", no 0', () => {
  assert.equal(parseNum(''), null)
  assert.equal(parseNum('   '), null)
})

test('coma decimal del teclado en español', () => {
  assert.equal(parseNum('42,5'), 42.5)
  assert.equal(parseNum('42.5'), 42.5)
})

test('ceros a la izquierda no cambian el número', () => {
  assert.equal(parseNum('012'), 12)
})

test('texto a medio escribir o basura', () => {
  assert.equal(parseNum('abc'), null)
  assert.equal(parseNum('-5'), null)   // no hay kilos negativos
  assert.equal(parseNum('42,'), 42)    // aún escribiendo el decimal
})

test('0 es un valor válido (dominadas sin lastre)', () => {
  assert.equal(parseNum('0'), 0)
})

test('lo que se muestra: nunca "0" inventado', () => {
  assert.equal(fieldText(null), '')
  assert.equal(fieldText(undefined), '')
  assert.equal(fieldText(12), '12')
  assert.equal(fieldText(42.5), '42.5')
})

test('reparación de datos viejos: los 0 de series NO marcadas eran relleno', () => {
  const s = sanitizeSet({ exerciseId: 'x', setIndex: 0, kg: 40, reps: 0, done: false })
  assert.equal(s.kg, 40)
  assert.equal(s.reps, null)
  const t = sanitizeSet({ exerciseId: 'x', setIndex: 0, kg: 0, reps: 12, done: false })
  assert.equal(t.kg, null)
  assert.equal(t.reps, 12)
})

test('reparación: una serie marcada conserva su 0 kg (puede ser real)', () => {
  const s = sanitizeSet({ exerciseId: 'x', setIndex: 0, kg: 0, reps: 8, done: true })
  assert.equal(s.kg, 0)
  assert.equal(s.reps, 8)
})

test('reparación: números guardados como texto o inválidos', () => {
  const s = sanitizeSet({ exerciseId: 'x', setIndex: 0, kg: '42,5' as unknown as number, reps: 'x' as unknown as number, done: true })
  assert.equal(s.kg, 42.5)
  assert.equal(s.reps, null)
})
