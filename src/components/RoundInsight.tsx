import { motion } from 'framer-motion'
import { Lightbulb, Thermometer, Target, HeartHandshake, Sparkles } from 'lucide-react'
import type { RoundRecord } from '../lib/engine/types'
import { cx } from '../lib/cx'

interface Props {
  round: RoundRecord | null
}

function Metric({
  icon: Icon,
  label,
  value,
  invert,
}: {
  icon: typeof Thermometer
  label: string
  value: number
  invert?: boolean
}) {
  // For temperature, high is bad; for clarity/empathy, high is good.
  const good = invert ? value <= 45 : value >= 60
  const mid = invert ? value <= 65 : value >= 40
  const color = good ? 'bg-calm' : mid ? 'bg-accent' : 'bg-tense'
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[11px] text-white/50">
        <span className="flex items-center gap-1">
          <Icon className="h-3 w-3" /> {label}
        </span>
        <span className="font-mono tabular-nums">{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
        <motion.div
          className={cx('h-full rounded-full', color)}
          initial={false}
          animate={{ width: `${value}%` }}
          transition={{ type: 'spring', stiffness: 140, damping: 22 }}
        />
      </div>
    </div>
  )
}

/** The OBSERVE + SELF-CORRECT output for the latest round. */
export function RoundInsight({ round }: Props) {
  if (!round) {
    return (
      <div className="glass rounded-2xl p-5 text-sm text-white/40">
        Say your opening line. After each thing you say, the loop will show you
        exactly where it landed — and how to say it better.
      </div>
    )
  }

  const { observation: obs, coaching } = round

  return (
    <motion.div
      key={round.round}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-5"
    >
      <div className="grid grid-cols-3 gap-3">
        <Metric icon={Thermometer} label="Heat" value={obs.emotionalTemperature} invert />
        <Metric icon={Target} label="Clarity" value={obs.clarity} />
        <Metric icon={HeartHandshake} label="Empathy" value={obs.empathy} />
      </div>

      {obs.signals.length > 0 && (
        <ul className="mt-4 space-y-1.5">
          {obs.signals.map((s, i) => (
            <li key={i} className="flex gap-2 text-sm text-white/70">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-soft" />
              {s}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 rounded-xl border border-accent/20 bg-accent/[0.06] p-3.5">
        <div className="flex items-center gap-2 text-sm font-medium text-accent-soft">
          <Lightbulb className="h-4 w-4" />
          {coaching.headline}
        </div>
        {coaching.suggestions.length > 0 && (
          <ul className="mt-2 space-y-1">
            {coaching.suggestions.map((s, i) => (
              <li key={i} className="text-sm text-white/70">
                • {s}
              </li>
            ))}
          </ul>
        )}
        {coaching.tryThis && (
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-white/[0.04] p-2.5 text-sm text-white/80">
            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warm" />
            <span>
              <span className="text-white/40">Try: </span>
              {coaching.tryThis}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  )
}
