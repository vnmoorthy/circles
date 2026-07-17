// ---------------------------------------------------------------------------
// The deterministic "demo" provider.
//
// This runs entirely in the browser with no network and no API key, so the
// live GitHub Pages demo works for anyone the moment it loads. It's not an
// LLM — it's a hand-built heuristic engine that reads what the user actually
// typed and reacts. It's good enough to make the loop legible on stage; swap
// in the Anthropic or Bedrock provider for the real thing.
// ---------------------------------------------------------------------------

import type { Observation, TurnAnalysis } from '../engine/types'
import type { AnalyzeInput, Provider } from './types'

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n))

const BLAME = /\b(you (always|never|make me|need to|have to|should|don't|didn't|can't))\b/i
const I_STATEMENT = /\bi (feel|felt|need|want|am|was|would|realized|know)\b/i
const EMPATHY = /\b(i (understand|hear|know|get|see)|that must|i imagine|for you|your side|makes sense)\b/i
const AVOID = /\b(sorry|my fault|nevermind|never mind|forget it|it's fine|i guess|maybe i'm wrong|whatever)\b/i
const HOT = /(!!+|\?\?+|[A-Z]{4,}|\b(stupid|ridiculous|insane|hate|shut up)\b)/

function countWords(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length
}

/** Read the user's message and produce the observer's structured read. */
function observe(input: AnalyzeInput): Observation {
  const msg = input.userMessage
  const words = countWords(msg)
  const signals: string[] = []

  let clarity = 50
  let empathy = 45
  let temperature = 30

  const goalTokens = input.spec.goal
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 4)
  const hitsGoal = goalTokens.some((t) => msg.toLowerCase().includes(t))

  const blamed = BLAME.test(msg)
  const usedI = I_STATEMENT.test(msg)
  const showedEmpathy = EMPATHY.test(msg)
  const avoided = AVOID.test(msg)
  const hot = HOT.test(msg)

  if (usedI) {
    clarity += 18
    signals.push('Owned it with an "I" statement instead of an accusation.')
  }
  if (hitsGoal) {
    clarity += 14
    signals.push('Named the actual thing you came to say.')
  }
  if (showedEmpathy) {
    empathy += 24
    signals.push('Acknowledged their side — that lowers their guard.')
  }
  if (blamed) {
    empathy -= 22
    temperature += 26
    signals.push('"You always / you never" — they\'ll hear an attack and defend.')
  }
  if (hot) {
    temperature += 22
    signals.push('The heat spiked here. Notice it before they do.')
  }
  if (avoided) {
    clarity -= 20
    signals.push('You softened away from the point — the ask got lost.')
  }
  if (words < 6) {
    clarity -= 14
    signals.push('Very short. Reads as shutting down rather than opening up.')
  }
  if (words > 70) {
    clarity -= 10
    signals.push('A lot at once — one clear sentence lands harder than five.')
  }

  // The curveball raises the ambient temperature the user is responding into.
  if (input.curveball) temperature += 10

  // Difficulty makes the room a little hotter to begin with.
  temperature += Math.round(input.difficulty * 0.12)

  const froze = avoided || (words < 6 && !usedI)
  const escalated = blamed || hot

  const detectedNeed = pickNeed(input, { usedI, showedEmpathy, blamed, avoided })

  if (signals.length === 0) {
    signals.push('Steady and neutral. Room to be a little more direct about the ask.')
  }

  return {
    emotionalTemperature: clamp(temperature),
    clarity: clamp(clarity),
    empathy: clamp(empathy),
    escalated,
    froze,
    signals: signals.slice(0, 3),
    detectedNeed,
  }
}

function pickNeed(
  input: AnalyzeInput,
  f: { usedI: boolean; showedEmpathy: boolean; blamed: boolean; avoided: boolean },
): string {
  if (f.blamed) return 'to be heard without it becoming a fight'
  if (f.avoided) return 'permission to actually say the hard thing'
  if (f.showedEmpathy) return 'to be understood while still holding your line'
  if (f.usedI) return 'to be honest about how this affects you'
  return `to move ${input.spec.otherPerson} toward: ${input.spec.goal}`
}

// --- Persona replies -------------------------------------------------------

const SOFTENING = [
  "Okay. I didn't expect you to put it like that. I'm listening.",
  "That's… fair. I don't love hearing it, but go on.",
  "Alright. I can tell this matters to you. What do you need from me?",
  "I hadn't thought about it that way. Keep going — I'm actually here.",
]

const DEFENSIVE = [
  "Wow. So this is my fault now? That's not how I remember it.",
  "Why do you always do this? I feel like I'm being cornered.",
  "I don't know what you want me to say. It sounds like you've already decided I'm the bad guy.",
  "Don't put this on me. You had every chance to bring it up before now.",
]

const NEUTRAL = [
  "Okay. What is it? You've clearly got something on your mind.",
  "I'm not sure where this is going. Say what you mean.",
  "Fine. I'm listening, but I don't totally get what you're asking for.",
  "Go ahead. I just don't want this to turn into a whole thing.",
]

const CURVEBALL_REPLIES: Record<string, string[]> = {
  anger: [
    "You know what? No. I'm done being calm about this. (voice rising)",
    "Unbelievable. After everything, THIS is what you come to me with?",
  ],
  tears: [
    "(their voice cracks) I'm sorry, I just— I didn't know you felt this way this whole time.",
    "(quietly, tearing up) Do you have any idea how much that hurts to hear?",
  ],
  guilt: [
    "After all I've done for you, this is where we are? I gave up a lot, you know.",
    "I guess I was never good enough. That's what you're really saying.",
  ],
  deflect: [
    "Can we not do this right now? I've had a long day. Let's talk later.",
    "Anyway — did you hear back about the other thing? Let's focus on that.",
  ],
  silence: [
    "(they say nothing, and just look at you, waiting)",
    "(a long, heavy pause — they're not going to make this easy)",
  ],
}

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length]
}

function personaReply(input: AnalyzeInput, obs: Observation): string {
  const seed = input.history.length

  if (input.curveball) {
    return pick(CURVEBALL_REPLIES[input.curveball.kind] ?? NEUTRAL, seed)
  }

  // The persona reacts to how the user showed up, scaled by difficulty.
  if (obs.escalated && input.difficulty > 35) return pick(DEFENSIVE, seed)
  if (obs.empathy >= 60 && obs.clarity >= 55) return pick(SOFTENING, seed)
  if (obs.froze) return pick(NEUTRAL, seed)
  return pick(input.difficulty > 60 ? DEFENSIVE : NEUTRAL, seed)
}

// --- Coaching --------------------------------------------------------------

function coach(input: AnalyzeInput, obs: Observation): TurnAnalysis['coaching'] {
  const suggestions: string[] = []
  let headline = 'Solid. Keep that footing.'
  let tryThis: string | undefined

  if (obs.escalated) {
    headline = 'It just got hot — cool it before you continue.'
    suggestions.push('Drop the "you always." Swap blame for a specific moment.')
    suggestions.push('Name your own feeling instead of their flaw.')
    tryThis = `"When ${short(input.spec.theirLikelyStance)}, I feel unheard — and I need us to get through this one."`
  } else if (obs.froze) {
    headline = 'You backed away from the point. Say it plainly.'
    suggestions.push('One sentence, no hedging, no apology in front of it.')
    suggestions.push('It\'s okay for it to feel blunt. Blunt is kind here.')
    tryThis = `"${capitalize(input.spec.goal)}. That's what I need to talk about."`
  } else if (obs.clarity >= 60 && obs.empathy >= 55) {
    headline = 'That landed. You were clear *and* kind.'
    suggestions.push('Hold this line if they push back — you don\'t have to escalate to stay firm.')
  } else {
    headline = 'Good start — now make the ask unmistakable.'
    suggestions.push('Lead with what you feel, then what you need.')
    tryThis = `"I feel ${short(input.spec.emotionalStakes)}. What I'm asking is: ${short(input.spec.goal)}."`
  }

  if (obs.detectedNeed) {
    suggestions.push(`Underneath, you seem to want ${obs.detectedNeed}. Aim there.`)
  }

  return { headline, suggestions: suggestions.slice(0, 3), tryThis }
}

function short(s: string): string {
  const t = s.trim().replace(/\.$/, '')
  return t.length > 60 ? t.slice(0, 57).trimEnd() + '…' : t
}
function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// --- Provider --------------------------------------------------------------

export const mockProvider: Provider = {
  id: 'mock',
  label: 'Demo engine (no key)',
  isMock: true,
  async analyze(input: AnalyzeInput): Promise<TurnAnalysis> {
    const observation = observe(input)
    const reply = personaReply(input, observation)
    const coaching = coach(input, observation)
    // A tiny delay so the loop's "thinking" phase is visible in the UI.
    await new Promise((r) => setTimeout(r, 420))
    return { personaReply: reply, observation, coaching }
  },
}
