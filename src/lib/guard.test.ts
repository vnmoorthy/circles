import { describe, it, expect } from 'vitest'
import { redactPII, classifySensitivity, evaluateEgress } from './guard'

describe('redactPII', () => {
  it('redacts emails, phones, SSNs and cards', () => {
    const { text, redactions } = redactPII(
      'reach me at jane.doe@example.com or 415-555-0132, ssn 123-45-6789',
    )
    expect(text).not.toContain('jane.doe@example.com')
    expect(text).not.toContain('123-45-6789')
    expect(text).toContain('[EMAIL_1]')
    expect(redactions.length).toBeGreaterThanOrEqual(3)
  })

  it('leaves clean text untouched', () => {
    const { text, redactions } = redactPII('I need to tell you something hard.')
    expect(text).toBe('I need to tell you something hard.')
    expect(redactions).toHaveLength(0)
  })
})

describe('classifySensitivity', () => {
  it('flags high-risk topics', () => {
    expect(classifySensitivity('I want to come out to my dad')).toBe('high')
    expect(classifySensitivity('my cancer diagnosis')).toBe('high')
  })
  it('flags medium-risk topics', () => {
    expect(classifySensitivity('I need to talk about my salary')).toBe('medium')
  })
  it('treats neutral topics as low', () => {
    expect(classifySensitivity('planning a surprise party')).toBe('low')
  })
})

describe('evaluateEgress', () => {
  it('always allows the on-device demo engine', () => {
    const d = evaluateEgress({
      providerIsMock: true,
      sensitivity: 'high',
      userConsentedToEgress: false,
    })
    expect(d.allowEgress).toBe(true)
  })

  it('blocks high-sensitivity egress without consent', () => {
    const d = evaluateEgress({
      providerIsMock: false,
      sensitivity: 'high',
      userConsentedToEgress: false,
    })
    expect(d.allowEgress).toBe(false)
  })

  it('allows high-sensitivity egress once the user consents', () => {
    const d = evaluateEgress({
      providerIsMock: false,
      sensitivity: 'high',
      userConsentedToEgress: true,
    })
    expect(d.allowEgress).toBe(true)
  })

  it('allows low-sensitivity egress by default', () => {
    const d = evaluateEgress({
      providerIsMock: false,
      sensitivity: 'low',
      userConsentedToEgress: false,
    })
    expect(d.allowEgress).toBe(true)
  })
})
