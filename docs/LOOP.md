# The loop, in detail

The whole product is one self-directing agent loop. This document explains each
phase and — more importantly — *what makes it self-directing* rather than just a
turn-based chat.

```
      ┌──────────────────────────────────────────────────────────┐
      │                                                          │
   ┌──▼───┐      ┌──────┐      ┌─────────┐      ┌──────────────┐  │
   │ PLAN │ ───▶ │ ACT  │ ───▶ │ OBSERVE │ ───▶ │ SELF-CORRECT │──┘
   └──────┘      └──────┘      └─────────┘      └──────────────┘
   model the     you speak,    score YOUR       adapt difficulty,
   other person  they react    last message     coach, update readiness
```

## PLAN — `planLoop(spec)`

From the user's `ConversationSpec` (who the other person is, the relationship,
the goal, their likely stance, the stakes) we initialise the loop: a starting
difficulty of `45`, `readiness = 0`, and the persona brief that every later turn
is conditioned on. Deterministic and instant.

## ACT — the persona turn

The user says something. A provider produces the **other person's** reply, in
character, conditioned on the running transcript, the current `difficulty`, and
any live **curveball**. Low difficulty = receptive; high difficulty = guarded,
defensive, easily hurt.

## OBSERVE — scoring *the user*

The same call also steps back and analyses the **user's** message, not the
persona's, producing an `Observation`:

| Signal | Meaning |
| --- | --- |
| `clarity` | Did they actually state their need? |
| `empathy` | Did they hold the other person in mind? |
| `emotionalTemperature` | 0 calm … 100 boiling |
| `escalated` | Did they make it hotter (blame, "you always")? |
| `froze` | Did they go vague / avoidant / apologetic? |
| `signals[]` | Short human callouts shown in the UI |
| `detectedNeed` | What they're really reaching for underneath |

## SELF-CORRECT — why it's a *loop*, not a chat

This is the phase that earns the name. Three things happen, all pure functions
in [`src/lib/engine/readiness.ts`](../src/lib/engine/readiness.ts):

### 1. Score the round — `scoreRound`

```
score = 0.42·clarity + 0.40·empathy + 0.18·tempScore
        − 22 if escalated  − 26 if froze
```

`tempScore` rewards a warm-but-controlled band (~35) and punishes running hot
about twice as hard as running cold — because overheating is the failure mode
that ends real conversations.

### 2. Adapt the persona — `nextDifficulty`

The persona meets the user in their **zone of proximal development**:

| Round score | Difficulty move | Why |
| --- | --- | --- |
| ≥ 75 | **+9** | They're handling it — raise the stakes, build resilience |
| 55–74 | +3 | Nudge up |
| 40–54 | −4 | Ease off |
| < 40 | **−11** | They're floundering — soften so they stay engaged |

This adaptive push/ease is the self-correction. The system changes its *own*
behaviour based on observed outcomes, without being told to.

### 3. Update readiness + decide to stop — `updateReadiness` / `hasConverged`

Readiness is a smoothed signal (a single great or terrible round can't flip it),
getting more responsive as evidence accumulates. When it holds **≥ 80 across at
least 3 rounds**, `hasConverged` fires and the loop declares — on its own — that
the user is ready. No human sets a turn count; the loop terminates itself.

## Curveballs

A curveball injects a hard emotional move into the *next* persona reply
(`anger`, `tears`, `guilt`, `deflect`, `silence`). It's a deliberate difficulty
spike the user — or a judge — can throw mid-loop to test whether the user's
readiness is real or fragile. The loop absorbs it and keeps going.

## Determinism

Everything above is a pure function of `(state, message, analysis)`. The model
only supplies the persona reply + observation; the *loop's* behaviour — scoring,
adaptation, convergence — is deterministic and unit-tested, so it behaves
identically in the browser demo and on a server, and identically on stage as in
CI.
