import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Zap } from 'lucide-react'
import type { LoopState } from '../lib/engine/types'
import { cx } from '../lib/cx'

interface Props {
  loop: LoopState
  pendingCurveballLabel: string | null
  onSubmit: (text: string) => void
}

export function ConversationView({ loop, pendingCurveballLabel, onSubmit }: Props) {
  const [draft, setDraft] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const thinking = loop.status === 'thinking'
  const done = loop.converged

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [loop.turns.length, thinking])

  const send = () => {
    if (!draft.trim() || thinking || done) return
    onSubmit(draft)
    setDraft('')
  }

  return (
    <div className="glass flex h-full flex-col rounded-2xl">
      <div className="border-b border-white/5 px-5 py-3">
        <div className="text-sm font-medium text-white">
          Rehearsing with: <span className="text-accent-soft">{loop.spec?.otherPerson}</span>
        </div>
        <div className="truncate text-xs text-white/40">{loop.spec?.title}</div>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {loop.turns.length === 0 && !thinking && (
          <p className="mt-8 text-center text-sm text-white/30">
            Take a breath. Say your first line the way you actually would.
          </p>
        )}

        <AnimatePresence initial={false}>
          {loop.turns.map((turn) => (
            <motion.div
              key={turn.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={cx('flex', turn.speaker === 'user' ? 'justify-end' : 'justify-start')}
            >
              <div
                className={cx(
                  'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                  turn.speaker === 'user'
                    ? 'bg-accent text-white'
                    : 'bg-white/[0.06] text-white/90',
                )}
              >
                {turn.curveball && (
                  <div className="mb-1 flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-warm">
                    <Zap className="h-3 w-3" /> {turn.curveball.label}
                  </div>
                )}
                {turn.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {thinking && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-white/[0.06] px-4 py-3">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="h-1.5 w-1.5 rounded-full bg-white/50"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-white/5 p-3">
        {done ? (
          <div className="rounded-xl bg-calm/10 px-4 py-3 text-center text-sm text-calm">
            You got through it. That's the rep. Start again anytime to push harder.
          </div>
        ) : (
          <div className="flex items-end gap-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  send()
                }
              }}
              rows={2}
              disabled={thinking}
              placeholder={
                pendingCurveballLabel
                  ? `They'll "${pendingCurveballLabel}" after you speak…`
                  : 'What do you say?  (Enter to send, Shift+Enter for newline)'
              }
              className="flex-1 resize-none rounded-xl bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-accent/50"
            />
            <button
              onClick={send}
              disabled={thinking || !draft.trim()}
              className="btn-primary h-[46px] px-4"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
