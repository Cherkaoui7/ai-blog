import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { applyAffiliateMonetization } from '@/lib/affiliate';
import { getTopicClusterMatch } from '@/lib/topic-clusters';
import { detectNiche } from '@/lib/authors';

const POSTS_DIRS = [
  path.join(process.cwd(), 'posts'),
  path.join(process.cwd(), 'app/blog/posts'),
];

const STOP_WORDS = new Set([
  'about', 'after', 'also', 'been', 'before', 'being', 'between', 'but',
  'from', 'into', 'just', 'more', 'most', 'over', 'such', 'than', 'that',
  'their', 'them', 'then', 'there', 'these', 'they', 'this', 'those', 'through',
  'very', 'what', 'when', 'where', 'which', 'while', 'with', 'would', 'your',
]);

export type RelatedPost = {
  slug: string;
  title: string;
  description: string;
};

export type Post = {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  keyword: string;
  image: string;
  readTime: string;
  wordCount: number;
  author: string;
  authorTitle: string;
  niche: string;
  lastUpdated: string;
  content: string;
  keyTakeaways: string[];
  heroQuote: string;
  relatedPosts: RelatedPost[];
};

export type AdminPost = {
  id: string;
  title: string;
  slug: string;
  keyword: string;
  word_count: number;
  status: string;
  created_at: string;
  mdx_content: string;
  meta_description: string;
};

type ParsedPost = Omit<Post, 'relatedPosts'> & {
  clusterKey: string;
  filePath: string;
};

/**
 * Strip "Agent: ..." prefix lines and in-body H1 duplicates from MDX content.
 * These are internal generation artifacts that shouldn't be visible to readers.
 */
function cleanArticleContent(content: string, _title: string): string {
  let cleaned = content
    .replace(/^\*\*Agent:\s*.+?\*\*\s*$/gm, '')
    .replace(/^#\s+.+$/m, '')
    .replace(/^\s*This article may contain affiliate links\.?.*$/gim, '')
    .replace(/^###?\s*(?:Call To Action|CTA|Conclusion|Summary)\b[\s\S]*$/im, '') 
    .replace(/\*\*Call To Action\b[\s\S]*$/im, '')
    .replace(/Welcome to today's briefing\.?/gi, '')
    .replace(/In today's briefing,?/gi, '')
    .replace(/As an AI,?/gi, '')
    .replace(/In conclusion,?/gi, '')
    .replace(/Today's briefing,?/gi, '')
    .replace(/^##\s*Key Takeaways\s*\n(?:[-*]\s+.*\n?)*\n?/im, '')
    .replace(/^###\s+(?:H3\s*)?(.+)$/gm, '\n**$1**\n');

  const faqRegex = /(?:^|\n)##\s*FAQ\s*\n([\s\S]*?)(?=\n##\s|$)/i;
  const faqMatch = cleaned.match(faqRegex);
  
  if (faqMatch) {
    const faqRaw = faqMatch[1];
    let newFaq = '\n<FAQAccordion>\n';
    let currentQ = '';
    let currentA = '';
    
    const lines = faqRaw.split('\n');
    for (let i = 0; i < lines.length; i++) {
       const line = lines[i].trim();
       if ((line.startsWith('**') && line.endsWith('**')) || (line.startsWith('**Q') && line.includes('**'))) {
           if (currentQ) {
               newFaq += `  <FAQItem question="${currentQ.replace(/"/g, '&quot;')}">\n    ${currentA.trim()}\n  </FAQItem>\n`;
           }
           if (line.startsWith('**Q') && line.includes('**') && !line.endsWith('**')) {
               currentQ = line.replace(/^\*\*(.+?)\*\*.*$/, '$1').trim();
               currentA = line.replace(/^\*\*.+?\*\*(.*)$/, '$1').trim();
           } else {
               currentQ = line.replace(/^\*\*(.+)\*\*$/, '$1').trim();
               currentA = '';
           }
       } else if (line.length > 0) {
           currentA += line + '\n';
       }
    }
    if (currentQ) {
       newFaq += `  <FAQItem question="${currentQ.replace(/"/g, '&quot;')}">\n    ${currentA.trim()}\n  </FAQItem>\n`;
    }
    newFaq += '</FAQAccordion>\n';
    
    cleaned = cleaned.replace(faqRegex, `\n## FAQ\n${newFaq}\n\n`);
  }

  return cleaned.replace(/\n{3,}/g, '\n\n').trim();
}

/** Extract Key Takeaways bullet points from the MDX content. */
function extractKeyTakeaways(content: string): string[] {
  const match = content.match(/##\s*Key Takeaways\s*\n([\s\S]*?)(?=\n##\s|$)/);
  if (!match) return [];
  return match[1]
    .split('\n')
    .map(line => line.replace(/^[-*]\s+/, '').trim())
    .filter(line => line.length > 0);
}

/** Pick the strongest sentence from the article intro for a hero quote. */
function extractHeroQuote(content: string): string {
  // Get the first substantial paragraph (not headings, not lists)
  const paragraphs = content
    .split('\n\n')
    .map(p => p.trim())
    .filter(p => p.length > 60 && !p.startsWith('#') && !p.startsWith('-') && !p.startsWith('*') && !p.startsWith('```') && !p.startsWith('**Agent'));

  if (paragraphs.length === 0) return '';

  // Pick the first paragraph, find the strongest sentence (longest with a clear statement)
  const sentences = paragraphs[0]
    .replace(/\*\*/g, '')
    .split(/(?<=[.!?])\s+/)
    .filter(s => s.length > 30 && s.length < 200);

  return sentences.length > 0 ? sentences[0] : '';
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

function normalizeReadTime(readTime: string, content: string): string {
  const minutes = Number(readTime.match(/\d+/)?.[0] || 0);
  return minutes > 0 ? `${minutes} min read` : estimateReadTime(content);
}

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
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

function getPostTags(title: string, keyword: string, tags: string[], content: string): string[] {
  const normalizedTags = uniqueValues(tags.map(normalizeTag)).filter(tag => tag.length <= 32);
  if (normalizedTags.length > 0) return normalizedTags.slice(0, 4);

  const derivedTags = uniqueValues([
    normalizeTag(keyword),
    ...getPhraseTags(keyword || title),
    ...getPhraseTags(title),
    ...getHeadingTags(content),
  ]);

  return derivedTags.filter(tag => tag.length <= 32).slice(0, 4);
}

function getPostDescription(content: string): string {
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

function getPostFiles(): { slug: string; filePath: string }[] {
  const files: { slug: string; filePath: string }[] = [];
  const seen = new Set<string>();

  for (const dir of POSTS_DIRS) {
    if (!fs.existsSync(dir)) continue;

    for (const filename of fs.readdirSync(dir)) {
      if (!filename.endsWith('.mdx') && !filename.endsWith('.md')) continue;

      const slug = filename.replace(/\.mdx?$/, '');
      if (seen.has(slug)) continue;

      files.push({ slug, filePath: path.join(dir, filename) });
      seen.add(slug);
    }
  }

  return files;
}

function readPostFile(slug: string, filePath: string): ParsedPost {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data, content: rawContent } = matter(raw);
  const rawNormalized = normalizeSpacing(rawContent);
  const postTitle = asString(data.title) || slug;
  const content = cleanArticleContent(rawNormalized, postTitle);
  const keyword = asString(data.keyword);
  const tags = getPostTags(postTitle, keyword, asStringArray(data.tags), content);
  const description = asString(data.description) || getPostDescription(content);
  const clusterMatch = getTopicClusterMatch(
    postTitle,
    keyword,
    description,
    tags.join(' '),
    content
  );
  const words = countWords(content);

  return {
    slug,
    clusterKey: clusterMatch?.key || '',
    filePath,
    title: postTitle,
    description,
    date: asString(data.date) || new Date().toISOString(),
    tags,
    keyword,
    image: asString(data.image),
    readTime: `${Math.max(1, Math.ceil(words / 200))} min read`,
    wordCount: words,
    author: asString(data.author) || 'Pulse Editorial',
    authorTitle: asString(data.authorTitle),
    niche: asString(data.niche) || detectNiche(`${postTitle} ${keyword} ${asStringArray(data.tags).join(' ')}`),
    lastUpdated: asString(data.lastUpdated) || asString(data.date) || new Date().toISOString(),
    content,
    keyTakeaways: extractKeyTakeaways(rawNormalized),
    heroQuote: extractHeroQuote(rawNormalized),
  };
}

function getSearchTerms(post: ParsedPost): Set<string> {
  return new Set([
    ...extractTerms(post.title),
    ...extractTerms(post.keyword),
    ...extractTerms(post.description),
    ...post.tags.flatMap(extractTerms),
  ]);
}

function scoreRelatedPost(post: ParsedPost, candidate: ParsedPost): number {
  if (post.slug === candidate.slug) return -1;

  const postTerms = getSearchTerms(post);
  const candidateTerms = getSearchTerms(candidate);
  let sharedTerms = 0;

  for (const term of postTerms) {
    if (candidateTerms.has(term)) sharedTerms += 1;
  }

  const postTags = new Set(post.tags.map(tag => tag.toLowerCase()));
  const sharedTags = candidate.tags.filter(tag => postTags.has(tag.toLowerCase())).length;
  const keywordBonus =
    post.keyword &&
    candidate.keyword &&
    post.keyword.toLowerCase() === candidate.keyword.toLowerCase()
      ? 4
      : 0;
  const clusterBonus =
    post.clusterKey && candidate.clusterKey && post.clusterKey === candidate.clusterKey
      ? 6
      : 0;

  return sharedTerms + sharedTags * 3 + keywordBonus + clusterBonus;
}

function getRelatedPosts(post: ParsedPost, posts: ParsedPost[]): RelatedPost[] {
  const scoredPosts = posts
    .map(candidate => ({ candidate, score: scoreRelatedPost(post, candidate) }))
    .filter(entry => entry.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return new Date(right.candidate.date).getTime() - new Date(left.candidate.date).getTime();
    })
    .map(entry => entry.candidate);

  const fallbackPosts = posts
    .filter(candidate => candidate.slug !== post.slug)
    .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());

  const selected = uniqueValues([
    ...scoredPosts.map(candidate => candidate.slug),
    ...fallbackPosts.map(candidate => candidate.slug),
  ])
    .slice(0, 3)
    .map(slug => posts.find(candidate => candidate.slug === slug))
    .filter((candidate): candidate is ParsedPost => Boolean(candidate));

  return selected.map(candidate => ({
    slug: candidate.slug,
    title: candidate.title,
    description: candidate.description,
  }));
}

function injectRelatedLinks(content: string, relatedPosts: RelatedPost[]): string {
  const normalized = normalizeSpacing(content);
  if (relatedPosts.length === 0 || /^##\s+Related reading\b/im.test(normalized)) {
    return normalized;
  }

  const links = relatedPosts
    .map(post => `- [${post.title}](/blog/${post.slug})`)
    .join('\n');

  const relatedBlock = `## Related reading\n\n${links}`;
  const trailingSectionMatch = normalized.match(/\n##\s+(Recommended Tool|Final Thoughts|Call To Action)\b/i);

  if (trailingSectionMatch?.index) {
    const insertionPoint = trailingSectionMatch.index + 1;
    return `${normalized.slice(0, insertionPoint).trimEnd()}\n\n${relatedBlock}\n\n${normalized.slice(insertionPoint).trimStart()}`;
  }

  return `${normalized}\n\n${relatedBlock}`;
}

async function loadPosts(): Promise<Post[]> {
  const files = getPostFiles();
  const parsedPosts = files.map(file => readPostFile(file.slug, file.filePath));
  const sortedPosts = [...parsedPosts].sort((left, right) =>
    new Date(right.date).getTime() - new Date(left.date).getTime()
  );

  return sortedPosts.map(post => {
    const relatedPosts = getRelatedPosts(post, sortedPosts);

    return {
      slug: post.slug,
      title: post.title,
      description: post.description,
      date: post.date,
      tags: post.tags,
      keyword: post.keyword,
      image: post.image,
      readTime: post.readTime,
      author: post.author,
      authorTitle: post.authorTitle,
      niche: post.niche,
      lastUpdated: post.lastUpdated,
      content: injectRelatedLinks(applyAffiliateMonetization(post), relatedPosts),
      keyTakeaways: post.keyTakeaways,
      heroQuote: post.heroQuote,
      wordCount: post.wordCount,
      relatedPosts,
    };
  });
}

export async function getAllPosts(): Promise<Post[]> {
  return loadPosts();
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const posts = await loadPosts();
  return posts.find(post => post.slug === slug) || null;
}

export async function getAdminPosts(): Promise<AdminPost[]> {
  const posts = await loadPosts();

  return posts.map(post => ({
    id: post.slug,
    title: post.title,
    slug: post.slug,
    keyword: post.keyword || post.tags[0] || '',
    word_count: countWords(post.content),
    status: 'local',
    created_at: post.date,
    mdx_content: post.content,
    meta_description: post.description,
  }));
}
