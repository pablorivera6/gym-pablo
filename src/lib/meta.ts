import raw from '../data/exerciseMeta.json'
import type { ExerciseMeta } from '../types'

/** Ejercicios de la rutina original: fotos en el proyecto, funcionan sin internet. */
const META = raw as Record<string, ExerciseMeta>

/** Ejercicios que el usuario añadió: sus datos viven en el estado de la app. */
let EXTRA: Record<string, ExerciseMeta> = {}
export const registerMeta = (m: Record<string, ExerciseMeta>) => { EXTRA = m }

export function getMeta(dbName: string): ExerciseMeta | null {
  return META[dbName] ?? EXTRA[dbName] ?? null
}

/** Las fotos locales son relativas; las de ejercicios añadidos son URLs del CDN. */
export const imgUrl = (p: string) =>
  p.startsWith('http') ? p : `${import.meta.env.BASE_URL}${p}`

export type CatalogEntry = {
  name: string
  images: string[]
  primary: string[]
  secondary: string[]
  equipment: string
}

let catalogCache: CatalogEntry[] | null = null

/** Los 876 ejercicios de la base. Se descarga solo al abrir el buscador. */
export async function loadCatalog(): Promise<CatalogEntry[]> {
  if (catalogCache) return catalogCache
  const res = await fetch(`${import.meta.env.BASE_URL}catalog.json`)
  if (!res.ok) throw new Error('No pude cargar el catálogo de ejercicios')
  catalogCache = (await res.json()) as CatalogEntry[]
  return catalogCache
}
