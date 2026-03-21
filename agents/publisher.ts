import fs from 'fs';
import path from 'path';
import { supabaseAdmin } from '@/lib/supabase';

export type PublishResult = {
  slug: string;
  url: string;
  githubCommitUrl: string;
  status: 'published' | 'failed';
};

// ── GitHub API helpers ────────────────────────────────────────
const GITHUB_TOKEN = process.env.GITHUB_TOKEN!;
const GITHUB_REPO  = process.env.GITHUB_REPO!;   // e.g. "username/ai-blog"
const SITE_URL     = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

async function githubRequest(endpoint: string, method = 'GET', body?: any) {
  const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(`GitHub API error: ${data.message}`);
  return data;
}

// Get the current SHA of a file (needed to update existing files)
async function getFileSHA(filePath: string): Promise<string | null> {
  try {
    const data = await githubRequest(`/contents/${filePath}`);
    return data.sha || null;
  } catch {
    return null; // File doesn't exist yet
  }
}

// ── Commit MDX file to GitHub ─────────────────────────────────
async function commitMDXToGitHub(
  slug: string,
  mdxContent: string,
  title: string
): Promise<string> {
  const filePath = `app/blog/posts/${slug}.mdx`;
  const content  = Buffer.from(mdxContent).toString('base64');
  const sha      = await getFileSHA(filePath);

  const payload: any = {
    message: `feat: publish "${title}"`,
    content,
    branch: 'main',
  };

  // Include SHA if updating existing file
  if (sha) payload.sha = sha;

  const data = await githubRequest(`/contents/${filePath}`, 'PUT', payload);

  const commitUrl = data.commit?.html_url || '';
  console.log(`[Publisher] Committed to GitHub: ${filePath}`);
  return commitUrl;
}

// ── Commit image to GitHub ────────────────────────────────────
async function commitImageToGitHub(
  slug: string,
  imagePath: string
): Promise<void> {
  try {
    // Read the local image file
    const localPath = path.join(process.cwd(), 'public', imagePath);
    if (!fs.existsSync(localPath)) {
      console.warn(`[Publisher] Image not found locally: ${localPath}`);
      return;
    }

    const imageBuffer = fs.readFileSync(localPath);
    const content     = imageBuffer.toString('base64');
    const ext         = path.extname(imagePath);
    const githubPath  = `public/images/${slug}${ext}`;
    const sha         = await getFileSHA(githubPath);

    const payload: any = {
      message: `feat: add image for "${slug}"`,
      content,
      branch: 'main',
    };
    if (sha) payload.sha = sha;

    await githubRequest(`/contents/${githubPath}`, 'PUT', payload);
    console.log(`[Publisher] Image committed: ${githubPath}`);
  } catch (err: any) {
    console.warn(`[Publisher] Image commit failed (non-fatal): ${err.message}`);
  }
}

// ── Trigger Vercel redeploy ───────────────────────────────────
async function triggerVercelDeploy(): Promise<void> {
  const hookUrl = process.env.VERCEL_DEPLOY_HOOK;
  if (!hookUrl) {
    console.warn('[Publisher] No VERCEL_DEPLOY_HOOK set — skipping redeploy trigger');
    return;
  }
  try {
    await fetch(hookUrl, { method: 'POST' });
    console.log('[Publisher] Vercel redeploy triggered');
  } catch (err: any) {
    console.warn('[Publisher] Vercel hook failed:', err.message);
  }
}

// ── Main export ───────────────────────────────────────────────
export async function runPublisherAgent(slug: string): Promise<PublishResult> {
  console.log(`[Publisher] Publishing "${slug}"...`);

  // 1. Fetch post from Supabase
  const { data: post, error } = await supabaseAdmin
    .from('posts')
    .select('slug, title, mdx_content, image_path, status')
    .eq('slug', slug)
    .single();

  if (error || !post) {
    throw new Error(`Post not found in Supabase: ${slug}`);
  }

  if (!post.mdx_content) {
    throw new Error(`Post has no content yet. Run the content agent first.`);
  }

  // 2. Commit MDX to GitHub
  const commitUrl = await commitMDXToGitHub(slug, post.mdx_content, post.title);

  // 3. Commit image to GitHub (non-blocking)
  if (post.image_path && post.image_path !== '/images/default.jpg') {
    await commitImageToGitHub(slug, post.image_path);
  }

  // 4. Trigger Vercel redeploy
  await triggerVercelDeploy();

  // 5. Mark post as published in Supabase
  await supabaseAdmin
    .from('posts')
    .update({
      status: 'published',
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('slug', slug);

  const liveUrl = `${SITE_URL}/blog/${slug}`;
  console.log(`[Publisher] Published! Live at: ${liveUrl}`);

  return {
    slug,
    url: liveUrl,
    githubCommitUrl: commitUrl,
    status: 'published',
  };
}