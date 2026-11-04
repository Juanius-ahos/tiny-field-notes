import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import './games.css'

// One tiny, slightly annoying question per reason.
// Every card has a different trick, and there is only one way out.

/** Lets the slideshow know a card's question has been answered. */
export const DoneContext = createContext<() => void>(() => {})

function Q({ q, done, answer, children }: { q: string; done: boolean; answer: string; children: ReactNode }) {
  const onDone = useContext(DoneContext)
  useEffect(() => {
    if (done) onDone()
  }, [done, onDone])
  return (
    <div className={`troll ${done ? 'troll--done' : ''}`}>
      <p className="troll__q">{q}</p>
      {done ? <p className="troll__a">✅ {answer}</p> : <div className="troll__opts">{children}</div>}
    </div>
  )
}

/* 1. The wrong answer runs away */
function Application() {
  const [done, setDone] = useState(false)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [n, setN] = useState(0)
  const flee = () => {
    setN((v) => v + 1)
    setPos({ x: (Math.random() > 0.5 ? 1 : -1) * (40 + Math.random() * 60), y: (Math.random() - 0.5) * 50 })
  }
  return (
    <Q q="Rate his application:" done={done} answer="Marked as promising. Training continues.">
      <button className="tb tb--hot" onClick={() => setDone(true)}>
        Promising 🤝
      </button>
      <button
        className="tb tb--run"
        style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
        onPointerDown={flee}
        onMouseEnter={flee}
      >
        {n === 0 ? 'Reject' : n < 3 ? 'nope 🏃' : 'stop trying 🏃‍♂️'}
      </button>
    </Q>
  )
}

/* 2. The wrong answer flips into the right one */
function Farfoura() {
  const [done, setDone] = useState(false)
  const [flipped, setFlipped] = useState(false)
  return (
    <Q q="Who is the Farfoura?" done={done} answer="Obviously. There is only one.">
      <button className="tb tb--hot" onClick={() => setDone(true)}>
        Me 🐣
      </button>
      <button
        className={`tb ${flipped ? 'tb--flip tb--hot' : ''}`}
        onClick={() => (flipped ? setDone(true) : setFlipped(true))}
      >
        {flipped ? 'Also me 🐣' : 'Someone else'}
      </button>
    </Q>
  )
}

/* 3. Wrong names cross themselves out and fall off */
function Names() {
  const [done, setDone] = useState(false)
  const [gone, setGone] = useState<string[]>([])
  const names = ['Jean Paul', 'JP', 'Juan']
  return (
    <Q q="What's his name?" done={done} answer="Juan. He answered before you finished tapping.">
      {names.map((nm) =>
        nm === 'Juan' ? (
          <button key={nm} className="tb tb--hot" onClick={() => setDone(true)}>
            Juan 🙋
          </button>
        ) : (
          <button
            key={nm}
            className={`tb ${gone.includes(nm) ? 'tb--gone' : ''}`}
            onClick={() => setGone((g) => [...g, nm])}
            disabled={gone.includes(nm)}
          >
            {nm}
          </button>
        ),
      )}
    </Q>
  )
}

/* 4. "No" keeps asking if you're sure, then gives up */
const SURE = ['No', 'Are you sure?', 'Really sure?', 'Think about it', 'Lying is a sin', 'Fine, Yes']
function Hair() {
  const [done, setDone] = useState(false)
  const [i, setI] = useState(0)
  return (
    <Q q="Does your hair smell unreasonably good?" done={done} answer="Science agrees. Case closed.">
      <button className="tb tb--hot" onClick={() => setDone(true)}>
        Yes
      </button>
      <button
        className={`tb ${i === SURE.length - 1 ? 'tb--hot' : ''}`}
        key={i}
        onClick={() => (i === SURE.length - 1 ? setDone(true) : setI(i + 1))}
      >
        {SURE[i]}
      </button>
    </Q>
  )
}

/* 5. The wrong answer turns into a slap and flies away */
function President() {
  const [done, setDone] = useState(false)
  const [kaffed, setKaffed] = useState(false)
  return (
    <Q q="Should Juan show up to your event?" done={done} answer="Wise choice. Juan stays home, cheek intact.">
      <button className="tb tb--hot" onClick={() => setDone(true)}>
        Ou3a 🙅‍♀️
      </button>
      {!kaffed ? (
        <button className="tb" onClick={() => setKaffed(true)}>
          Yes
        </button>
      ) : (
        <span className="kaff" aria-hidden="true">
          👋
        </span>
      )}
      {kaffed && <p className="troll__note">Juan has been kaffed. Try the other answer.</p>}
    </Q>
  )
}

/* 6. "La2" triggers a typing bubble that never finishes */
function Akalte() {
  const [done, setDone] = useState(false)
  const [typing, setTyping] = useState(false)
  return (
    <Q q="Akalte?" done={done} answer="Ok good bb 💛">
      <button className="tb tb--hot" onClick={() => setDone(true)}>
        Ee
      </button>
      {!typing && (
        <button className="tb" onClick={() => setTyping(true)}>
          La2
        </button>
      )}
      {typing && (
        <p className="typing">
          Juan is typing<span>.</span>
          <span>.</span>
          <span>.</span>
        </p>
      )}
      {typing && <p className="troll__note">(he will be typing forever. Just say Ee.)</p>}
    </Q>
  )
}

/* 7. Juan is calling, and the "answer" button falls asleep */
const MISSED = [1, 4, 12, 27]
function Sleep() {
  const [done, setDone] = useState(false)
  const [tries, setTries] = useState(0)
  const [asleep, setAsleep] = useState(false)
  const missed = MISSED[Math.min(tries, MISSED.length - 1)]
  const answer = () => {
    if (asleep) return
    setAsleep(true)
    setTries((n) => n + 1)
    window.setTimeout(() => setAsleep(false), 1200)
  }
  return (
    <Q
      q="📞 Juan is calling... You're asleep. What happens?"
      done={done}
      answer={`${missed} missed call${missed > 1 ? 's' : ''} from Juan. Sleep remains undefeated.`}
    >
      <div className={`phone ${asleep ? '' : 'phone--ring'}`} aria-hidden="true">
        📱 <span>Juan 🕺</span>
      </div>
      <button className="tb tb--hot" onClick={() => setDone(true)}>
        Keep sleeping 😴
      </button>
      {tries < 3 ? (
        <button className={`tb ${asleep ? 'tb--asleep' : ''}`} onClick={answer}>
          {asleep ? 'zzz 💤' : 'Answer ☀️'}
        </button>
      ) : (
        <button className="tb tb--asleep" disabled>
          the answer button fell asleep too
        </button>
      )}
      {tries > 0 && <p className="troll__note">Missed calls from Juan: {missed}</p>}
    </Q>
  )
}

/* 8. Fake loading stuck at 99% */
function Sarcasm() {
  const [done, setDone] = useState(false)
  const [p, setP] = useState(0)
  const [runs, setRuns] = useState(0)
  const [running, setRunning] = useState(false)
  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => setP((x) => Math.min(99, x + 7)), 60)
    return () => window.clearInterval(id)
  }, [running])
  // Gets stuck at 99%, waits a moment, then gives up.
  useEffect(() => {
    if (!running || p < 99) return
    const t = window.setTimeout(() => {
      setRunning(false)
      setRuns((r) => r + 1)
    }, 700)
    return () => window.clearTimeout(t)
  }, [running, p])
  const start = () => {
    if (runs >= 2) {
      setDone(true)
      return
    }
    setP(0)
    setRunning(true)
  }
  return (
    <Q q="Use your AI: was Juan being sarcastic?" done={done} answer="ERROR 418: Juan cannot be analyzed. Your AI needs a hug.">
      <div className="loader">
        <div style={{ width: `${p}%` }} />
        <span>{running ? `analyzing Juan... ${p}%` : runs ? '99% ... recalibrating 🤖' : 'ready'}</span>
      </div>
      <button className="tb tb--hot" onClick={start} disabled={running}>
        {runs === 0 ? 'Analyze' : runs === 1 ? 'Try again' : 'Try one more time'}
      </button>
    </Q>
  )
}

/* 9. The "Juan" answer leaves and is replaced */
function Smart() {
  const [done, setDone] = useState(false)
  const [left, setLeft] = useState(false)
  return (
    <Q q="Who's smarter?" done={done} answer="Correct. Juan has been informed. Oops.">
      <button className="tb tb--hot" onClick={() => setDone(true)}>
        Laety 🧠
      </button>
      {left ? (
        <button className="tb tb--hot tb--pop" onClick={() => setDone(true)}>
          Laety (again)
        </button>
      ) : (
        <button className="tb" onClick={() => setLeft(true)}>
          Juan
        </button>
      )}
      {left && <p className="troll__note">"Juan" has left the chat out of embarrassment.</p>}
    </Q>
  )
}

/* 10. Decline is microscopic and denied */
function Certified() {
  const [done, setDone] = useState(false)
  const [denied, setDenied] = useState(false)
  return (
    <Q q="Accept the official finding: love of my life?" done={done} answer="Accepted and stamped. Peer reviewed by Juan. Peer also Juan.">
      <button className="tb tb--hot tb--big" onClick={() => setDone(true)}>
        Accept 📜
      </button>
      <button className="tb--tiny" onClick={() => setDenied(true)}>
        decline
      </button>
      {denied && <p className="troll__note">Declining requires Juan's approval. Request denied.</p>}
    </Q>
  )
}

export const games = [Application, Farfoura, Names, Hair, President, Akalte, Sleep, Sarcasm, Smart, Certified]
