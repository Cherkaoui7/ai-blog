import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { slug, base64 } = await req.json();
    if (!slug || !base64) {
      return NextResponse.json({ ok: false, error: 'slug and base64 required' }, { status: 400 });
    }

    const dir = path.join(process.cwd(), 'public', 'images');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const buffer = Buffer.from(base64, 'base64');
    const filePath = path.join(dir, `${slug}.jpg`);
    fs.writeFileSync(filePath, buffer);

    console.log(`[Save Image] Saved /images/${slug}.jpg`);
    return NextResponse.json({ ok: true, imagePath: `/images/${slug}.jpg` });
  } catch (err: any) {
    console.error('[Save Image] Error:', err.message);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}