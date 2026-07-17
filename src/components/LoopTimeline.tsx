import { motion } from 'framer-motion'
import { Brain, MessageSquare, Eye, Wand2 } from 'lucide-react'
import type { LoopPhase } from '../lib/engine/types'
import { cx } from '../lib/cx'

const PHASES: { key: LoopPhase; label: string; icon: typeof Brain; blurb: string }[] = [
  { key: 'plan', label: 'Plan', icon: Brain, blurb: 'model the other person' },
  { key: 'act', label: 'Act', icon: MessageSquare, blurb: 'you speak, they react' },
  { key: 'observe', label: 'Observe', icon: Eye, blurb: 'score how you did' },
  { key: 'correct', label: 'Self-correct', icon: Wand2, blurb: 'adapt + coach' },
]

interface Props {
  active: LoopPhase | null
  round: number
}

/**
 * The loop, made visible. Each round these four steps light up in sequence, so
 * anyone watching can see the agent plan → act → observe → self-correct in real
 * time. This is the thing that makes the "loop" claim undeniable on stage.
 */
export function LoopTimeline({ active, round }: Props) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs uppercase tracking-widest text-white/40">The loop</span>
        <span className="font-mono text-xs text-white/40">round {round}</span>
      </div>

      <div className="flex items-stretch gap-1.5">
        {PHASES.map((phase, i) => {
          const isActive = active === phase.key
          const Icon = phase.icon
          return (
            <div key={phase.key} className="flex flex-1 items-center gap-1.5">
              <motion.div
                animate={{
                  scale: isActive ? 1.03 : 1,
                  opacity: isActive ? 1 : 0.5,
                }}
                className={cx(
                  'flex-1 rounded-xl border p-2.5 text-center transition-colors',
                  isActive
                    ? 'border-accent/60 bg-accent/15'
                    : 'border-white/5 bg-white/[0.02]',
                )}
              >
                <Icon
                  className={cx(
                    'mx-auto h-4 w-4',
                    isActive ? 'text-accent-soft animate-pulseGlow' : 'text-white/40',
                  )}
                />
                <div
                  className={cx(
                    'mt-1.5 text-xs font-medium',
                    isActive ? 'text-white' : 'text-white/50',
                  )}
                >
                  {phase.label}
                </div>
                <div className="mt-0.5 hidden text-[10px] leading-tight text-white/30 sm:block">
                  {phase.blurb}
                </div>
              </motion.div>
              {i < PHASES.length - 1 && (
                <div className="text-white/20" aria-hidden>
                  →
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
