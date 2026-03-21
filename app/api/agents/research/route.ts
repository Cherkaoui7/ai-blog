import { NextRequest, NextResponse } from 'next/server';
import { runResearchAgent } from '@/agents/research';
import { supabaseAdmin } from '@/lib/supabase';

export const maxDuration = 60; // ← add this

export async function POST(req: NextRequest) {
  try {
    const { niche } = await req.json();
    if (!niche) {
      return NextResponse.json({ ok: false, error: 'niche is required' }, { status: 400 });
    }

    const topics = await runResearchAgent(niche);

    const { error } = await supabaseAdmin.from('research_topics').insert(
      topics.map(t => ({
        niche,
        topic: t.topic,
        reason: t.reason,
        search_volume: t.estimatedSearchVolume,
        content_angle: t.contentAngle,
        status: 'pending',
        created_at: new Date().toISOString(),
      }))
    );

    if (error) console.error('[Research Route] Supabase error:', error.message);

    return NextResponse.json({ ok: true, topics });
  } catch (err: any) {
    console.error('[Research Route] Error:', err.message);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}