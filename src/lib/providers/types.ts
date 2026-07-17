import type {
  ConversationSpec,
  Curveball,
  Turn,
  TurnAnalysis,
} from '../engine/types'

/** Everything a provider needs to produce one round of the loop. */
export interface AnalyzeInput {
  spec: ConversationSpec
  /** Prior turns, oldest first. */
  history: Turn[]
  /** What the user just said. */
  userMessage: string
  /** 0..100 — how hard the persona should push this round. */
  difficulty: number
  /** A live curveball to fold into the persona's reply, if any. */
  curveball: Curveball | null
}

/**
 * A provider does the model work for one round: reply in-character as the
 * persona, observe how the user did, and coach them — all in a single call so
 * the loop stays snappy.
 *
 * Three implementations ship:
 *   - mock       deterministic, in-browser, no key (powers the live demo)
 *   - anthropic  Claude via the browser-direct Messages API
 *   - bedrock    Claude on AWS Bedrock (server-side; sponsor path)
 */
export interface Provider {
  id: string
  label: string
  /** True when the provider needs no network and no credentials. */
  isMock: boolean
  analyze(input: AnalyzeInput): Promise<TurnAnalysis>
}
