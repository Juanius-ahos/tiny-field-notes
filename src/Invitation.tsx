import { useEffect, useRef, useState } from 'react'
import { telepartyUrl } from './reasons'

function WaxSeal() {
  // Wavy-edged wax seal with a J in the middle.
  const points = Array.from({ length: 48 }, (_, i) => {
    const a = (i / 48) * Math.PI * 2
    const r = i % 2 ? 46 : 50
    return `${(60 + Math.cos(a) * r).toFixed(1)},${(60 + Math.sin(a) * r).toFixed(1)}`
  }).join(' ')
  return (
    <svg className="seal" viewBox="0 0 120 120" aria-hidden="true">
      <polygon points={points} fill="#c8323f" />
      <circle cx="60" cy="60" r="36" fill="none" stroke="#8f1f2a" strokeWidth="3" />
      <circle cx="60" cy="60" r="30" fill="#b52a36" />
      <text
        x="60"
        y="76"
        textAnchor="middle"
        fontFamily="Shrikhand, Georgia, serif"
        fontSize="44"
        fill="#ffd9c9"
      >
        J
      </text>
      <ellipse cx="44" cy="40" rx="10" ry="5" fill="#ffffff" opacity="0.18" transform="rotate(-30 44 40)" />
    </svg>
  )
}

export default function Invitation() {
  const ref = useRef<HTMLElement | null>(null)
  const [open, setOpen] = useState(false)
  const [planned, setPlanned] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setOpen(true)
          io.disconnect()
        }
      },
      { threshold: 0.2 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <section ref={ref} className={`invite-wrap ${open ? 'is-in' : ''}`}>
      <p className="invite-kicker">one more thing...</p>
      <article className="invite">
        <header className="invite__head">
          <p className="invite__dept">Department of Juan Affairs</p>
          <h2 className="invite__title">Official Invitation</h2>
          <div className="invite__rule" aria-hidden="true" />
        </header>

        <dl className="invite__memo">
          <div>
            <dt>To</dt>
            <dd>Her Royal Farfoura, Laetitia</dd>
          </div>
          <div>
            <dt>From</dt>
            <dd>Juan</dd>
          </div>
          <div>
            <dt>Subject</dt>
            <dd>A Very Important Netflix Meeting</dd>
          </div>
        </dl>

        <div className="invite__stamp" aria-hidden="true">
          attendance
          <br />
          optional
        </div>
        <p className="invite__body">Dear Farfoura,</p>
        <p className="invite__body">
          You are cordially invited to attend an extremely important entertainment session with
          Juan.
        </p>

        <dl className="invite__details">
          <div>
            <dt>Date</dt>
            <dd>Today</dd>
          </div>
          <div>
            <dt>Activity</dt>
            <dd>Netflix &amp; Teleparty</dd>
          </div>
          <div>
            <dt>Dress code</dt>
            <dd>Whatever makes you comfortable</dd>
          </div>
          <div>
            <dt>Agenda</dt>
            <dd>Watch something, laugh a little, enjoy some company.</dd>
          </div>
        </dl>

        <p className="invite__body">
          Your presence would be very much appreciated, although attendance is entirely optional.
          Please consider this your official invitation.
        </p>

        <div className="invite__sign">
          <p className="invite__body">Respectfully submitted,</p>
          <p className="invite__name">Juan</p>
          <p className="invite__role">
            Chief Executive Officer of Missing Your Movie Recommendations (unofficially)
          </p>
        </div>

        <WaxSeal />

        <div className="invite__actions">
          {telepartyUrl ? (
            <a className="invite__btn" href={telepartyUrl} target="_blank" rel="noopener noreferrer">
              Accept Invitation
            </a>
          ) : planned ? (
            <p className="invite__note" role="status">
              Noted by the Department. Send Juan a message whenever suits you, no rush.
            </p>
          ) : (
            <button className="invite__btn" onClick={() => setPlanned(true)}>
              Let's plan it
            </button>
          )}
        </div>
      </article>
    </section>
  )
}
