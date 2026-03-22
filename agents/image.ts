export type GeneratedImage = {
  slug: string;
  imagePath: string;
  source: 'pollinations' | 'unsplash' | 'placeholder';
};

// ── 1. Pollinations.ai (free, no key, unlimited) ──────────────
async function generateWithPollinations(title: string, slug: string): Promise<string | null> {
  try {
    const prompt = encodeURIComponent(
      `Professional blog featured image for article titled "${title}". Clean editorial style, no text, no words, photorealistic, wide format, bright and inviting, suitable for a blog header.`
    );
    const url = `https://image.pollinations.ai/prompt/${prompt}?width=1200&height=630&nologo=true&enhance=true`;

    console.log(`[Image Agent] Fetching from Pollinations...`);
    const res = await fetch(url, {
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      console.error(`[Image Agent] Pollinations returned ${res.status}`);
      return null;
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length < 1000) {
      console.error('[Image Agent] Pollinations returned empty image');
      return null;
    }

    const dataUrl = `data:image/jpeg;base64,${buffer.toString('base64')}`;
    console.log(`[Image Agent] Pollinations image ready for: ${slug} (${Math.round(buffer.length / 1024)}KB)`);
    return dataUrl;
  } catch (err: any) {
    console.error('[Image Agent] Pollinations failed:', err.message);
    return null;
  }
}

// ── 2. Unsplash (free, no key needed) ────────────────────────
async function generateWithUnsplash(title: string, slug: string): Promise<string | null> {
  try {
    const stopWords = ['how', 'to', 'the', 'a', 'an', 'and', 'or', 'in', 'on', 'for',
      'with', 'your', 'why', 'what', 'when', 'you', 'should', 'can', 'do', 'is', 'are'];
    const keywords = title
      .toLowerCase()
      .replace(/[^a-z\s]/g, '')
      .split(' ')
      .filter(w => !stopWords.includes(w) && w.length > 3)
      .slice(0, 3)
      .join(',');

    const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;
    let imageUrl: string;

    if (unsplashKey) {
      const res = await fetch(
        `https://api.unsplash.com/photos/random?query=${encodeURIComponent(keywords)}&orientation=landscape&content_filter=high`,
        { headers: { Authorization: `Client-ID ${unsplashKey}` } }
      );
      const data = await res.json();
      imageUrl = data?.urls?.regular;
    } else {
      imageUrl = `https://source.unsplash.com/1200x630/?${encodeURIComponent(keywords)}`;
    }

    if (!imageUrl) return null;

    const imgRes = await fetch(imageUrl, { signal: AbortSignal.timeout(15000) });
    if (!imgRes.ok) return null;

    const buffer = Buffer.from(await imgRes.arrayBuffer());
    const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
    const dataUrl = `data:${contentType};base64,${buffer.toString('base64')}`;

    console.log(`[Image Agent] Unsplash image ready for: ${slug}`);
    return dataUrl;
  } catch (err: any) {
    console.error('[Image Agent] Unsplash failed:', err.message);
    return null;
  }
}

// ── 3. SVG Placeholder (always works, no external calls) ──────
function generatePlaceholder(title: string, slug: string): string {
  const palettes = [
    ['#1e3a5f', '#3b82f6'],
    ['#1a2e1a', '#22c55e'],
    ['#2d1b1b', '#ef4444'],
    ['#1e1b2e', '#8b5cf6'],
    ['#1a2535', '#06b6d4'],
    ['#2d1f0a', '#f59e0b'],
    ['#1f1a2e', '#a78bfa'],
    ['#1a2d2d', '#14b8a6'],
  ];
  const [bg, accent] = palettes[
    Math.abs((slug.charCodeAt(0) || 0) + (slug.charCodeAt(slug.length - 1) || 0)) % palettes.length
  ];

  const shortTitle = title.length > 45 ? title.slice(0, 42) + '...' : title;
  const words = shortTitle.split(' ');
  const mid = Math.ceil(words.length / 2);
  const line1 = words.slice(0, mid).join(' ');
  const line2 = words.slice(mid).join(' ');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${bg}"/>
  <rect x="0" y="0" width="8" height="630" fill="${accent}"/>
  <rect x="60" y="295" width="100" height="4" fill="${accent}" opacity="0.7"/>
  <text x="60" y="270" font-family="system-ui,sans-serif" font-size="44" font-weight="700" fill="white" opacity="0.95">${line1}</text>
  ${line2 ? `<text x="60" y="335" font-family="system-ui,sans-serif" font-size="44" font-weight="700" fill="white" opacity="0.95">${line2}</text>` : ''}
  <text x="60" y="530" font-family="system-ui,sans-serif" font-size="20" fill="${accent}" opacity="0.9" font-weight="500">Pulse Editorial</text>
  <circle cx="1100" cy="80" r="200" fill="${accent}" opacity="0.05"/>
  <circle cx="1050" cy="560" r="120" fill="${accent}" opacity="0.07"/>
  <circle cx="900" cy="300" r="80" fill="${accent}" opacity="0.03"/>
</svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

// ── Main export ───────────────────────────────────────────────
export async function runImageAgent(title: string, slug: string): Promise<GeneratedImage> {
  console.log(`[Image Agent] Generating image for: "${title}"`);

  // 1. Pollinations.ai — free, no key, real AI images
  const pollinations = await generateWithPollinations(title, slug);
  if (pollinations) return { slug, imagePath: pollinations, source: 'pollinations' };

  // 2. Unsplash — free stock photos
  const unsplash = await generateWithUnsplash(title, slug);
  if (unsplash) return { slug, imagePath: unsplash, source: 'unsplash' };

  // 3. SVG placeholder — always works
  console.log(`[Image Agent] Using SVG placeholder for: ${slug}`);
  return { slug, imagePath: generatePlaceholder(title, slug), source: 'placeholder' };
}