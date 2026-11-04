import { useEffect, useRef, useState } from 'react'
import { finalLines, footerLine, meterLabels, reasons, signature } from './reasons'
import Invitation from './Invitation'
import { games } from './Games'
import Hearts from './Hearts'

const TOTAL = reasons.length
// Each card gets its own 3D entrance, cycling through these.
const ENTRANCES = ['flip-up', 'swing-left', 'spin-right', 'drop-in', 'swing-right']

function Meter({ shown }: { shown: number }) {
  const over = shown >= TOTAL
  const [overPct, setOverPct] = useState(100)

  useEffect(() => {
    if (!over) return
    let v = 100
    const id = window.setInterval(() => {
      v += Math.ceil(Math.random() * 37)
      if (v >= 999) {
        v = 999
        window.clearInterval(id)
      }
      setOverPct(v)
    }, 70)
    return () => window.clearInterval(id)
  }, [over])

  const pct = over ? overPct : Math.round((shown / TOTAL) * 100)
  const label = shown === 0 ? 'warming up' : meterLabels[shown - 1]

  return (
    <div className={`meter ${over ? 'meter--over' : ''}`} role="status" aria-live="polite">
      <div className="meter__top">
        <span className="meter__name">Love Overload Meter</span>
        <span className="meter__pct" data-text={`${pct}%`}>
          {pct}%
        </span>
      </div>
      <div className="meter__track">
        <div className="meter__fill" style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <div className="meter__label" data-text={label}>
        {label}
      </div>
    </div>
  )
}

export default function App() {
  const [seen, setSeen] = useState<Set<number>>(() => new Set())
  const [finalSeen, setFinalSeen] = useState(false)
  const slotRefs = useRef<(HTMLElement | null)[]>([])
  const finalRef = useRef<HTMLElement | null>(null)

  // Reveal each card once its slot scrolls into the middle of the screen.
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          const el = e.target as HTMLElement
          if (el === finalRef.current) {
            setFinalSeen(true)
          } else {
            const i = Number(el.dataset.index)
            setSeen((s) => (s.has(i) ? s : new Set(s).add(i)))
          }
          io.unobserve(el)
        }
      },
      { rootMargin: '0px 0px -35% 0px', threshold: 0.15 },
    )
    slotRefs.current.forEach((el) => el && io.observe(el))
    if (finalRef.current) io.observe(finalRef.current)
    return () => io.disconnect()
  }, [])

  // Tilt revealed cards slightly as they move through the screen.
  useEffect(() => {
    let raf = 0
    const update = () => {
      raf = 0
      const vh = window.innerHeight
      slotRefs.current.forEach((el) => {
        if (!el) return
        const r = el.getBoundingClientRect()
        // -1 when the slot is at the bottom of the screen, 1 at the top
        const t = Math.max(-1, Math.min(1, (vh / 2 - (r.top + r.height / 2)) / (vh / 2)))
        el.style.setProperty('--scroll', t.toFixed(3))
      })
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])

  const shown = seen.size

  return (
    <>
      <Meter shown={shown} />

      <header className="hero">
        <p className="hero__kicker">a very official list by Juan</p>
        <h1 className="hero__title">
          10 Reasons Why I Love <span className="hero__name">Laety</span>
        </h1>
        <p className="hero__sub">ranked in no particular order (they're all number 1)</p>
        <div className="hero__scroll" aria-hidden="true">
          keep scrolling
          <span className="hero__arrow">↓</span>
        </div>
      </header>

      <main className="cards">
        {reasons.map((r, i) => (
          <section
            key={i}
            data-index={i}
            ref={(el) => {
              slotRefs.current[i] = el
            }}
            className={`slot ${seen.has(i) ? 'is-in' : ''}`}
          >
            <div className="tilt">
              <article
                className={`card card--c${i % 4} enter--${ENTRANCES[i % ENTRANCES.length]}`}
              >
                <div className="card__num">
                  <span>#</span>
                  {i + 1}
                </div>
                <div className="card__emoji" aria-hidden="true">
                  {r.emoji}
                </div>
                <h2 className="card__title">{r.title}</h2>
                <p className="card__line">{r.line}</p>
                {(() => {
                  const Game = games[i]
                  return Game ? (
                    <Game />
                  ) : null
                })()}
                <div className="card__shine" aria-hidden="true" />
              </article>
            </div>
          </section>
        ))}

        <section ref={finalRef} className={`final ${finalSeen ? 'is-in' : ''}`}>
          {finalSeen && <Hearts />}
          <div className="final__lines">
            {finalLines.map((l, i) => (
              <p
                key={i}
                className={`final__line ${l.startsWith('P.S.') ? 'final__ps' : ''}`}
                style={{ transitionDelay: `${i * 0.9}s` }}
              >
                {l}
              </p>
            ))}
            <p
              className="final__line final__sig"
              style={{ transitionDelay: `${finalLines.length * 0.9}s` }}
            >
              {signature}
            </p>
          </div>
        </section>

        <Invitation />
      </main>

      <footer className="footer">{footerLine}</footer>
    </>
  )
}
