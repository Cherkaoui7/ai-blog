import affiliateDirectory from '@/data/affiliate-links.json';

export type AffiliateEntry = {
  url: string;
  label: string;
  aliases?: string[];
};

type AffiliateCandidate = {
  key: string;
  entry: AffiliateEntry;
  rawTerms: string[];
  terms: string[];
  score: number;
};

type AffiliatePost = {
  title: string;
  keyword: string;
  tags: string[];
  content: string;
};

const MAX_AFFILIATE_LINKS = 3;
const AFFILIATE_DISCLOSURE = '> This article may contain affiliate links.';

const AFFILIATE_ENTRIES = Object.entries(affiliateDirectory as Record<string, AffiliateEntry>).map(([key, entry]) => {
  const rawTerms = Array.from(new Set([key, entry.label, ...(entry.aliases || [])].map(value => value.trim()).filter(Boolean)));

  return {
    key,
    entry,
    rawTerms,
    terms: rawTerms.map(normalizeValue),
  };
});

function normalizeValue(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sanitizeExternalUrl(value: string): string {
  try {
    const url = new URL(value);

    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return url.toString();
    }
  } catch {
    // Fall through to the safe fallback below.
  }

  return '#';
}

function renderAffiliateLink(entry: AffiliateEntry): string {
  return `<a href="${sanitizeExternalUrl(entry.url)}" target="_blank" rel="nofollow sponsored noopener">${escapeHtml(entry.label)}</a>`;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function insertBeforeTrailingSections(content: string, block: string): string {
  const trailingSectionMatch = content.match(/\n##\s+(?:🎯\s+)?(?:Final Thoughts|Call To Action|Conclusion)\b/i);

  if (trailingSectionMatch?.index) {
    const insertionPoint = trailingSectionMatch.index + 1;
    return `${content.slice(0, insertionPoint).trimEnd()}\n\n${block}\n\n${content.slice(insertionPoint).trimStart()}`;
  }

  return `${content}\n\n${block}`;
}

function getAffiliateCandidates(post: AffiliatePost): AffiliateCandidate[] {
  const sources = [
    normalizeValue(post.keyword),
    normalizeValue(post.title),
    ...post.tags.map(normalizeValue),
    normalizeValue(post.content),
  ].filter(Boolean);

  return AFFILIATE_ENTRIES
    .map(item => {
      let score = 0;

      for (const source of sources) {
        for (const term of item.terms) {
          if (!term) continue;
          if (source === term) score += 12;
          else if (source.includes(term)) score += Math.min(8, term.split(' ').length + 2);
          else if (term.includes(source) && source.length > 4) score += 3;
        }
      }

      return {
        key: item.key,
        entry: item.entry,
        rawTerms: item.rawTerms,
        terms: item.terms,
        score,
      };
    })
    .filter(candidate => candidate.score > 0)
    .sort((left, right) => right.score - left.score);
}

function findPlaceholderMatch(query: string, candidates: AffiliateCandidate[]): AffiliateCandidate | null {
  const normalizedQuery = normalizeValue(query);

  const exactMatch = AFFILIATE_ENTRIES.find(entry => entry.terms.includes(normalizedQuery));
  if (exactMatch) {
    const candidate = candidates.find(item => item.key === exactMatch.key);
    return candidate || {
      key: exactMatch.key,
      entry: exactMatch.entry,
      rawTerms: exactMatch.rawTerms,
      terms: exactMatch.terms,
      score: 1,
    };
  }

  const partialMatch = candidates.find(candidate =>
    candidate.key === normalizedQuery ||
    normalizeValue(candidate.entry.label).includes(normalizedQuery) ||
    normalizedQuery.includes(candidate.key)
  );

  return partialMatch || candidates[0] || null;
}

function replaceProductLinkPlaceholders(content: string, candidates: AffiliateCandidate[]) {
  const usedKeys = new Set<string>();
  let insertedCount = 0;

  const updatedContent = content.replace(/\[\[PRODUCT_LINK:([^\]]+)\]\]/g, (_, rawQuery: string) => {
    if (insertedCount >= MAX_AFFILIATE_LINKS) {
      return rawQuery.trim();
    }

    const match = findPlaceholderMatch(rawQuery, candidates);
    if (!match) {
      return rawQuery.trim();
    }

    usedKeys.add(match.key);
    insertedCount += 1;
    return renderAffiliateLink(match.entry);
  });

  return { content: updatedContent, usedKeys, insertedCount };
}

function isSkippableBlock(block: string): boolean {
  const trimmed = block.trim();

  return (
    !trimmed ||
    /^(#{1,6}\s|>|\- |\* |\d+\. |\|)/.test(trimmed) ||
    trimmed.includes('<a href=') ||
    trimmed.includes('](') ||
    trimmed.includes('[[PRODUCT_LINK:') ||
    /This article may contain affiliate links\./i.test(trimmed)
  );
}

function getInjectableTerms(candidate: AffiliateCandidate): string[] {
  return Array.from(new Set(candidate.rawTerms))
    .filter(term => {
      const normalized = normalizeValue(term);
      return Boolean(normalized) && (term.includes(' ') || normalized.length >= 8);
    })
    .sort((left, right) => right.length - left.length);
}

function injectContextualLinks(
  content: string,
  candidates: AffiliateCandidate[],
  usedKeys: Set<string>,
  insertedCount: number
) {
  if (insertedCount >= MAX_AFFILIATE_LINKS) {
    return { content, usedKeys, insertedCount };
  }

  const trailingSectionMatch = content.match(/\n##\s+(?:🎯\s+)?(?:Recommended Tool|Final Thoughts|Call To Action|Conclusion|Related reading)\b/i);
  const mainBody = trailingSectionMatch?.index
    ? content.slice(0, trailingSectionMatch.index + 1).trimEnd()
    : content;
  const trailingBody = trailingSectionMatch?.index
    ? content.slice(trailingSectionMatch.index + 1).trimStart()
    : '';

  const updatedBlocks = mainBody
    .split(/\n\s*\n/)
    .map(block => {
      if (insertedCount >= MAX_AFFILIATE_LINKS || isSkippableBlock(block)) {
        return block;
      }

      let updatedBlock = block;

      for (const candidate of candidates) {
        if (insertedCount >= MAX_AFFILIATE_LINKS || usedKeys.has(candidate.key)) {
          continue;
        }

        for (const term of getInjectableTerms(candidate)) {
          const pattern = new RegExp(`\\b${escapeRegExp(term)}\\b`, 'i');
          if (!pattern.test(updatedBlock)) {
            continue;
          }

          updatedBlock = updatedBlock.replace(pattern, renderAffiliateLink(candidate.entry));
          usedKeys.add(candidate.key);
          insertedCount += 1;
          break;
        }

        if (updatedBlock !== block) {
          break;
        }
      }

      return updatedBlock;
    })
    .join('\n\n');

  if (!trailingBody) {
    return { content: updatedBlocks, usedKeys, insertedCount };
  }

  return {
    content: `${updatedBlocks}\n\n${trailingBody}`,
    usedKeys,
    insertedCount,
  };
}

function ensureAffiliateDisclaimer(content: string): string {
  if (content.includes('This article may contain affiliate links.')) {
    return content;
  }

  const recommendedToolPattern = /(##\s+Recommended Tool\s*\n\n)/i;
  if (recommendedToolPattern.test(content)) {
    return content.replace(recommendedToolPattern, `$1${AFFILIATE_DISCLOSURE}\n\n`);
  }

  const firstParagraphBreak = content.indexOf('\n\n');
  if (firstParagraphBreak > -1) {
    return `${content.slice(0, firstParagraphBreak)}\n\n${AFFILIATE_DISCLOSURE}\n\n${content.slice(firstParagraphBreak + 2)}`;
  }

  return `${AFFILIATE_DISCLOSURE}\n\n${content}`;
}

function ensureRecommendedToolSection(
  content: string,
  candidates: AffiliateCandidate[],
  usedKeys: Set<string>,
  insertedCount: number
) {
  if (/^##\s+Best Overall\b/im.test(content) && /\]\(https?:\/\/|<a href=/i.test(content)) {
    return { content, insertedCount };
  }

  if (insertedCount >= MAX_AFFILIATE_LINKS) {
    return { content, insertedCount };
  }

  const candidate = candidates.find(item => !usedKeys.has(item.key));
  if (!candidate) {
    return { content, insertedCount };
  }

  const toolSentence = `A practical place to start is ${renderAffiliateLink(candidate.entry)}. It fits this topic because it helps the reader act on the advice instead of leaving it as theory.`;

  const recommendedToolSectionPattern = /(##\s+Recommended Tool\s*\n\n(?:>.*\n\n)?)([\s\S]*?)(\n##\s+[^\n]+|$)/i;
  const sectionMatch = content.match(recommendedToolSectionPattern);

  if (sectionMatch) {
    const existingSectionBody = sectionMatch[2];
    if (existingSectionBody.includes('<a href=')) {
      return { content, insertedCount };
    }

    const sectionStart = sectionMatch[1];
    const nextSection = sectionMatch[3];
    const updatedSection = `${sectionStart}${toolSentence}\n\n${existingSectionBody.trimStart()}`;

    return {
      content: `${content.slice(0, sectionMatch.index)}${updatedSection}${nextSection}${content.slice((sectionMatch.index || 0) + sectionMatch[0].length)}`,
      insertedCount: insertedCount + 1,
    };
  }

  const recommendedToolBlock = `## Recommended Tool\n\n${AFFILIATE_DISCLOSURE}\n\n${toolSentence}`;

  return {
    content: insertBeforeTrailingSections(content, recommendedToolBlock),
    insertedCount: insertedCount + 1,
  };
}

export function applyAffiliateMonetization(post: AffiliatePost): string {
  const candidates = getAffiliateCandidates(post);
  if (candidates.length === 0 && !post.content.includes('[[PRODUCT_LINK:')) {
    return post.content;
  }

  const placeholderResult = replaceProductLinkPlaceholders(post.content, candidates);
  const contextualResult = injectContextualLinks(
    placeholderResult.content,
    candidates,
    new Set(placeholderResult.usedKeys),
    placeholderResult.insertedCount
  );
  const toolResult = ensureRecommendedToolSection(
    contextualResult.content,
    candidates,
    contextualResult.usedKeys,
    contextualResult.insertedCount
  );

  const monetizedContent =
    contextualResult.insertedCount > 0 || toolResult.insertedCount > contextualResult.insertedCount
      ? ensureAffiliateDisclaimer(toolResult.content)
      : toolResult.content;

  return monetizedContent;
}
