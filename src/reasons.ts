// The 10 reasons. Keep each line short. No em dashes, please.
// Every detail here is either confirmed by Juan or comes from Laety's own CV.

export type Reason = {
  title: string
  line: string
  emoji: string
}

export const reasons: Reason[] = [
  {
    title: 'Dream Guy, in Training',
    line: 'Currently training for the role of the man of your dreams. Enthusiasm: 100%. Experience: still training.',
    emoji: '💼',
  },
  {
    title: 'Farfoura, Obviously',
    line: 'Nobody else gets to be a Farfoura. The name was made for you, I just found it.',
    emoji: '🐣',
  },
  {
    title: 'Juan, Apparently',
    line: 'You turned Jean Paul into Juan, and now I answer to it faster than my real name.',
    emoji: '🕺',
  },
  {
    title: 'The Hair Situation',
    line: "Your hair smells unreasonably good. I'm not saying I lean in on purpose. I'm not not saying it.",
    emoji: '💐',
  },
  {
    title: 'Miss President',
    line: "Running events like a boss. I'd come cheer, but I've been warned about a kaff 😂",
    emoji: '👑',
  },
  {
    title: 'Daily Check-In',
    line: "My most asked question in history: \"akalte?\" You answer \"Ee\". The system works.",
    emoji: '🍽️',
  },
  {
    title: 'Sleep Is Cardio',
    line: "Sleeping is basically your cardio, and honestly, you're in incredible shape.",
    emoji: '😴',
  },
  {
    title: 'The Sarcasm Dataset',
    line: 'You built an AI that detects sarcasm. I remain the one case it will never solve.',
    emoji: '🤖',
  },
  {
    title: 'Smarter Than Me',
    line: "You're smarter than me. I've accepted it. I just refuse to say it out loud. Oops.",
    emoji: '🧠',
  },
  {
    title: 'Officially Certified',
    line: "Love of my life, according to Juan's very official research department. (It's just me.)",
    emoji: '📜',
  },
]

// Shown one after another on the closing screen.
export const finalLines = [
  'If you smiled even once while scrolling, this page did its job.',
  'No occasion, no special reason. I just felt like making something for my favourite Farfoura.',
  "P.S. You're still ridiculously cute. Don't let it go to your head.",
]
export const signature = '❤️ Juan'

// Paste a Teleparty link here to turn on the "Accept Invitation" button.
// Leave it empty and the button becomes a playful "Let's plan it".
export const telepartyUrl = ''

export const footerLine = "Reason 11 didn't fit on the page."

// What the meter says as it fills, one per card.
export const meterLabels = [
  'mildly smitten',
  'noticeably fond',
  'grinning at phone',
  'telling friends too much',
  'humming for no reason',
  'certified sappy',
  'scientists concerned',
  'containment failing',
  'please stand back',
  'LOVE OVERLOAD',
]
