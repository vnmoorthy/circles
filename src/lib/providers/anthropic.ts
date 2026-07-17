// ---------------------------------------------------------------------------
// Anthropic provider — real Claude, called directly from the browser.
//
// The user pastes their own API key into Settings; it lives only in their
// browser (localStorage) and is sent straight to api.anthropic.com. We set the
// `anthropic-dangerous-direct-browser-access` header, which Anthropic requires
// to opt in to browser-side calls. This is fine for a demo/hackathon; for a
// production deployment you'd proxy through a server (see the Bedrock provider).
// ---------------------------------------------------------------------------

import type { TurnAnalysis } from '../engine/types'
import type { AnalyzeInput, Provider } from './types'
import { SYSTEM_PROMPT, buildUserPrompt, parseAnalysis } from './prompt'

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
const DEFAULT_MODEL = 'claude-sonnet-5'

export function createAnthropicProvider(apiKey: string, model = DEFAULT_MODEL): Provider {
  return {
    id: 'anthropic',
    label: 'Claude (Anthropic API)',
    isMock: false,
    async analyze(input: AnalyzeInput): Promise<TurnAnalysis> {
      const res = await fetch(ANTHROPIC_URL, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model,
          max_tokens: 1024,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: buildUserPrompt(input) }],
        }),
      })

      if (!res.ok) {
        const detail = await res.text().catch(() => '')
        throw new Error(`Anthropic API ${res.status}: ${detail.slice(0, 200)}`)
      }

      const data = await res.json()
      const text: string = data?.content?.[0]?.text ?? ''
      return parseAnalysis(text)
    },
  }
}
