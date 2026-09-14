/**
 * Descarga las fotos de los ejercicios de la rutina desde free-exercise-db
 * (dominio público), las comprime, y genera src/data/exerciseMeta.json.
 *
 * Uso:  node scripts/fetch-exercises.mjs
 * Las imágenes quedan en public/ex/<slug>/0.jpg y 1.jpg  ->  100% offline.
 */
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import path from 'node:path'

const run = promisify(execFile)
const GRADER = path.join(import.meta.dirname, '.grade-photo')
const ROOT = path.resolve(import.meta.dirname, '..')
const DB_URL = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/dist/exercises.json'
const IMG_BASE = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises'
const OUT_IMG = path.join(ROOT, 'public', 'ex')
const OUT_META = path.join(ROOT, 'src', 'data', 'exerciseMeta.json')

const MUSCLE_ES = {
  abdominals: 'Abdomen', abductors: 'Abductores', adductors: 'Aductores',
  biceps: 'Bíceps', calves: 'Gemelos', chest: 'Pecho', forearms: 'Antebrazo',
  glutes: 'Glúteos', hamstrings: 'Femoral', lats: 'Dorsal', 'lower back': 'Lumbar',
  'middle back': 'Espalda media', neck: 'Cuello', quadriceps: 'Cuádriceps',
  shoulders: 'Hombros', traps: 'Trapecio', triceps: 'Tríceps',
}
const EQUIP_ES = {
  barbell: 'Barra', dumbbell: 'Mancuerna', cable: 'Polea', machine: 'Máquina',
  'body only': 'Peso corporal', kettlebell: 'Kettlebell', bands: 'Bandas',
  'medicine ball': 'Balón medicinal', 'exercise ball': 'Fitball',
  'foam roll': 'Foam roller', 'e-z curl bar': 'Barra Z', other: 'Otro',
}
const es = (map, k) => map[k] ?? (k ? k[0].toUpperCase() + k.slice(1) : '')

const slugify = (s) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
   .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

/** Compila el recortador/gradador (Vision + CoreImage) si hace falta */
async function buildGrader() {
  const src = path.join(import.meta.dirname, 'grade-photo.swift')
  if (existsSync(GRADER)) return
  console.log('Compilando el procesador de fotos…')
  await run('swiftc', ['-O', src, '-o', GRADER])
}

async function main() {
  await buildGrader()
  // 1. Qué ejercicios necesito (leo los dbName de routine.ts)
  const routineSrc = await readFile(path.join(ROOT, 'src', 'data', 'routine.ts'), 'utf8')
  const names = [...new Set([...routineSrc.matchAll(/dbName:\s*'([^']+)'/g)].map((m) => m[1]))]
  console.log(`Ejercicios en la rutina: ${names.length}`)

  // 2. Base de datos
  console.log('Descargando base de datos…')
  const res = await fetch(DB_URL)
  if (!res.ok) throw new Error(`No pude bajar la base de datos: HTTP ${res.status}`)
  const db = await res.json()
  const byName = new Map(db.map((e) => [e.name, e]))

  const missing = names.filter((n) => !byName.has(n))
  if (missing.length) throw new Error(`Estos ejercicios no existen en la base: ${missing.join(', ')}`)

  // 3. Descargar + comprimir imágenes
  await rm(OUT_IMG, { recursive: true, force: true })
  await mkdir(OUT_IMG, { recursive: true })
  const meta = {}
  let bytes = 0

  for (const name of names) {
    const ex = byName.get(name)
    const slug = slugify(name)
    const dir = path.join(OUT_IMG, slug)
    await mkdir(dir, { recursive: true })
    const images = []

    for (const [i, rel] of (ex.images ?? []).entries()) {
      const url = `${IMG_BASE}/${rel}`
      const r = await fetch(url)
      if (!r.ok) { console.warn(`  ! ${name} imagen ${i}: HTTP ${r.status}`); continue }
      const tmp = path.join(dir, `_raw${i}.jpg`)
      const out = path.join(dir, `${i}.jpg`)
      await writeFile(tmp, Buffer.from(await r.arrayBuffer()))
      // Detecta al levantador con Vision, recorta cerrado sobre él y le aplica
      // el grado "sótano" (desaturado, negros profundos, viñeta).
      try {
        await run(GRADER, [tmp, out, '640'])
      } catch {
        // Si Vision no encuentra a nadie, al menos redimensiono
        console.warn(`  · ${name} ${i}: sin detección, uso recorte central`)
        await run('sips', ['-Z', '640', '-s', 'format', 'jpeg', '-s', 'formatOptions', '74', tmp, '--out', out])
      }
      await rm(tmp)
      images.push(`ex/${slug}/${i}.jpg`)
      bytes += (await readFile(out)).length
    }

    meta[name] = {
      slug,
      images,
      primary: (ex.primaryMuscles ?? []).map((m) => es(MUSCLE_ES, m)),
      secondary: (ex.secondaryMuscles ?? []).map((m) => es(MUSCLE_ES, m)),
      equipment: es(EQUIP_ES, ex.equipment),
      instructions: ex.instructions ?? [],
    }
    console.log(`  ✓ ${name} (${images.length} fotos)`)
  }

  await writeFile(OUT_META, JSON.stringify(meta, null, 2))

  // 4. Catálogo completo (sin descargar fotos): permite añadir cualquier
  //    ejercicio a la rutina. Sus fotos se cargan del CDN la primera vez.
  const catalog = db.map((e) => ({
    name: e.name,
    images: (e.images ?? []).map((rel) => `${IMG_BASE}/${rel}`),
    primary: (e.primaryMuscles ?? []).map((m) => es(MUSCLE_ES, m)),
    secondary: (e.secondaryMuscles ?? []).map((m) => es(MUSCLE_ES, m)),
    equipment: es(EQUIP_ES, e.equipment),
  })).sort((a, b) => a.name.localeCompare(b.name))
  await writeFile(path.join(ROOT, 'public', 'catalog.json'), JSON.stringify(catalog))
  console.log(`Catálogo: ${catalog.length} ejercicios disponibles para añadir`)
  console.log(`\nListo: ${Object.keys(meta).length} ejercicios, ${(bytes / 1024 / 1024).toFixed(2)} MB de fotos`)
}

main().catch((e) => { console.error('\nERROR:', e.message); process.exit(1) })
