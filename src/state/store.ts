// ---------------------------------------------------------------------------
// The app store: owns the loop state, the active provider, settings, and the
// async orchestration of a round (including the visible phase animation).
// ---------------------------------------------------------------------------

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { ConversationSpec, Curveball, LoopPhase, LoopState } from '../lib/engine/types'
import { applyRound, planLoop } from '../lib/engine/loop'
import type { Provider } from '../lib/providers/types'
import { mockProvider } from '../lib/providers/mock'
import { createAnthropicProvider } from '../lib/providers/anthropic'
import { createBedrockProvider } from '../lib/providers/bedrock'
import { classifySensitivity, evaluateEgress, redactPII } from '../lib/guard'

export type ProviderId = 'mock' | 'anthropic' | 'bedrock'

export interface Settings {
  providerId: ProviderId
  anthropicKey: string
  anthropicModel: string
  bedrockEndpoint: string
  bedrockModelId: string
  consentToEgress: boolean
}

const DEFAULT_SETTINGS: Settings = {
  providerId: 'mock',
  anthropicKey: '',
  anthropicModel: 'claude-sonnet-5',
  bedrockEndpoint: '',
  bedrockModelId: 'anthropic.claude-3-5-sonnet-20240620-v1:0',
  consentToEgress: false,
}

const IDLE_LOOP: LoopState = {
  spec: null,
  turns: [],
  rounds: [],
  difficulty: 0,
  readiness: 0,
  phase: 'plan',
  status: 'idle',
  converged: false,
}

interface AppState {
  loop: LoopState
  settings: Settings
  /** The phase currently lighting up in the timeline (null = at rest). */
  activePhase: LoopPhase | null
  pendingCurveball: Curveball | null
  policyNotice: string | null
  error: string | null

  startScenario: (spec: ConversationSpec) => void
  updateSettings: (patch: Partial<Settings>) => void
  queueCurveball: (cb: Curveball | null) => void
  submitMessage: (text: string) => Promise<void>
  reset: () => void
}

/** Build the active provider from settings, falling back to the demo engine. */
function resolveProvider(settings: Settings): { provider: Provider; note?: string } {
  if (settings.providerId === 'anthropic') {
    if (!settings.anthropicKey.trim()) {
      return { provider: mockProvider, note: 'No Anthropic key set — using the demo engine.' }
    }
    return { provider: createAnthropicProvider(settings.anthropicKey, settings.anthropicModel) }
  }
  if (settings.providerId === 'bedrock') {
    if (!settings.bedrockEndpoint.trim()) {
      return { provider: mockProvider, note: 'No Bedrock endpoint set — using the demo engine.' }
    }
    return {
      provider: createBedrockProvider({
        endpoint: settings.bedrockEndpoint,
        modelId: settings.bedrockModelId,
      }),
    }
  }
  return { provider: mockProvider }
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      loop: IDLE_LOOP,
      settings: DEFAULT_SETTINGS,
      activePhase: null,
      pendingCurveball: null,
      policyNotice: null,
      error: null,

      startScenario(spec) {
        set({
          loop: planLoop(spec),
          activePhase: 'plan',
          pendingCurveball: null,
          policyNotice: null,
          error: null,
        })
        // Let the PLAN phase glow briefly, then settle on ACT.
        setTimeout(() => set({ activePhase: 'act' }), 700)
      },

      updateSettings(patch) {
        set({ settings: { ...get().settings, ...patch } })
      },

      queueCurveball(cb) {
        set({ pendingCurveball: cb })
      },

      async submitMessage(text) {
        const { loop, settings, pendingCurveball } = get()
        if (!loop.spec || loop.status === 'thinking' || loop.converged) return
        const message = text.trim()
        if (!message) return

        const { provider, note } = resolveProvider(settings)

        // --- Guard: decide whether this may leave the device -----------------
        const sensitivity = classifySensitivity(
          loop.spec.goal,
          loop.spec.emotionalStakes,
          message,
        )
        const policy = evaluateEgress({
          providerIsMock: provider.isMock,
          sensitivity,
          userConsentedToEgress: settings.consentToEgress,
        })
        if (!policy.allowEgress) {
          set({ policyNotice: policy.reason })
          return
        }

        // Real providers only ever see redacted text.
        const outboundMessage = provider.isMock ? message : redactPII(message).text

        set({
          loop: { ...loop, status: 'thinking' },
          activePhase: 'act',
          policyNotice: note ?? null,
          error: null,
        })

        try {
          await wait(260)
          set({ activePhase: 'observe' })

          const analysis = await provider.analyze({
            spec: loop.spec,
            history: loop.turns,
            userMessage: outboundMessage,
            difficulty: loop.difficulty,
            curveball: pendingCurveball,
          })

          set({ activePhase: 'correct' })
          await wait(320)

          const next = applyRound(loop, message, analysis, pendingCurveball, Date.now())
          set({
            loop: next,
            pendingCurveball: null,
            activePhase: next.converged ? 'correct' : 'act',
          })
        } catch (err) {
          set({
            loop: { ...get().loop, status: 'awaiting-user' },
            activePhase: 'act',
            error: err instanceof Error ? err.message : 'Something went wrong.',
          })
        }
      },

      reset() {
        set({
          loop: IDLE_LOOP,
          activePhase: null,
          pendingCurveball: null,
          policyNotice: null,
          error: null,
        })
      },
    }),
    {
      name: 'circles-settings',
      // Only persist settings — never the (sensitive) conversation itself.
      partialize: (s) => ({ settings: s.settings }),
    },
  ),
)
