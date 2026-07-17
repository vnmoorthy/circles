// ---------------------------------------------------------------------------
// Privacy guard — the client-side half of a Pomerium-gated architecture.
//
// The conversations people rehearse here are among the most sensitive things
// they'll ever type: a coming-out, a divorce, a diagnosis. Two rules follow:
//
//   1. The *demo* provider runs fully in-browser — this data never leaves the
//      device at all.
//   2. When a real model IS used, we scrub obvious PII before egress and make a
//      policy decision the UI surfaces to the user. In a deployed setup this
//      pairs with Pomerium enforcing identity-aware access + egress policy at
//      the runtime boundary (see docs/SPONSORS.md).
//
// This module is pure and unit-tested — it's a guardrail, so it has to be right.
// ---------------------------------------------------------------------------

export type Sensitivity = 'low' | 'medium' | 'high'

export interface Redaction {
  kind: 'email' | 'phone' | 'ssn' | 'card'
  original: string
  placeholder: string
}

export interface RedactionResult {
  text: string
  redactions: Redaction[]
}

const PATTERNS: { kind: Redaction['kind']; re: RegExp; tag: string }[] = [
  { kind: 'email', re: /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/g, tag: 'EMAIL' },
  { kind: 'ssn', re: /\b\d{3}-\d{2}-\d{4}\b/g, tag: 'SSN' },
  { kind: 'card', re: /\b(?:\d[ -]*?){13,16}\b/g, tag: 'CARD' },
  { kind: 'phone', re: /\b(?:\+?\d{1,2}[\s-]?)?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}\b/g, tag: 'PHONE' },
]

/**
 * Scrub obvious identifiers from text before it egresses to an external model.
 * Order matters: SSN/card before the looser phone pattern so we don't mislabel.
 */
export function redactPII(input: string): RedactionResult {
  let text = input
  const redactions: Redaction[] = []
  const counts: Record<string, number> = {}

  for (const { kind, re, tag } of PATTERNS) {
    text = text.replace(re, (match) => {
      counts[tag] = (counts[tag] ?? 0) + 1
      const placeholder = `[${tag}_${counts[tag]}]`
      redactions.push({ kind, original: match, placeholder })
      return placeholder
    })
  }
  return { text, redactions }
}

const HIGH_RISK = /\b(hiv|cancer|diagnos|suicid|abuse|assault|pregnan|divorce|custody|overdose|addict|terminal|died|death|gay|lesbian|trans|com(e|ing) out)\b/i
const MED_RISK = /\b(salary|fired|laid off|money|debt|therapy|depress|anxiety|breakup|affair|cheat)\b/i

/** Classify how sensitive a piece of text is, to drive UI + egress policy. */
export function classifySensitivity(...parts: string[]): Sensitivity {
  const blob = parts.join(' ')
  if (HIGH_RISK.test(blob)) return 'high'
  if (MED_RISK.test(blob)) return 'medium'
  return 'low'
}

export interface PolicyDecision {
  allowEgress: boolean
  sensitivity: Sensitivity
  reason: string
}

/**
 * Decide whether a round may call an external model, mirroring the kind of
 * decision Pomerium would enforce at the runtime boundary.
 *
 * - Mock provider: nothing leaves the browser, always allowed.
 * - Real provider + high sensitivity: allowed only if the user has explicitly
 *   consented to send sensitive content off-device this session.
 */
export function evaluateEgress(opts: {
  providerIsMock: boolean
  sensitivity: Sensitivity
  userConsentedToEgress: boolean
}): PolicyDecision {
  const { providerIsMock, sensitivity, userConsentedToEgress } = opts

  if (providerIsMock) {
    return {
      allowEgress: true,
      sensitivity,
      reason: 'Demo engine runs on-device — no data leaves the browser.',
    }
  }

  if (sensitivity === 'high' && !userConsentedToEgress) {
    return {
      allowEgress: false,
      sensitivity,
      reason:
        'This conversation looks highly sensitive. Turn on "send off-device" in Settings to use a cloud model, or stay on the demo engine.',
    }
  }

  return {
    allowEgress: true,
    sensitivity,
    reason: 'PII scrubbed; sending redacted context to the model provider.',
  }
}
