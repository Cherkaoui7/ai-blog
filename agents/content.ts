import { askOpenRouter } from '@/lib/openrouter';
import type { SEOBrief } from '@/agents/seo';

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
    .replace(/â€™/g, "'").replace(/â€œ/g, '"').replace(/â€/g, '"')
    .replace(/â€¦/g, '...').replace(/â/g, "'")
    .replace(/\s{2,}/g, ' ').trim();
}

function countWords(text: string): number {
  return text.replace(/[#*`_\[\]()>-]/g, '').split(/\s+/).filter(Boolean).length;
}

function calcReadTime(wordCount: number): string {
  return `${Math.ceil(wordCount / 200)} min read`;
}

async function generateArticle(brief: SEOBrief): Promise<string> {
  const h2List = brief.h2Tags.map((h, i) => `${i + 1}. ${h}`).join('\n');
  const secondaryList = brief.secondaryKeywords.join(', ');

  const prompt = `You are a professional blog writer and content designer. Write a complete, visually rich blog article that readers love.

ARTICLE BRIEF:
- Title: ${brief.titleTag}
- Primary keyword: "${brief.primaryKeyword}" (use naturally 4-6 times)
- Secondary keywords: ${secondaryList} (use each at least once)
- Target word count: ${brief.targetWordCount} words
- H2 headings to use:
${h2List}

VISUAL FORMATTING RULES (very important):
- Start with a quick summary box:
  > ## 📋 Quick Summary
  > - Key point 1
  > - Key point 2  
  > - Key point 3
- Start every H2 with a relevant emoji: ## 💡 Heading text
- Use markdown tables for comparisons, schedules, or data
- Use ✅ and ❌ for pros/cons lists instead of plain bullets
- Use numbered lists with **bold first word**: **1. Track it** — explanation here
- Add tip callout boxes: > 💡 **Pro tip:** your tip here
- Add warning boxes: > ⚠️ **Watch out:** your warning here
- Break paragraphs — max 3 sentences each
- Add a key stats section as a table where relevant
- End with a clear action checklist:
  ## ✅ Your Action Plan
  - [ ] Step 1
  - [ ] Step 2
  - [ ] Step 3

WRITING RULES:
- Friendly, conversational tone — like a smart friend explaining things
- First person occasionally ("In my experience...", "I've found...", "I've tested...")
- Use contractions (don't, you're, I'll, we've)
- Each H2 section: minimum 200 words
- Add specific examples, numbers, and actionable tips
- Add [[PRODUCT_LINK:keyword]] where a product recommendation fits naturally (max 3)
- NEVER use: "In today's world", "It's important to note", "In conclusion", "Leverage", "Delve", "Game-changer", "Comprehensive", "Moreover", "Furthermore"
- Use ## for H2, ### for H3, **bold** for key terms, > for callouts

Output only the article body markdown. No frontmatter. Make it look amazing.`;

  const content = await askOpenRouter(prompt, 'deepseek/deepseek-chat-v3.1');
  return fixEncoding(content);
}

function buildMDX(brief: SEOBrief, body: string, imagePath: string): string {
  const date = new Date().toISOString().split('T')[0];
  const wordCount = countWords(body);
  const readTime = calcReadTime(wordCount);

  return `---
title: "${brief.titleTag.replace(/"/g, "'")}"
description: "${brief.metaDescription.replace(/"/g, "'")}"
date: "${date}"
slug: "${brief.slug}"
keyword: "${brief.primaryKeyword}"
image: "${imagePath}"
author: "Editorial Team"
readTime: "${readTime}"
lastUpdated: "${date}"
tags: [${brief.secondaryKeywords.slice(0, 4).map(k => `"${k.replace(/"/g, "'")}"`).join(', ')}]
---

${body}
`;
}

export async function runContentAgent(
  brief: SEOBrief,
  imagePath?: string
): Promise<GeneratedArticle> {
  console.log(`[Content Agent] Writing: "${brief.titleTag}"`);

  const resolvedImagePath = imagePath || `/images/${brief.slug}.svg`;
  const body = await generateArticle(brief);
  const wordCount = countWords(body);
  const mdx = buildMDX(brief, body, resolvedImagePath);

  console.log(`[Content Agent] Done — ${wordCount} words for "${brief.slug}"`);

  return {
    slug: brief.slug,
    title: brief.titleTag,
    metaDescription: brief.metaDescription,
    mdx,
    wordCount,
    keyword: brief.primaryKeyword,
    imagePath: resolvedImagePath,
  };
}