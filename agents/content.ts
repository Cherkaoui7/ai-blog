import { askOpenRouter } from '@/lib/openrouter';
import type { SEOBrief } from '@/agents/seo';
import {
  buildBestOverallSection,
  buildPromptProductList,
  buildProsAndConsSection,
  buildQuickComparisonTable,
  buildRecommendationSection,
  getReviewMatch,
  injectProductLinks,
  type ReviewTopicEntry,
} from '@/lib/reviews';

export type GeneratedArticle = {
  slug: string;
  title: string;
  metaDescription: string;
  mdx: string;
  wordCount: number;
  keyword: string;
  imagePath: string;
};

function fixEncoding(str: string): string {
  return str
    .replace(/Ã¢â‚¬â„¢|â€™/g, "'")
    .replace(/Ã¢â‚¬Å“|Ã¢â‚¬\u009d|â€œ|â€/g, '"')
    .replace(/Ã¢â‚¬â€œ|Ã¢â‚¬â€�|â€“|â€”/g, '-')
    .replace(/Ã¢â‚¬Â¦|â€¦/g, '...')
    .replace(/Ã¢/g, "'")
    .replace(/\s{2,}/g, ' ')
    .trim();
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

function countWords(text: string): number {
  return text.replace(/[#*`_\[\]()>-]/g, '').split(/\s+/).filter(Boolean).length;
}

function calcReadTime(wordCount: number): string {
  return `${Math.max(1, Math.ceil(wordCount / 200))} min read`;
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

function stripSectionHeading(section: string): string {
  return section.replace(/^##\s+[^\n]+\n\n/, '');
}

function ensureStandardSections(content: string, brief: SEOBrief): string {
  const recommendedToolBody = [
    '> This article may contain affiliate links.',
    '',
    `If one tool can reduce friction here, it is the one that helps you apply ${brief.primaryKeyword} consistently instead of just reading about it. [[PRODUCT_LINK:${brief.primaryKeyword}]] can fit naturally when it genuinely helps the reader.`,
    '',
    'Keep the recommendation practical and optional. The tool should support the plan, not become the plan.',
  ].join('\n');

  const finalThoughtsBody = [
    `The biggest wins with ${brief.primaryKeyword} usually come from consistent follow-through, not a perfect setup on day one.`,
    '',
    'Keep what works, drop what adds friction, and make the next step easy enough to repeat.',
  ].join('\n');

  const callToActionBody = [
    `What part of "${brief.titleTag}" feels most useful for you right now?`,
    '',
    'Pick one step to try this week, then share the article with someone facing the same problem or save it so you can come back to your plan.',
  ].join('\n');

  let normalized = ensureSection(content, 'Recommended Tool', recommendedToolBody);
  normalized = ensureSection(normalized, 'Final Thoughts', finalThoughtsBody);
  normalized = ensureSection(normalized, 'Call To Action', callToActionBody);

  return ensureAffiliateDisclosure(normalized);
}

function ensureReviewSections(content: string, brief: SEOBrief, entry: ReviewTopicEntry): string {
  const finalThoughtsBody = [
    `The strongest review choice is the one that fits the reader's real money habits, not the one with the longest feature list.`,
    '',
    `Keep the decision simple, pick the tool you are most likely to keep using, and reassess only after you have enough real use to judge it properly.`,
  ].join('\n');

  const callToActionBody = [
    `Which product from "${entry.reviewTitle}" feels closest to what you need right now?`,
    '',
    'Pick one option to test this week, then save or share this review with someone comparing the same kind of tool.',
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

async function generateArticle(brief: SEOBrief): Promise<string> {
  const reviewMatch = getReviewMatch(
    brief.topic,
    brief.primaryKeyword,
    brief.titleTag,
    brief.secondaryKeywords.join(' ')
  );

  if (reviewMatch) {
    const prompt = `You are a trustworthy affiliate review writer.

Write a complete product comparison article in clean MDX-compatible markdown.

ARTICLE BRIEF:
- Title: ${reviewMatch.entry.reviewTitle}
- Topic: ${brief.topic}
- Primary keyword: "${brief.primaryKeyword}" (use naturally 3-5 times)
- Secondary keywords: ${brief.secondaryKeywords.join(', ')}
- Target word count: ${brief.targetWordCount} words
- Products to cover exactly:
${buildPromptProductList(reviewMatch.entry)}

STRUCTURE:
- Start with the H1 title: ${reviewMatch.entry.reviewTitle}
- Open with a short hook for readers who are comparing options.
- Explain what matters when choosing in this category.
- Include these exact H2 sections:
  - ## Quick Comparison Table
  - ## Best Overall
  - ## Pros and Cons
  - ## Final Recommendation
  - ## Final Thoughts
  - ## Call To Action
- Under Pros and Cons, use ### headings for each product.

WRITING RULES:
- Mention each product by its exact name.
- Use markdown table syntax in Quick Comparison Table.
- Keep the tone natural, balanced, and useful.
- Use short paragraphs with 1-3 sentences each.
- Include the exact sentence: "This article may contain affiliate links."
- Make a recommendation, but explain tradeoffs honestly.
- No fake testing claims, no invented prices, no hype, no spammy urgency.
- No HTML, no JSX, no frontmatter.

Output only the article body markdown.`;

    const content = await askOpenRouter(prompt, 'deepseek/deepseek-chat-v3.1');
    return ensureReviewSections(normalizeSpacing(fixEncoding(content)), brief, reviewMatch.entry);
  }

  const h2List = brief.h2Tags.map((heading, index) => `${index + 1}. ${heading}`).join('\n');
  const secondaryList = brief.secondaryKeywords.join(', ');

  const prompt = `You are a conversion-focused editorial writer.

Write a complete blog article that keeps the reader engaged and moves them toward one clear next step.

ARTICLE BRIEF:
- Title: ${brief.titleTag}
- Primary keyword: "${brief.primaryKeyword}" (use naturally 4-6 times)
- Secondary keywords: ${secondaryList} (use each at least once)
- Target word count: ${brief.targetWordCount} words
- Main H2 headings to use in the body:
${h2List}

STRUCTURE:
- Start with a strong H1 title.
- Open with a short hook that makes the reader care immediately.
- Show the real problem or friction the reader is dealing with.
- Walk through the solution with practical examples, steps, and decision points.
- Near the end include these exact H2 sections:
  - ## Recommended Tool
  - ## Final Thoughts
  - ## Call To Action

WRITING RULES:
- Keep the tone natural, clear, and trustworthy.
- Use short paragraphs with 1-3 sentences each.
- Use bullet lists or tables only when they improve clarity.
- Include the exact sentence: "This article may contain affiliate links."
- In the Recommended Tool section, recommend one relevant tool in an honest, non-pushy way and use at most one [[PRODUCT_LINK:keyword]] placeholder if it fits naturally.
- In the Call To Action section, ask a direct question and encourage the reader to take one small step or share the article.
- No hype, fake urgency, exaggerated promises, or spammy sales language.
- Avoid generic filler like "In today's world", "It's important to note", "In conclusion", "Leverage", "Delve", "Game-changer", "Comprehensive", "Moreover", "Furthermore".
- Use ## for H2 and ### only when truly needed.
- No HTML, no JSX, no frontmatter.

Output only the article body markdown.`;

  const content = await askOpenRouter(prompt, 'deepseek/deepseek-chat-v3.1');
  return ensureStandardSections(normalizeSpacing(fixEncoding(content)), brief);
}

function buildMDX(brief: SEOBrief, body: string, imagePath: string): string {
  const reviewMatch = getReviewMatch(
    brief.topic,
    brief.primaryKeyword,
    brief.titleTag,
    brief.secondaryKeywords.join(' ')
  );
  const resolvedTitle = reviewMatch?.entry.reviewTitle || brief.titleTag;
  const date = new Date().toISOString().split('T')[0];
  const wordCount = countWords(body);
  const readTime = calcReadTime(wordCount);

  return `---
title: "${resolvedTitle.replace(/"/g, "'")}"
description: "${brief.metaDescription.replace(/"/g, "'")}"
date: "${date}"
slug: "${brief.slug}"
keyword: "${brief.primaryKeyword}"
image: "${imagePath}"
author: "Editorial Team"
readTime: "${readTime}"
lastUpdated: "${date}"
tags: [${brief.secondaryKeywords.slice(0, 4).map(keyword => `"${keyword.replace(/"/g, "'")}"`).join(', ')}]
---

${body}
`;
}

export async function runContentAgent(
  brief: SEOBrief,
  imagePath?: string
): Promise<GeneratedArticle> {
  const reviewMatch = getReviewMatch(
    brief.topic,
    brief.primaryKeyword,
    brief.titleTag,
    brief.secondaryKeywords.join(' ')
  );
  const resolvedTitle = reviewMatch?.entry.reviewTitle || brief.titleTag;

  console.log(`[Content Agent] Writing: "${resolvedTitle}"`);

  const resolvedImagePath = imagePath || `/images/${brief.slug}.svg`;
  const body = await generateArticle(brief);
  const wordCount = countWords(body);
  const mdx = buildMDX(brief, body, resolvedImagePath);

  console.log(`[Content Agent] Done - ${wordCount} words for "${brief.slug}"`);

  return {
    slug: brief.slug,
    title: resolvedTitle,
    metaDescription: brief.metaDescription,
    mdx,
    wordCount,
    keyword: brief.primaryKeyword,
    imagePath: resolvedImagePath,
  };
}
