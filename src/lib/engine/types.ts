// ---------------------------------------------------------------------------
// Domain types for Circles loop.
//
// The whole product is a single self-directing agent loop:
//
//   PLAN  ─▶  ACT  ─▶  OBSERVE  ─▶  SELF-CORRECT ─┐
//     ▲                                           │
//     └───────────────────────────────────────────┘
//
// PLAN         build a persona + difficulty model from the user's spec
// ACT          the user speaks; the persona replies in-character
// OBSERVE      an observer scores what the user actually did
// SELF-CORRECT adjust persona difficulty + generate coaching + update readiness
//
// The loop keeps running until the user's `readiness` converges above a
// threshold — i.e. the system decides *on its own* that they're ready.
// ---------------------------------------------------------------------------

/** The difficult conversation the user wants to rehearse. */
export interface ConversationSpec {
  title: string
  /** Who the other person is, e.g. "my father", "my manager". */
  otherPerson: string
  /** Relationship + history context that shapes the persona. */
  relationship: string
  /** What the user needs to say or achieve. */
  goal: string
  /** How the other person is likely to react. */
  theirLikelyStance: string
  /** Why this is hard — the emotional stakes. */
  emotionalStakes: string
}

export type LoopPhase = 'plan' | 'act' | 'observe' | 'correct'

export type Speaker = 'user' | 'persona' | 'system'

export interface Turn {
  id: string
  speaker: Speaker
  text: string
  ts: number
  /** Present on persona turns when a curveball was injected this round. */
  curveball?: Curveball | null
}

/** A deliberate difficulty spike the user (or a judge!) can inject live. */
export type CurveballKind = 'anger' | 'tears' | 'guilt' | 'deflect' | 'silence'

export interface Curveball {
  kind: CurveballKind
  label: string
  description: string
}

/** The observer's read on the user's most recent message. */
export interface Observation {
  /** 0 = calm, 100 = heated. */
  emotionalTemperature: number
  /** 0..100 — did the user state their need clearly? */
  clarity: number
  /** 0..100 — did the user acknowledge the other person's side? */
  empathy: number
  /** The user made the exchange hotter. */
  escalated: boolean
  /** The user went vague / avoidant / deflected. */
  froze: boolean
  /** Short, human-readable observations shown as callouts. */
  signals: string[]
  /** What the user actually seems to be reaching for underneath. */
  detectedNeed?: string
}

/** Coaching the loop self-generates to nudge the user forward. */
export interface Coaching {
  headline: string
  suggestions: string[]
  /** A concrete phrasing the user can try next turn. */
  tryThis?: string
}

/** Everything one call to the model produces for a single round. */
export interface TurnAnalysis {
  personaReply: string
  observation: Observation
  coaching: Coaching
}

/** One completed pass through act → observe → correct. */
export interface RoundRecord {
  round: number
  userMessage: string
  personaReply: string
  observation: Observation
  coaching: Coaching
  /** Single-round performance, 0..100. */
  roundScore: number
  /** Smoothed readiness *after* this round. */
  readiness: number
  /** Persona difficulty the system chose *for the next* round. */
  difficulty: number
  curveball: Curveball | null
}

export type LoopStatus =
  | 'idle'
  | 'planning'
  | 'awaiting-user'
  | 'thinking'
  | 'converged'

export interface LoopState {
  spec: ConversationSpec | null
  turns: Turn[]
  rounds: RoundRecord[]
  /** 0..100 — how hard the persona is pushing right now. */
  difficulty: number
  /** 0..100 — the system's confidence the user is ready. */
  readiness: number
  phase: LoopPhase
  status: LoopStatus
  /** Set once readiness has converged above threshold. */
  converged: boolean
}
