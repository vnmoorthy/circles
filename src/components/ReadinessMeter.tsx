import { motion } from 'framer-motion'
import { readinessLabel, READINESS_THRESHOLD } from '../lib/engine/readiness'
import { cx } from '../lib/cx'

interface Props {
  readiness: number
  converged: boolean
}

/**
 * The single most important number on screen: the system's own confidence that
 * the user is ready. It climbs, round over round, until the loop converges.
 */
export function ReadinessMeter({ readiness, converged }: Props) {
  const label = converged ? 'Ready' : readinessLabel(readiness)
  const hue = readiness >= 80 ? 'text-calm' : readiness >= 45 ? 'text-accent-soft' : 'text-warm'

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-baseline justify-between">
        <span className="text-xs uppercase tracking-widest text-white/40">Readiness</span>
        <span className={cx('text-xs font-medium', hue)}>{label}</span>
      </div>

      <div className="mt-2 flex items-end gap-2">
        <motion.span
          key={readiness}
          initial={{ opacity: 0.4, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className={cx('font-mono text-5xl font-semibold tabular-nums', hue)}
        >
          {readiness}
        </motion.span>
        <span className="mb-1.5 text-white/30">/ 100</span>
      </div>

      <div className="relative mt-3 h-2.5 overflow-hidden rounded-full bg-white/5">
        <motion.div
          className={cx(
            'h-full rounded-full',
            readiness >= 80 ? 'bg-calm' : readiness >= 45 ? 'bg-accent' : 'bg-warm',
          )}
          initial={false}
          animate={{ width: `${readiness}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
        {/* Convergence threshold marker */}
        <div
          className="absolute top-0 h-full w-px bg-white/30"
          style={{ left: `${READINESS_THRESHOLD}%` }}
          title={`Ready at ${READINESS_THRESHOLD}`}
        />
      </div>

      {converged && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-3 text-sm text-calm"
        >
          The loop decided you're ready. You can walk in now.
        </motion.p>
      )}
    </div>
  )
}
