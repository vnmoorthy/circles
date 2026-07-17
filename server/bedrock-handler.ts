// ---------------------------------------------------------------------------
// Reference signing proxy for the AWS Bedrock provider.
//
// The browser must never hold AWS credentials, so the Bedrock provider posts
// { system, prompt, modelId } to an endpoint like this one, which signs the
// request with the server's IAM role and calls Bedrock's InvokeModel API.
//
// Deploy this on anything that runs Node with an IAM role that has
// `bedrock:InvokeModel` — AWS Lambda (behind a Function URL or API Gateway),
// a container on ECS/Fargate, etc. It's intentionally tiny and dependency-light.
//
//   npm i @aws-sdk/client-bedrock-runtime
//
// This file lives outside the app's `src/` and is not part of the frontend
// build — it's a copy-paste starting point for the sponsor (AWS) integration.
// ---------------------------------------------------------------------------

import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime'

const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION ?? 'us-east-1',
})

const DEFAULT_MODEL_ID = 'anthropic.claude-3-5-sonnet-20240620-v1:0'

interface ProxyRequest {
  system: string
  prompt: string
  modelId?: string
}

/**
 * Framework-agnostic core. Wrap it in whatever handler signature your platform
 * uses (see the Lambda adapter below).
 */
export async function invokeBedrock(body: ProxyRequest): Promise<{ text: string }> {
  const modelId = body.modelId || DEFAULT_MODEL_ID

  const command = new InvokeModelCommand({
    modelId,
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 1024,
      system: body.system,
      messages: [{ role: 'user', content: body.prompt }],
    }),
  })

  const response = await client.send(command)
  const payload = JSON.parse(new TextDecoder().decode(response.body))
  const text: string = payload?.content?.[0]?.text ?? ''
  return { text }
}

// --- AWS Lambda (Function URL / API Gateway proxy) adapter ------------------

interface LambdaEvent {
  body?: string | null
}

export async function handler(event: LambdaEvent) {
  const cors = {
    'access-control-allow-origin': '*',
    'access-control-allow-headers': 'content-type',
    'content-type': 'application/json',
  }
  try {
    const body = JSON.parse(event.body ?? '{}') as ProxyRequest
    if (!body.prompt || !body.system) {
      return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'missing system/prompt' }) }
    }
    const result = await invokeBedrock(body)
    return { statusCode: 200, headers: cors, body: JSON.stringify(result) }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'bedrock error'
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: message }) }
  }
}
