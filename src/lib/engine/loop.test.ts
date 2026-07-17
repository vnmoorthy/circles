import { describe, it, expect } from 'vitest'
import { planLoop, applyRound, currentRound, STARTING_DIFFICULTY } from './loop'
import type { ConversationSpec, TurnAnalysis } from './types'

const spec: ConversationSpec = {
  title: 'Test',
  otherPerson: 'my manager',
  relationship: 'mentor',
  goal: 'resign cleanly',
  theirLikelyStance: 'guilt',
  emotionalStakes: 'loyalty',
}

const analysis = (score: 'good' | 'bad'): TurnAnalysis => ({
  personaReply: 'ok',
  observation:
    score === 'good'
      ? {
          emotionalTemperature: 30,
          clarity: 88,
          empathy: 84,
          escalated: false,
          froze: false,
          signals: ['clear'],
        }
      : {
          emotionalTemperature: 85,
          clarity: 20,
          empathy: 15,
          escalated: true,
          froze: false,
          signals: ['hot'],
        },
  coaching: { headline: 'x', suggestions: [] },
})

describe('planLoop', () => {
  it('creates an awaiting-user state at the starting difficulty', () => {
    const s = planLoop(spec)
    expect(s.status).toBe('awaiting-user')
    expect(s.difficulty).toBe(STARTING_DIFFICULTY)
    expect(s.readiness).toBe(0)
    expect(s.turns).toHaveLength(0)
    expect(currentRound(s)).toBeNull()
  })
})

describe('applyRound', () => {
  it('appends a user turn and a persona turn', () => {
    const s0 = planLoop(spec)
    const s1 = applyRound(s0, 'I need to talk to you.', analysis('good'), null, 1000)
    expect(s1.turns).toHaveLength(2)
    expect(s1.turns[0].speaker).toBe('user')
    expect(s1.turns[1].speaker).toBe('persona')
    expect(s1.rounds).toHaveLength(1)
  })

  it('raises readiness after good rounds and converges', () => {
    let s = planLoop(spec)
    for (let i = 0; i < 5; i++) {
      s = applyRound(s, 'clear and kind', analysis('good'), null, i)
    }
    expect(s.readiness).toBeGreaterThanOrEqual(80)
    expect(s.converged).toBe(true)
    expect(s.status).toBe('converged')
  })

  it('does not converge on bad rounds', () => {
    let s = planLoop(spec)
    for (let i = 0; i < 5; i++) {
      s = applyRound(s, 'you always...', analysis('bad'), null, i)
    }
    expect(s.converged).toBe(false)
    expect(s.readiness).toBeLessThan(80)
  })

  it('records the curveball on the persona turn', () => {
    const s0 = planLoop(spec)
    const cb = { kind: 'anger' as const, label: 'They get angry', description: '' }
    const s1 = applyRound(s0, 'hi', analysis('good'), cb, 1)
    expect(s1.turns[1].curveball).toEqual(cb)
    expect(currentRound(s1)?.curveball).toEqual(cb)
  })

  it('is a pure function — does not mutate the previous state', () => {
    const s0 = planLoop(spec)
    const before = JSON.stringify(s0)
    applyRound(s0, 'hi', analysis('good'), null, 1)
    expect(JSON.stringify(s0)).toBe(before)
  })
})
