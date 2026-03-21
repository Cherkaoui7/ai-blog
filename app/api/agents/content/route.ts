import { NextRequest, NextResponse } from 'next/server';
import { runContentAgent } from '@/agents/content';
import { supabaseAdmin } from '@/lib/supabase';
import type { SEOBrief } from '@/agents/seo';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const briefs: SEOBrief[] = Array.isArray(body.briefs)
      ? body.briefs
      : [body.brief];

    if (!briefs.length || !briefs[0]) {
      return NextResponse.json(
        { ok: false, error: 'brief or briefs array is required' },
        { status: 400 }
      );
    }

    const articles = [];

    for (const brief of briefs) {
      try {
        const article = await runContentAgent(brief);

        const { error } = await supabaseAdmin
          .from('posts')
          .upsert(
            {
              slug: article.slug,
              title: article.title,
              keyword: article.keyword,
              meta_description: brief.metaDescription,
              mdx_content: article.mdx,
              word_count: article.wordCount,
              // Use the resolved image path — always matches /images/slug.svg
              image_path: article.imagePath,
              status: 'content_ready',
              updated_at: new Date().toISOString(),
              created_at: new Date().toISOString(),
            },
            { onConflict: 'slug' }
          );

        if (error) console.error('[Content Route] Supabase error:', error.message);

        articles.push({
          slug: article.slug,
          title: article.title,
          wordCount: article.wordCount,
          keyword: article.keyword,
          imagePath: article.imagePath,
          preview: article.mdx.slice(0, 400) + '...',
        });

        if (briefs.length > 1) await new Promise(r => setTimeout(r, 1500));

      } catch (err: any) {
        console.error(`[Content Route] Failed for "${brief?.slug}":`, err.message);
        articles.push({ slug: brief?.slug || 'unknown', error: err.message });
      }
    }

    const succeeded = articles.filter(a => !('error' in a));
    const failed = articles.filter(a => 'error' in a);

    return NextResponse.json({
      ok: failed.length === 0,
      articles: succeeded,
      errors: failed.length > 0 ? failed : undefined,
    });

  } catch (err: any) {
    console.error('[Content Route] Fatal error:', err.message);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}