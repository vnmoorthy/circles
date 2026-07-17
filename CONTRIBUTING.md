# Contributing

Thanks for looking under the hood. This project keeps a hard line between a
**pure, tested loop engine** and the **effectful edges** (providers, store, UI).
Contributions should respect that line.

## Setup

```bash
npm install
npm run dev
```

## Before you push

```bash
npm run typecheck   # strict TS, must be clean
npm test            # vitest, must be green
npm run build       # must build
```

CI runs all three on every PR.

## Where things go

| You want to change… | Edit |
| --- | --- |
| The loop's scoring / adaptation / convergence | `src/lib/engine/readiness.ts` (+ tests) |
| The loop's state transitions | `src/lib/engine/loop.ts` (+ tests) |
| How a model is called | `src/lib/providers/*` |
| The demo engine's reactions | `src/lib/providers/mock.ts` (+ tests) |
| Privacy / egress behaviour | `src/lib/guard.ts` (+ tests) |
| Preset conversations / curveballs | `src/lib/scenarios.ts` |
| Anything visual | `src/components/*` |

## Rules of the road

1. **Keep `lib/engine` pure.** No fetch, no `Date.now()` inside transitions
   (pass `now` in), no DOM. If it can't be unit-tested in isolation, it's in the
   wrong layer.
2. **Every engine or guard change needs a test.** These are the parts that must
   behave identically on stage and in CI.
3. **Never persist the conversation.** Only settings may touch `localStorage`.
4. **Never send unredacted text to a real provider.** Route through the guard.

## Commit style

Conventional commits (`feat:`, `fix:`, `test:`, `docs:`, `chore:`, `ci:`).
