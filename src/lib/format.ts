const DAY = 86400000

/** "hoy" | "ayer" | "hace 9 días" | "hace 3 semanas" */
export function relativeDay(iso: string): string {
  const d = Math.floor((startOfDay(Date.now()) - startOfDay(new Date(iso).getTime())) / DAY)
  if (d <= 0) return 'hoy'
  if (d === 1) return 'ayer'
  if (d < 14) return `hace ${d} días`
  if (d < 60) return `hace ${Math.round(d / 7)} semanas`
  return `hace ${Math.round(d / 30)} meses`
}

const startOfDay = (ms: number) => {
  const d = new Date(ms)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export function longDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' })
}

export function clockTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
}

/** Duración entre dos ISO, "48 min" o "1 h 12 min" */
export function duration(a: string, b: string): string {
  const min = Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 60000))
  if (min < 60) return `${min} min`
  return `${Math.floor(min / 60)} h ${min % 60} min`
}

/** 102.5 -> "102.5",  100 -> "100" */
export const kg = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0$/, ''))

/** 12500 -> "12.5 t" para volumen */
export function volumeLabel(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)} t`
  return `${Math.round(n)} kg`
}

export const repRange = (min: number, max: number) => (min === max ? `${min}` : `${min}-${max}`)
