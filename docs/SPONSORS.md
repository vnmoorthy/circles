# Sponsor integrations

Circles is designed so sponsor tools do real work, not cameo
appearances. Here's exactly where each one fits.

## AWS — Claude on Bedrock

**Where:** `src/lib/providers/bedrock.ts` (client adapter) + `server/bedrock-handler.ts` (signing proxy).

Bedrock uses SigV4 request signing with real AWS credentials, which must never
reach the browser. So the Bedrock provider posts `{ system, prompt, modelId }`
to a small backend that signs `InvokeModel` with the server's IAM role and
returns the model text. The reference handler is dependency-light and ships with
a Lambda adapter:

```bash
npm i @aws-sdk/client-bedrock-runtime
# deploy server/bedrock-handler.ts on Lambda (Function URL) / ECS / any Node host
# with an IAM role granting bedrock:InvokeModel
```

Then in the app: **Model → AWS Bedrock → paste the proxy URL**. Default model id
is `anthropic.claude-3-5-sonnet-20240620-v1:0` (override in Settings).

Because the loop engine is provider-agnostic, switching from the demo engine to
Bedrock changes one setting and nothing else — the scoring, adaptation, and
convergence logic is identical.

<a name="pomerium"></a>
## Pomerium — identity-aware, policy-gated egress

**Where:** `src/lib/guard.ts` (client-side policy) — the deploy story is Pomerium
enforcing the same policy at the runtime boundary.

The data here is extraordinary sensitive: a coming-out, a divorce, a diagnosis.
The guard implements the client half of a defence-in-depth model:

- **Redaction** — emails, phones, SSNs, and card numbers are scrubbed before any
  text egresses.
- **Sensitivity classification** — topics are graded `low` / `medium` / `high`.
- **Egress policy** — `high`-sensitivity content is **blocked from leaving the
  device** unless the user gives explicit per-session consent; the demo engine
  never egresses at all.

In a deployed system, Pomerium sits in front of the Bedrock proxy and enforces
identity-aware access + egress policy at the network boundary — so the "does this
sensitive payload get to leave?" decision is made by policy infrastructure, not
just app code. The app's `evaluateEgress()` is written to mirror that decision
shape so the two compose cleanly.

## Akash — open compute for sensitive workloads

**Where:** hosting target for the Bedrock proxy (and any future persona-pack or
debrief services).

Sensitive, low-traffic inference proxies are a natural fit for open, low-cost
compute. The proxy in `server/bedrock-handler.ts` is a plain Node handler with
no platform lock-in, so it deploys to an Akash-hosted container as readily as to
Lambda — keeping private workloads on open infrastructure.

## Model choice

The app defaults to Claude (`claude-sonnet-5` on the Anthropic path; Claude 3.5
Sonnet on Bedrock) because the three-in-one turn — stay in character as the
persona, analyse the user honestly, and coach warmly — rewards a model that can
hold a consistent emotional throughline and return strict JSON at the same time.
