import fs from 'fs';
import path from 'path';

export type GeneratedImage = {
  slug: string;
  imagePath: string;
  source: 'dalle' | 'unsplash' | 'placeholder';
};

// ── Helpers ──────────────────────────────────────────────────
function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function saveImageFromUrl(url: string, filePath: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(filePath, buffer);
}

// ── Source 1: DALL-E 3 ───────────────────────────────────────
async function generateWithDallE(title: string, slug: string): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    const prompt = `A professional, modern blog featured image for an article titled "${title}". 
Clean editorial style, no text, no words, photorealistic. 
Wide format, bright and inviting, suitable for a blog header.`;

    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size: '1792x1024',
        quality: 'standard',
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error('[Image Agent] DALL-E error:', data.error?.message);
      return null;
    }

    const imageUrl = data.data?.[0]?.url;
    if (!imageUrl) return null;

    const dir = path.join(process.cwd(), 'public', 'images');
    ensureDir(dir);
    const filePath = path.join(dir, `${slug}.jpg`);
    await saveImageFromUrl(imageUrl, filePath);

    console.log(`[Image Agent] DALL-E image saved: /images/${slug}.jpg`);
    return `/images/${slug}.jpg`;
  } catch (err: any) {
    console.error('[Image Agent] DALL-E failed:', err.message);
    return null;
  }
}

// ── Source 2: Unsplash (free, no key needed for single images) ─
async function generateWithUnsplash(title: string, slug: string): Promise<string | null> {
  try {
    // Extract 2-3 key words from title for better image matching
    const stopWords = ['how', 'to', 'the', 'a', 'an', 'and', 'or', 'in', 'on', 'for', 'with', 'your'];
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
      // With API key — higher quality, specific search
      const res = await fetch(
        `https://api.unsplash.com/photos/random?query=${encodeURIComponent(keywords)}&orientation=landscape&content_filter=high`,
        { headers: { Authorization: `Client-ID ${unsplashKey}` } }
      );
      const data = await res.json();
      imageUrl = data?.urls?.regular;
    } else {
      // Without API key — use source.unsplash.com (free, no auth)
      imageUrl = `https://source.unsplash.com/1200x630/?${encodeURIComponent(keywords)}`;
    }

    if (!imageUrl) return null;

    const dir = path.join(process.cwd(), 'public', 'images');
    ensureDir(dir);
    const filePath = path.join(dir, `${slug}.jpg`);
    await saveImageFromUrl(imageUrl, filePath);

    console.log(`[Image Agent] Unsplash image saved: /images/${slug}.jpg`);
    return `/images/${slug}.jpg`;
  } catch (err: any) {
    console.error('[Image Agent] Unsplash failed:', err.message);
    return null;
  }
}

// ── Source 3: SVG placeholder (always works, no API needed) ──
function generatePlaceholder(title: string, slug: string): string {
  const colors = [
    ['#1e3a5f', '#3b82f6'],
    ['#1a2e1a', '#22c55e'],
    ['#2d1b1b', '#ef4444'],
    ['#1e1b2e', '#8b5cf6'],
    ['#1a2535', '#06b6d4'],
  ];
  const [bg, accent] = colors[Math.abs(slug.charCodeAt(0)) % colors.length];

  // Truncate title for SVG
  const shortTitle = title.length > 50 ? title.slice(0, 47) + '...' : title;
  const words = shortTitle.split(' ');
  const line1 = words.slice(0, Math.ceil(words.length / 2)).join(' ');
  const line2 = words.slice(Math.ceil(words.length / 2)).join(' ');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${bg}"/>
  <rect x="0" y="0" width="6" height="630" fill="${accent}"/>
  <rect x="60" y="280" width="80" height="4" fill="${accent}" opacity="0.6"/>
  <text x="60" y="260" font-family="system-ui,sans-serif" font-size="42" font-weight="700" fill="white" opacity="0.95">${line1}</text>
  <text x="60" y="320" font-family="system-ui,sans-serif" font-size="42" font-weight="700" fill="white" opacity="0.95">${line2}</text>
  <text x="60" y="520" font-family="system-ui,sans-serif" font-size="18" fill="${accent}" opacity="0.8">AI Blog</text>
  <circle cx="1100" cy="100" r="180" fill="${accent}" opacity="0.04"/>
  <circle cx="1050" cy="550" r="100" fill="${accent}" opacity="0.06"/>
</svg>`;

  const dir = path.join(process.cwd(), 'public', 'images');
  ensureDir(dir);
  const filePath = path.join(dir, `${slug}.svg`);
  fs.writeFileSync(filePath, svg);

  console.log(`[Image Agent] Placeholder SVG saved: /images/${slug}.svg`);
  return `/images/${slug}.svg`;
}

// ── Main export ───────────────────────────────────────────────
export async function runImageAgent(
  title: string,
  slug: string
): Promise<GeneratedImage> {
  console.log(`[Image Agent] Generating image for: "${title}"`);

  // Try DALL-E first (best quality, requires OPENAI_API_KEY)
  const dalle = await generateWithDallE(title, slug);
  if (dalle) return { slug, imagePath: dalle, source: 'dalle' };

  // Fall back to Unsplash (free, no key required)
  const unsplash = await generateWithUnsplash(title, slug);
  if (unsplash) return { slug, imagePath: unsplash, source: 'unsplash' };

  // Last resort: generate a clean SVG placeholder (always works)
  const placeholder = generatePlaceholder(title, slug);
  return { slug, imagePath: placeholder, source: 'placeholder' };
}