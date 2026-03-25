import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { cache } from 'react';
import { applyAffiliateMonetization } from '@/lib/affiliate';
import { getTopicClusterMatch } from '@/lib/topic-clusters';

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
  author: string;
  authorTitle: string;
  niche: string;
  lastUpdated: string;
  content: string;
  relatedPosts: RelatedPost[];
};

type ParsedPost = Omit<Post, 'relatedPosts'> & {
  clusterKey: string;
  filePath: string;
};

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
  const content = normalizeSpacing(rawContent);
  const keyword = asString(data.keyword);
  const tags = getPostTags(asString(data.title) || slug, keyword, asStringArray(data.tags), content);
  const description = asString(data.description) || getPostDescription(content);
  const clusterMatch = getTopicClusterMatch(
    asString(data.title) || slug,
    keyword,
    description,
    tags.join(' '),
    content
  );

  return {
    slug,
    clusterKey: clusterMatch?.key || '',
    filePath,
    title: asString(data.title) || slug,
    description,
    date: asString(data.date) || new Date().toISOString(),
    tags,
    keyword,
    image: asString(data.image),
    readTime: normalizeReadTime(asString(data.readTime), content),
    author: asString(data.author) || 'Pulse Editorial',
    authorTitle: asString(data.authorTitle),
    niche: asString(data.niche),
    lastUpdated: asString(data.lastUpdated) || asString(data.date) || new Date().toISOString(),
    content,
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

const loadPosts = cache(async (): Promise<Post[]> => {
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
      relatedPosts,
    };
  });
});

export async function getAllPosts(): Promise<Post[]> {
  return loadPosts();
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const posts = await loadPosts();
  return posts.find(post => post.slug === slug) || null;
}
