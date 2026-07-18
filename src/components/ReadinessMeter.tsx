import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { readinessLabel, READINESS_THRESHOLD } from '../lib/engine/readiness'
import { cx } from '../lib/cx'

interface Props {
  readiness: number
  converged: boolean
}

const R = 52
const C = 2 * Math.PI * R

/**
 * The single most important number on screen: the system's own confidence that
 * the user is ready. A radial gauge that fills round over round until the loop
 * converges.
 */
export function ReadinessMeter({ readiness, converged }: Props) {
  const label = converged ? 'Ready' : readinessLabel(readiness)
  const stroke = readiness >= 80 ? '#4ade80' : readiness >= 45 ? '#7c6cff' : '#ff8a5c'
  const offset = C * (1 - readiness / 100)
  // Threshold tick position on the ring (start at top, clockwise).
  const tickAngle = (READINESS_THRESHOLD / 100) * 360 - 90

  return (
    <div className="glass rounded-2xl p-5">
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-[11px] uppercase tracking-[0.18em] text-white/40">Readiness</span>
        <span
          className="text-xs font-medium"
          style={{ color: stroke }}
        >
          {label}
        </span>
      </div>

      <div className="relative mx-auto grid h-[148px] w-[148px] place-items-center">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          {/* track */}
          <circle cx="60" cy="60" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="9" />
          {/* progress */}
          <motion.circle
            cx="60"
            cy="60"
            r={R}
            fill="none"
            stroke={stroke}
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={C}
            initial={false}
            animate={{ strokeDashoffset: offset, stroke }}
            transition={{ type: 'spring', stiffness: 90, damping: 20 }}
            style={{ filter: `drop-shadow(0 0 6px ${stroke}66)` }}
          />
          {/* threshold tick */}
          <line
            x1={60 + (R - 7) * Math.cos((tickAngle * Math.PI) / 180)}
            y1={60 + (R - 7) * Math.sin((tickAngle * Math.PI) / 180)}
            x2={60 + (R + 7) * Math.cos((tickAngle * Math.PI) / 180)}
            y2={60 + (R + 7) * Math.sin((tickAngle * Math.PI) / 180)}
            stroke="rgba(255,255,255,0.5)"
            strokeWidth="2"
          />
        </svg>

        <div className="absolute inset-0 grid place-content-center text-center">
          {converged ? (
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="grid place-items-center"
            >
              <span className="grid h-11 w-11 place-items-center rounded-full bg-calm/15">
                <Check className="h-6 w-6 text-calm" />
              </span>
            </motion.div>
          ) : (
            <>
              <motion.span
                key={readiness}
                initial={{ opacity: 0.5, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-mono text-4xl font-semibold tabular-nums leading-none"
                style={{ color: stroke }}
              >
                {readiness}
              </motion.span>
              <span className="mt-1 text-[11px] text-white/30">of 100</span>
            </>
          )}
        </div>
      </div>

      <p
        className={cx(
          'mt-1 text-center text-xs',
          converged ? 'text-calm' : 'text-white/40',
        )}
      >
        {converged
          ? "The loop decided you're ready. You can walk in now."
          : `Ready at ${READINESS_THRESHOLD} · the loop decides on its own`}
      </p>
    </div>
  )
}
