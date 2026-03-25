import fs from 'fs';
import path from 'path';

const GENERATED_DIR = path.join(process.cwd(), '.tmp-generated');
const GENERATION_LOG_PATH = path.join(GENERATED_DIR, 'content-engine-log.json');
const TOPIC_USAGE_PATH = path.join(GENERATED_DIR, 'topic-usage.json');
const DEFAULT_POSTS_DIR = path.resolve(process.cwd(), process.env.POSTS_DIR || 'posts');

export type GenerationLogEntry = {
  topic: string;
  title: string;
  slug: string;
  filePath: string;
  clusterKey: string;
  usedFallback: boolean;
  generatedAt: string;
};

export type TopicUsageRecord = {
  topic: string;
  count: number;
  clusterKey: string;
  lastGeneratedAt: string;
  lastSlug: string;
};

export type ContentEngineStatus = {
  outputDir: string;
  postsAvailable: number;
  lastGeneratedAt: string | null;
  recentRuns: GenerationLogEntry[];
  topicUsage: TopicUsageRecord[];
  githubConfigured: boolean;
};

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

function getPostsAvailable(outputDir: string): number {
  if (!fs.existsSync(outputDir)) {
    return 0;
  }

  return fs
    .readdirSync(outputDir)
    .filter(filename => filename.endsWith('.md') || filename.endsWith('.mdx'))
    .length;
}

function asLogEntries(value: unknown): GenerationLogEntry[] {
  return Array.isArray(value) ? value as GenerationLogEntry[] : [];
}

function asTopicUsage(value: unknown): TopicUsageRecord[] {
  if (Array.isArray(value)) {
    return value as TopicUsageRecord[];
  }

  if (value && typeof value === 'object') {
    return Object.values(value) as TopicUsageRecord[];
  }

  return [];
}

export function getContentEngineStatus(): ContentEngineStatus {
  const recentRuns = asLogEntries(readJsonFile<unknown>(GENERATION_LOG_PATH, []))
    .filter(entry => Boolean(entry?.slug && entry?.generatedAt))
    .sort((left, right) => new Date(right.generatedAt).getTime() - new Date(left.generatedAt).getTime())
    .slice(0, 8);

  const topicUsage = asTopicUsage(readJsonFile<unknown>(TOPIC_USAGE_PATH, []))
    .filter(entry => Boolean(entry?.topic && entry?.lastGeneratedAt))
    .sort((left, right) => {
      if (right.count !== left.count) {
        return right.count - left.count;
      }

      return new Date(right.lastGeneratedAt).getTime() - new Date(left.lastGeneratedAt).getTime();
    })
    .slice(0, 8);

  return {
    outputDir: DEFAULT_POSTS_DIR,
    postsAvailable: getPostsAvailable(DEFAULT_POSTS_DIR),
    lastGeneratedAt: recentRuns[0]?.generatedAt || null,
    recentRuns,
    topicUsage,
    githubConfigured: Boolean(process.env.GITHUB_TOKEN && process.env.GITHUB_REPO),
  };
}
