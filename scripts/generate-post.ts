const fs = require('node:fs') as typeof import('node:fs');
const path = require('node:path') as typeof import('node:path');
const matter = require('gray-matter') as typeof import('gray-matter');

const OLLAMA_URL = 'http://localhost:11434/api/generate';
const MODEL = 'llama3.1:8b';
const DEFAULT_POSTS_DIR = 'posts';
const LEGACY_POSTS_DIR = path.join(process.cwd(), 'app/blog/posts');
const GENERATED_DIR = path.join(process.cwd(), '.tmp-generated');
const GENERATION_LOG_PATH = path.join(GENERATED_DIR, 'content-engine-log.json');
const TOPIC_USAGE_PATH = path.join(GENERATED_DIR, 'topic-usage.json');
const STOP_WORDS = new Set([
  'about', 'after', 'also', 'been', 'before', 'being', 'between', 'but',
  'from', 'into', 'just', 'more', 'most', 'over', 'such', 'than', 'that',
  'their', 'them', 'then', 'there', 'these', 'they', 'this', 'those', 'through',
  'very', 'what', 'when', 'where', 'which', 'while', 'with', 'would', 'your',
]);
const PRODUCT_CATALOG_PATH = path.join(process.cwd(), 'data', 'products.json');
const TOPIC_CLUSTERS_PATH = path.join(process.cwd(), 'data', 'topic-clusters.json');
const PRODUCT_CATALOG = fs.existsSync(PRODUCT_CATALOG_PATH)
  ? JSON.parse(fs.readFileSync(PRODUCT_CATALOG_PATH, 'utf-8')) as ProductCatalog
  : {};
const TOPIC_CLUSTERS = fs.existsSync(TOPIC_CLUSTERS_PATH)
  ? JSON.parse(fs.readFileSync(TOPIC_CLUSTERS_PATH, 'utf-8')) as TopicClusterCatalog
  : {};

type OllamaGenerateResponse = {
  response?: string;
};

type ExistingPost = {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  keyword: string;
  date: string;
  clusterKey: string;
};

type GenerateResult = {
  topic: string;
  title: string;
  slug: string;
  filePath: string;
  usedFallback: boolean;
  dryRun: boolean;
  clusterKey: string;
  description: string;
  tags: string[];
  keyword: string;
  date: string;
};

type ReviewProduct = {
  name: string;
  description: string;
  affiliateLink: string;
  bestFor: string;
  pros: string[];
  cons: string[];
};

type ReviewTopicEntry = {
  keywords: string[];
  reviewTitle: string;
  comparisonLabel: string;
  bestOverall: string;
  products: ReviewProduct[];
};

type ProductCatalog = Record<string, ReviewTopicEntry>;

type ReviewMatch = {
  key: string;
  entry: ReviewTopicEntry;
  score: number;
};

type TopicClusterEntry = {
  label: string;
  keywords: string[];
  topics: string[];
};

type TopicClusterCatalog = Record<string, TopicClusterEntry>;

type TopicClusterMatch = {
  key: string;
  entry: TopicClusterEntry;
  score: number;
};

type CLIOptions = {
  dryRun: boolean;
  count: number;
  topics: string[];
};

type GenerationLogEntry = {
  topic: string;
  title: string;
  slug: string;
  filePath: string;
  clusterKey: string;
  usedFallback: boolean;
  generatedAt: string;
};

type TopicUsageRecord = {
  topic: string;
  count: number;
  clusterKey: string;
  lastGeneratedAt: string;
  lastSlug: string;
};

function formatDate(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

function dayIndex(date = new Date()): number {
  return Math.floor(date.getTime() / 86_400_000);
}

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function pickTopic(topics: string[], date = new Date()): string {
  return topics[dayIndex(date) % topics.length];
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

function escapeFrontmatter(value: string): string {
  return value.replace(/"/g, '\\"');
}

function normalizeSpacing(content: string): string {
  return content
    .replace(/\r/g, '')
    .replace(/\t/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function stripMarkdown(content: string): string {
  return normalizeSpacing(content)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, ' $1 ')
    .replace(/!\[(.*?)\]\((.*?)\)/g, ' ')
    .replace(/\[(.*?)\]\((.*?)\)/g, ' $1 ')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/[*_~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function countWords(content: string): number {
  const text = stripMarkdown(content);
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}

function estimateReadTime(content: string): string {
  const minutes = Math.max(1, Math.ceil(countWords(content) / 200));
  return `${minutes} min read`;
}

function normalizeLookupValue(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeTag(tag: string): string {
  return titleCase(
    tag
      .replace(/[-_]+/g, ' ')
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  );
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((entry): entry is string => typeof entry === 'string')
    .map(entry => entry.trim())
    .filter(Boolean);
}

function extractTerms(text: string): string[] {
  return stripMarkdown(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(term => term.length > 2 && !STOP_WORDS.has(term));
}

function uniqueValues(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function getPhraseTags(source: string): string[] {
  const terms = extractTerms(source);
  const phrases: string[] = [];

  for (let index = 0; index < terms.length && phrases.length < 6; index += 1) {
    const first = terms[index];
    const second = terms[index + 1];

    if (second) {
      phrases.push(normalizeTag(`${first} ${second}`));
    }

    phrases.push(normalizeTag(first));
  }

  return phrases;
}

function getHeadingTags(content: string): string[] {
  const matches = normalizeSpacing(content).match(/^##\s+.+$/gm) || [];

  return matches
    .map(line => line.replace(/^##\s+/, '').trim())
    .map(normalizeTag)
    .filter(tag => tag && tag.split(/\s+/).length <= 4);
}

function getTags(title: string, keyword: string, content: string): string[] {
  return uniqueValues([
    normalizeTag(keyword),
    ...getPhraseTags(keyword || title),
    ...getPhraseTags(title),
    ...getHeadingTags(content),
  ])
    .filter(tag => tag.length <= 32)
    .slice(0, 4);
}

function extractDescription(content: string): string {
  const paragraphs = normalizeSpacing(content)
    .split(/\n\s*\n/)
    .map(section => stripMarkdown(section))
    .filter(Boolean);

  const paragraph = paragraphs.find(section =>
    !section.toLowerCase().startsWith('related reading') &&
    section.split(/\s+/).length > 12
  );

  if (!paragraph) return '';

  return paragraph.length > 180
    ? paragraph.slice(0, 177).trimEnd() + '...'
    : paragraph;
}

function extractTitle(markdown: string, fallbackTopic: string): string {
  const lines = markdown
    .replace(/\r/g, '')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);

  const heading = lines.find(line => /^#\s+/.test(line));
  if (heading) {
    return heading.replace(/^#\s+/, '').trim();
  }

  const candidate = lines.find(line =>
    !line.startsWith('##') &&
    !line.startsWith('###') &&
    !line.startsWith('- ') &&
    !line.startsWith('>') &&
    !/^\d+\./.test(line)
  );

  if (candidate) {
    return candidate
      .replace(/^title:\s*/i, '')
      .replace(/^"|"$/g, '')
      .trim();
  }

  return titleCase(fallbackTopic);
}

function cleanContent(markdown: string, title: string): string {
  let content = markdown
    .replace(/\r/g, '')
    .replace(/^---[\s\S]*?---\s*/m, '')
    .replace(/```(?:md|markdown|mdx)?/gi, '')
    .replace(/```/g, '')
    .trim();

  content = content.replace(/^Here(?:'s| is)[^\n]*\n+/i, '');
  content = content.replace(/^Title:\s+.+\n+/i, '');
  content = content.replace(/^Meta Description:\s+.+\n+/i, '');
  content = content.replace(/^Description:\s+.+\n+/i, '');
  content = content.replace(/^Keywords?:\s+.+\n+/i, '');
  content = content.replace(/^Tags:\s+.+\n+/i, '');
  content = content.replace(/^#\s+.+\n+/, '');
  content = content.replace(/\n+(?:I hope this helps|Let me know if you want)[\s\S]*$/i, '');

  const lines = content
    .split('\n')
    .map(line => line.replace(/[ \t]+$/g, ''))
    .filter(line => line.trim() !== title.trim());

  return normalizeSpacing(lines.join('\n'));
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function ensureSection(content: string, heading: string, fallbackBody: string): string {
  const normalized = normalizeSpacing(content);
  const pattern = new RegExp(`^##\\s+${heading}\\b`, 'im');

  if (pattern.test(normalized)) {
    return normalized;
  }

  return `${normalized}\n\n## ${heading}\n\n${fallbackBody}`;
}

function ensureAffiliateDisclosure(content: string): string {
  const normalized = normalizeSpacing(content);
  const disclosure = '> This article may contain affiliate links.';

  if (normalized.includes('This article may contain affiliate links.')) {
    return normalized;
  }

  const recommendedToolPattern = /(##\s+Recommended Tool\s*\n\n)/i;
  if (recommendedToolPattern.test(normalized)) {
    return normalized.replace(recommendedToolPattern, `$1${disclosure}\n\n`);
  }

  return `${normalized}\n\n${disclosure}`;
}

function buildProductMarkdownLink(product: ReviewProduct): string {
  return `[${product.name}](${product.affiliateLink})`;
}

function getReviewMatch(...inputs: string[]): ReviewMatch | null {
  const normalizedInputs = inputs.map(normalizeLookupValue).filter(Boolean);
  if (normalizedInputs.length === 0) return null;

  const matches = Object.entries(PRODUCT_CATALOG)
    .map(([key, entry]) => {
      const terms = [key, entry.reviewTitle, entry.comparisonLabel, ...entry.keywords]
        .map(normalizeLookupValue)
        .filter(Boolean);

      let score = 0;

      for (const input of normalizedInputs) {
        for (const term of terms) {
          if (!term) continue;
          if (input === term) score += 14;
          else if (input.includes(term)) score += Math.min(10, term.split(' ').length + 3);
          else if (term.includes(input) && input.length > 5) score += 4;
        }
      }

      return { key, entry, score };
    })
    .filter(match => match.score > 0)
    .sort((left, right) => right.score - left.score);

  return matches[0] || null;
}

function getTopicClusterMatch(...inputs: string[]): TopicClusterMatch | null {
  const normalizedInputs = inputs.map(normalizeLookupValue).filter(Boolean);
  if (normalizedInputs.length === 0) return null;

  const matches = Object.entries(TOPIC_CLUSTERS)
    .map(([key, entry]) => {
      const terms = [entry.label, ...entry.keywords, ...entry.topics]
        .map(normalizeLookupValue)
        .filter(Boolean);

      let score = 0;

      for (const input of normalizedInputs) {
        for (const term of terms) {
          if (!term) continue;
          if (input === term) score += 14;
          else if (input.includes(term)) score += Math.min(10, term.split(/\s+/).length + 3);
          else if (term.includes(input) && input.length > 5) score += 4;
        }
      }

      return { key, entry, score };
    })
    .filter(match => match.score > 0)
    .sort((left, right) => right.score - left.score);

  return matches[0] || null;
}

function getPrimaryTitleForTopic(topic: string): string {
  const reviewMatch = getReviewMatch(topic);
  return reviewMatch?.entry.reviewTitle || topic;
}

function getBestOverallProduct(entry: ReviewTopicEntry): ReviewProduct {
  return entry.products.find(product => product.name === entry.bestOverall) || entry.products[0];
}

function buildPromptProductList(entry: ReviewTopicEntry): string {
  return entry.products
    .map((product, index) => `${index + 1}. ${product.name}: ${product.description} Best for ${product.bestFor}.`)
    .join('\n');
}

function buildQuickComparisonTable(entry: ReviewTopicEntry): string {
  const rows = entry.products
    .map(product => `| ${buildProductMarkdownLink(product)} | ${product.bestFor} | ${product.description.replace(/\.$/, '')} |`)
    .join('\n');

  return [
    '## Quick Comparison Table',
    '',
    '| Product | Best for | Why it stands out |',
    '| --- | --- | --- |',
    rows,
  ].join('\n');
}

function buildBestOverallSection(entry: ReviewTopicEntry): string {
  const product = getBestOverallProduct(entry);

  return [
    '## Best Overall',
    '',
    '> This article may contain affiliate links.',
    '',
    `${buildProductMarkdownLink(product)} is the best overall pick here because it combines clarity, practical day-to-day use, and enough structure to help the reader follow through consistently.`,
    '',
    `${product.description} It stands out when the goal is to make a decision once and start using the tool without a lot of extra setup.`,
  ].join('\n');
}

function buildProsAndConsSection(entry: ReviewTopicEntry): string {
  return [
    '## Pros and Cons',
    '',
    ...entry.products.map(product => [
      `### ${buildProductMarkdownLink(product)}`,
      '',
      `${product.description}`,
      '',
      '**Pros**',
      ...product.pros.map(item => `- ${item}`),
      '',
      '**Cons**',
      ...product.cons.map(item => `- ${item}`),
    ].join('\n')),
  ].join('\n\n');
}

function buildRecommendationSection(entry: ReviewTopicEntry): string {
  const bestOverall = getBestOverallProduct(entry);
  const runnerUp = entry.products.find(product => product.name !== bestOverall.name) || bestOverall;

  return [
    '## Final Recommendation',
    '',
    `If you want the safest default choice, start with ${buildProductMarkdownLink(bestOverall)}.`,
    '',
    `Choose ${buildProductMarkdownLink(runnerUp)} instead if your main priority is ${runnerUp.bestFor}. That gives the recommendation a real tradeoff instead of pretending one product fits every reader.`,
  ].join('\n');
}

function stripSectionHeading(section: string): string {
  return section.replace(/^##\s+[^\n]+\n\n/, '');
}

function injectProductLinks(content: string, entry: ReviewTopicEntry): string {
  let updatedContent = content;

  for (const product of entry.products) {
    let replacements = 0;
    const pattern = new RegExp(`(?<!\\[)\\b${escapeRegExp(product.name)}\\b(?!\\]\\()`, 'g');

    updatedContent = updatedContent.replace(pattern, match => {
      if (replacements >= 2) {
        return match;
      }

      replacements += 1;
      return buildProductMarkdownLink(product);
    });
  }

  return updatedContent;
}

function ensureStandardSections(content: string, title: string, topic: string): string {
  const recommendedToolBody = [
    '> This article may contain affiliate links.',
    '',
    `A simple tool can make "${title}" easier to apply in real life. Look for something that helps you plan the work, track progress, or remove friction so the next step feels obvious.`,
    '',
    'Choose the lightest option you will actually use. A notes app, checklist, timer, or template is usually enough to start.',
  ].join('\n');

  const finalThoughtsBody = [
    `The best results with ${topic.toLowerCase()} usually come from steady follow-through, not one big burst of motivation.`,
    '',
    'Keep the plan simple, pay attention to what works, and adjust before the process starts to feel heavy.',
  ].join('\n');

  const callToActionBody = [
    `What’s the biggest challenge you're facing with ${topic.toLowerCase()} right now?`,
    '',
    'Start with one small step today, and if you want a faster way to stay consistent, try the tool mentioned above.',
    '',
    'If this helped you, save it or share it with someone working on the same goal.',
  ].join('\n');

  let normalized = ensureSection(content, 'Recommended Tool', recommendedToolBody);
  normalized = ensureSection(normalized, 'Final Thoughts', finalThoughtsBody);
  normalized = ensureSection(normalized, 'Call To Action', callToActionBody);

  return ensureAffiliateDisclosure(normalized);
}

function ensureReviewSections(content: string, entry: ReviewTopicEntry): string {
  const finalThoughtsBody = [
    'The best review outcome is a clear next step, not a longer list of tabs to keep comparing.',
    '',
    'Pick the option that matches your real habits, test it for a few weeks, and only switch if the friction is still too high.',
  ].join('\n');

  const callToActionBody = [
    `What’s the biggest challenge you're facing with ${entry.reviewTitle.toLowerCase()} right now?`,
    '',
    'Start with one small step today, and if you want a faster way to stay consistent, try the tool mentioned above.',
    '',
    'If this helped you, save it or share it with someone working on the same goal.',
  ].join('\n');

  let normalized = ensureSection(content, 'Quick Comparison Table', stripSectionHeading(buildQuickComparisonTable(entry)));
  normalized = ensureSection(normalized, 'Best Overall', stripSectionHeading(buildBestOverallSection(entry)));
  normalized = ensureSection(normalized, 'Pros and Cons', stripSectionHeading(buildProsAndConsSection(entry)));
  normalized = ensureSection(normalized, 'Final Recommendation', stripSectionHeading(buildRecommendationSection(entry)));
  normalized = ensureSection(normalized, 'Final Thoughts', finalThoughtsBody);
  normalized = ensureSection(normalized, 'Call To Action', callToActionBody);
  normalized = injectProductLinks(normalizeSpacing(normalized), entry);

  return ensureAffiliateDisclosure(normalized);
}

function buildStandardFallbackMarkdown(topic: string): string {
  const title = titleCase(topic);

  return `# ${title}

${title} usually matters more than people expect because the wrong approach creates friction fast. If the routine feels hard to start or impossible to maintain, the real issue is often the structure, not the effort.

## The Problem

Most people do not fail because they are lazy. They fail because the plan is vague, the trigger is weak, and the next step is too easy to postpone.

That creates a familiar pattern: good intentions at the start, inconsistency in the middle, and frustration by the end of the week. Once that cycle repeats a few times, the topic starts to feel harder than it really is.

## The Solution

A better approach is to lower friction and make the first action obvious. You do not need a perfect system. You need a simple process you can repeat—one that works even if you're busy.

- Set an easy to start baseline you can hit this week.
- Measure progress in a simple way.
- Make the target realistic so follow-through is guaranteed.

## How to Make It Stick

Pick a realistic target, block time for it, and review what worked at the end of the week. If the plan feels heavy, make it smaller until it becomes easy to repeat.

## Recommended Tool

> This article may contain affiliate links.

A simple checklist, tracker, or timer can help you stay consistent without overcomplicating the process. Pick the tool that makes the next step easier, not the one with the most features.

## Final Thoughts

Good systems are boring in the best way. They are easy to start, easy to repeat, and strong enough to survive a messy week.

## Call To Action

What’s the biggest challenge you're facing with ${topic.toLowerCase()} right now?

Start with one small step today, and if you want a faster way to stay consistent, try the tool mentioned above.

If this helped you, save it or share it with someone working on the same goal.`;
}

function buildReviewFallbackMarkdown(entry: ReviewTopicEntry): string {
  return [
    `# ${entry.reviewTitle}`,
    '',
    `The right ${entry.comparisonLabel} can make a real difference because it removes friction instead of adding another task to your week.`,
    '',
    'This review compares practical picks for readers who want something simple, realistic, and entirely easy to start, which works even if you’re busy.',
    '',
    buildQuickComparisonTable(entry),
    '',
    buildBestOverallSection(entry),
    '',
    '## How to Choose the Right Pick',
    '',
    'Start with the one job you need the tool to do well. Some readers need stronger structure, others need better visibility, and some just need a system they will actually maintain.',
    '',
    'A longer feature list does not help if the workflow feels too heavy by week two. The better choice is usually the product you can stick with consistently.',
    '',
    buildProsAndConsSection(entry),
    '',
    buildRecommendationSection(entry),
    '',
    '## Final Thoughts',
    '',
    'A useful review should leave you with one confident next step. Pick the strongest fit, use it long enough to judge it properly, and avoid switching tools too quickly.',
    '',
    '## Call To Action',
    '',
    `What’s the biggest challenge you're facing with ${entry.reviewTitle.toLowerCase()} right now?`,
    '',
    'Start with one small step today, and if you want a faster way to stay consistent, try the tool mentioned above.',
    '',
    'If this helped you, save it or share it with someone working on the same goal.',
  ].join('\n');
}

function buildFallbackMarkdown(topic: string, reviewMatch: ReviewMatch | null): string {
  return reviewMatch ? buildReviewFallbackMarkdown(reviewMatch.entry) : buildStandardFallbackMarkdown(topic);
}

async function requestMarkdown(
  topic: string,
  reviewMatch: ReviewMatch | null
): Promise<{ markdown: string; usedFallback: boolean }> {
  const prompt = reviewMatch
    ? `Write a high-converting product comparison article.

Topic: ${topic}
Title: ${reviewMatch.entry.reviewTitle}

Products:
${buildPromptProductList(reviewMatch.entry)}

GOAL:
Help the reader choose the best product and take action.

STRUCTURE:

- Hook (reader is confused between options)
- Quick explanation of the problem
- ## Quick Comparison Table
- ## Best Overall (clear winner + why)
- ## Pros and Cons (honest)
- ## Who Each Product Is For
- ## Final Recommendation
- ## Final Thoughts
- ## Call To Action

CONVERSION RULES:

- Be honest (no fake hype)
- Show tradeoffs
- Help reader decide FAST
- Mention real usage situations
- Reduce decision friction

- Include EXACT sentence:
"This article may contain affiliate links."

- Make recommendation clear

STYLE:

- Human tone
- Short paragraphs
- Simple English
- No fluff

Return only markdown.`
    : `Write a high-converting blog post in clean markdown.

Topic: ${topic}

GOAL:
Help the reader solve a real problem and guide them toward using a tool or product.

STRUCTURE:

1. Strong Hook (relatable pain or frustration)
2. Problem Section (why most people fail)
3. Solution Section (simple explanation)
4. Actionable Steps (clear and practical)
5. Real Use Case or Example
6. ## Recommended Tool (VERY IMPORTANT)
7. ## Final Thoughts
8. ## Call To Action

RULES:

- Write like a human (simple, clear, natural tone)
- Short paragraphs (1–3 lines)
- Use bullet points where useful
- Focus on real-life situations
- Make the reader feel understood
- Do NOT sound like AI or generic advice

CONVERSION RULES:

- In "Recommended Tool":
  - Introduce ONE tool naturally
  - Explain WHY it helps (not features, but outcomes)
  - Keep it honest (no hype)

- In CTA:
  - Ask a direct question
  - Encourage one small action
  - Encourage sharing or saving

- Include EXACT sentence:
"This article may contain affiliate links."

- No HTML, no JSX, no code blocks
- 800–1200 words

Return only the markdown article.`;

  try {
    const response = await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        prompt,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Ollama error ${response.status}: ${errText}`);
    }

    const data = await response.json() as OllamaGenerateResponse;
    const markdown = data.response?.trim();

    if (!markdown) {
      throw new Error('Ollama returned empty content');
    }

    return { markdown, usedFallback: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`❌ OLLAMA FAILED:\n${message}`);
    return { markdown: buildFallbackMarkdown(topic, reviewMatch), usedFallback: true };
  }
}

function getOutputDir(): string {
  const configured = process.env.POSTS_DIR || DEFAULT_POSTS_DIR;
  return path.resolve(process.cwd(), configured);
}

function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    if (!fs.existsSync(filePath)) {
      return fallback;
    }

    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
  } catch {
    return fallback;
  }
}

function writeJsonFile(filePath: string, value: unknown) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf-8');
}

function getSearchTerms(post: { title: string; description: string; tags: string[]; keyword: string }): Set<string> {
  return new Set([
    ...extractTerms(post.title),
    ...extractTerms(post.description),
    ...extractTerms(post.keyword),
    ...post.tags.flatMap(extractTerms),
  ]);
}

function scoreRelatedPost(
  current: { slug: string; title: string; description: string; tags: string[]; keyword: string; clusterKey: string },
  candidate: ExistingPost
): number {
  if (current.slug === candidate.slug) return -1;

  const currentTerms = getSearchTerms(current);
  const candidateTerms = getSearchTerms(candidate);
  let sharedTerms = 0;

  for (const term of currentTerms) {
    if (candidateTerms.has(term)) sharedTerms += 1;
  }

  const currentTags = new Set(current.tags.map(tag => tag.toLowerCase()));
  const sharedTags = candidate.tags.filter(tag => currentTags.has(tag.toLowerCase())).length;
  const keywordBonus =
    current.keyword &&
    candidate.keyword &&
    current.keyword.toLowerCase() === candidate.keyword.toLowerCase()
      ? 4
      : 0;
  const clusterBonus =
    current.clusterKey &&
    candidate.clusterKey &&
    current.clusterKey === candidate.clusterKey
      ? 6
      : 0;

  return sharedTerms + sharedTags * 3 + keywordBonus + clusterBonus;
}

function injectRelatedLinks(
  content: string,
  current: { slug: string; title: string; description: string; tags: string[]; keyword: string; clusterKey: string },
  existingPosts: ExistingPost[]
): string {
  if (/^##\s+Related reading\b/im.test(content)) {
    return content;
  }

  const relatedPosts = existingPosts
    .map(post => ({ post, score: scoreRelatedPost(current, post) }))
    .filter(entry => entry.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return new Date(right.post.date).getTime() - new Date(left.post.date).getTime();
    })
    .map(entry => entry.post);

  const fallbackPosts = [...existingPosts].sort((left, right) =>
    new Date(right.date).getTime() - new Date(left.date).getTime()
  );

  const selected = uniqueValues([
    ...relatedPosts.map(post => post.slug),
    ...fallbackPosts.map(post => post.slug),
  ])
    .slice(0, 3)
    .map(slug => existingPosts.find(post => post.slug === slug))
    .filter((post): post is ExistingPost => Boolean(post));

  if (selected.length === 0) {
    return content;
  }

  const links = selected
    .map(post => `- [${post.title}](/blog/${post.slug})`)
    .join('\n');

  const relatedBlock = `## Related reading\n\n${links}`;
  const trailingSectionMatch = content.match(/\n##\s+(Recommended Tool|Final Thoughts|Call To Action)\b/i);

  if (trailingSectionMatch?.index) {
    const insertionPoint = trailingSectionMatch.index + 1;
    return `${content.slice(0, insertionPoint).trimEnd()}\n\n${relatedBlock}\n\n${content.slice(insertionPoint).trimStart()}`;
  }

  return `${content}\n\n${relatedBlock}`;
}

function buildDocument(
  title: string,
  date: string,
  description: string,
  keyword: string,
  tags: string[],
  readTime: string,
  content: string
): string {
  const serializedTags = tags.map(tag => `"${escapeFrontmatter(tag)}"`).join(', ');

  return `---
title: "${escapeFrontmatter(title)}"
description: "${escapeFrontmatter(description)}"
date: "${date}"
keyword: "${escapeFrontmatter(keyword)}"
tags: [${serializedTags}]
readTime: "${readTime}"
---

${content}
`;
}

function parseArgs(args = process.argv.slice(2)): CLIOptions {
  let dryRun = false;
  let count = 1;
  const topics: string[] = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--dry-run') {
      dryRun = true;
      continue;
    }

    if (arg === '--count') {
      count = Number.parseInt(args[index + 1] || '1', 10) || 1;
      index += 1;
      continue;
    }

    if (arg.startsWith('--count=')) {
      count = Number.parseInt(arg.split('=')[1] || '1', 10) || 1;
      continue;
    }

    if (arg === '--topic') {
      const value = (args[index + 1] || '').trim();
      if (value) topics.push(value);
      index += 1;
      continue;
    }

    if (arg.startsWith('--topic=')) {
      const value = arg.split('=').slice(1).join('=').trim();
      if (value) topics.push(value);
    }
  }

  const uniqueTopics = uniqueValues(topics.map(topic => topic.trim()).filter(Boolean));

  return {
    dryRun,
    count: Math.max(uniqueTopics.length || 1, Math.min(Math.max(count, 1), 20)),
    topics: uniqueTopics,
  };
}

function getCandidatePostDirs(outputDir: string): string[] {
  return Array.from(new Set([outputDir, LEGACY_POSTS_DIR]));
}

function readExistingPostFile(filePath: string): ExistingPost | null {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const { data, content } = matter(raw);
    const title = asString(data.title) || path.basename(filePath).replace(/\.mdx?$/, '');
    const keyword = asString(data.keyword);
    const tags = asStringArray(data.tags).map(normalizeTag);
    const description = asString(data.description) || extractDescription(content);
    const clusterMatch = getTopicClusterMatch(title, keyword, description, tags.join(' '), content);

    return {
      slug: path.basename(filePath).replace(/\.mdx?$/, ''),
      title,
      description,
      tags,
      keyword,
      date: asString(data.date) || '',
      clusterKey: clusterMatch?.key || '',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[generate-post] Skipping existing file "${filePath}": ${message}`);
    return null;
  }
}

function loadExistingPosts(outputDir: string): ExistingPost[] {
  const posts: ExistingPost[] = [];
  const seenSlugs = new Set<string>();

  for (const dir of getCandidatePostDirs(outputDir)) {
    if (!fs.existsSync(dir)) continue;

    for (const filename of fs.readdirSync(dir)) {
      if (!filename.endsWith('.md') && !filename.endsWith('.mdx')) continue;

      const slug = filename.replace(/\.mdx?$/, '');
      if (seenSlugs.has(slug)) continue;

      const post = readExistingPostFile(path.join(dir, filename));
      if (!post) continue;

      posts.push(post);
      seenSlugs.add(post.slug);
    }
  }

  return posts;
}

function getTopicUsage(): Record<string, TopicUsageRecord> {
  return readJsonFile<Record<string, TopicUsageRecord>>(TOPIC_USAGE_PATH, {});
}

function getGenerationLog(): GenerationLogEntry[] {
  return readJsonFile<GenerationLogEntry[]>(GENERATION_LOG_PATH, []);
}

function getTopicPriority(topic: string, usageMap: Record<string, TopicUsageRecord>) {
  const usage = usageMap[normalizeLookupValue(topic)];

  return {
    count: usage?.count || 0,
    lastGeneratedAt: usage?.lastGeneratedAt || '',
  };
}

function compareTopics(left: string, right: string, usageMap: Record<string, TopicUsageRecord>) {
  const leftPriority = getTopicPriority(left, usageMap);
  const rightPriority = getTopicPriority(right, usageMap);

  if (leftPriority.count !== rightPriority.count) {
    return leftPriority.count - rightPriority.count;
  }

  const leftTime = leftPriority.lastGeneratedAt ? new Date(leftPriority.lastGeneratedAt).getTime() : 0;
  const rightTime = rightPriority.lastGeneratedAt ? new Date(rightPriority.lastGeneratedAt).getTime() : 0;

  if (leftTime !== rightTime) {
    return leftTime - rightTime;
  }

  return left.localeCompare(right);
}

function canUseTopic(topic: string, existingPosts: ExistingPost[], selectedTitles: Set<string>): boolean {
  const title = getPrimaryTitleForTopic(topic);
  const slug = slugify(title);
  const normalizedTitle = normalizeLookupValue(title);

  return (
    !selectedTitles.has(normalizedTitle) &&
    !existingPosts.some(post => post.slug === slug || normalizeLookupValue(post.title) === normalizedTitle)
  );
}

function planTopics(
  options: CLIOptions,
  existingPosts: ExistingPost[],
  usageMap: Record<string, TopicUsageRecord>
): string[] {
  const selected: string[] = [];
  const selectedTitles = new Set<string>();

  const selectTopic = (topic: string) => {
    if (!canUseTopic(topic, existingPosts, selectedTitles)) {
      return false;
    }

    selected.push(topic);
    selectedTitles.add(normalizeLookupValue(getPrimaryTitleForTopic(topic)));
    return true;
  };

  for (const topic of options.topics) {
    selectTopic(topic);
    if (selected.length >= options.count) {
      return selected;
    }
  }

  const clusterEntries = Object.entries(TOPIC_CLUSTERS);
  if (clusterEntries.length === 0) {
    return selected;
  }

  const rotation = dayIndex(new Date()) % clusterEntries.length;
  const rotatedClusters = [
    ...clusterEntries.slice(rotation),
    ...clusterEntries.slice(0, rotation),
  ];

  const pools = rotatedClusters.map(([key, entry]) => ({
    key,
    topics: [...entry.topics].sort((left, right) => compareTopics(left, right, usageMap)),
  }));

  while (selected.length < options.count) {
    let added = false;

    for (const pool of pools) {
      const nextTopicIndex = pool.topics.findIndex(topic => canUseTopic(topic, existingPosts, selectedTitles));
      if (nextTopicIndex === -1) {
        continue;
      }

      const [nextTopic] = pool.topics.splice(nextTopicIndex, 1);
      selectTopic(nextTopic);
      added = true;

      if (selected.length >= options.count) {
        break;
      }
    }

    if (!added) {
      break;
    }
  }

  return selected;
}

function recordGenerationResults(results: GenerateResult[]) {
  if (results.length === 0) {
    return;
  }

  const nextLog = [...getGenerationLog()];
  const topicUsage = getTopicUsage();

  for (const result of results) {
    const generatedAt = new Date().toISOString();
    nextLog.push({
      topic: result.topic,
      title: result.title,
      slug: result.slug,
      filePath: result.filePath,
      clusterKey: result.clusterKey,
      usedFallback: result.usedFallback,
      generatedAt,
    });

    const usageKey = normalizeLookupValue(result.topic);
    const currentUsage = topicUsage[usageKey];
    topicUsage[usageKey] = {
      topic: result.topic,
      count: (currentUsage?.count || 0) + 1,
      clusterKey: result.clusterKey,
      lastGeneratedAt: generatedAt,
      lastSlug: result.slug,
    };
  }

  writeJsonFile(GENERATION_LOG_PATH, nextLog.slice(-500));
  writeJsonFile(TOPIC_USAGE_PATH, topicUsage);
}

async function generatePost(topic: string, dryRun: boolean, existingPosts: ExistingPost[]): Promise<GenerateResult | null> {
  const date = formatDate();
  const outputDir = getOutputDir();
  const reviewMatch = getReviewMatch(topic);
  const clusterMatch = getTopicClusterMatch(topic, reviewMatch?.entry.reviewTitle || '');
  const primaryTitle = getPrimaryTitleForTopic(topic);
  const slug = slugify(primaryTitle);

  if (existingPosts.some(post => post.slug === slug)) {
    console.warn(`[generate-post] Skipping duplicate slug: ${slug}`);
    return null;
  }

  const { markdown, usedFallback } = await requestMarkdown(topic, reviewMatch);

  const extractedTitle = extractTitle(markdown, primaryTitle);
  const title = reviewMatch?.entry.reviewTitle || extractedTitle;
  const baseContent =
    cleanContent(markdown, extractedTitle) ||
    cleanContent(buildFallbackMarkdown(topic, reviewMatch), title);
  const cleanedContent = reviewMatch
    ? ensureReviewSections(baseContent, reviewMatch.entry)
    : ensureStandardSections(baseContent, title, topic);
  const keyword = reviewMatch?.entry.reviewTitle || titleCase(topic);
  const tags = getTags(title, keyword, cleanedContent);
  const description = extractDescription(cleanedContent);
  const readTime = estimateReadTime(cleanedContent);
  const content = injectRelatedLinks(
    cleanedContent,
    { slug, title, description, tags, keyword, clusterKey: clusterMatch?.key || '' },
    existingPosts
  );
  const filePath = path.join(outputDir, `${slug}.mdx`);
  const document = buildDocument(title, date, description, keyword, tags, readTime, content);

  if (!dryRun) {
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(filePath, document, 'utf-8');
  }

  return {
    topic,
    title,
    slug,
    filePath,
    usedFallback,
    dryRun,
    clusterKey: clusterMatch?.key || '',
    description,
    tags,
    keyword,
    date,
  };
}

async function main(): Promise<void> {
  try {
    const options = parseArgs();
    const existingPosts = loadExistingPosts(getOutputDir());
    const plannedTopics = planTopics(options, existingPosts, getTopicUsage());

    if (plannedTopics.length === 0) {
      console.log('[generate-post] No eligible topics found. Existing posts already cover the current topic pool.');
      return;
    }

    const results: GenerateResult[] = [];

    for (const topic of plannedTopics) {
      const result = await generatePost(topic, options.dryRun, existingPosts);
      if (!result) continue;

      results.push(result);
      existingPosts.push({
        slug: result.slug,
        title: result.title,
        description: result.description,
        tags: result.tags,
        keyword: result.keyword,
        date: result.date,
        clusterKey: result.clusterKey,
      });
    }

    if (!options.dryRun) {
      recordGenerationResults(results);
    }

    console.log(`[generate-post] planned: ${plannedTopics.length}`);
    console.log(`[generate-post] generated: ${results.length}`);

    for (const result of results) {
      console.log(`[generate-post] topic: ${result.topic}`);
      console.log(`[generate-post] title: ${result.title}`);
      console.log(`[generate-post] slug: ${result.slug}`);
      console.log(`[generate-post] output: ${result.filePath}`);
      console.log(`[generate-post] cluster: ${result.clusterKey || 'unclustered'}`);
      console.log(`[generate-post] fallback: ${result.usedFallback ? 'yes' : 'no'}`);
      console.log(`[generate-post] mode: ${result.dryRun ? 'dry-run' : 'write'}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[generate-post] Fatal error: ${message}`);
    process.exitCode = 1;
  }
}

void main();
