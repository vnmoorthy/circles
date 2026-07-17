import type { ConversationSpec, Curveball, CurveballKind } from './engine/types'

/** One-click starting points so the demo lands in seconds. */
export interface Scenario extends ConversationSpec {
  id: string
  emoji: string
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'coming-out',
    emoji: '🌈',
    title: 'Coming out to a parent',
    otherPerson: 'my father',
    relationship:
      'Traditional, loving but conservative. We\'ve never talked about anything this personal.',
    goal: 'Tell him I\'m gay, and that I need him in my life either way.',
    theirLikelyStance:
      'Shock, then deflection or hurt. He may make it about how it reflects on him.',
    emotionalStakes:
      'I\'m terrified of losing him, and even more terrified of hiding forever.',
  },
  {
    id: 'quitting',
    emoji: '🚪',
    title: 'Quitting a job I\'m loyal to',
    otherPerson: 'my manager',
    relationship: 'She mentored me for four years. I feel like I owe her.',
    goal: 'Resign, hold my two-week timeline, and not get guilt-tripped into staying.',
    theirLikelyStance:
      'Surprise, then a counter-offer, then guilt about the team and the timing.',
    emotionalStakes: 'I hate disappointing her, and I keep talking myself out of leaving.',
  },
  {
    id: 'diagnosis',
    emoji: '🫂',
    title: 'Telling my kid about a diagnosis',
    otherPerson: 'my 11-year-old',
    relationship: 'Close. I\'m the parent who keeps things okay.',
    goal: 'Explain that I\'m sick, be honest, and still make them feel safe.',
    theirLikelyStance: 'Scared, quiet, then either clingy or angry.',
    emotionalStakes:
      'I can\'t fall apart in front of them, but I also can\'t lie to them.',
  },
  {
    id: 'breakup',
    emoji: '💔',
    title: 'Ending a long relationship',
    otherPerson: 'my partner of six years',
    relationship: 'We love each other, but I\'ve been unhappy for a long time.',
    goal: 'Be honest that it\'s over, without cruelty and without false hope.',
    theirLikelyStance: 'Blindsided, bargaining, "we can fix this."',
    emotionalStakes: 'I don\'t want to hurt them, so I keep not saying it.',
  },
  {
    id: 'boundary',
    emoji: '🧱',
    title: 'Setting a boundary with a friend',
    otherPerson: 'my closest friend',
    relationship: 'Twenty years. They lean on me hard and rarely notice the cost.',
    goal: 'Ask for space without them hearing it as rejection.',
    theirLikelyStance: 'Hurt, defensive, "so I\'m too much for you now?"',
    emotionalStakes: 'I don\'t want to lose them — I just can\'t keep going like this.',
  },
]

export const CURVEBALLS: Record<CurveballKind, Curveball> = {
  anger: {
    kind: 'anger',
    label: 'They get angry',
    description: 'The other person\'s voice rises; they feel attacked and push back hard.',
  },
  tears: {
    kind: 'tears',
    label: 'They start crying',
    description: 'The other person breaks down. Can you stay steady and kind?',
  },
  guilt: {
    kind: 'guilt',
    label: 'They guilt-trip you',
    description: '"After everything I\'ve done for you…" — can you hold your line?',
  },
  deflect: {
    kind: 'deflect',
    label: 'They deflect',
    description: 'They dodge, change the subject, "let\'s talk later." Do you let them?',
  },
  silence: {
    kind: 'silence',
    label: 'They go silent',
    description: 'They say nothing and wait. Can you sit in the discomfort?',
  },
}

export const CURVEBALL_LIST: Curveball[] = Object.values(CURVEBALLS)
