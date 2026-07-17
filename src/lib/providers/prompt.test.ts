import { describe, it, expect } from 'vitest'
import { parseAnalysis, buildUserPrompt } from './prompt'
import type { AnalyzeInput } from './types'

describe('parseAnalysis', () => {
  it('parses a clean JSON payload', () => {
    const raw = JSON.stringify({
      personaReply: 'I hear you.',
      observation: {
        emotionalTemperature: 40,
        clarity: 70,
        empathy: 65,
        escalated: false,
        froze: false,
        signals: ['clear'],
        detectedNeed: 'to be heard',
      },
      coaching: { headline: 'Nice', suggestions: ['keep going'], tryThis: 'say X' },
    })
    const a = parseAnalysis(raw)
    expect(a.personaReply).toBe('I hear you.')
    expect(a.observation.clarity).toBe(70)
    expect(a.coaching.tryThis).toBe('say X')
  })

  it('tolerates prose wrapped around the JSON', () => {
    const raw = 'Sure! Here you go:\n{"personaReply":"ok","observation":{"clarity":50},"coaching":{}}\nHope that helps.'
    const a = parseAnalysis(raw)
    expect(a.personaReply).toBe('ok')
    expect(a.observation.clarity).toBe(50)
  })

  it('clamps out-of-range numbers and fills defaults', () => {
    const raw = '{"personaReply":"x","observation":{"clarity":999,"empathy":-5},"coaching":{}}'
    const a = parseAnalysis(raw)
    expect(a.observation.clarity).toBe(100)
    expect(a.observation.empathy).toBe(0)
    expect(a.coaching.headline).toBeTruthy()
  })

  it('throws when there is no JSON at all', () => {
    expect(() => parseAnalysis('no json here')).toThrow()
  })
})

describe('buildUserPrompt', () => {
  it('includes the spec, difficulty and the latest message', () => {
    const input: AnalyzeInput = {
      spec: {
        title: 't',
        otherPerson: 'my father',
        relationship: 'r',
        goal: 'come out to him',
        theirLikelyStance: 's',
        emotionalStakes: 'e',
      },
      history: [],
      userMessage: 'Dad, I need to tell you something.',
      difficulty: 60,
      curveball: null,
    }
    const p = buildUserPrompt(input)
    expect(p).toContain('my father')
    expect(p).toContain('60/100')
    expect(p).toContain('Dad, I need to tell you something.')
    expect(p).toContain('none')
  })
})
