import clusterDirectory from '@/data/topic-clusters.json';

export type TopicClusterEntry = {
  label: string;
  keywords: string[];
  topics: string[];
};

export type TopicClusterMatch = {
  key: string;
  entry: TopicClusterEntry;
  score: number;
};

const TOPIC_CLUSTERS = Object.entries(clusterDirectory as Record<string, TopicClusterEntry>);

function normalizeValue(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getAllClusterTopics(): string[] {
  return TOPIC_CLUSTERS.flatMap(([, entry]) => entry.topics);
}

export function getClusterEntries(): Array<[string, TopicClusterEntry]> {
  return TOPIC_CLUSTERS;
}

export function getTopicClusterMatch(...inputs: Array<string | undefined | null>): TopicClusterMatch | null {
  const normalizedInputs = inputs
    .map(value => normalizeValue(value || ''))
    .filter(Boolean);

  if (normalizedInputs.length === 0) {
    return null;
  }

  const matches = TOPIC_CLUSTERS
    .map(([key, entry]) => {
      const terms = [entry.label, ...entry.keywords, ...entry.topics]
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
