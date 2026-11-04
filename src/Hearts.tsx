import { useMemo, type CSSProperties } from 'react'

// Mostly paper confetti, with only a few hearts mixed in.
const COLORS = ['#f0455a', '#ffd27a', '#8fd6b0', '#a99cff', '#ff9fb2']

export default function Hearts() {
  const bits = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => {
        const kind = i % 5 === 0 ? 'heart' : i % 2 ? 'strip' : 'dot'
        return {
          id: i,
          kind,
          color: COLORS[i % COLORS.length],
          left: Math.random() * 100,
          size: kind === 'heart' ? 16 + Math.random() * 10 : 6 + Math.random() * 6,
          delay: Math.random() * 5,
          dur: 5 + Math.random() * 4,
          drift: (Math.random() - 0.5) * 90,
          spin: (Math.random() > 0.5 ? 1 : -1) * (180 + Math.random() * 360),
        }
      }),
    [],
  )

  return (
    <div className="hearts" aria-hidden="true">
      {bits.map((b) => (
        <span
          key={b.id}
          className={`bit bit--${b.kind}`}
          style={
            {
              left: `${b.left}%`,
              animationDelay: `${b.delay}s`,
              animationDuration: `${b.dur}s`,
              '--drift': `${b.drift}px`,
              '--spin': `${b.spin}deg`,
              '--size': `${b.size}px`,
              '--color': b.color,
            } as CSSProperties
          }
        >
          {b.kind === 'heart' ? '♥' : null}
        </span>
      ))}
    </div>
  )
}
