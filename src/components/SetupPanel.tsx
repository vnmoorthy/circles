import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, PenLine } from 'lucide-react'
import type { ConversationSpec } from '../lib/engine/types'
import { SCENARIOS } from '../lib/scenarios'
import { classifySensitivity } from '../lib/guard'
import { cx } from '../lib/cx'

interface Props {
  onStart: (spec: ConversationSpec) => void
}

const EMPTY: ConversationSpec = {
  title: '',
  otherPerson: '',
  relationship: '',
  goal: '',
  theirLikelyStance: '',
  emotionalStakes: '',
}

const FIELDS: { key: keyof ConversationSpec; label: string; placeholder: string }[] = [
  { key: 'title', label: 'Name this conversation', placeholder: 'Asking my dad for help' },
  { key: 'otherPerson', label: 'Who are you talking to?', placeholder: 'my father' },
  { key: 'relationship', label: 'Your relationship', placeholder: 'Close but we never talk about feelings' },
  { key: 'goal', label: 'What you need to say / achieve', placeholder: 'Ask him to move in with us' },
  { key: 'theirLikelyStance', label: 'How they\'ll probably react', placeholder: 'Proud, stubborn, says he\'s fine' },
  { key: 'emotionalStakes', label: 'Why it\'s hard', placeholder: 'I\'m scared of admitting he\'s getting older' },
]

export function SetupPanel({ onStart }: Props) {
  const [custom, setCustom] = useState(false)
  const [spec, setSpec] = useState<ConversationSpec>(EMPTY)

  const ready = spec.otherPerson.trim() && spec.goal.trim()

  return (
    <div className="mx-auto max-w-3xl">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Rehearse the conversation you're dreading.
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-white/50">
          An agent role-plays the other person, watches where you break, and coaches you —
          looping until it decides you're ready. Nothing you type here leaves your browser
          on the demo engine.
        </p>
      </motion.div>

      {!custom ? (
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {SCENARIOS.map((s, i) => {
            const sensitivity = classifySensitivity(s.goal, s.emotionalStakes)
            return (
              <motion.button
                key={s.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => onStart(s)}
                className="group glass rounded-2xl p-4 text-left transition-all hover:border-accent/40 hover:bg-ink-800/70"
              >
                <div className="flex items-start justify-between">
                  <span className="text-2xl">{s.emoji}</span>
                  {sensitivity === 'high' && (
                    <span className="rounded-full bg-tense/15 px-2 py-0.5 text-[10px] text-tense">
                      sensitive
                    </span>
                  )}
                </div>
                <div className="mt-2 font-medium text-white">{s.title}</div>
                <div className="mt-1 line-clamp-2 text-sm text-white/45">{s.goal}</div>
                <div className="mt-3 flex items-center gap-1 text-xs text-accent-soft opacity-0 transition-opacity group-hover:opacity-100">
                  Start rehearsing <ArrowRight className="h-3 w-3" />
                </div>
              </motion.button>
            )
          })}

          <button
            onClick={() => setCustom(true)}
            className="glass flex items-center justify-center gap-2 rounded-2xl p-4 text-sm text-white/60 transition-all hover:border-accent/40 hover:text-white"
          >
            <PenLine className="h-4 w-4" /> Write my own
          </button>
        </div>
      ) : (
        <div className="mt-8 space-y-3">
          {FIELDS.map((f) => (
            <div key={f.key}>
              <label className="mb-1 block text-xs text-white/50">{f.label}</label>
              <input
                value={spec[f.key]}
                onChange={(e) => setSpec({ ...spec, [f.key]: e.target.value })}
                placeholder={f.placeholder}
                className="w-full rounded-xl bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-accent/50"
              />
            </div>
          ))}
          <div className="flex gap-2 pt-1">
            <button onClick={() => setCustom(false)} className="btn-ghost">
              Back
            </button>
            <button
              disabled={!ready}
              onClick={() => onStart({ ...spec, title: spec.title || `Talking to ${spec.otherPerson}` })}
              className={cx('btn-primary flex-1')}
            >
              Start rehearsing <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
