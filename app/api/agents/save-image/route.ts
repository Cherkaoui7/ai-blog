import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { slug, base64 } = await req.json();
    if (!slug || !base64) {
      return NextResponse.json({ ok: false, error: 'slug and base64 required' }, { status: 400 });
    }

    const buffer = Buffer.from(base64, 'base64');

    // Upload to Supabase Storage bucket "images"
    const { error } = await supabaseAdmin.storage
      .from('images')
      .upload(`${slug}.jpg`, buffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (error) throw new Error(error.message);

    // Get public URL
    const { data } = supabaseAdmin.storage
      .from('images')
      .getPublicUrl(`${slug}.jpg`);

    console.log(`[Save Image] Uploaded to Supabase: ${data.publicUrl}`);
    return NextResponse.json({ ok: true, imagePath: data.publicUrl });

  } catch (err: any) {
    console.error('[Save Image] Error:', err.message);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}