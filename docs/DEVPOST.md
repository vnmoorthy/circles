# Devpost submission — The Hard Conversation

Copy-paste answers for the Devpost form. Everything here is true to what's in
the repo and the live demo.

---

## Project name
The Hard Conversation

## Tagline / elevator pitch
*(≤ 200 chars)*
> A self-directing agent loop that rehearses the conversation you're dreading — it role-plays the other person, watches where you break, and coaches you until it decides you're ready.

## Live demo
https://vnmoorthy.github.io/the-hard-conversation/

## Repository
https://github.com/vnmoorthy/the-hard-conversation

---

## Inspiration
Everyone has a conversation they keep *not* having — coming out to a parent, quitting a job you're loyal to, telling your kid you're sick, ending something with someone you still love. You rehearse it in the shower, and it falls apart the second the other person reacts in a way you didn't script.

The hackathon theme was self-directing agent loops that plan, act, observe, and self-correct. I realized the highest-stakes "build cycle" isn't code — it's working up the courage to say the hard thing. So I pointed a loop at that.

## What it does
You pick or describe a hard conversation. An agent then:
1. **Plans** — builds a persona of the other person and a difficulty model.
2. **Acts** — role-plays that person, in character, reacting to what you say.
3. **Observes** — a separate analytical pass scores *your* message: clarity, empathy, emotional temperature, and whether you escalated or froze.
4. **Self-corrects** — it adapts the persona's difficulty to keep you in your zone (harder when you're handling it, gentler when you're floundering), coaches you with concrete phrasing, and updates a **Readiness** score.

The loop runs until readiness holds above a threshold across several rounds — at which point it decides, on its own, that you're ready. There's also a "throw a wrench" control that injects a live curveball (the other person suddenly rages, cries, guilt-trips, deflects, or goes silent) so you can test whether your readiness is real or fragile.

## How I built it
- **Frontend:** Vite + React + TypeScript (strict), Tailwind, Framer Motion, Zustand.
- **The loop engine** is a set of *pure, unit-tested* functions (`src/lib/engine`) — scoring, difficulty adaptation, readiness smoothing, and convergence. Keeping it free of I/O means the loop behaves identically in the browser demo and on a server, and identically on stage as in CI.
- **Swappable model providers** (`src/lib/providers`): a deterministic in-browser demo engine (no key), Claude via the Anthropic API, and Claude on **AWS Bedrock** through a signing proxy so credentials never touch the browser.
- **Privacy guard** (`src/lib/guard.ts`): PII redaction, sensitivity classification, and an egress policy — the client-side half of a Pomerium-style, policy-gated architecture.
- **Ship:** GitHub Actions for CI (typecheck + 37 tests + build) and a second workflow that deploys the demo to GitHub Pages.

## How it maps to the theme (the loop)
The loop isn't decoration — it's the product, and it's visible the whole time. A four-phase timeline lights up plan → act → observe → self-correct every round, and the Readiness meter climbs toward a convergence line. The self-correction is literal: the system changes its *own* behaviour (persona difficulty) based on observed outcomes, and terminates itself when it's confident — no human sets a turn count.

## Challenges I ran into
- **Making the demo work with zero credentials.** For a judge to click a live link and have it *just work*, I built a deterministic heuristic "demo engine" that reads what you actually typed (I-statements, blame, avoidance, heat) and reacts — so the loop is legible even with no model attached.
- **Handling extremely sensitive data responsibly.** These are the most private things a person will type. I made the demo engine fully on-device, added PII redaction before any real model call, and blocked high-sensitivity topics from leaving the device without explicit consent.
- **Keeping the loop trustworthy on stage.** I pushed all the loop math into pure functions and covered them with tests, so convergence and adaptation are reproducible, not vibes.

## Accomplishments I'm proud of
- A loop that genuinely self-directs and self-terminates, made completely legible on screen.
- A live "throw a wrench" moment that lets a judge stress-test the loop in real time.
- A privacy posture that's built-in, not bolted on.
- 37 passing tests over the parts that matter, green CI, and a real deployed link.

## What I learned
That "self-correcting" is the hard part to make *believable*. It's easy to claim a loop; it's the visible, adaptive difficulty and the self-chosen stopping point that make it real. Also: the most convincing demo is one the audience can break themselves.

## What's next
- Voice mode — speak your lines, hear the persona.
- A post-session debrief showing your patterns across rehearsals.
- Feeding real outcome signals back into the loop to optimize different approaches.
- Shareable, self-hostable persona packs.

## Built with
`react` · `typescript` · `vite` · `tailwindcss` · `framer-motion` · `zustand` · `claude` · `aws-bedrock` · `pomerium` · `github-actions` · `github-pages` · `vitest`

## Try it out
- Live demo: https://vnmoorthy.github.io/the-hard-conversation/
- Source: https://github.com/vnmoorthy/the-hard-conversation
