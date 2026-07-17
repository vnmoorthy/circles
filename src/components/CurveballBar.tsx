import { Zap, X } from 'lucide-react'
import type { Curveball } from '../lib/engine/types'
import { CURVEBALL_LIST } from '../lib/scenarios'
import { cx } from '../lib/cx'

interface Props {
  pending: Curveball | null
  disabled: boolean
  onQueue: (cb: Curveball | null) => void
}

/**
 * "Throw a wrench." Injects a hard emotional turn into the *next* persona
 * reply. This is the live-demo money button — hand it to a judge and let them
 * make the other person suddenly cry or rage, then watch the loop cope.
 */
export function CurveballBar({ pending, disabled, onQueue }: Props) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="mb-2.5 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-white/40">
          <Zap className="h-3.5 w-3.5 text-warm" /> Throw a wrench
        </span>
        {pending && (
          <button
            onClick={() => onQueue(null)}
            className="flex items-center gap-1 text-[11px] text-white/40 hover:text-white/70"
          >
            <X className="h-3 w-3" /> clear
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {CURVEBALL_LIST.map((cb) => {
          const active = pending?.kind === cb.kind
          return (
            <button
              key={cb.kind}
              disabled={disabled}
              onClick={() => onQueue(active ? null : cb)}
              title={cb.description}
              className={cx(
                'rounded-full px-3 py-1.5 text-xs font-medium transition-all disabled:opacity-30',
                active
                  ? 'bg-warm text-ink-950 shadow-lg shadow-warm/20'
                  : 'bg-white/5 text-white/70 hover:bg-white/10',
              )}
            >
              {cb.label}
            </button>
          )
        })}
      </div>

      {pending && (
        <p className="mt-2.5 text-xs text-warm/80">
          Loaded: “{pending.label}” fires on your next line.
        </p>
      )}
    </div>
  )
}
