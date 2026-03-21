import { NextRequest, NextResponse } from 'next/server';
import { runContentAgent } from '@/agents/content';
import { supabaseAdmin } from '@/lib/supabase';
import type { SEOBrief } from '@/agents/seo';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Accept single brief or array of briefs
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

        // Upsert — works even if the post was never inserted by SEO agent
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
              status: 'content_ready',
              updated_at: new Date().toISOString(),
              created_at: new Date().toISOString(),
            },
            { onConflict: 'slug' }
          );

        if (error) {
          console.error('[Content Route] Supabase upsert error:', error.message);
        } else {
          console.log(`[Content Route] Saved "${article.slug}" to Supabase`);
        }

        articles.push({
          slug: article.slug,
          title: article.title,
          wordCount: article.wordCount,
          keyword: article.keyword,
          preview: article.mdx.slice(0, 400) + '...',
        });

        // Delay between articles to avoid Gemini rate limits
        if (briefs.length > 1) {
          await new Promise(r => setTimeout(r, 1500));
        }

      } catch (err: any) {
        // Expose the real error instead of silently returning []
        console.error(`[Content Route] Failed for "${brief?.slug}":`, err.message);
        articles.push({
          slug: brief?.slug || 'unknown',
          error: err.message,
        });
      }
    }

    const succeeded = articles.filter(a => !('error' in a));
    const failed    = articles.filter(a => 'error' in a);

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