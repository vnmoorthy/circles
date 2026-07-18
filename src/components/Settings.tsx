import { motion, AnimatePresence } from 'framer-motion'
import { X, ShieldCheck } from 'lucide-react'
import type { ProviderId, Settings as SettingsT } from '../state/store'
import { cx } from '../lib/cx'

interface Props {
  open: boolean
  settings: SettingsT
  onClose: () => void
  onChange: (patch: Partial<SettingsT>) => void
}

const PROVIDERS: { id: ProviderId; label: string; note: string }[] = [
  { id: 'mock', label: 'Demo engine', note: 'On-device, no key, nothing leaves your browser.' },
  { id: 'anthropic', label: 'Claude (Anthropic)', note: 'Your key, called directly from the browser.' },
  { id: 'bedrock', label: 'AWS Bedrock', note: 'Via your signing proxy — creds stay server-side.' },
]

export function Settings({ open, settings, onClose, onChange }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
            className="fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-y-auto bg-ink-900 p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Model & privacy</h2>
              <button onClick={onClose} className="text-white/40 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-2">
              {PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => onChange({ providerId: p.id })}
                  className={cx(
                    'w-full rounded-xl border p-3 text-left transition-colors',
                    settings.providerId === p.id
                      ? 'border-accent/60 bg-accent/10'
                      : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.05]',
                  )}
                >
                  <div className="text-sm font-medium text-white">{p.label}</div>
                  <div className="text-xs text-white/45">{p.note}</div>
                </button>
              ))}
            </div>

            {settings.providerId === 'anthropic' && (
              <div className="mt-4 space-y-3">
                <Field
                  label="Anthropic API key"
                  type="password"
                  value={settings.anthropicKey}
                  placeholder="sk-ant-…"
                  onChange={(v) => onChange({ anthropicKey: v })}
                />
                <Field
                  label="Model"
                  value={settings.anthropicModel}
                  onChange={(v) => onChange({ anthropicModel: v })}
                />
                <p className="text-xs text-white/40">
                  Stored only in this browser. Sent directly to api.anthropic.com.
                </p>
              </div>
            )}

            {settings.providerId === 'bedrock' && (
              <div className="mt-4 space-y-3">
                <Field
                  label="Proxy endpoint URL"
                  value={settings.bedrockEndpoint}
                  placeholder="https://…/invoke"
                  onChange={(v) => onChange({ bedrockEndpoint: v })}
                />
                <Field
                  label="Bedrock model id"
                  value={settings.bedrockModelId}
                  onChange={(v) => onChange({ bedrockModelId: v })}
                />
                <p className="text-xs text-white/40">
                  See <span className="font-mono">server/bedrock-handler.ts</span> for a
                  drop-in signing proxy.
                </p>
              </div>
            )}

            <div className="mt-6 rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-white">
                <ShieldCheck className="h-4 w-4 text-calm" /> Privacy
              </div>
              <label className="mt-3 flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={settings.consentToEgress}
                  onChange={(e) => onChange({ consentToEgress: e.target.checked })}
                  className="mt-0.5 h-4 w-4 accent-accent"
                />
                <span className="text-sm text-white/70">
                  Allow highly-sensitive conversations to be sent (redacted) to a cloud model.
                  Off by default — high-risk topics stay on the demo engine unless you opt in.
                </span>
              </label>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <div>
      <label className="mb-1 block text-xs text-white/50">{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="field"
      />
    </div>
  )
}
