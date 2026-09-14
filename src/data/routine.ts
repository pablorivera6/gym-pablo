import type { CycleSlot, Day } from '../types'

/**
 * La rutina de Pablo, transcrita de sus dos hojas.
 * Hoja A: Pull, Chest, Legs.  Hoja B: Pull, Push, Legs, Arms.
 */
export const ROUTINE: Day[] = [
  // ─────────────────────────── HOJA A ───────────────────────────
  {
    id: 'a-pull',
    name: 'Pull',
    short: 'Pull',
    sheet: 'A',
    accent: 'steel',
    hex: '#8a9aa6',
    exercises: [
      { id: 'a-pull-1', name: 'Cable Pullover agarre ancho', dbName: 'Straight-Arm Pulldown', sets: 2, repMin: 10, repMax: 10, tempo: true },
      { id: 'a-pull-2', name: 'Remo con pecho apoyado', dbName: 'Dumbbell Incline Row', sets: 2, repMin: 10, repMax: 10, tempo: true },
      { id: 'a-pull-3', name: 'Remo a una mano', dbName: 'One-Arm Dumbbell Row', sets: 2, repMin: 10, repMax: 10, perSide: true },
      { id: 'a-pull-4', name: 'Dominadas con peso', dbName: 'Pullups', sets: 3, repMin: 6, repMax: 10 },
      { id: 'a-pull-5', name: 'Pec Deck invertido', dbName: 'Reverse Machine Flyes', sets: 2, repMin: 10, repMax: 12, isolation: true },
      { id: 'a-pull-6', name: 'Curl en polea', dbName: 'Standing Biceps Cable Curl', sets: 2, repMin: 10, repMax: 10, isolation: true },
      { id: 'a-pull-7', name: 'Curl predicador', dbName: 'Preacher Curl', sets: 2, repMin: 10, repMax: 12, isolation: true },
      { id: 'a-pull-8', name: 'Curl martillo con mancuerna', dbName: 'Hammer Curls', sets: 2, repMin: 10, repMax: 10, isolation: true },
    ],
  },
  {
    id: 'a-chest',
    name: 'Chest',
    short: 'Chest',
    sheet: 'A',
    accent: 'blood',
    hex: '#c1121f',
    exercises: [
      { id: 'a-chest-1', name: 'Pec Deck', dbName: 'Butterfly', sets: 2, repMin: 8, repMax: 10, tempo: true, toFailure: true, isolation: true },
      { id: 'a-chest-2', name: 'Press inclinado en Smith', dbName: 'Smith Machine Incline Bench Press', sets: 2, repMin: 10, repMax: 10, tempo: true, toFailure: true },
      { id: 'a-chest-3', name: 'Aperturas inclinadas con mancuerna', dbName: 'Incline Dumbbell Flyes', sets: 2, repMin: 10, repMax: 12, isolation: true },
      { id: 'a-chest-4', name: 'Fondos asistidos o en máquina', dbName: 'Dips - Chest Version', sets: 2, repMin: 10, repMax: 10 },
      { id: 'a-chest-5', name: 'Extensiones en polea (pushdowns)', dbName: 'Triceps Pushdown', sets: 2, repMin: 10, repMax: 10, isolation: true },
      { id: 'a-chest-6', name: 'JM Press ligeramente inclinado', dbName: 'JM Press', sets: 2, repMin: 8, repMax: 12 },
    ],
  },
  {
    id: 'a-legs',
    name: 'Legs',
    short: 'Legs',
    sheet: 'A',
    accent: 'ash',
    hex: '#8a7f9c',
    exercises: [
      { id: 'a-legs-1', name: 'Aductores', dbName: 'Thigh Adductor', sets: 2, repMin: 10, repMax: 10, isolation: true },
      { id: 'a-legs-2', name: 'Extensiones de cuádriceps', dbName: 'Leg Extensions', sets: 2, repMin: 10, repMax: 10, isolation: true, note: 'Calentamiento con static hold' },
      { id: 'a-legs-3', name: 'Hack squat', dbName: 'Hack Squat', sets: 2, repMin: 8, repMax: 12, alt: 'o Smith squat' },
      { id: 'a-legs-4', name: 'Prensa a una pierna', dbName: 'Split Squats', sets: 2, repMin: 10, repMax: 10, perSide: true, alt: 'o Split squats' },
      { id: 'a-legs-5', name: 'Curl femoral', dbName: 'Lying Leg Curls', sets: 2, repMin: 10, repMax: 10, isolation: true },
      { id: 'a-legs-6', name: 'Zancadas caminando', dbName: 'Bodyweight Walking Lunge', sets: 2, repMin: 10, repMax: 10, perSide: true },
      { id: 'a-legs-7', name: 'Gemelos de pie', dbName: 'Standing Calf Raises', sets: 3, repMin: 10, repMax: 12, tempo: true, toFailure: true, isolation: true },
    ],
  },

  // ─────────────────────────── HOJA B ───────────────────────────
  {
    id: 'b-pull',
    name: 'Pull',
    short: 'Pull',
    sheet: 'B',
    accent: 'steel',
    hex: '#8a9aa6',
    exercises: [
      { id: 'b-pull-1', name: 'Jalón al pecho', dbName: 'Wide-Grip Lat Pulldown', sets: 2, repMin: 8, repMax: 10 },
      { id: 'b-pull-2', name: 'Remo pronado con pecho apoyado', dbName: 'Leverage Iso Row', sets: 2, repMin: 8, repMax: 10 },
      { id: 'b-pull-3', name: 'Remo bajo en polea o máquina', dbName: 'Seated Cable Rows', sets: 2, repMin: 8, repMax: 10 },
      { id: 'b-pull-4', name: 'Remo a una mano', dbName: 'One-Arm Dumbbell Row', sets: 2, repMin: 8, repMax: 10, perSide: true, alt: 'cualquier variación' },
      { id: 'b-pull-5', name: 'Curl predicador', dbName: 'Preacher Curl', sets: 2, repMin: 8, repMax: 10, isolation: true },
      { id: 'b-pull-6', name: 'Curl martillo', dbName: 'Hammer Curls', sets: 2, repMin: 8, repMax: 10, isolation: true },
    ],
  },
  {
    id: 'b-push',
    name: 'Push',
    short: 'Push',
    sheet: 'B',
    accent: 'rust',
    hex: '#b08050',
    exercises: [
      { id: 'b-push-1', name: 'Press de hombro', dbName: 'Dumbbell Shoulder Press', sets: 2, repMin: 8, repMax: 10 },
      { id: 'b-push-2', name: 'Elevaciones laterales', dbName: 'Side Lateral Raise', sets: 2, repMin: 8, repMax: 10, isolation: true },
      { id: 'b-push-3', name: 'Pec Deck', dbName: 'Butterfly', sets: 2, repMin: 8, repMax: 10, isolation: true },
      { id: 'b-push-4', name: 'Press declinado', dbName: 'Decline Barbell Bench Press', sets: 2, repMin: 8, repMax: 10 },
      { id: 'b-push-5', name: 'JM Press', dbName: 'JM Press', sets: 2, repMin: 8, repMax: 10 },
      { id: 'b-push-6', name: 'Extensiones en polea (pushdowns)', dbName: 'Triceps Pushdown', sets: 2, repMin: 8, repMax: 10, isolation: true },
      { id: 'b-push-7', name: 'Fondos', dbName: 'Dips - Triceps Version', sets: 2, repMin: 8, repMax: 10 },
    ],
  },
  {
    id: 'b-legs',
    name: 'Legs',
    short: 'Legs',
    sheet: 'B',
    accent: 'ash',
    hex: '#8a7f9c',
    exercises: [
      { id: 'b-legs-1', name: 'Abductores', dbName: 'Thigh Abductor', sets: 2, repMin: 8, repMax: 10, isolation: true },
      { id: 'b-legs-2', name: 'Aductores', dbName: 'Thigh Adductor', sets: 2, repMin: 8, repMax: 10, isolation: true },
      { id: 'b-legs-3', name: 'Curl femoral tumbado', dbName: 'Lying Leg Curls', sets: 2, repMin: 8, repMax: 10, isolation: true },
      { id: 'b-legs-4', name: 'Peso muerto rumano (RDL)', dbName: 'Romanian Deadlift', sets: 2, repMin: 8, repMax: 10 },
      { id: 'b-legs-5', name: 'Prensa', dbName: 'Leg Press', sets: 2, repMin: 8, repMax: 10 },
      { id: 'b-legs-6', name: 'Extensiones de cuádriceps', dbName: 'Leg Extensions', sets: 2, repMin: 10, repMax: 10, isolation: true },
      { id: 'b-legs-7', name: 'Gemelos', dbName: 'Standing Calf Raises', sets: 4, repMin: 10, repMax: 10, isolation: true },
    ],
  },
  {
    id: 'b-arms',
    name: 'Arm Day',
    short: 'Arms',
    sheet: 'B',
    accent: 'moss',
    hex: '#7f9184',
    exercises: [
      { id: 'b-arms-1', name: 'Curl predicador', dbName: 'Preacher Curl', sets: 2, repMin: 6, repMax: 10, isolation: true },
      { id: 'b-arms-2', name: 'JM Press', dbName: 'JM Press', sets: 2, repMin: 6, repMax: 10 },
      { id: 'b-arms-3', name: 'Curl con barra Z', dbName: 'EZ-Bar Curl', sets: 2, repMin: 6, repMax: 10, isolation: true },
      { id: 'b-arms-4', name: 'Extensiones sobre la cabeza', dbName: 'Cable Rope Overhead Triceps Extension', sets: 2, repMin: 6, repMax: 10, isolation: true },
      { id: 'b-arms-5', name: 'Curl martillo', dbName: 'Hammer Curls', sets: 2, repMin: 6, repMax: 10, isolation: true },
      { id: 'b-arms-6', name: 'Pushdown a una mano', dbName: 'Standing Low-Pulley One-Arm Triceps Extension', sets: 2, repMin: 6, repMax: 10, perSide: true, isolation: true },
    ],
  },
]

/** Ciclo de 9 días: 3 de hoja A + descanso, 4 de hoja B + descanso. */
export const CYCLE: CycleSlot[] = [
  { kind: 'workout', dayId: 'a-pull' },
  { kind: 'workout', dayId: 'a-chest' },
  { kind: 'workout', dayId: 'a-legs' },
  { kind: 'rest' },
  { kind: 'workout', dayId: 'b-pull' },
  { kind: 'workout', dayId: 'b-push' },
  { kind: 'workout', dayId: 'b-legs' },
  { kind: 'workout', dayId: 'b-arms' },
  { kind: 'rest' },
]
