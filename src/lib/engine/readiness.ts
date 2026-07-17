// ---------------------------------------------------------------------------
// The scoring + self-correction math that makes the loop *self-directing*.
//
// These are pure functions with no I/O so they're trivially testable and run
// identically in the browser demo and on a server. This is deliberately the
// most heavily unit-tested part of the codebase — it's the loop's brain.
// ---------------------------------------------------------------------------

import type { Observation } from './types'

export const READINESS_THRESHOLD = 80
export const MIN_ROUNDS_TO_CONVERGE = 3

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n))

/**
 * Score a single round's performance from the observer's read, 0..100.
 *
 * We reward clarity (did they say the thing?) and empathy (did they hold the
 * other person in mind?), and we reward keeping the emotional temperature in a
 * workable band — not stone-cold, not boiling. Escalating or freezing both cost
 * real points because those are the two failure modes the tool exists to fix.
 */
export function scoreRound(obs: Observation): number {
  // Ideal temperature is warm-but-controlled (~35). Punish drift, and punish
  // running hot roughly twice as hard as running cold.
  const drift = obs.emotionalTemperature - 35
  const tempPenalty = drift > 0 ? drift * 1.4 : Math.abs(drift) * 0.7
  const tempScore = clamp(100 - tempPenalty)

  let score = 0.42 * obs.clarity + 0.4 * obs.empathy + 0.18 * tempScore

  if (obs.escalated) score -= 22
  if (obs.froze) score -= 26

  return Math.round(clamp(score))
}

/**
 * Smooth the readiness signal so a single great (or terrible) round doesn't
 * declare victory on its own. Weighted toward the running value early, then
 * more responsive as evidence accumulates.
 */
export function updateReadiness(
  prev: number,
  roundScore: number,
  roundsSoFar: number,
): number {
  // Very first round: seed from the round score but stay conservative.
  if (roundsSoFar <= 1) return Math.round(clamp(roundScore * 0.7))
  const responsiveness = clamp(0.35 + roundsSoFar * 0.04, 0.35, 0.6) / 100
  const alpha = responsiveness * 100
  return Math.round(clamp(prev * (1 - alpha) + roundScore * alpha))
}

/**
 * The self-correction step. The persona adapts to keep the user in their
 * zone of proximal development: push harder when they're handling it (build
 * resilience), ease off when they're floundering (scaffold, don't crush).
 */
export function nextDifficulty(prev: number, roundScore: number): number {
  let delta: number
  if (roundScore >= 75) delta = 9 // doing well → raise the stakes
  else if (roundScore >= 55) delta = 3
  else if (roundScore >= 40) delta = -4
  else delta = -11 // struggling → soften to keep them engaged
  return Math.round(clamp(prev + delta, 10, 95))
}

/** The loop decides on its own that the user is ready. */
export function hasConverged(readiness: number, rounds: number): boolean {
  return readiness >= READINESS_THRESHOLD && rounds >= MIN_ROUNDS_TO_CONVERGE
}

/** A short human label for a readiness value, used in the UI. */
export function readinessLabel(readiness: number): string {
  if (readiness >= READINESS_THRESHOLD) return 'Ready'
  if (readiness >= 60) return 'Getting there'
  if (readiness >= 40) return 'Warming up'
  if (readiness >= 20) return 'Shaky'
  return 'Just starting'
}
