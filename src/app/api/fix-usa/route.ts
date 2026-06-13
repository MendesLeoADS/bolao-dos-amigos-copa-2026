import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

// Rota temporária para forçar a atualização do jogo EUA x PAR diretamente no Firestore
export async function GET() {
  try {
    const jogosRef = adminDb.collection('jogos');

    // Busca o documento do jogo EUA x PAR pelo campo 'id' (537345)
    const snapshot = await jogosRef.where('id', '==', 537345).get();

    if (snapshot.empty) {
      // Tenta também como string
      const snapshot2 = await jogosRef.where('id', '==', '537345').get();
      if (snapshot2.empty) {
        return NextResponse.json({ 
          error: 'Jogo EUA x PAR não encontrado no Firestore',
          hint: 'O campo id pode ter um valor diferente'
        });
      }
      // Atualiza via string
      const doc2 = snapshot2.docs[0];
      await doc2.ref.update({
        placar_a: 4,
        placar_b: 1,
        status: 'ENCERRADO',
      });
      return NextResponse.json({
        ok: true,
        docId: doc2.id,
        idType: 'string',
        atualizado: { placar_a: 4, placar_b: 1, status: 'ENCERRADO' }
      });
    }

    const doc = snapshot.docs[0];
    await doc.ref.update({
      placar_a: 4,
      placar_b: 1,
      status: 'ENCERRADO',
    });

    return NextResponse.json({
      ok: true,
      docId: doc.id,
      idType: 'number',
      atualizado: { placar_a: 4, placar_b: 1, status: 'ENCERRADO' }
    });

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
