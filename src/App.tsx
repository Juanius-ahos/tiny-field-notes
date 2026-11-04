import { useEffect, useState } from 'react'
import { finalLines, footerLine, meterLabels, reasons, signature } from './reasons'
import Invitation from './Invitation'
import { DoneContext, games } from './Games'
import Hearts from './Hearts'
import './slides.css'

const TOTAL = reasons.length
// Each card gets its own 3D entrance, cycling through these.
const ENTRANCES = ['flip-up', 'swing-left', 'spin-right', 'drop-in', 'swing-right']
const HERO = -1
const END = TOTAL

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
  const [step, setStep] = useState(HERO)
  const [solved, setSolved] = useState<Set<number>>(() => new Set())
  const [finalIn, setFinalIn] = useState(false)

  const go = (s: number) => {
    setStep(s)
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }

  // Let the closing lines animate in after the ending screen mounts.
  useEffect(() => {
    if (step !== END) {
      setFinalIn(false)
      return
    }
    const t = window.setTimeout(() => setFinalIn(true), 60)
    return () => window.clearTimeout(t)
  }, [step])

  const unlocked = step >= 0 && step < TOTAL && solved.has(step)

  return (
    <>
      <Meter shown={solved.size} />

      {step === HERO && (
        <header className="hero">
          <p className="hero__kicker">a very official list by Juan</p>
          <h1 className="hero__title">
            10 Reasons Why I Love <span className="hero__name">Laety</span>
          </h1>
          <p className="hero__sub">ranked in no particular order (they're all number 1)</p>
          <button className="start" onClick={() => go(0)}>
            open the list 💌
          </button>
          <p className="start__note">answer each one to unlock the next</p>
        </header>
      )}

      {step >= 0 && step < TOTAL && (
        <main className="stage">
          {/* All cards stay mounted so answers are remembered when going back. */}
          {reasons.map((r, i) => {
            const Game = games[i]
            return (
              <section key={i} className={`slot ${i === step ? 'is-active' : ''}`} aria-hidden={i !== step}>
                <div className="tilt">
                  <article className={`card card--c${i % 4} enter--${ENTRANCES[i % ENTRANCES.length]}`}>
                    <div className="card__num">
                      <span>#</span>
                      {i + 1}
                    </div>
                    <div className="card__emoji" aria-hidden="true">
                      {r.emoji}
                    </div>
                    <h2 className="card__title">{r.title}</h2>
                    <p className="card__line">{r.line}</p>
                    <DoneContext.Provider value={() => setSolved((s) => (s.has(i) ? s : new Set(s).add(i)))}>
                      {Game && <Game />}
                    </DoneContext.Provider>
                    <div className="card__shine" aria-hidden="true" />
                  </article>
                </div>
              </section>
            )
          })}

          <nav className="pager" aria-label="Cards">
            <button className="pager__btn" onClick={() => go(step - 1)}>
              ← {step === 0 ? 'start' : 'back'}
            </button>
            <span className="pager__count">
              {step + 1} / {TOTAL}
            </span>
            <button className="pager__btn pager__btn--next" onClick={() => go(step + 1)} disabled={!unlocked}>
              {unlocked ? (step === TOTAL - 1 ? 'the end →' : 'next →') : '🔒'}
            </button>
          </nav>
          {!unlocked && <p className="pager__hint">answer the question to unlock the next one</p>}
        </main>
      )}

      {step === END && (
        <main className="cards">
          <button className="pager__btn pager__back" onClick={() => go(TOTAL - 1)}>
            ← back to the list
          </button>
          <section className={`final ${finalIn ? 'is-in' : ''}`}>
            {finalIn && <Hearts />}
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
              <p className="final__line final__sig" style={{ transitionDelay: `${finalLines.length * 0.9}s` }}>
                {signature}
              </p>
            </div>
            <p className="final__more" aria-hidden="true">
              keep scrolling ↓
            </p>
          </section>

          <Invitation />
          <footer className="footer">{footerLine}</footer>
        </main>
      )}
    </>
  )
}
