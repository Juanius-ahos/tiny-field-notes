import { useEffect, useRef, useState, type PointerEvent as RPointerEvent, type ReactNode } from 'react'
import './games.css'

// One small game per reason. Each has a goal, a way to fail, and a replay.

type GameProps = { onWin: () => void }

const rand = (a: number, b: number) => a + Math.random() * (b - a)
const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]

/** Runs a callback every `ms` while `on` is true; cleans up after itself. */
function useTick(on: boolean, ms: number, fn: () => void) {
  const saved = useRef(fn)
  saved.current = fn
  useEffect(() => {
    if (!on) return
    const id = window.setInterval(() => saved.current(), ms)
    return () => window.clearInterval(id)
  }, [on, ms])
}

/** Calls onWin once per win (replays can win again without double counting upstream). */
function useWin(onWin: () => void) {
  const [won, setWon] = useState(false)
  const win = () => {
    setWon(true)
    onWin()
  }
  return [won, win, () => setWon(false)] as const
}

function Shell(props: {
  title: string
  hint: string
  status?: ReactNode
  won: boolean
  winText: string
  onReplay?: () => void
  children: ReactNode
}) {
  return (
    <div className={`game ${props.won ? 'game--done' : ''}`}>
      <div className="game__head">
        <span className="game__title">🎮 {props.title}</span>
        {props.status && <span className="game__status">{props.status}</span>}
      </div>
      <p className="game__hint">{props.won ? '🏅 ' + props.winText : props.hint}</p>
      <div className="game__stage">{props.children}</div>
      {props.won && props.onReplay && (
        <button className="game__replay" onClick={props.onReplay}>
          play again ↺
        </button>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 1. Kitchen Hall of Fame: catch the falling kisses, dodge the pans   */
/* ------------------------------------------------------------------ */
type Faller = { id: number; x: number; y: number; v: number; e: string; kiss: boolean}
function KitchenCatch({ onWin }: GameProps) {
  const GOAL = 5
  const [won, win, unwin] = useWin(onWin)
  const [on, setOn] = useState(false)
  const [items, setItems] = useState<Faller[]>([])
  const [caught, setCaught] = useState(0)
  const [lives, setLives] = useState(3)
  const [msg, setMsg] = useState('')
  const nextId = useRef(0)
  const spawnIn = useRef(0)

  useTick(on, 40, () => {
    // Decide on a new item outside the state updater so the updater stays pure.
    spawnIn.current -= 40
    let fresh: Faller | null = null
    if (spawnIn.current <= 0) {
      spawnIn.current = rand(420, 750)
      const kiss = Math.random() < 0.42
      fresh = {
        id: nextId.current++,
        x: rand(4, 82),
        y: -14,
        v: rand(1.6, 2.6) + caught * 0.25,
        e: kiss ? '💋' : pick(['🍳', '🥄', '🧂', '🔪', '🥫']),
        kiss,
      }
    }
    setItems((list) => {
      const out = list.map((f) => ({ ...f, y: f.y + f.v })).filter((f) => f.y < 112)
      return fresh ? [...out, fresh] : out
    })
  })

  const start = () => {
    unwin()
    setItems([])
    setCaught(0)
    setLives(3)
    setMsg('')
    spawnIn.current = 0
    setOn(true)
  }

  const tap = (f: Faller) => {
    if (!on) return
    setItems((list) => list.filter((x) => x.id !== f.id))
    if (f.kiss) {
      const c = caught + 1
      setCaught(c)
      if (c >= GOAL) {
        setOn(false)
        setItems([])
        win()
      }
    } else {
      const l = lives - 1
      setLives(l)
      setMsg('Ouch! That was a ' + f.e)
      if (l <= 0) {
        setOn(false)
        setItems([])
        setMsg('Kitchen chaos. The pans won this round.')
      }
    }
  }

  return (
    <Shell
      title="Kitchen Catch"
      hint="Tap the falling 💋 kisses. Don't touch the kitchen stuff."
      status={
        <>
          💋 {caught}/{GOAL} · {'❤'.repeat(Math.max(0, lives))}
        </>
      }
      won={won}
      winText="5 kisses caught. The kitchen remains undefeated."
      onReplay={start}
    >
      <div className="arena">
        {items.map((f) => (
          <button
            key={f.id}
            className={`faller ${f.kiss ? 'faller--kiss' : ''}`}
            style={{ left: `${f.x}%`, top: `${f.y}%` }}
            onPointerDown={() => tap(f)}
            aria-label={f.kiss ? 'kiss' : 'kitchen item'}
          >
            {f.e}
          </button>
        ))}
        {!on && !won && (
          <div className="arena__overlay">
            {msg && <p className="game__out">{msg}</p>}
            <button className="game__chip game__chip--hot" onClick={start}>
              {msg ? 'try again' : 'start'}
            </button>
          </div>
        )}
        {on && msg && <p className="arena__toast">{msg}</p>}
        {won && <div className="arena__overlay arena__overlay--win">🏆</div>}
      </div>
    </Shell>
  )
}

/* ------------------------------------------------------------------ */
/* 2. Farfoura: shell game, track the egg with the chick               */
/* ------------------------------------------------------------------ */
function FindFarfoura({ onWin }: GameProps) {
  const [won, win, unwin] = useWin(onWin)
  const [slots, setSlots] = useState([0, 1, 2]) // slots[eggId] = position
  const [chick, setChick] = useState(1)
  const [phase, setPhase] = useState<'idle' | 'show' | 'shuffle' | 'pick' | 'wrong'>('idle')
  const [picked, setPicked] = useState<number | null>(null)
  const [round, setRound] = useState(0)
  const timers = useRef<number[]>([])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const start = () => {
    unwin()
    timers.current.forEach(clearTimeout)
    timers.current = []
    const c = Math.floor(Math.random() * 3)
    setChick(c)
    setPicked(null)
    setPhase('show')
    const swaps = 6 + round
    const speed = Math.max(230, 380 - round * 40)
    let s = [0, 1, 2]
    setSlots(s)
    for (let i = 0; i < swaps; i++) {
      timers.current.push(
        window.setTimeout(() => {
          setPhase('shuffle')
          const a = Math.floor(Math.random() * 3)
          const b = (a + 1 + Math.floor(Math.random() * 2)) % 3
          s = [...s]
          ;[s[a], s[b]] = [s[b], s[a]]
          setSlots(s)
        }, 1100 + i * speed),
      )
    }
    timers.current.push(window.setTimeout(() => setPhase('pick'), 1100 + swaps * speed + 150))
  }

  const choose = (egg: number) => {
    if (phase !== 'pick') return
    setPicked(egg)
    if (egg === chick) {
      setPhase('idle')
      setRound((r) => r + 1)
      win()
    } else {
      setPhase('wrong')
    }
  }

  const reveal = phase === 'show' || phase === 'wrong' || won
  return (
    <Shell
      title="Find the Farfoura"
      hint={
        phase === 'pick'
          ? 'Which egg is she in?'
          : phase === 'wrong'
            ? "That's just an egg. Farfoura is somewhere else."
            : 'Watch the egg with the chick. Then find her.'
      }
      status={round > 0 ? `level ${round + 1}` : undefined}
      won={won}
      winText="Found her. There is only one Farfoura."
      onReplay={start}
    >
      <div className="shells">
        {[0, 1, 2].map((egg) => (
          <button
            key={egg}
            className={`shell ${phase === 'pick' ? 'shell--pick' : ''} ${picked === egg ? 'shell--picked' : ''}`}
            style={{ left: `calc(${slots[egg] * 33.33}% + 16.66% - 30px)` }}
            onClick={() => choose(egg)}
            aria-label={`egg ${egg + 1}`}
          >
            <span className="shell__egg">{reveal && egg === chick ? '🐣' : '🥚'}</span>
          </button>
        ))}
      </div>
      {(phase === 'idle' || phase === 'wrong') && !won && (
        <button className="game__chip game__chip--hot" onClick={start}>
          {phase === 'wrong' ? 'try again' : 'start'}
        </button>
      )}
    </Shell>
  )
}

/* ------------------------------------------------------------------ */
/* 3. Juan: reaction test, tap only when the right name shows up       */
/* ------------------------------------------------------------------ */
const NOT_JUAN = ['Jean Paul', 'JP', 'Jean', 'Monsieur Paul', 'Paulo', 'Jean-Pierre?', 'Juana']
function NameReflex({ onWin }: GameProps) {
  const [won, win, unwin] = useWin(onWin)
  const [phase, setPhase] = useState<'idle' | 'run' | 'fail'>('idle')
  const [name, setName] = useState('ready?')
  const [msg, setMsg] = useState('')
  const [best, setBest] = useState<number | null>(null)
  const shownAt = useRef(0)
  const timer = useRef<number | null>(null)

  const clear = () => {
    if (timer.current) window.clearTimeout(timer.current)
  }
  useEffect(() => clear, [])

  const step = (left: number) => {
    if (left <= 0) {
      setName('Juan')
      shownAt.current = performance.now()
      timer.current = window.setTimeout(() => {
        setPhase('fail')
        setMsg('Too slow! He already answered.')
      }, 1100)
      return
    }
    setName(pick(NOT_JUAN))
    timer.current = window.setTimeout(() => step(left - 1), rand(550, 900))
  }

  const start = () => {
    unwin()
    clear()
    setMsg('')
    setPhase('run')
    setName('...')
    timer.current = window.setTimeout(() => step(Math.floor(rand(3, 7))), 600)
  }

  const tap = () => {
    if (phase !== 'run') return
    clear()
    if (name === 'Juan') {
      const ms = Math.round(performance.now() - shownAt.current)
      setBest((b) => (b === null ? ms : Math.min(b, ms)))
      setMsg(`${ms} ms`)
      setPhase('idle')
      win()
    } else {
      setPhase('fail')
      setMsg(`"${name}"? He doesn't answer to that anymore.`)
    }
  }

  return (
    <Shell
      title="Name Reflex"
      hint="Tap the screen ONLY when his real name appears."
      status={best !== null ? `best ${best} ms` : undefined}
      won={won}
      winText={`Reacted in ${msg}. Faster than Jean Paul ever did.`}
      onReplay={start}
    >
      <button
        className={`reflex ${phase === 'run' && name === 'Juan' ? 'reflex--go' : ''}`}
        onPointerDown={tap}
        disabled={phase !== 'run'}
      >
        {phase === 'run' ? name : won ? '🙋 Juan!' : phase === 'fail' ? '😬' : 'ready?'}
      </button>
      {phase === 'fail' && <p className="game__out">{msg}</p>}
      {phase !== 'run' && !won && (
        <button className="game__chip game__chip--hot" onClick={start}>
          {phase === 'fail' ? 'try again' : 'start'}
        </button>
      )}
    </Shell>
  )
}

/* ------------------------------------------------------------------ */
/* 4. Hair: hold to lean in, release in the sweet spot                 */
/* ------------------------------------------------------------------ */
function LeanIn({ onWin }: GameProps) {
  const [won, win, unwin] = useWin(onWin)
  const [p, setP] = useState(0)
  const [holding, setHolding] = useState(false)
  const [msg, setMsg] = useState('')
  const pRef = useRef(0)
  const ZONE: [number, number] = [72, 86]

  useTick(holding, 30, () => {
    // speeds up the longer you hold
    const nv = pRef.current + 0.8 + pRef.current * 0.03
    pRef.current = nv
    setP(Math.min(100, nv))
    if (nv >= 100) {
      setHolding(false)
      setMsg('Way too close. Now it is weird. 😳')
    }
  })

  const down = () => {
    if (won) return
    pRef.current = 0
    setP(0)
    setMsg('')
    setHolding(true)
  }
  const up = () => {
    if (!holding) return
    setHolding(false)
    const v = pRef.current
    if (v < ZONE[0]) setMsg(v < 30 ? 'That was a polite distance. Lean in more.' : 'Almost. A little closer.')
    else if (v > ZONE[1]) setMsg('Too close. Personal space has left the chat.')
    else {
      setMsg('')
      win()
    }
  }

  return (
    <Shell
      title="The Perfect Lean"
      hint="Hold to lean in. Let go inside the green zone."
      won={won}
      winText="Perfect lean. Unreasonably good, scientifically confirmed."
      onReplay={() => {
        unwin()
        pRef.current = 0
        setP(0)
      }}
    >
      <div className="lean">
        <div className="lean__zone" style={{ left: `${ZONE[0]}%`, width: `${ZONE[1] - ZONE[0]}%` }} />
        <div className="lean__fill" style={{ width: `${p}%` }} />
        <span className="lean__face" style={{ left: `calc(${p}% - 14px)` }}>
          {won ? '😌' : p > ZONE[1] ? '😳' : '🙂'}
        </span>
        <span className="lean__hair">💇‍♀️</span>
      </div>
      <p className="game__out">{msg || ' '}</p>
      {!won && (
        <button
          className={`game__chip game__chip--hold ${holding ? 'is-holding' : ''}`}
          onPointerDown={down}
          onPointerUp={up}
          onPointerLeave={up}
          onPointerCancel={up}
          onContextMenu={(e) => e.preventDefault()}
        >
          {holding ? 'leaning...' : 'hold to lean in 👃'}
        </button>
      )}
    </Shell>
  )
}

/* ------------------------------------------------------------------ */
/* 5. October 2023: three-reel slot, stop each reel yourself           */
/* ------------------------------------------------------------------ */
const REEL = ['🍂', '☕', '📅', '🎃', '🌧️', '💛']
function OctoberSlots({ onWin }: GameProps) {
  const [won, win, unwin] = useWin(onWin)
  const [reels, setReels] = useState([0, 2, 4])
  const [spinning, setSpinning] = useState([false, false, false])
  const [tries, setTries] = useState(0)
  const [msg, setMsg] = useState('')
  const anySpin = spinning.some(Boolean)
  const HEART = REEL.length - 1

  useTick(anySpin, 80, () => {
    setReels((r) => r.map((v, i) => (spinning[i] ? (v + 1) % REEL.length : v)))
  })

  const spin = () => {
    unwin()
    setMsg('')
    setTries((t) => t + 1)
    setSpinning([true, true, true])
  }

  const stop = () => {
    const i = spinning.indexOf(true)
    if (i < 0) return
    // Lady luck likes her: the odds of a heart go up every try.
    const luck = Math.min(0.9, 0.35 + tries * 0.18)
    const next = [...reels]
    if (Math.random() < luck) next[i] = HEART
    setReels(next)
    const s = [...spinning]
    s[i] = false
    setSpinning(s)
    if (!s.some(Boolean)) {
      if (next.every((v) => v === HEART)) win()
      else setMsg(pick(['So close. October is trying its best.', 'Not quite. Spin again.', 'October 2023 says: one more try.']))
    }
  }

  return (
    <Shell
      title="October Jackpot"
      hint="Spin, then stop each reel. Line up three 💛 to win."
      status={tries > 0 ? `spins: ${tries}` : undefined}
      won={won}
      winText="JACKPOT. Best thing in October 2023: you."
      onReplay={spin}
    >
      <div className={`slots ${won ? 'slots--win' : ''}`}>
        {reels.map((v, i) => (
          <div key={i} className={`slots__reel ${spinning[i] ? 'is-spinning' : ''}`}>
            {REEL[v]}
          </div>
        ))}
      </div>
      <p className="game__out">{msg || ' '}</p>
      {!won &&
        (anySpin ? (
          <button className="game__chip game__chip--hot" onPointerDown={stop}>
            STOP reel {spinning.indexOf(true) + 1}
          </button>
        ) : (
          <button className="game__chip game__chip--hot" onClick={spin}>
            {tries ? 'spin again' : 'spin'}
          </button>
        ))}
    </Shell>
  )
}

/* ------------------------------------------------------------------ */
/* 6. Sarcasm: be a better sarcasm detector than the AI                */
/* ------------------------------------------------------------------ */
const QUOTES: { q: string; sarcastic: boolean; note: string }[] = [
  { q: "I'm a morning person.", sarcastic: true, note: 'Absolutely sarcastic.' },
  { q: 'Your laugh is my favourite sound.', sarcastic: false, note: '100% serious.' },
  { q: 'I fully understood your last AI project.', sarcastic: true, note: 'Sarcastic. He nodded a lot though.' },
  { q: "You're ridiculously cute.", sarcastic: false, note: 'Serious. Peer reviewed.' },
  { q: 'Building this website was easy.', sarcastic: true, note: 'Very sarcastic.' },
]
function SarcasmDetector({ onWin }: GameProps) {
  const [won, win, unwin] = useWin(onWin)
  const [i, setI] = useState(0)
  const [score, setScore] = useState(0)
  const [feedback, setFeedback] = useState<null | { ok: boolean; note: string }>(null)

  const answer = (sarcastic: boolean) => {
    if (feedback) return
    const cur = QUOTES[i]
    const ok = cur.sarcastic === sarcastic
    if (ok) setScore((s) => s + 1)
    setFeedback({ ok, note: cur.note })
    window.setTimeout(() => {
      setFeedback(null)
      if (i + 1 >= QUOTES.length) win()
      else setI(i + 1)
    }, 1100)
  }

  return (
    <Shell
      title="Human vs. AI"
      hint="Your AI detects sarcasm at 90%. Can you beat it on Juan?"
      status={`${Math.min(i + 1, QUOTES.length)}/${QUOTES.length} · score ${score}`}
      won={won}
      winText={`You scored ${score}/${QUOTES.length}. The AI scored 0 on Juan. Human wins.`}
      onReplay={() => {
        unwin()
        setI(0)
        setScore(0)
      }}
    >
      {!won && (
        <>
          <p className={`game__quote ${feedback ? (feedback.ok ? 'is-ok' : 'is-bad') : ''}`} key={i}>
            Juan: "{QUOTES[i].q}"
          </p>
          <p className="game__out">{feedback ? (feedback.ok ? '✅ ' : '❌ ') + feedback.note : ' '}</p>
          <div className="game__row">
            <button className="game__chip" onClick={() => answer(true)}>
              sarcastic 🙄
            </button>
            <button className="game__chip game__chip--hot" onClick={() => answer(false)}>
              serious 💛
            </button>
          </div>
        </>
      )}
    </Shell>
  )
}

/* ------------------------------------------------------------------ */
/* 7. Sleep: whack the alarms before they wake you up                  */
/* ------------------------------------------------------------------ */
function SnoozeDefense({ onWin }: GameProps) {
  const TOTAL = 10
  const NEED = 7
  const [won, win, unwin] = useWin(onWin)
  const [on, setOn] = useState(false)
  const [cell, setCell] = useState<number | null>(null)
  const [spawned, setSpawned] = useState(0)
  const [hits, setHits] = useState(0)
  const [result, setResult] = useState('')
  const timer = useRef<number | null>(null)
  const hitsRef = useRef(0)

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])

  const next = (n: number) => {
    if (n >= TOTAL) {
      setOn(false)
      setCell(null)
      if (hitsRef.current >= NEED) win()
      else setResult(`Snoozed ${hitsRef.current}/${TOTAL}. You woke up. Tragic.`)
      return
    }
    setSpawned(n + 1)
    setCell((c) => {
      let v = Math.floor(Math.random() * 9)
      if (v === c) v = (v + 4) % 9
      return v
    })
    timer.current = window.setTimeout(() => next(n + 1), Math.max(560, 950 - n * 40))
  }

  const start = () => {
    unwin()
    setResult('')
    setHits(0)
    hitsRef.current = 0
    setOn(true)
    next(0)
  }

  const smack = (i: number) => {
    if (!on || i !== cell) return
    hitsRef.current += 1
    setHits(hitsRef.current)
    setCell(null)
  }

  return (
    <Shell
      title="Snooze Defense"
      hint={`Alarms are ringing. Smack ${NEED} of ${TOTAL} to stay asleep.`}
      status={on || hits ? `💤 ${hits} · ⏰ ${spawned}/${TOTAL}` : undefined}
      won={won}
      winText={`Snoozed ${hits}/${TOTAL}. Elite sleeper. Cardio complete.`}
      onReplay={start}
    >
      <div className="grid9">
        {Array.from({ length: 9 }, (_, i) => (
          <button key={i} className={`grid9__cell ${cell === i ? 'is-ringing' : ''}`} onPointerDown={() => smack(i)}>
            {cell === i ? '⏰' : won ? '😴' : ''}
          </button>
        ))}
      </div>
      {result && <p className="game__out">{result}</p>}
      {!on && !won && (
        <button className="game__chip game__chip--hot" onClick={start}>
          {result ? 'try again' : 'start'}
        </button>
      )}
    </Shell>
  )
}

/* ------------------------------------------------------------------ */
/* 8. That laugh: time the laugh so Juan's joke lands                  */
/* ------------------------------------------------------------------ */
const JOKES = ['Why did the scarecrow win an award?', 'I told my alarm a joke. It didn\'t laugh.', 'Parallel lines have so much in common...']
function LaughTiming({ onWin }: GameProps) {
  const GOAL = 3
  const [won, win, unwin] = useWin(onWin)
  const [on, setOn] = useState(false)
  const [pos, setPos] = useState(0)
  const [hits, setHits] = useState(0)
  const [msg, setMsg] = useState('')
  const t = useRef(0)
  const zone: [number, number] = [42, 58]

  useTick(on, 16, () => {
    t.current += 0.035 + hits * 0.012
    setPos(50 + Math.sin(t.current) * 48)
  })

  const tap = () => {
    if (!on) return
    if (pos >= zone[0] && pos <= zone[1]) {
      const h = hits + 1
      setHits(h)
      setMsg(pick(['😂 HAHA', '🤣 landed!', '😆 she laughed!']))
      if (h >= GOAL) {
        setOn(false)
        win()
      }
    } else {
      setMsg(pick(['*awkward silence*', '*crickets* 🦗', '*polite smile*']))
    }
  }

  return (
    <Shell
      title="Laugh Track"
      hint="Juan's jokes need help. Tap LAUGH when the marker is in the zone."
      status={`😂 ${hits}/${GOAL}`}
      won={won}
      winText="3 laughs landed. Comedy saved, as usual."
      onReplay={() => {
        unwin()
        setHits(0)
        setMsg('')
        setOn(true)
      }}
    >
      {!won && <p className="game__quote">Juan: "{JOKES[Math.min(hits, JOKES.length - 1)]}"</p>}
      <div className="track">
        <div className="track__zone" style={{ left: `${zone[0]}%`, width: `${zone[1] - zone[0]}%` }}>
          LOL
        </div>
        <div className="track__marker" style={{ left: `${pos}%` }} />
      </div>
      <p className="game__out">{msg || ' '}</p>
      {!won &&
        (on ? (
          <button className="game__chip game__chip--hot" onPointerDown={tap}>
            LAUGH 😂
          </button>
        ) : (
          <button className="game__chip game__chip--hot" onClick={() => setOn(true)}>
            start
          </button>
        ))}
    </Shell>
  )
}

/* ------------------------------------------------------------------ */
/* 9. Smarter: beat Juan at quick maths against the clock              */
/* ------------------------------------------------------------------ */
const QUIZ = [
  { q: '7 × 8', a: '56', opts: ['54', '56', '58'], juan: '54', why: 'felt right' },
  { q: '15% of 200', a: '30', opts: ['20', '30', '35'], juan: '20', why: 'rounded with confidence' },
  { q: '√144', a: '12', opts: ['72', '14', '12'], juan: '72', why: 'half of 144, surely' },
]
function QuickMaths({ onWin }: GameProps) {
  const [won, win, unwin] = useWin(onWin)
  const [on, setOn] = useState(false)
  const [i, setI] = useState(0)
  const [score, setScore] = useState(0)
  const [time, setTime] = useState(100)
  const [msg, setMsg] = useState('')
  const [lost, setLost] = useState(false)
  const scoreRef = useRef(0)

  const advance = (ok: boolean, note: string) => {
    if (ok) scoreRef.current += 1
    setScore(scoreRef.current)
    setMsg(note)
    if (i + 1 >= QUIZ.length) {
      setOn(false)
      if (scoreRef.current >= 2) win()
      else setLost(true)
    } else {
      setI(i + 1)
      timeRef.current = 100
      setTime(100)
    }
  }

  const timeRef = useRef(100)
  useTick(on, 50, () => {
    timeRef.current -= 1.4
    setTime(Math.max(0, timeRef.current))
    if (timeRef.current <= 0) {
      timeRef.current = 100
      advance(false, "⏱ Time's up. Juan is celebrating.")
    }
  })

  const start = () => {
    unwin()
    scoreRef.current = 0
    setScore(0)
    setI(0)
    timeRef.current = 100
    setTime(100)
    setMsg('')
    setLost(false)
    setOn(true)
  }

  const cur = QUIZ[i]
  return (
    <Shell
      title="Quick Maths: Laety vs. Juan"
      hint="Juan already answered. Beat him before the timer runs out."
      status={on || score ? `Laety ${score} · Juan 0` : undefined}
      won={won}
      winText={`Laety ${score}, Juan 0. Shocking to absolutely nobody.`}
      onReplay={start}
    >
      {on && (
        <>
          <div className="timer">
            <div style={{ width: `${time}%` }} />
          </div>
          <p className="quiz__q">{cur.q} = ?</p>
          <p className="quiz__juan">
            Juan says <b>{cur.juan}</b> ({cur.why})
          </p>
          <div className="game__row">
            {cur.opts.map((o) => (
              <button
                key={o}
                className="game__chip"
                onClick={() => advance(o === cur.a, o === cur.a ? '✅ Correct. Juan is reconsidering his life.' : '❌ Oh no, you think like Juan.')}
              >
                {o}
              </button>
            ))}
          </div>
        </>
      )}
      {msg && <p className="game__out">{msg}</p>}
      {!on && !won && (
        <button className="game__chip game__chip--hot" onClick={start}>
          {lost ? 'rematch' : 'start'}
        </button>
      )}
    </Shell>
  )
}

/* ------------------------------------------------------------------ */
/* 10. Certified: sign the certificate with your finger                */
/* ------------------------------------------------------------------ */
function SignIt({ onWin }: GameProps) {
  const [won, win, unwin] = useWin(onWin)
  const canvas = useRef<HTMLCanvasElement | null>(null)
  const drawing = useRef(false)
  const last = useRef<[number, number] | null>(null)
  const ink = useRef(0)
  const [progress, setProgress] = useState(0)
  const NEED = 320

  const ctx = () => canvas.current?.getContext('2d') ?? null

  const resize = () => {
    const c = canvas.current
    if (!c) return
    const r = c.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    c.width = r.width * dpr
    c.height = r.height * dpr
    const g = c.getContext('2d')
    if (g) {
      g.scale(dpr, dpr)
      g.lineCap = 'round'
      g.lineJoin = 'round'
      g.lineWidth = 3
      g.strokeStyle = '#2b3a8f'
    }
  }
  useEffect(() => {
    resize()
  }, [])

  const point = (e: RPointerEvent): [number, number] => {
    const r = canvas.current!.getBoundingClientRect()
    return [e.clientX - r.left, e.clientY - r.top]
  }
  const down = (e: RPointerEvent) => {
    if (won) return
    drawing.current = true
    last.current = point(e)
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
  }
  const move = (e: RPointerEvent) => {
    if (!drawing.current || !last.current) return
    const p = point(e)
    const g = ctx()
    if (g) {
      g.beginPath()
      g.moveTo(...last.current)
      g.lineTo(...p)
      g.stroke()
    }
    ink.current += Math.hypot(p[0] - last.current[0], p[1] - last.current[1])
    last.current = p
    setProgress(Math.min(100, (ink.current / NEED) * 100))
  }
  const up = () => {
    drawing.current = false
    last.current = null
    if (ink.current >= NEED && !won) win()
  }
  const clear = () => {
    const c = canvas.current
    const g = ctx()
    if (c && g) g.clearRect(0, 0, c.width, c.height)
    ink.current = 0
    setProgress(0)
  }

  return (
    <Shell
      title="Make It Official"
      hint="Finding #10 needs your signature. Sign below with your finger."
      status={!won ? `ink ${Math.round(progress)}%` : undefined}
      won={won}
      winText="Signed, stamped, certified. Peer reviewed by Juan. Peer also Juan."
      onReplay={() => {
        unwin()
        clear()
      }}
    >
      <div className="cert">
        <p className="cert__text">
          Finding #10: <b>love of my life</b>
        </p>
        <div className="cert__pad">
          <canvas
            ref={canvas}
            className="cert__canvas"
            onPointerDown={down}
            onPointerMove={move}
            onPointerUp={up}
            onPointerCancel={up}
          />
          <span className="cert__line">x ____________________ Laety</span>
          {won && <b className="game__stamp">CERTIFIED</b>}
        </div>
      </div>
      {!won && progress > 0 && (
        <button className="game__replay" onClick={clear}>
          clear
        </button>
      )}
    </Shell>
  )
}

export const games = [
  KitchenCatch,
  FindFarfoura,
  NameReflex,
  LeanIn,
  OctoberSlots,
  SarcasmDetector,
  SnoozeDefense,
  LaughTiming,
  QuickMaths,
  SignIt,
]
