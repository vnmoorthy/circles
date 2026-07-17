// ---------------------------------------------------------------------------
// AWS Bedrock provider (sponsor path).
//
// Bedrock uses SigV4 request signing with real AWS credentials, which must
// never touch the browser. So this provider talks to a tiny backend endpoint
// that signs and forwards the request to Bedrock's InvokeModel API. A reference
// handler you can drop onto Lambda / any Node server lives in
// `server/bedrock-handler.ts`, and the deployment writeup is in
// `docs/SPONSORS.md`.
//
// The endpoint is expected to accept { system, prompt } and return the model's
// raw text, which we parse with the same shared parser as the other providers.
// ---------------------------------------------------------------------------

import type { TurnAnalysis } from '../engine/types'
import type { AnalyzeInput, Provider } from './types'
import { SYSTEM_PROMPT, buildUserPrompt, parseAnalysis } from './prompt'

export interface BedrockConfig {
  /** URL of your deployed proxy (e.g. an API Gateway / Lambda URL). */
  endpoint: string
  /** Bedrock model id, e.g. "anthropic.claude-3-5-sonnet-20240620-v1:0". */
  modelId?: string
}

export function createBedrockProvider(config: BedrockConfig): Provider {
  return {
    id: 'bedrock',
    label: 'Claude on AWS Bedrock',
    isMock: false,
    async analyze(input: AnalyzeInput): Promise<TurnAnalysis> {
      const res = await fetch(config.endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          modelId: config.modelId,
          system: SYSTEM_PROMPT,
          prompt: buildUserPrompt(input),
        }),
      })

      if (!res.ok) {
        const detail = await res.text().catch(() => '')
        throw new Error(`Bedrock proxy ${res.status}: ${detail.slice(0, 200)}`)
      }

      const data = await res.json()
      // Accept either { text } from our reference handler or a raw Bedrock body.
      const text: string =
        data?.text ??
        data?.content?.[0]?.text ??
        data?.output?.message?.content?.[0]?.text ??
        ''
      return parseAnalysis(text)
    },
  }
}
