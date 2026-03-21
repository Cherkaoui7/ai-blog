import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug');

  const { data, error } = await supabaseAdmin
    .from('posts')
    .select('title, slug, keyword, word_count, status, mdx_content')
    .eq('slug', slug || '')
    .single();

  if (error) return NextResponse.json({ ok: false, error: error.message });
  return NextResponse.json({ ok: true, post: data });
}