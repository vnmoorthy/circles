import { motion } from 'framer-motion'
import { Brain, MessageSquare, Eye, Wand2 } from 'lucide-react'
import type { LoopPhase } from '../lib/engine/types'
import { cx } from '../lib/cx'

const PHASES: { key: LoopPhase; label: string; icon: typeof Brain; blurb: string }[] = [
  { key: 'plan', label: 'Plan', icon: Brain, blurb: 'model them' },
  { key: 'act', label: 'Act', icon: MessageSquare, blurb: 'you speak' },
  { key: 'observe', label: 'Observe', icon: Eye, blurb: 'score you' },
  { key: 'correct', label: 'Self-correct', icon: Wand2, blurb: 'adapt + coach' },
]

interface Props {
  active: LoopPhase | null
  round: number
}

/**
 * The loop, made visible. Each round the four steps light up in sequence, so
 * anyone watching can see the agent plan → act → observe → self-correct in real
 * time. This is what makes the "loop" claim undeniable on stage.
 */
export function LoopTimeline({ active, round }: Props) {
  const activeIdx = active ? PHASES.findIndex((p) => p.key === active) : -1

  return (
    <div className="glass rounded-2xl p-4">
      <div className="mb-3.5 flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-[0.18em] text-white/40">The loop</span>
        <span className="rounded-full bg-white/[0.05] px-2 py-0.5 font-mono text-[11px] text-white/45">
          round {round}
        </span>
      </div>

      <div className="flex items-start">
        {PHASES.map((phase, i) => {
          const isActive = active === phase.key
          const isDone = activeIdx > i
          const Icon = phase.icon
          return (
            <div key={phase.key} className="flex flex-1 flex-col items-center">
              <div className="flex w-full items-center">
                {/* left connector */}
                <div className="h-0.5 flex-1">
                  {i > 0 && (
                    <div
                      className={cx(
                        'h-full rounded-full transition-colors duration-300',
                        activeIdx >= i ? 'bg-accent/60' : 'bg-white/[0.08]',
                      )}
                    />
                  )}
                </div>

                <motion.div
                  animate={{ scale: isActive ? 1.12 : 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                  className={cx(
                    'grid h-10 w-10 shrink-0 place-items-center rounded-xl border transition-colors duration-300',
                    isActive
                      ? 'border-accent/70 bg-gradient-to-br from-accent/30 to-accent/5'
                      : isDone
                        ? 'border-accent/30 bg-accent/10'
                        : 'border-white/[0.08] bg-white/[0.03]',
                  )}
                  style={isActive ? { boxShadow: '0 0 18px -2px rgba(124,108,255,0.6)' } : undefined}
                >
                  <Icon
                    className={cx(
                      'h-[18px] w-[18px] transition-colors',
                      isActive
                        ? 'text-accent-soft'
                        : isDone
                          ? 'text-accent/70'
                          : 'text-white/35',
                    )}
                  />
                </motion.div>

                {/* right connector */}
                <div className="h-0.5 flex-1">
                  {i < PHASES.length - 1 && (
                    <div
                      className={cx(
                        'h-full rounded-full transition-colors duration-300',
                        activeIdx > i ? 'bg-accent/60' : 'bg-white/[0.08]',
                      )}
                    />
                  )}
                </div>
              </div>

              <div
                className={cx(
                  'mt-2 text-center text-[11px] font-medium leading-tight transition-colors',
                  isActive ? 'text-white' : 'text-white/45',
                )}
              >
                {phase.label}
              </div>
              <div className="text-[9.5px] leading-tight text-white/25">{phase.blurb}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
