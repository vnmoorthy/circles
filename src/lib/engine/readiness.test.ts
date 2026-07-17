import { describe, it, expect } from 'vitest'
import {
  scoreRound,
  updateReadiness,
  nextDifficulty,
  hasConverged,
  readinessLabel,
  READINESS_THRESHOLD,
} from './readiness'
import type { Observation } from './types'

const obs = (o: Partial<Observation>): Observation => ({
  emotionalTemperature: 35,
  clarity: 50,
  empathy: 50,
  escalated: false,
  froze: false,
  signals: [],
  ...o,
})

describe('scoreRound', () => {
  it('rewards clear + empathetic + calm turns', () => {
    const strong = scoreRound(obs({ clarity: 90, empathy: 85, emotionalTemperature: 30 }))
    const weak = scoreRound(obs({ clarity: 20, empathy: 15, emotionalTemperature: 30 }))
    expect(strong).toBeGreaterThan(weak)
    expect(strong).toBeGreaterThan(75)
  })

  it('penalises escalation and freezing', () => {
    const base = scoreRound(obs({ clarity: 70, empathy: 70 }))
    const escalated = scoreRound(obs({ clarity: 70, empathy: 70, escalated: true }))
    const froze = scoreRound(obs({ clarity: 70, empathy: 70, froze: true }))
    expect(escalated).toBeLessThan(base)
    expect(froze).toBeLessThan(base)
  })

  it('punishes running hot more than running cold', () => {
    const hot = scoreRound(obs({ clarity: 60, empathy: 60, emotionalTemperature: 85 }))
    const cold = scoreRound(obs({ clarity: 60, empathy: 60, emotionalTemperature: 0 }))
    expect(hot).toBeLessThan(cold)
  })

  it('always returns a value in 0..100', () => {
    const lowest = scoreRound(
      obs({ clarity: 0, empathy: 0, emotionalTemperature: 100, escalated: true, froze: true }),
    )
    const highest = scoreRound(obs({ clarity: 100, empathy: 100, emotionalTemperature: 35 }))
    expect(lowest).toBeGreaterThanOrEqual(0)
    expect(highest).toBeLessThanOrEqual(100)
  })
})

describe('updateReadiness', () => {
  it('stays conservative on the first round', () => {
    expect(updateReadiness(0, 100, 1)).toBeLessThan(100)
  })

  it('moves toward the round score over time', () => {
    let r = 0
    for (let i = 1; i <= 8; i++) r = updateReadiness(r, 90, i)
    expect(r).toBeGreaterThan(70)
  })

  it('a single bad round cannot tank a strong history to zero', () => {
    let r = 85
    r = updateReadiness(r, 10, 6)
    expect(r).toBeGreaterThan(40)
  })
})

describe('nextDifficulty', () => {
  it('raises difficulty when the user is handling it', () => {
    expect(nextDifficulty(50, 90)).toBeGreaterThan(50)
  })
  it('lowers difficulty when the user is struggling', () => {
    expect(nextDifficulty(50, 20)).toBeLessThan(50)
  })
  it('clamps to the 10..95 band', () => {
    expect(nextDifficulty(95, 100)).toBeLessThanOrEqual(95)
    expect(nextDifficulty(10, 0)).toBeGreaterThanOrEqual(10)
  })
})

describe('hasConverged', () => {
  it('needs both a high readiness and enough rounds', () => {
    expect(hasConverged(READINESS_THRESHOLD, 3)).toBe(true)
    expect(hasConverged(READINESS_THRESHOLD, 2)).toBe(false)
    expect(hasConverged(70, 5)).toBe(false)
  })
})

describe('readinessLabel', () => {
  it('maps ranges to human labels', () => {
    expect(readinessLabel(85)).toBe('Ready')
    expect(readinessLabel(10)).toBe('Just starting')
  })
})
