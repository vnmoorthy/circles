import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Settings2, RotateCcw, AlertTriangle, Info } from 'lucide-react'

import { useStore } from './state/store'
import { currentRound } from './lib/engine/loop'
import { SetupPanel } from './components/SetupPanel'
import { ConversationView } from './components/ConversationView'
import { ReadinessMeter } from './components/ReadinessMeter'
import { LoopTimeline } from './components/LoopTimeline'
import { RoundInsight } from './components/RoundInsight'
import { CurveballBar } from './components/CurveballBar'
import { Settings } from './components/Settings'

export default function App() {
  const loop = useStore((s) => s.loop)
  const settings = useStore((s) => s.settings)
  const activePhase = useStore((s) => s.activePhase)
  const pendingCurveball = useStore((s) => s.pendingCurveball)
  const policyNotice = useStore((s) => s.policyNotice)
  const error = useStore((s) => s.error)

  const startScenario = useStore((s) => s.startScenario)
  const submitMessage = useStore((s) => s.submitMessage)
  const queueCurveball = useStore((s) => s.queueCurveball)
  const updateSettings = useStore((s) => s.updateSettings)
  const reset = useStore((s) => s.reset)

  const [settingsOpen, setSettingsOpen] = useState(false)
  const started = loop.status !== 'idle'
  const round = currentRound(loop)

  return (
    <div className="min-h-screen">
      <div className="aurora" aria-hidden />
      <div className="grid-overlay" aria-hidden />
      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-ink-950/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <button
            onClick={reset}
            className="flex items-center gap-2 text-left"
            title="Back to start"
          >
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-accent to-warm">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
                <circle cx="12" cy="12" r="8.5" stroke="white" strokeWidth="1.6" opacity="0.55" />
                <circle cx="12" cy="12" r="5" stroke="white" strokeWidth="1.6" opacity="0.8" />
                <circle cx="12" cy="12" r="1.9" fill="white" />
              </svg>
            </span>
            <div>
              <div className="text-sm font-semibold leading-tight text-white">
                Circles
              </div>
              <div className="text-[11px] leading-tight text-white/40">
                plan · act · observe · self-correct
              </div>
            </div>
          </button>

          <div className="flex items-center gap-2">
            <span className="hidden rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-white/50 sm:block">
              {settings.providerId === 'mock' ? 'demo engine' : settings.providerId}
            </span>
            {started && (
              <button onClick={reset} className="btn-ghost h-9 px-3 text-xs">
                <RotateCcw className="h-3.5 w-3.5" /> New
              </button>
            )}
            <button
              onClick={() => setSettingsOpen(true)}
              className="btn-ghost h-9 px-3 text-xs"
            >
              <Settings2 className="h-3.5 w-3.5" /> Model
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <AnimatePresence mode="wait">
          {!started ? (
            <motion.div key="setup" exit={{ opacity: 0 }}>
              <SetupPanel onStart={startScenario} />
            </motion.div>
          ) : (
            <motion.div
              key="loop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid gap-4 lg:grid-cols-[1fr_380px]"
            >
              {/* Conversation */}
              <div className="order-2 h-[70vh] min-h-[520px] lg:order-1">
                <ConversationView
                  loop={loop}
                  pendingCurveballLabel={pendingCurveball?.label ?? null}
                  onSubmit={submitMessage}
                />
              </div>

              {/* Loop instrumentation */}
              <div className="order-1 space-y-4 lg:order-2">
                <ReadinessMeter readiness={loop.readiness} converged={loop.converged} />
                <LoopTimeline active={activePhase} round={loop.rounds.length} />

                {(policyNotice || error) && (
                  <div
                    className={`flex items-start gap-2 rounded-xl border p-3 text-xs ${
                      error
                        ? 'border-tense/30 bg-tense/10 text-tense'
                        : 'border-accent/20 bg-accent/[0.06] text-accent-soft'
                    }`}
                  >
                    {error ? (
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    ) : (
                      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    )}
                    <span>{error ?? policyNotice}</span>
                  </div>
                )}

                <CurveballBar
                  pending={pendingCurveball}
                  disabled={loop.status === 'thinking' || loop.converged}
                  onQueue={queueCurveball}
                />
                <RoundInsight round={round} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="mx-auto max-w-6xl px-4 py-8 text-center text-xs text-white/30">
        Built for the Loop Engineering Hackathon · a self-directing agent loop ·
        your rehearsal never leaves your device on the demo engine.
      </footer>

      <Settings
        open={settingsOpen}
        settings={settings}
        onClose={() => setSettingsOpen(false)}
        onChange={updateSettings}
      />
    </div>
  )
}
