import { useEffect, useRef, useState } from 'react'
import { fieldText, parseNum } from '../lib/number'

/**
 * Campo numérico que SÍ se puede vaciar.
 * Guarda el texto tal cual lo escribes mientras tienes el foco (así "42," no
 * salta) y entrega el número —o null si está vacío— a quien lo usa.
 * Al tocarlo selecciona todo, para reemplazar el valor sin tener que borrar.
 */
export function NumField({ value, onChange, placeholder, decimal = false, className = '', label }: {
  value: number | null | undefined
  onChange: (n: number | null) => void
  placeholder?: string
  decimal?: boolean
  className?: string
  label: string
}) {
  const [text, setText] = useState(fieldText(value))
  const focused = useRef(false)

  // Si el valor cambia desde fuera (p.ej. al marcar ✓ con lo sugerido), lo reflejo
  useEffect(() => {
    if (!focused.current) setText(fieldText(value))
  }, [value])

  return (
    <input
      type="text"
      inputMode={decimal ? 'decimal' : 'numeric'}
      pattern={decimal ? '[0-9]*[.,]?[0-9]*' : '[0-9]*'}
      autoComplete="off"
      enterKeyHint="done"
      aria-label={label}
      value={text}
      placeholder={placeholder}
      onFocus={(e) => { focused.current = true; e.currentTarget.select() }}
      onBlur={() => { focused.current = false; setText(fieldText(value)) }}
      onChange={(e) => {
        const allowed = decimal ? /^[0-9]*[.,]?[0-9]*$/ : /^[0-9]*$/
        const t = e.target.value
        if (!allowed.test(t)) return
        setText(t)
        onChange(parseNum(t))
      }}
      className={className}
    />
  )
}
