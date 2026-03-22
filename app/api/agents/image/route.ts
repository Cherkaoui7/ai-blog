import { NextRequest, NextResponse } from 'next/server';
import { runImageAgent } from '@/agents/image';
import { supabaseAdmin } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const posts: { title: string; slug: string }[] = Array.isArray(body.posts)
      ? body.posts
      : [{ title: body.title, slug: body.slug }];

    if (!posts.length || !posts[0].slug) {
      return NextResponse.json({ ok: false, error: 'title and slug required' }, { status: 400 });
    }

    const results = [];

    for (const post of posts) {
      try {
        const result = await runImageAgent(post.title, post.slug);

        // Commit image to GitHub so it's available on Vercel
        await commitImageToGitHub(post.slug, result.imagePath);

        // Update Supabase
        await supabaseAdmin.from('posts').update({
          image_path: result.imagePath,
          status: 'image_ready',
          updated_at: new Date().toISOString(),
        }).eq('slug', post.slug);

        results.push({ slug: result.slug, imagePath: result.imagePath, source: result.source });

      } catch (err: any) {
        console.error(`[Image Route] Failed for "${post.slug}":`, err.message);
        results.push({ slug: post.slug, error: err.message });
      }
    }

    return NextResponse.json({ ok: true, results });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

async function commitImageToGitHub(slug: string, imagePath: string): Promise<void> {
  const token = process.env.GITHUB_TOKEN!;
  const repo  = process.env.GITHUB_REPO!;
  const ext   = path.extname(imagePath);
  const githubPath = `public/images/${slug}${ext}`;

  // Read the local file
  const localPath = path.join(process.cwd(), 'public', imagePath);
  if (!fs.existsSync(localPath)) {
    console.warn(`[Image Route] File not found locally: ${localPath}`);
    return;
  }

  const content = fs.readFileSync(localPath).toString('base64');

  // Check if file already exists on GitHub
  let sha: string | undefined;
  try {
    const check = await fetch(`https://api.github.com/repos/${repo}/contents/${githubPath}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
    });
    if (check.ok) {
      const data = await check.json();
      sha = data.sha;
    }
  } catch { }

  const payload: any = { message: `feat: add image for ${slug}`, content, branch: 'main' };
  if (sha) payload.sha = sha;

  await fetch(`https://api.github.com/repos/${repo}/contents/${githubPath}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  console.log(`[Image Route] Committed to GitHub: ${githubPath}`);
}