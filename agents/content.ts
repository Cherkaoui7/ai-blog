import { askGemini } from '@/lib/gemini';
import type { SEOBrief } from '@/agents/seo';

export type GeneratedArticle = {
  slug: string;
  title: string;
  metaDescription: string;
  mdx: string;
  wordCount: number;
  keyword: string;
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

async function generateArticle(brief: SEOBrief): Promise<string> {
  const h2List = brief.h2Tags.map((h, i) => `${i + 1}. ${h}`).join('\n');
  const secondaryList = brief.secondaryKeywords.join(', ');

  const prompt = `
You are a professional blog writer. Write a complete, high-quality blog article.

ARTICLE BRIEF:
- Title: ${brief.titleTag}
- Primary keyword: "${brief.primaryKeyword}" (use naturally 4-6 times)
- Secondary keywords: ${secondaryList} (use each at least once)
- Target word count: ${brief.targetWordCount} words
- Structure (use these exact H2 headings):
${h2List}

WRITING RULES:
- Write in a friendly, helpful, conversational tone
- Each H2 section must be 200-300 words minimum
- Use bullet points and numbered lists where helpful
- Add specific examples, numbers, and actionable tips
- Include a strong intro (hook + what reader will learn)
- Include a conclusion with a clear call to action
- Add [[PRODUCT_LINK:keyword]] placeholders where a product recommendation fits naturally (max 3)
- Do NOT write the frontmatter — only the article body

FORMAT:
- Use ## for H2 headings (already provided above)
- Use ### for any H3 subheadings you add
- Use **bold** for key terms and important points
- Use > for tip/callout blocks

Output only the markdown article body, nothing else.
`;

  // Use flash model — more widely available on free tier
  const content = await askGemini(prompt, false);
  return fixEncoding(content);
}

function buildMDX(brief: SEOBrief, body: string, imagePath: string): string {
  const date = new Date().toISOString().split('T')[0];
  return `---
title: "${brief.titleTag.replace(/"/g, "'")}"
description: "${brief.metaDescription.replace(/"/g, "'")}"
date: "${date}"
slug: "${brief.slug}"
keyword: "${brief.primaryKeyword}"
image: "${imagePath}"
author: "AI Blog"
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

  const body = await generateArticle(brief);
  const mdx = buildMDX(brief, body, imagePath);
  const wordCount = countWords(body);

  console.log(`[Content Agent] Done — ${wordCount} words for "${brief.slug}"`);

  return {
    slug: brief.slug,
    title: brief.titleTag,
    metaDescription: brief.metaDescription,
    mdx,
    wordCount,
    keyword: brief.primaryKeyword,
  };
}