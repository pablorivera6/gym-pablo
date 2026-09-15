/** Un ejercicio tal como aparece en la hoja de rutina. */
export type Exercise = {
  /** id único y estable: se usa como llave del historial. No cambiar nunca. */
  id: string
  /** Nombre que se muestra en la app */
  name: string
  /** Nombre en free-exercise-db, usado para buscar las fotos */
  dbName: string
  sets: number
  repMin: number
  repMax: number
  /** La hoja marca "Tempo" */
  tempo?: boolean
  /** La hoja marca "x Failure" */
  toFailure?: boolean
  /** Se registra por lado (cada pierna / cada brazo) */
  perSide?: boolean
  /** Ejercicio de aislamiento: sube de a 1.25 kg en vez de 2.5 kg */
  isolation?: boolean
  /** Variante aceptada, ej. "o Smith squat" */
  alt?: string
  /** Nota fija de la hoja */
  note?: string
}

export type DayId =
  | 'a-pull' | 'a-chest' | 'a-legs'
  | 'b-pull' | 'b-push' | 'b-legs' | 'b-arms'

export type Day = {
  id: DayId
  name: string
  /** etiqueta corta para la tira del ciclo */
  short: string
  sheet: 'A' | 'B'
  /** clases tailwind del color de acento */
  accent: string
  hex: string
  exercises: Exercise[]
}

/** Un hueco del ciclo de 9 días */
export type CycleSlot =
  | { kind: 'workout'; dayId: DayId }
  | { kind: 'rest' }

/** Una serie registrada */
export type LoggedSet = {
  exerciseId: string
  setIndex: number
  /** 'L' | 'R' solo cuando el ejercicio es perSide */
  side?: 'L' | 'R'
  /** null = el campo está vacío. 0 es un valor real (ej. dominadas sin lastre). */
  kg: number | null
  reps: number | null
  done: boolean
}

/** Dónde se entrenó: las máquinas cambian, así que los pesos se llevan por separado */
export type Place = 'gym' | 'casa'

export const PLACE_LABEL: Record<Place, string> = { gym: 'Gym', casa: 'Casa' }

export type Session = {
  id: string
  dayId: DayId
  /** undefined solo en entrenos guardados antes de que existiera esta opción */
  place?: Place
  /** ISO date-time de inicio */
  startedAt: string
  /** ISO date-time de fin, undefined si sigue en curso */
  finishedAt?: string
  sets: LoggedSet[]
  /** notas por ejercicio */
  notes: Record<string, string>
}

export type Settings = {
  /** índice 0..8 dentro del ciclo, apunta al día que toca AHORA */
  cycleIndex: number
  restSeconds: number
  vibrate: boolean
  /** último lugar elegido, para preseleccionarlo */
  lastPlace?: Place
}

export type AppState = {
  version: number
  settings: Settings
  sessions: Session[]
  /** sesión en curso (no terminada) */
  active: Session | null
  /** rutina editada por el usuario; null = usar la de fábrica */
  customRoutine: Day[] | null
  /** fotos y músculos de los ejercicios que el usuario añadió */
  customMeta: Record<string, ExerciseMeta>
}

export type ExerciseMeta = {
  slug: string
  images: string[]
  primary: string[]
  secondary: string[]
  equipment: string
  instructions: string[]
}
