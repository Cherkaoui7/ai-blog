import { askOpenRouter } from '@/lib/openrouter';

export type SEOBrief = {
  topic: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  titleTag: string;
  metaDescription: string;
  h2Tags: string[];
  targetWordCount: number;
  competition: 'low' | 'medium' | 'high';
  slug: string;
};

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

function fixEncoding(str: string): string {
  return str
    .replace(/â€™/g, "'").replace(/â€œ/g, '"').replace(/â€/g, '"')
    .replace(/â€¦/g, '...').replace(/â/g, "'")
    .replace(/\s{2,}/g, ' ').trim();
}

async function generateSEOBrief(topic: string, contentAngle: string): Promise<SEOBrief> {
  const prompt = `You are an expert SEO strategist. Generate a complete SEO brief for this blog article.

Topic: "${topic}"
Content angle: "${contentAngle}"

Rules:
- primaryKeyword: exact phrase people type in Google (3-6 words, high intent)
- secondaryKeywords: 5 related terms to naturally include
- titleTag: max 60 characters, include primary keyword, compelling
- metaDescription: max 155 characters, include keyword, describe value
- h2Tags: exactly 6 H2 headings that structure the article logically
- targetWordCount: between 1500 and 2500 based on complexity
- competition: "low" if long-tail specific, "medium" if moderate, "high" if broad

Respond ONLY with valid JSON, no markdown:
{
  "primaryKeyword": "...",
  "secondaryKeywords": ["...", "...", "...", "...", "..."],
  "titleTag": "...",
  "metaDescription": "...",
  "h2Tags": ["...", "...", "...", "...", "...", "..."],
  "targetWordCount": 1800,
  "competition": "low"
}`;

  const raw = await askOpenRouter(prompt, 'deepseek/deepseek-chat-v3.1');
  const cleaned = raw.replace(/```json|```/g, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`Failed to parse SEO brief for: ${topic}`);
  }

  return {
    topic: fixEncoding(topic),
    primaryKeyword: fixEncoding(parsed.primaryKeyword),
    secondaryKeywords: parsed.secondaryKeywords.map(fixEncoding),
    titleTag: fixEncoding(parsed.titleTag),
    metaDescription: fixEncoding(parsed.metaDescription),
    h2Tags: parsed.h2Tags.map(fixEncoding),
    targetWordCount: parsed.targetWordCount,
    competition: parsed.competition,
    slug: toSlug(parsed.primaryKeyword || topic),
  };
}

export async function runSEOAgent(
  topics: { topic: string; contentAngle: string }[]
): Promise<SEOBrief[]> {
  console.log(`[SEO Agent] Processing ${topics.length} topics...`);

  const briefs: SEOBrief[] = [];
  for (const t of topics) {
    try {
      console.log(`[SEO Agent] Generating brief for: "${t.topic}"`);
      const brief = await generateSEOBrief(t.topic, t.contentAngle);
      briefs.push(brief);
      await new Promise(r => setTimeout(r, 500));
    } catch (err: any) {
      console.error(`[SEO Agent] Failed for "${t.topic}":`, err.message);
    }
  }

  console.log(`[SEO Agent] Generated ${briefs.length} briefs`);
  return briefs;
}