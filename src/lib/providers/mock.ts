// ---------------------------------------------------------------------------
// The deterministic "demo" provider.
//
// This runs entirely in the browser with no network and no API key, so the
// live demo works for anyone the moment it loads. It's not an LLM — it's a
// hand-built heuristic engine that reads what the user actually typed and
// reacts, well enough to make the loop legible on stage. Swap in the Anthropic
// or Bedrock provider for the real thing.
// ---------------------------------------------------------------------------

import type { Observation, Turn, TurnAnalysis } from '../engine/types'
import type { AnalyzeInput, Provider } from './types'

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n))

const BLAME = /\byou (always|never|make me|need to|have to|should|don't|didn't|can't|only ever)\b/i
const I_OWN =
  /\bi (feel|felt|need|want|am|was|would|realize|realized|know|think|choose|chose|decided|value|care)\b|\bi'(m|ve|ll|d)\b|\bi have (decided|thought|realized)\b|\bmy (decision|choice|mind|last day)\b/i
const EMPATHY =
  /\b(i (understand|hear|know|get|see|realize|appreciate|value|respect)|that must|i imagine|for you|your side|makes sense|thank you|thanks|grateful|appreciate|means a lot|you'?ve been|not about you|i'?m sorry that)\b/i
const DECISIVE =
  /\b(i have decided|i'?ve decided|my decision|i will|i'?m going to|i am going to|final|my last day|effective|resign|resigning|two weeks?|moving on|it'?s over|i need to|i'?m ready|i'?m telling you|i have to tell you)\b/i
const WARMTH =
  /\b(love you|i love|i'?m grateful|grateful|thank you|thanks|means a lot|means everything|care about|i value|appreciate you|we'?ll figure|figure this out|no matter what)\b/i
const AVOID =
  /\b(sorry,? (nevermind|never mind)|nevermind|never mind|forget it|it'?s fine|i guess|maybe i'?m wrong|maybe this is a bad time|yeah,? whatever|whatever you say|whatever then|i don'?t know why|forget i said)\b/i
const HOT = /(!!+|\?\?+|[A-Z]{4,}|\b(stupid|ridiculous|insane|hate|shut up|screw)\b)/

function countWords(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length
}

/** Read the user's message and produce the observer's structured read. */
function observe(input: AnalyzeInput): Observation {
  const msg = input.userMessage
  const words = countWords(msg)
  const signals: string[] = []

  let clarity = 50
  let empathy = 46
  let temperature = 28

  const goalTokens = input.spec.goal
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 4)
  const hitsGoal = goalTokens.some((t) => msg.toLowerCase().includes(t))

  const blamed = BLAME.test(msg)
  const usedI = I_OWN.test(msg)
  const decisive = DECISIVE.test(msg)
  const showedEmpathy = EMPATHY.test(msg)
  const warmth = WARMTH.test(msg)
  const avoided = AVOID.test(msg)
  const hot = HOT.test(msg)

  if (usedI) {
    clarity += 16
    signals.push('Owned it with an "I" statement instead of an accusation.')
  }
  if (decisive) {
    clarity += 14
    signals.push('Clear and decisive — no hedging around the ask.')
  }
  if (hitsGoal) {
    clarity += 10
    signals.push('Named the actual thing you came to say.')
  }
  if (showedEmpathy) {
    empathy += 26
    signals.push('Acknowledged their side — that lowers their guard.')
  }
  if (warmth) {
    empathy += 12
    signals.push('Real warmth in there — that\'s what keeps the door open.')
  }
  if (blamed) {
    empathy -= 24
    temperature += 26
    signals.push('"You always / you never" — they\'ll hear an attack and defend.')
  }
  if (hot) {
    temperature += 22
    signals.push('The heat spiked here. Notice it before they do.')
  }
  if (avoided) {
    clarity -= 22
    signals.push('You softened away from the point — the ask got lost.')
  }
  if (words < 6 && !decisive) {
    clarity -= 12
    signals.push('Very short. Reads as shutting down rather than opening up.')
  }
  if (words > 85) {
    clarity -= 8
    signals.push('A lot at once — one clear sentence lands harder than five.')
  }

  if (input.curveball) temperature += 10
  temperature += Math.round(input.difficulty * 0.1)

  const froze = avoided || (words < 6 && !usedI && !decisive)
  const escalated = blamed || hot

  const detectedNeed = pickNeed(input, { usedI, showedEmpathy, blamed, avoided, decisive })

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
  f: { usedI: boolean; showedEmpathy: boolean; blamed: boolean; avoided: boolean; decisive: boolean },
): string {
  if (f.blamed) return 'to be heard without it becoming a fight'
  if (f.avoided) return 'permission to actually say the hard thing'
  if (f.decisive && f.showedEmpathy) return 'to hold your line while keeping the relationship'
  if (f.showedEmpathy) return 'to be understood while still holding your line'
  if (f.usedI) return 'to be honest about how this affects you'
  return `to move ${input.spec.otherPerson} toward: ${input.spec.goal}`
}

// --- Persona replies -------------------------------------------------------

const DEFENSIVE = [
  "Wow. So this is my fault now? That's not how I remember it.",
  "Why do you always do this? I feel like I'm being cornered.",
  "I don't know what you want me to say. Sounds like you've already decided I'm the bad guy.",
  "Don't put this on me. You had every chance to bring it up before now.",
  "That's not fair. I've done nothing but support you, and this is what I get?",
]

const GUARDED = [
  "Okay… where is this going? You've got your serious voice on.",
  "I'm listening, but I'll be honest, I don't love the sound of this.",
  "Go on. I'm not going to pretend I know what you're about to say.",
  "Alright. Say it. I'd rather you just tell me straight.",
]

const NEUTRAL = [
  "Okay. What is it? You've clearly got something on your mind.",
  "I'm not sure where this is going. Say what you mean.",
  "Fine. I'm listening, but I don't totally get what you're asking for.",
  "Go ahead. I just don't want this to turn into a whole thing.",
]

const NUDGE = [
  "You kind of trailed off there. What are you actually trying to tell me?",
  "It's okay — just say it. I can tell you're holding something back.",
  "Don't do that, don't downplay it. What do you really need?",
  "You started to say something and stopped. I'm still here. Go on.",
]

const SOFTENING = [
  "Okay. I didn't expect you to put it like that. I'm listening.",
  "That's… fair. I don't love hearing it, but go on.",
  "Alright. I can tell this matters to you. What do you need from me?",
  "I hadn't thought about it that way. Keep going — I'm actually here.",
  "Huh. Okay. That's not what I braced for. Tell me more.",
]

const ACCEPTING = [
  "Okay. Okay. I hear you. I don't love it, but I understand. Let's do this right.",
  "You know what — thank you for being straight with me. I can respect that.",
  "I won't pretend it's easy for me. But I get it, and I'm not going anywhere.",
  "Alright. I've been listening this whole time. You've clearly thought about it. I'm with you.",
  "That took guts to say. I'm proud of you, even if it stings a little.",
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

function lastPersonaLine(history: Turn[]): string | null {
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].speaker === 'persona') return history[i].text
  }
  return null
}

/** Pick from a bank, avoiding an exact repeat of the previous persona line. */
function pick(arr: string[], seed: number, avoid: string | null): string {
  if (arr.length === 1) return arr[0]
  let idx = seed % arr.length
  if (avoid && arr[idx] === avoid) idx = (idx + 1) % arr.length
  return arr[idx]
}

function personaReply(input: AnalyzeInput, obs: Observation): string {
  const seed = input.history.length + Math.round(input.difficulty)
  const avoid = lastPersonaLine(input.history)

  if (input.curveball) {
    return pick(CURVEBALL_REPLIES[input.curveball.kind] ?? NEUTRAL, seed, avoid)
  }

  const roundsIn = Math.floor(input.history.length / 2)
  const strong = obs.empathy >= 58 && obs.clarity >= 58 && !obs.escalated

  // A hostile line always provokes defensiveness, regardless of difficulty.
  if (obs.escalated) return pick(DEFENSIVE, seed, avoid)
  // Sustained, warm competence late in the talk earns a resolution.
  if (strong && roundsIn >= 2) return pick(ACCEPTING, seed, avoid)
  if (strong) return pick(SOFTENING, seed, avoid)
  if (obs.froze) return pick(NUDGE, seed, avoid)
  if (input.difficulty >= 55) return pick(GUARDED, seed, avoid)
  return pick(NEUTRAL, seed, avoid)
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
    suggestions.push("It's okay for it to feel blunt. Blunt is kind here.")
    tryThis = `"${capitalize(short(input.spec.goal))}. That's what I need to talk about."`
  } else if (obs.clarity >= 62 && obs.empathy >= 58) {
    headline = 'That landed. You were clear *and* kind.'
    suggestions.push("Hold this line if they push back — you don't have to escalate to stay firm.")
    if (input.difficulty >= 55)
      suggestions.push("They're getting harder to move — good. That means you're ready for more.")
  } else if (obs.clarity >= 60 && obs.empathy < 55) {
    headline = 'Clear — now warm it up.'
    suggestions.push('Add one line that shows you see their side. It disarms the defensiveness.')
    tryThis = `"I know ${short(input.spec.theirLikelyStance)}. I'm not dismissing that."`
  } else {
    headline = 'Good start — now make the ask unmistakable.'
    suggestions.push('Lead with what you feel, then what you need.')
    tryThis = `"I feel ${short(input.spec.emotionalStakes)}. What I'm asking is: ${short(input.spec.goal)}."`
  }

  if (obs.detectedNeed && suggestions.length < 3) {
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
