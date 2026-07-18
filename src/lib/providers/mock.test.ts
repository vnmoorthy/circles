import { describe, it, expect } from 'vitest'
import { mockProvider } from './mock'
import type { AnalyzeInput } from './types'
import type { ConversationSpec } from '../engine/types'

const spec: ConversationSpec = {
  title: 'Quitting',
  otherPerson: 'my manager',
  relationship: 'mentor of four years',
  goal: 'resign and hold my timeline',
  theirLikelyStance: 'guilt trip',
  emotionalStakes: 'loyalty',
}

const input = (userMessage: string, extra: Partial<AnalyzeInput> = {}): AnalyzeInput => ({
  spec,
  history: [],
  userMessage,
  difficulty: 45,
  curveball: null,
  ...extra,
})

describe('mockProvider', () => {
  it('reads blame as low-empathy and hot', async () => {
    const a = await mockProvider.analyze(input('You always make me feel guilty and you never listen'))
    expect(a.observation.empathy).toBeLessThan(40)
    expect(a.observation.emotionalTemperature).toBeGreaterThan(45)
    expect(a.observation.escalated).toBe(true)
  })

  it('reads an I-statement + empathy as clear and warm', async () => {
    const a = await mockProvider.analyze(
      input('I feel torn about this, and I understand your side, but I need to resign.'),
    )
    expect(a.observation.clarity).toBeGreaterThan(55)
    expect(a.observation.empathy).toBeGreaterThan(55)
    expect(a.observation.escalated).toBe(false)
  })

  it('reads avoidance as freezing', async () => {
    const a = await mockProvider.analyze(input('sorry, nevermind, it\'s fine'))
    expect(a.observation.froze).toBe(true)
  })

  it('honours a curveball in the persona reply', async () => {
    const a = await mockProvider.analyze(
      input('I need to talk to you', {
        curveball: { kind: 'tears', label: 'They start crying', description: '' },
      }),
    )
    expect(a.personaReply.length).toBeGreaterThan(0)
  })

  it('always returns coaching', async () => {
    const a = await mockProvider.analyze(input('hello'))
    expect(a.coaching.headline).toBeTruthy()
  })

  it('does not treat forward-looking "whatever" as freezing', async () => {
    const a = await mockProvider.analyze(
      input("I love you, and I'm ready for whatever comes next."),
    )
    expect(a.observation.froze).toBe(false)
    expect(a.observation.clarity).toBeGreaterThan(60)
  })

  it('rewards warmth (love / grateful) with real empathy', async () => {
    const warm = await mockProvider.analyze(
      input("I'm grateful you heard me out. I love you and I'm not going anywhere."),
    )
    const flat = await mockProvider.analyze(input('I have decided. That is my choice.'))
    expect(warm.observation.empathy).toBeGreaterThan(flat.observation.empathy)
    expect(warm.observation.empathy).toBeGreaterThan(70)
  })
})
