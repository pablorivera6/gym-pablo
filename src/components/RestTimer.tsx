import { useEffect, useRef, useState } from 'react'

/** Cronómetro de descanso entre series. Vibra al terminar. */
export function RestTimer({ seconds, vibrate, accent }: { seconds: number; vibrate: boolean; accent: string }) {
  const [left, setLeft] = useState(0)
  const [running, setRunning] = useState(false)
  const endRef = useRef(0)

  useEffect(() => {
    if (!running) return
    const tick = () => {
      const remaining = Math.max(0, Math.round((endRef.current - Date.now()) / 1000))
      setLeft(remaining)
      if (remaining === 0) {
        setRunning(false)
        if (vibrate && 'vibrate' in navigator) navigator.vibrate([200, 100, 200])
      }
    }
    tick()
    const t = setInterval(tick, 250)
    return () => clearInterval(t)
  }, [running, vibrate])

  const start = (s: number) => {
    endRef.current = Date.now() + s * 1000
    setLeft(s)
    setRunning(true)
  }

  const mm = String(Math.floor(left / 60)).padStart(1, '0')
  const ss = String(left % 60).padStart(2, '0')
  const pct = running ? (left / seconds) * 100 : 0

  return (
    <div className="flex items-center gap-2">
      {running ? (
        <>
          <div className="relative flex-1 h-11 rounded bg-ink-800 overflow-hidden">
            <div className="absolute inset-y-0 left-0 transition-[width] duration-300" style={{ width: `${pct}%`, background: accent, opacity: 0.22 }} />
            <div className="relative h-full flex items-center justify-center numeral text-xl tracking-wider">
              {mm}:{ss}
            </div>
          </div>
          <button onClick={() => start(left + 30)} className="h-11 px-3 rounded-sm bg-ink-800 numeral text-sm text-ink-200">+30s</button>
          <button onClick={() => setRunning(false)} className="h-11 px-3 rounded-sm bg-ink-800 numeral text-sm text-ink-200">✕</button>
        </>
      ) : (
        <button onClick={() => start(seconds)} className="flex-1 h-11 rounded-sm bg-ink-800 label text-[10px] text-ink-200 active:scale-[.98] transition-transform">
          Descanso {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}
        </button>
      )}
    </div>
  )
}
