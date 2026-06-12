import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join('C:/Users/Leonardo Mendes/.gemini/antigravity-ide/brain/b99e5a0b-16e3-4286-a1ad-57126e817eed', 'busger_logo_1781228929199.png');
    const file = fs.readFileSync(filePath);
    return new NextResponse(file, {
      headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=86400' }
    });
  } catch {
    return new NextResponse('Not found', { status: 404 });
  }
}
