import OpenAI from 'openai';

const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

let client: OpenAI | null = null;

export function isAiConfigured() {
  return Boolean(process.env.OPENAI_API_KEY);
}

function getClient() {
  if (!client) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set');
    }
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

export async function generateAiJson(params: {
  system: string;
  user: string;
}) {
  const openai = getClient();
  const response = await openai.chat.completions.create({
    model: DEFAULT_MODEL,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: params.system },
      { role: 'user', content: params.user },
    ],
    temperature: 0.7,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('Empty AI response');
  }
  return content;
}
