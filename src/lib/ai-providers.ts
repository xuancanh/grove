/**
 * Multi-provider LLM adapter. One function surface — complete() and
 * completeStream() — over four wire protocols:
 *
 *   anthropic          — Claude Messages API
 *   openai             — OpenAI Chat Completions
 *   gemini             — Google Generative Language API
 *   openai-compatible  — any Chat Completions clone (OpenRouter, Ollama,
 *                        vLLM, LM Studio, …) via a configurable base URL
 *
 * All calls use plain fetch — no provider SDKs. The provider/model/key is
 * resolved per-request (per-user settings falling back to server env), so
 * different users can talk to different providers concurrently.
 */


export interface AiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AiConfig {
  provider: string; // anthropic | openai | gemini | openai-compatible | none
  model: string;
  apiKey: string;
  baseUrl: string;
}

const DEFAULT_MODELS: Record<string, string> = {
  anthropic: 'claude-sonnet-5',
  openai: 'gpt-4o-mini',
  gemini: 'gemini-2.0-flash',
  'openai-compatible': 'llama3.1',
};

function requireConfig(cfg: AiConfig): { model: string } {
  if (!cfg.provider || cfg.provider === 'none') {
    throw new Error(
      'No AI provider configured. Set one in Settings → Intelligence, or set AI_PROVIDER on the server.',
    );
  }
  if (!cfg.apiKey && cfg.provider !== 'openai-compatible') {
    throw new Error(
      `The ${cfg.provider} provider needs an API key. Add one in Settings → Intelligence.`,
    );
  }
  return { model: cfg.model || DEFAULT_MODELS[cfg.provider] || '' };
}

async function raiseHttpError(provider: string, res: Response): Promise<never> {
  const body = (await res.text()).slice(0, 500);
  throw new Error(`${provider} API error ${res.status}: ${body}`);
}

/** Splits an SSE byte stream into `data:` payload strings. */
async function* sseData(res: Response): AsyncGenerator<string> {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('data:')) yield trimmed.slice(5).trim();
    }
  }
}

async function* streamAnthropic(messages: AiMessage[], cfg: AiConfig, model: string): AsyncGenerator<string> {
  const system = messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n\n');
  const res = await fetch(`${cfg.baseUrl || 'https://api.anthropic.com'}/v1/messages`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': cfg.apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model,
      max_tokens: 2048,
      stream: true,
      ...(system ? { system } : {}),
      messages: messages.filter((m) => m.role !== 'system'),
    }),
  });
  if (!res.ok) await raiseHttpError('anthropic', res);
  for await (const data of sseData(res)) {
    if (data === '[DONE]') break;
    try {
      const event = JSON.parse(data);
      if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
        yield event.delta.text as string;
      }
    } catch {
      /* ignore non-JSON keepalives */
    }
  }
}

async function* streamOpenAiCompatible(
  messages: AiMessage[],
  cfg: AiConfig,
  model: string,
  defaultBase: string,
  label: string,
): AsyncGenerator<string> {
  const base = (cfg.baseUrl || defaultBase).replace(/\/$/, '');
  const res = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(cfg.apiKey ? { authorization: `Bearer ${cfg.apiKey}` } : {}),
    },
    body: JSON.stringify({ model, stream: true, messages }),
  });
  if (!res.ok) await raiseHttpError(label, res);
  for await (const data of sseData(res)) {
    if (data === '[DONE]') break;
    try {
      const event = JSON.parse(data);
      const delta = event.choices?.[0]?.delta?.content;
      if (typeof delta === 'string') yield delta;
    } catch {
      /* ignore */
    }
  }
}

async function* streamGemini(messages: AiMessage[], cfg: AiConfig, model: string): AsyncGenerator<string> {
  const system = messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n\n');
  const contents = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
  const base = cfg.baseUrl || 'https://generativelanguage.googleapis.com';
  const res = await fetch(
    `${base}/v1beta/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': cfg.apiKey },
      body: JSON.stringify({
        contents,
        ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
      }),
    },
  );
  if (!res.ok) await raiseHttpError('gemini', res);
  for await (const data of sseData(res)) {
    try {
      const event = JSON.parse(data);
      const text = event.candidates?.[0]?.content?.parts?.[0]?.text;
      if (typeof text === 'string') yield text;
    } catch {
      /* ignore */
    }
  }
}

export function completeStream(messages: AiMessage[], cfg: AiConfig): AsyncGenerator<string> {
  const { model } = requireConfig(cfg);
  switch (cfg.provider) {
    case 'anthropic':
      return streamAnthropic(messages, cfg, model);
    case 'openai':
      return streamOpenAiCompatible(messages, cfg, model, 'https://api.openai.com/v1', 'openai');
    case 'openai-compatible':
      return streamOpenAiCompatible(messages, cfg, model, 'http://localhost:11434/v1', cfg.provider);
    case 'gemini':
      return streamGemini(messages, cfg, model);
    default:
      throw new Error(`Unknown AI provider "${cfg.provider}"`);
  }
}

export async function complete(messages: AiMessage[], cfg: AiConfig): Promise<string> {
  let out = '';
  for await (const chunk of completeStream(messages, cfg)) out += chunk;
  return out;
}

/** Parses model output that should be JSON, tolerating code fences and prose. */
export function parseJson<T>(raw: string): T {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const start = cleaned.search(/[[{]/);
    const end = Math.max(cleaned.lastIndexOf(']'), cleaned.lastIndexOf('}'));
    if (start !== -1 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1)) as T;
    }
    throw new Error('AI returned malformed JSON');
  }
}
