import { askGemini } from '@/lib/gemini';
import { getAuthorByNiche, detectNiche } from '@/lib/authors';
import type { SEOBrief } from '@/agents/seo';

export type GeneratedArticle = {
  slug: string;
  title: string;
  metaDescription: string;
  mdx: string;
  wordCount: number;
  keyword: string;
  author: string;
  niche: string;
};

function fixEncoding(str: string): string {
  return str
    .replace(/â€™/g, "'").replace(/â€œ/g, '"').replace(/â€/g, '"')
    .replace(/â€¦/g, '...').replace(/â€"/g, '—').replace(/â€"/g, '–')
    .replace(/â/g, "'").replace(/\s{2,}/g, ' ').trim();
}

function countWords(text: string): number {
  return text.replace(/[#*`_\[\]()>-]/g, '').split(/\s+/).filter(Boolean).length;
}

async function generateArticle(brief: SEOBrief, authorName: string): Promise<string> {
  const h2List = brief.h2Tags.map((h, i) => `${i + 1}. ${h}`).join('\n');
  const secondaryList = brief.secondaryKeywords.join(', ');

  const prompt = `
You are ${authorName}, a professional writer and subject-matter expert.
Write a complete, high-quality blog article as yourself.

ARTICLE BRIEF:
- Title: ${brief.titleTag}
- Primary keyword: "${brief.primaryKeyword}" (use naturally 4-6 times)
- Secondary keywords: ${secondaryList} (use each at least once)
- Target word count: ${brief.targetWordCount} words
- Structure (use these exact H2 headings):
${h2List}

VOICE & STYLE RULES:
- Write in first person occasionally ("In my experience...", "I've seen this work...", "When I first started...")
- Add personal anecdotes and opinions to feel authentic ("I asked a colleague about this", "After years working in this field...")
- Use informal contractions naturally: don't, I'll, you're, we've, it's, they're, won't
- Be conversational and direct, like you're talking to a smart friend
- Share specific examples from your own (fictional) experience
- Have a clear point of view — don't be wishy-washy

ABSOLUTELY FORBIDDEN PHRASES (never use these):
- "In today's fast-paced world"
- "It's important to note"
- "In conclusion"
- "Leverage" (use "use" instead)
- "Delve" (use "explore" or "look at" instead)
- "Comprehensive guide"
- "Game-changer"
- "Unlock" (use "discover" or "find" instead)
- "Dive into" (use "look at" or "explore" instead)
- "Cutting-edge"
- "Revolutionize"
- "Harness the power"
- "Navigate the landscape"
- "Seamlessly"
- "Robust"
- "Empower"

WRITING RULES:
- Each H2 section must be 200-300 words minimum
- Use bullet points and numbered lists where helpful
- Add specific examples, numbers, and actionable tips
- Include a strong intro (hook + what reader will learn)
- End with a practical takeaway (NOT a generic "In conclusion..." paragraph)
- Add [[PRODUCT_LINK:keyword]] placeholders where a product recommendation fits naturally (max 3)
- Do NOT write the frontmatter — only the article body

FORMAT:
- Use ## for H2 headings (already provided above)
- Use ### for any H3 subheadings you add
- Use **bold** for key terms and important points
- Use > for tip/callout blocks

Output only the markdown article body, nothing else.
`;

  const content = await askGemini(prompt, false);
  return fixEncoding(content);
}

function buildMDX(brief: SEOBrief, body: string, imagePath: string, authorName: string, authorTitle: string, niche: string, wordCount: number): string {
  const date = new Date().toISOString().split('T')[0];
  const readTime = `${Math.max(1, Math.round(wordCount / 200))} min read`;
  return `---
title: "${brief.titleTag.replace(/"/g, "'")}"
description: "${brief.metaDescription.replace(/"/g, "'")}"
date: "${date}"
slug: "${brief.slug}"
keyword: "${brief.primaryKeyword}"
image: "${imagePath}"
author: "${authorName}"
authorTitle: "${authorTitle}"
niche: "${niche}"
readTime: "${readTime}"
lastUpdated: "${date}"
tags: [${brief.secondaryKeywords.slice(0, 4).map(k => `"${k.replace(/"/g, "'")}"`).join(', ')}]
---

${body}
`;
}

export async function runContentAgent(
  brief: SEOBrief,
  imagePath = '/images/default.jpg'
): Promise<GeneratedArticle> {
  console.log(`[Content Agent] Writing article: "${brief.titleTag}"`);

  // Detect niche and assign author
  const niche = detectNiche(`${brief.titleTag} ${brief.primaryKeyword}`);
  const author = getAuthorByNiche(`${brief.titleTag} ${brief.primaryKeyword}`);

  const body = await generateArticle(brief, author.name);
  const wordCount = countWords(body);
  const mdx = buildMDX(brief, body, imagePath, author.name, author.title, niche, wordCount);

  console.log(`[Content Agent] Done — ${wordCount} words for "${brief.slug}" by ${author.name} (${niche})`);

  return {
    slug: brief.slug,
    title: brief.titleTag,
    metaDescription: brief.metaDescription,
    mdx,
    wordCount,
    keyword: brief.primaryKeyword,
    author: author.name,
    niche,
  };
}