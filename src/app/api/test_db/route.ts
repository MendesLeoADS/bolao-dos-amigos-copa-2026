import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const batch = adminDb.batch();
    
    // Coreia (537328)
    const refCoreia = adminDb.collection('jogos').doc('537328');
    batch.update(refCoreia, {
      placar_a: 2,
      placar_b: 1,
      status: 'ENCERRADO'
    });

    // Canada (537333)
    const refCanada = adminDb.collection('jogos').doc('537333');
    batch.update(refCanada, {
      placar_a: 1,
      placar_b: 1,
      status: 'ENCERRADO'
    });

    await batch.commit();

    return NextResponse.json({ success: true, message: "Jogos atualizados com sucesso" });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
