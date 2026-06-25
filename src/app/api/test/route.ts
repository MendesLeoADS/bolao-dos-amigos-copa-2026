import { adminDb } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const jogosSnap = await adminDb.collection('jogos').limit(1).get();
  const data = jogosSnap.docs[0].data();
  return NextResponse.json({
    data_hora: data.data_hora,
    type: typeof data.data_hora,
    constructor: data.data_hora?.constructor?.name,
    isTimestamp: !!data.data_hora?.toDate
  });
}
