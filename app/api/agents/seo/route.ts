import { NextRequest, NextResponse } from 'next/server';
import { runSEOAgent } from '@/agents/seo';
import { supabaseAdmin } from '@/lib/supabase';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Accept either topics array directly from research agent output
    // or a single topic object
    const topics: { topic: string; contentAngle: string }[] = Array.isArray(body.topics)
      ? body.topics
      : [{ topic: body.topic, contentAngle: body.contentAngle || body.topic }];

    if (!topics.length) {
      return NextResponse.json({ ok: false, error: 'topics array is required' }, { status: 400 });
    }

    const briefs = await runSEOAgent(topics);

    // Save each brief to Supabase posts table as drafts
    const { error } = await supabaseAdmin.from('posts').insert(
      briefs.map(b => ({
        title: b.titleTag,
        slug: b.slug,
        keyword: b.primaryKeyword,
        meta_description: b.metaDescription,
        h2_tags: b.h2Tags,
        secondary_keywords: b.secondaryKeywords,
        target_word_count: b.targetWordCount,
        competition: b.competition,
        status: 'draft',
        created_at: new Date().toISOString(),
      }))
    );

    if (error) console.error('[SEO Route] Supabase error:', error.message);

    return NextResponse.json({ ok: true, briefs });
  } catch (err: any) {
    console.error('[SEO Route] Error:', err.message);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}