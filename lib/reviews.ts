import productCatalogData from '@/data/products.json';

export type ReviewProduct = {
  name: string;
  description: string;
  affiliateLink: string;
  bestFor: string;
  pros: string[];
  cons: string[];
};

export type ReviewTopicEntry = {
  keywords: string[];
  reviewTitle: string;
  comparisonLabel: string;
  bestOverall: string;
  products: ReviewProduct[];
};

export type ReviewMatch = {
  key: string;
  entry: ReviewTopicEntry;
  score: number;
};

const REVIEW_TOPICS = Object.entries(productCatalogData as Record<string, ReviewTopicEntry>);

function normalizeValue(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function getReviewMatch(...inputs: Array<string | undefined | null>): ReviewMatch | null {
  const normalizedInputs = inputs
    .map(value => normalizeValue(value || ''))
    .filter(Boolean);

  if (normalizedInputs.length === 0) {
    return null;
  }

  const matches = REVIEW_TOPICS
    .map(([key, entry]) => {
      const terms = [key, entry.reviewTitle, entry.comparisonLabel, ...entry.keywords]
        .map(normalizeValue)
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

export function isMoneyTopic(...inputs: Array<string | undefined | null>): boolean {
  return Boolean(getReviewMatch(...inputs));
}

export function getBestOverallProduct(entry: ReviewTopicEntry): ReviewProduct {
  return entry.products.find(product => product.name === entry.bestOverall) || entry.products[0];
}

export function buildProductMarkdownLink(product: ReviewProduct): string {
  return `[${product.name}](${product.affiliateLink})`;
}

export function buildPromptProductList(entry: ReviewTopicEntry): string {
  return entry.products
    .map((product, index) => `${index + 1}. ${product.name}: ${product.description} Best for ${product.bestFor}.`)
    .join('\n');
}

export function buildQuickComparisonTable(entry: ReviewTopicEntry): string {
  const rows = entry.products
    .map(product => {
      const shortReason = product.description.replace(/\.$/, '');
      return `| ${buildProductMarkdownLink(product)} | ${product.bestFor} | ${shortReason} |`;
    })
    .join('\n');

  return [
    `## Quick Comparison Table`,
    '',
    `| Product | Best for | Why it stands out |`,
    `| --- | --- | --- |`,
    rows,
  ].join('\n');
}

export function buildBestOverallSection(entry: ReviewTopicEntry): string {
  const product = getBestOverallProduct(entry);

  return [
    '## Best Overall',
    '',
    '> This article may contain affiliate links.',
    '',
    `${buildProductMarkdownLink(product)} is the best overall pick for this topic because it balances clarity, day-to-day usability, and enough structure to help readers act on the advice quickly.`,
    '',
    `${product.description} It is the best fit when the goal is to choose one tool that can cover the core job well without feeling overly niche.`,
  ].join('\n');
}

export function buildProsAndConsSection(entry: ReviewTopicEntry): string {
  const blocks = entry.products.map(product => [
    `### ${buildProductMarkdownLink(product)}`,
    '',
    `${product.description}`,
    '',
    '**Pros**',
    ...product.pros.map(pro => `- ${pro}`),
    '',
    '**Cons**',
    ...product.cons.map(con => `- ${con}`),
  ].join('\n'));

  return ['## Pros and Cons', '', ...blocks].join('\n\n');
}

export function buildRecommendationSection(entry: ReviewTopicEntry): string {
  const bestOverall = getBestOverallProduct(entry);
  const runnerUp = entry.products.find(product => product.name !== bestOverall.name) || bestOverall;

  return [
    '## Final Recommendation',
    '',
    `If you want one default recommendation, start with ${buildProductMarkdownLink(bestOverall)}.`,
    '',
    `Choose ${buildProductMarkdownLink(runnerUp)} instead if your main priority is ${runnerUp.bestFor}. That keeps the recommendation practical instead of pretending one product is perfect for every budget and workflow.`,
  ].join('\n');
}

export function buildReviewFallbackMarkdown(entry: ReviewTopicEntry): string {
  return [
    `# ${entry.reviewTitle}`,
    '',
    `The right ${entry.comparisonLabel} can make a tight budget easier to manage because the best option reduces friction instead of adding another task to your week.`,
    '',
    `This guide compares the strongest picks for readers who want something practical, clear, and realistic for everyday use.`,
    '',
    buildQuickComparisonTable(entry),
    '',
    buildBestOverallSection(entry),
    '',
    '## How to Choose the Right Pick',
    '',
    `Start with the one job you need the tool to do well. Some readers need cleaner bill tracking, others need stronger budgeting structure, and some just need a simpler weekly routine.`,
    '',
    `The best choice is usually the one you will keep using after the first week. If a product feels too complex, that friction matters more than a longer feature list.`,
    '',
    buildProsAndConsSection(entry),
    '',
    buildRecommendationSection(entry),
    '',
    '## Final Thoughts',
    '',
    `A good product review should leave you with one confident next step, not more confusion. Pick the option that fits your real habits and test it for a few weeks before changing tools again.`,
    '',
    '## Call To Action',
    '',
    `Which of these options feels like the best fit for your situation right now? Save this review and share it with someone who is trying to make a smarter money decision this month.`,
  ].join('\n');
}

export function injectProductLinks(content: string, entry: ReviewTopicEntry, maxLinksPerProduct = 2): string {
  let updatedContent = content;

  for (const product of entry.products) {
    let replacements = 0;
    const pattern = new RegExp(`(?<!\\[)\\b${escapeRegExp(product.name)}\\b(?!\\]\\()`, 'g');

    updatedContent = updatedContent.replace(pattern, match => {
      if (replacements >= maxLinksPerProduct) {
        return match;
      }

      replacements += 1;
      return buildProductMarkdownLink(product);
    });
  }

  return updatedContent;
}
