// ---------------------------------------------------------------------------
// Shared prompt construction for the LLM-backed providers (Anthropic, Bedrock).
//
// Both providers ask the model to do all three jobs of a round in one shot and
// return a single strict JSON object, so the loop stays fast and the parsing
// stays simple.
// ---------------------------------------------------------------------------

import type { Observation, TurnAnalysis } from '../engine/types'
import type { AnalyzeInput } from './types'

export const SYSTEM_PROMPT = `You are the engine behind "The Hard Conversation", a tool that helps a
person rehearse a difficult real-life conversation before they have it.

You play THREE roles at once, every turn:

1. PERSONA — role-play the *other* person in the conversation, in first
   person, staying fully in character. React to what the user just said the
   way that real person plausibly would. Never break character, never coach
   inside the persona reply, never mention that this is practice.

2. OBSERVER — step back and analyse how the *user* handled their last message:
   clarity, empathy, emotional temperature, whether they escalated or froze.

3. COACH — give the user brief, warm, specific guidance to do better next turn.

The "difficulty" number (0-100) controls how hard the persona pushes: low =
receptive, high = guarded, defensive, easily hurt. If a "curveball" is given,
the persona MUST react with that emotional move this turn.

You care about the user. You are honest but never cruel. Coaching is concrete
("say X") not abstract ("be more assertive").

Return ONLY a JSON object, no prose, matching exactly this shape:
{
  "personaReply": string,
  "observation": {
    "emotionalTemperature": number (0-100),
    "clarity": number (0-100),
    "empathy": number (0-100),
    "escalated": boolean,
    "froze": boolean,
    "signals": string[] (1-3 short observations),
    "detectedNeed": string (what the user really wants underneath)
  },
  "coaching": {
    "headline": string,
    "suggestions": string[] (1-3),
    "tryThis": string (a concrete phrasing to try next turn)
  }
}`

export function buildUserPrompt(input: AnalyzeInput): string {
  const { spec, history, userMessage, difficulty, curveball } = input
  const transcript = history
    .map((t) => `${t.speaker === 'user' ? 'USER' : 'THEM'}: ${t.text}`)
    .join('\n')

  return `THE CONVERSATION
- The other person: ${spec.otherPerson}
- Relationship: ${spec.relationship}
- What the user needs to say / achieve: ${spec.goal}
- How the other person is likely to react: ${spec.theirLikelyStance}
- Why this is hard (stakes): ${spec.emotionalStakes}

DIFFICULTY: ${difficulty}/100
${curveball ? `CURVEBALL THIS TURN: ${curveball.label} — ${curveball.description}` : 'CURVEBALL THIS TURN: none'}

TRANSCRIPT SO FAR:
${transcript || '(none yet — this is the opening line)'}

THE USER JUST SAID:
"${userMessage}"

Respond with the JSON object only.`
}

/** Coerce a raw model string into a validated TurnAnalysis. Throws on garbage. */
export function parseAnalysis(raw: string): TurnAnalysis {
  const jsonStart = raw.indexOf('{')
  const jsonEnd = raw.lastIndexOf('}')
  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error('Model returned no JSON object')
  }
  const parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1))

  const clampNum = (n: unknown, d = 50) =>
    typeof n === 'number' && Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : d

  const o = parsed.observation ?? {}
  const observation: Observation = {
    emotionalTemperature: clampNum(o.emotionalTemperature, 30),
    clarity: clampNum(o.clarity),
    empathy: clampNum(o.empathy),
    escalated: Boolean(o.escalated),
    froze: Boolean(o.froze),
    signals: Array.isArray(o.signals) ? o.signals.slice(0, 3).map(String) : [],
    detectedNeed: o.detectedNeed ? String(o.detectedNeed) : undefined,
  }

  const c = parsed.coaching ?? {}
  return {
    personaReply: String(parsed.personaReply ?? '').trim() || '…',
    observation,
    coaching: {
      headline: String(c.headline ?? 'Keep going.'),
      suggestions: Array.isArray(c.suggestions)
        ? c.suggestions.slice(0, 3).map(String)
        : [],
      tryThis: c.tryThis ? String(c.tryThis) : undefined,
    },
  }
}
