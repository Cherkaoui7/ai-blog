import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { slug, title, keyword, metaDescription, mdxContent, wordCount, imagePath } = await req.json();

    if (!slug || !mdxContent) {
      return NextResponse.json({ ok: false, error: 'slug and mdxContent required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('posts')
      .upsert(
        {
          slug,
          title,
          keyword,
          meta_description: metaDescription,
          mdx_content: mdxContent,
          word_count: wordCount,
          image_path: imagePath,
          status: 'content_ready',
          updated_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        },
        { onConflict: 'slug' }
      );

    if (error) {
      console.error('[Save Content] Supabase error:', error.message);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    console.log(`[Save Content] Saved "${slug}" to Supabase`);
    return NextResponse.json({ ok: true, slug });
  } catch (err: any) {
    console.error('[Save Content] Error:', err.message);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}