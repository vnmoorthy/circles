import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Zap, User } from 'lucide-react'
import type { LoopState } from '../lib/engine/types'
import { cx } from '../lib/cx'

interface Props {
  loop: LoopState
  pendingCurveballLabel: string | null
  onSubmit: (text: string) => void
}

/** First letter of the other person's descriptor, for their avatar. */
function personaInitial(otherPerson: string): string {
  const words = otherPerson.trim().split(/\s+/)
  const last = words[words.length - 1] || otherPerson
  const ch = last.replace(/[^a-z]/gi, '')[0]
  return ch ? ch.toUpperCase() : ''
}

export function ConversationView({ loop, pendingCurveballLabel, onSubmit }: Props) {
  const [draft, setDraft] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const thinking = loop.status === 'thinking'
  const done = loop.converged
  const initial = personaInitial(loop.spec?.otherPerson ?? '')

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
      <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-3.5">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-ink-700 to-ink-800 text-sm font-semibold text-accent-soft ring-1 ring-white/10">
          {initial || <User className="h-4 w-4" />}
        </span>
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-white">
            {loop.spec?.otherPerson}
          </div>
          <div className="truncate text-xs text-white/40">{loop.spec?.title}</div>
        </div>
        <span className="ml-auto flex items-center gap-1.5 text-[11px] text-white/35">
          <span className="h-1.5 w-1.5 rounded-full bg-calm" /> in character
        </span>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
        {loop.turns.length === 0 && !thinking && (
          <div className="mx-auto mt-10 max-w-xs text-center">
            <p className="text-sm text-white/45">
              Take a breath. Say your first line the way you actually would.
            </p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {loop.turns.map((turn) => {
            const isUser = turn.speaker === 'user'
            return (
              <motion.div
                key={turn.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cx('flex items-end gap-2.5', isUser ? 'flex-row-reverse' : 'flex-row')}
              >
                <span
                  className={cx(
                    'mb-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-semibold',
                    isUser
                      ? 'bg-gradient-to-br from-accent to-accent-glow text-white'
                      : 'bg-ink-700 text-accent-soft ring-1 ring-white/10',
                  )}
                >
                  {isUser ? 'You' : initial || <User className="h-3.5 w-3.5" />}
                </span>
                <div
                  className={cx(
                    'max-w-[76%] px-4 py-2.5 text-sm leading-relaxed shadow-lg',
                    isUser
                      ? 'rounded-2xl rounded-br-md bg-gradient-to-br from-accent to-accent-glow text-white shadow-accent/20'
                      : 'rounded-2xl rounded-bl-md bg-white/[0.06] text-white/90 ring-1 ring-white/[0.06]',
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
            )
          })}
        </AnimatePresence>

        {thinking && (
          <div className="flex items-end gap-2.5">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink-700 text-[11px] font-semibold text-accent-soft ring-1 ring-white/10">
              {initial || <User className="h-3.5 w-3.5" />}
            </span>
            <div className="rounded-2xl rounded-bl-md bg-white/[0.06] px-4 py-3 ring-1 ring-white/[0.06]">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="h-1.5 w-1.5 rounded-full bg-white/50"
                    animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.18 }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-white/[0.06] p-3">
        {done ? (
          <div className="rounded-xl bg-calm/10 px-4 py-3 text-center text-sm text-calm ring-1 ring-calm/20">
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
              className="field flex-1 resize-none"
            />
            <button
              onClick={send}
              disabled={thinking || !draft.trim()}
              className="btn-primary h-[46px] w-[46px] !px-0"
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
