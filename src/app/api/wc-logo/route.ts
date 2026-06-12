import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), '2026_FIFA_World_Cup_logo.svg.webp');
    const file = fs.readFileSync(filePath);
    return new NextResponse(file, {
      headers: { 'Content-Type': 'image/webp', 'Cache-Control': 'public, max-age=86400' }
    });
  } catch {
    return new NextResponse('Not found', { status: 404 });
  }
}
