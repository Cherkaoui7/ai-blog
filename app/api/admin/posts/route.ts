import { NextResponse } from 'next/server';
import { getAdminPosts } from '@/lib/posts';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const posts = await getAdminPosts();
    return NextResponse.json({ ok: true, posts });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load local posts';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
