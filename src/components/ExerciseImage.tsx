import { useEffect, useState } from 'react'
import { getMeta, imgUrl } from '../lib/meta'

/**
 * Alterna las dos fotos del ejercicio (inicio → final) para que se vea
 * el movimiento, como un GIF. Se puede pausar tocándola.
 */
export function ExerciseImage({ dbName, className = '', autoplay = true }: { dbName: string; className?: string; autoplay?: boolean }) {
  const meta = getMeta(dbName)
  const [frame, setFrame] = useState(0)
  const [playing, setPlaying] = useState(autoplay)
  const frames = meta?.images ?? []

  // Si la tarjeta se abre o se cierra, la animación sigue ese estado
  useEffect(() => setPlaying(autoplay), [autoplay])

  useEffect(() => {
    if (!playing || frames.length < 2) return
    const t = setInterval(() => setFrame((f) => (f + 1) % frames.length), 950)
    return () => clearInterval(t)
  }, [playing, frames.length])

  if (!frames.length) {
    return (
      <div className={`flex items-center justify-center bg-ink-800 text-ink-400 text-3xl ${className}`}>🏋️</div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying((p) => !p)}
      className={`relative overflow-hidden bg-white ${className}`}
      aria-label={playing ? 'Pausar animación' : 'Reproducir animación'}
    >
      {frames.map((src, i) => (
        <img
          key={src}
          src={imgUrl(src)}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-200"
          style={{ opacity: i === frame ? 1 : 0 }}
        />
      ))}
      {!playing && autoplay && (
        <span className="absolute bottom-1.5 right-1.5 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white">
          ⏸ pausado
        </span>
      )}
    </button>
  )
}
