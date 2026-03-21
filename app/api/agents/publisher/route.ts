import { NextRequest, NextResponse } from 'next/server';
import { runPublisherAgent } from '@/agents/publisher';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Accept single slug or array of slugs
    const slugs: string[] = Array.isArray(body.slugs)
      ? body.slugs
      : [body.slug];

    if (!slugs.length || !slugs[0]) {
      return NextResponse.json(
        { ok: false, error: 'slug or slugs array is required' },
        { status: 400 }
      );
    }

    const results = [];

    for (const slug of slugs) {
      try {
        const result = await runPublisherAgent(slug);
        results.push(result);
        // Small delay between publishes
        if (slugs.length > 1) await new Promise(r => setTimeout(r, 1000));
      } catch (err: any) {
        console.error(`[Publisher Route] Failed for "${slug}":`, err.message);
        results.push({ slug, status: 'failed', error: err.message });
      }
    }

    const published = results.filter(r => r.status === 'published');
    const failed    = results.filter(r => r.status === 'failed');

    return NextResponse.json({
      ok: failed.length === 0,
      published,
      errors: failed.length > 0 ? failed : undefined,
    });

  } catch (err: any) {
    console.error('[Publisher Route] Fatal error:', err.message);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}