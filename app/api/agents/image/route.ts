import { NextRequest, NextResponse } from 'next/server';
import { runImageAgent } from '@/agents/image';
import { supabaseAdmin } from '@/lib/supabase';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const posts: { title: string; slug: string }[] = Array.isArray(body.posts)
      ? body.posts
      : [{ title: body.title, slug: body.slug }];

    if (!posts.length || !posts[0].slug) {
      return NextResponse.json(
        { ok: false, error: 'title and slug are required' },
        { status: 400 }
      );
    }

    const results = [];

    for (const post of posts) {
      try {
        const result = await runImageAgent(post.title, post.slug);

        // Save image path (data URL) to Supabase — no filesystem needed
        const { error } = await supabaseAdmin
          .from('posts')
          .update({
            image_path: result.imagePath,
            status: 'image_ready',
            updated_at: new Date().toISOString(),
          })
          .eq('slug', post.slug);

        if (error) console.error('[Image Route] Supabase error:', error.message);

        results.push({
          slug: result.slug,
          imagePath: result.imagePath,
          source: result.source,
        });

        if (posts.length > 1) await new Promise(r => setTimeout(r, 500));

      } catch (err: any) {
        console.error(`[Image Route] Failed for "${post.slug}":`, err.message);
        results.push({ slug: post.slug, error: err.message });
      }
    }

    return NextResponse.json({ ok: true, results });
  } catch (err: any) {
    console.error('[Image Route] Fatal error:', err.message);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}