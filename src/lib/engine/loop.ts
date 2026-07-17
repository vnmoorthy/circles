// ---------------------------------------------------------------------------
// The loop orchestration — pure state transitions.
//
// `planLoop` runs the PLAN phase (build the starting state from a spec).
// `applyRound` folds one ACT → OBSERVE → SELF-CORRECT pass into the state.
//
// Nothing here does I/O. The model call happens in the store; this module just
// decides what the new world looks like given the model's output, so the loop's
// behaviour is fully deterministic and testable.
// ---------------------------------------------------------------------------

import type {
  ConversationSpec,
  Curveball,
  LoopState,
  RoundRecord,
  Turn,
  TurnAnalysis,
} from './types'
import {
  hasConverged,
  nextDifficulty,
  scoreRound,
  updateReadiness,
} from './readiness'

/** Difficulty the persona opens with — deliberately mid, then adapts. */
export const STARTING_DIFFICULTY = 45

export function planLoop(spec: ConversationSpec): LoopState {
  return {
    spec,
    turns: [],
    rounds: [],
    difficulty: STARTING_DIFFICULTY,
    readiness: 0,
    phase: 'act',
    status: 'awaiting-user',
    converged: false,
  }
}

/**
 * Fold one completed round into the loop state.
 *
 * @param now  injected timestamp so callers stay in control of time (and tests
 *             stay deterministic).
 */
export function applyRound(
  state: LoopState,
  userMessage: string,
  analysis: TurnAnalysis,
  curveball: Curveball | null,
  now: number,
): LoopState {
  const round = state.rounds.length + 1

  const roundScore = scoreRound(analysis.observation)
  const readiness = updateReadiness(state.readiness, roundScore, round)
  const difficulty = nextDifficulty(state.difficulty, roundScore)
  const converged = hasConverged(readiness, round)

  const userTurn: Turn = {
    id: `u-${round}`,
    speaker: 'user',
    text: userMessage,
    ts: now,
  }
  const personaTurn: Turn = {
    id: `p-${round}`,
    speaker: 'persona',
    text: analysis.personaReply,
    ts: now + 1,
    curveball,
  }

  const record: RoundRecord = {
    round,
    userMessage,
    personaReply: analysis.personaReply,
    observation: analysis.observation,
    coaching: analysis.coaching,
    roundScore,
    readiness,
    difficulty,
    curveball,
  }

  return {
    ...state,
    turns: [...state.turns, userTurn, personaTurn],
    rounds: [...state.rounds, record],
    difficulty,
    readiness,
    phase: converged ? 'correct' : 'act',
    status: converged ? 'converged' : 'awaiting-user',
    converged,
  }
}

/** The latest completed round, if any. */
export function currentRound(state: LoopState): RoundRecord | null {
  return state.rounds.length ? state.rounds[state.rounds.length - 1] : null
}
