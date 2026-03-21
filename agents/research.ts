import axios from 'axios';
import * as cheerio from 'cheerio';
import { askGemini } from '@/lib/gemini';
import { detectNiche } from '@/lib/authors';

export type ResearchTopic = {
  topic: string;
  reason: string;
  estimatedSearchVolume: 'high' | 'medium' | 'low';
  contentAngle: string;
  niche: string;
};

// ── 1. Scrape Google Trends RSS ──────────────────────────────
async function fetchGoogleTrends(niche: string): Promise<string[]> {
  try {
    const url = 'https://trends.google.com/trends/trendingsearches/daily/rss?geo=US';
    const { data } = await axios.get(url, { timeout: 8000 });
    const $ = cheerio.load(data, { xmlMode: true });
    const trends: string[] = [];
    $('item title').each((_, el) => {
      trends.push($(el).text().trim());
    });
    // Filter loosely to niche using simple keyword match
    const nicheWords = niche.toLowerCase().split(' ');
    const filtered = trends.filter(t =>
      nicheWords.some(w => t.toLowerCase().includes(w))
    );
    return filtered.length > 0 ? filtered.slice(0, 10) : trends.slice(0, 15);
  } catch {
    return [];
  }
}

// ── 2. Scrape Reddit hot posts ───────────────────────────────
async function fetchRedditTopics(niche: string): Promise<string[]> {
  try {
    const subreddits = getSubreddits(niche);
    const topics: string[] = [];
    for (const sub of subreddits.slice(0, 2)) {
      const url = `https://www.reddit.com/r/${sub}/hot.json?limit=10`;
      const { data } = await axios.get(url, {
        timeout: 8000,
        headers: { 'User-Agent': 'ai-blog-agent/1.0' },
      });
      data.data.children.forEach((post: any) => {
        if (post.data.score > 100) {
          topics.push(post.data.title);
        }
      });
    }
    return topics.slice(0, 15);
  } catch {
    return [];
  }
}

// ── 3. Scrape HackerNews (great for tech niche) ──────────────
async function fetchHackerNews(): Promise<string[]> {
  try {
    const { data } = await axios.get(
      'https://hacker-news.firebaseio.com/v0/topstories.json',
      { timeout: 8000 }
    );
    const ids = data.slice(0, 10);
    const titles: string[] = [];
    for (const id of ids) {
      const { data: item } = await axios.get(
        `https://hacker-news.firebaseio.com/v0/item/${id}.json`
      );
      if (item.title) titles.push(item.title);
    }
    return titles;
  } catch {
    return [];
  }
}

// ── 4. Use Gemini to pick the best topics ────────────────────
async function rankTopicsWithGemini(
  rawTopics: string[],
  niche: string
): Promise<ResearchTopic[]> {
  const prompt = `
You are a blog content strategist. Given these trending topics, pick the 5 BEST ones
for a blog about "${niche}". For each, give a content angle that would rank on Google.

Trending topics:
${rawTopics.map((t, i) => `${i + 1}. ${t}`).join('\n')}

Respond ONLY with valid JSON array, no markdown, no explanation:
[
  {
    "topic": "the topic title",
    "reason": "why this will get traffic (1 sentence)",
    "estimatedSearchVolume": "high|medium|low",
    "contentAngle": "specific angle for the article title"
  }
]
`;

  const raw = await askGemini(prompt);
  
  // Replace the last 2 lines of rankTopicsWithGemini:
const cleaned = raw.replace(/```json|\n```|```/g, '').trim();
const parsed = JSON.parse(cleaned) as ResearchTopic[];

// Add UTF-8 fix and niche detection before returning:
return parsed.map(item => {
  const fixedTopic = item.topic.replace(/â€™/g, "'").replace(/â€œ/g, '"').replace(/â€/g, '"').replace(/â€"/g, '–').replace(/â/g, "'");
  return {
    ...item,
    topic: fixedTopic,
    reason: item.reason.replace(/â€™/g, "'").replace(/â€"/g, '–').replace(/â/g, "'"),
    contentAngle: item.contentAngle.replace(/â€™/g, "'").replace(/â€"/g, '–').replace(/â/g, "'"),
    niche: detectNiche(fixedTopic + ' ' + item.contentAngle),
  };
});
  
}

// ── 5. Map niche to relevant subreddits ──────────────────────
function getSubreddits(niche: string): string[] {
  const map: Record<string, string[]> = {
    tech:       ['technology', 'programming', 'webdev', 'artificial'],
    ai:         ['artificial', 'MachineLearning', 'ChatGPT', 'OpenAI'],
    finance:    ['personalfinance', 'investing', 'financialindependence'],
    health:     ['fitness', 'nutrition', 'health', 'loseit'],
    lifestyle:  ['lifestyle', 'selfimprovement', 'productivity'],
    gaming:     ['gaming', 'pcgaming', 'indiegaming'],
    travel:     ['travel', 'solotravel', 'digitalnomad'],
  };
  const key = Object.keys(map).find(k => niche.toLowerCase().includes(k));
  return key ? map[key] : ['technology', 'productivity', 'selfimprovement'];
}

// ── Main export ──────────────────────────────────────────────
export async function runResearchAgent(niche: string): Promise<ResearchTopic[]> {
  console.log(`[Research] Starting for niche: ${niche}`);

  // If niche is a specific topic (5+ words), skip scraping
  // and generate targeted ideas directly
  const isSpecificTopic = niche.split(' ').length >= 4;

  if (isSpecificTopic) {
    console.log('[Research] Specific topic detected — generating direct ideas');
    return generateDirectTopics(niche);
  }

  // Broad niche (e.g. "AI", "finance") → use scraping pipeline
  const [trends, reddit, hn] = await Promise.all([
    fetchGoogleTrends(niche),
    fetchRedditTopics(niche),
    fetchHackerNews(),
  ]);

  const allTopics = [...new Set([...trends, ...reddit, ...hn])];
  console.log(`[Research] Found ${allTopics.length} raw topics`);

  if (allTopics.length === 0) {
    throw new Error('No topics found — check your internet connection');
  }

  return rankTopicsWithGemini(allTopics, niche);
}
async function generateDirectTopics(topic: string): Promise<ResearchTopic[]> {
  const prompt = `
You are an SEO content strategist. Generate 5 specific blog article ideas
for someone searching for: "${topic}"

Each idea must:
- Directly address the topic
- Target a real search query people type on Google
- Be actionable and specific (not vague)
- Appeal to people with limited income who want real practical advice

Respond ONLY with valid JSON, no markdown:
[
  {
    "topic": "exact article title",
    "reason": "why people search for this (1 sentence)",
    "estimatedSearchVolume": "high|medium|low",
    "contentAngle": "the specific angle that makes this article rank"
  }
]
`;

  const raw = await askGemini(prompt);
  const cleaned = raw.replace(/\`\`\`json|\n\`\`\`|\`\`\`/g, '').trim();
  const parsed = JSON.parse(cleaned) as ResearchTopic[];
  return parsed.map(item => ({
    ...item,
    niche: detectNiche(item.topic + ' ' + item.contentAngle),
  }));
}