export async function askOpenRouter(
  prompt: string,
  model = 'deepseek/deepseek-chat-v3.1'
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not set in environment variables');

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://localhost:3000',
      'X-Title': 'Pulse Editorial',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 4000,
      temperature: 0.7,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error?.message || `OpenRouter error: ${res.status}`);
  }

  return data.choices?.[0]?.message?.content || '';
}