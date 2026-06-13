import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

// URL base do Football-Data.org - busca por ID individual (mais confiável)
const API_URL = 'https://api.football-data.org/v4/matches';
const API_KEY = process.env.FOOTBALL_DATA_API_KEY || '';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const jogosRef = adminDb.collection('jogos');

    // Busca jogos que ainda não foram encerrados
    const snapshot = await jogosRef.where('status', 'in', ['AGENDADO', 'AO_VIVO']).get();

    const nowMillis = Date.now();

    // Filtra apenas jogos cuja hora já passou (candidatos a ter resultado)
    const jogosVerificar = snapshot.docs
      .map(doc => ({ docId: doc.id, ...doc.data() } as any))
      .filter((j: any) => {
        if (j.status === 'AO_VIVO') return true;
        if (j.status === 'AGENDADO' && new Date(j.data_hora).getTime() <= nowMillis) return true;
        return false;
      });

    if (jogosVerificar.length === 0) {
      return NextResponse.json({ message: 'Nenhum jogo para verificar no momento.' });
    }

    const batch = adminDb.batch();
    let updates = 0;
    const log: any[] = [];

    // Busca cada jogo INDIVIDUALMENTE pelo ID - mais confiável que busca por data
    for (const jogo of jogosVerificar) {
      // O campo 'id' no Firestore pode ser number ou string - normaliza para string
      const matchId = String(jogo.id ?? jogo.docId);

      try {
        const apiRes = await fetch(`${API_URL}/${matchId}`, {
          headers: { 'X-Auth-Token': API_KEY },
          cache: 'no-store',
        });

        if (!apiRes.ok) {
          log.push({ matchId, erro: `API status ${apiRes.status}` });
          continue;
        }

        const match = await apiRes.json();
        const apiStatus: string = match.status;

        const goalsHome = match.score?.fullTime?.home ?? match.score?.regularTime?.home ?? null;
        const goalsAway = match.score?.fullTime?.away ?? match.score?.regularTime?.away ?? null;

        let novoStatus = jogo.status;
        if (['IN_PLAY', 'PAUSED'].includes(apiStatus)) {
          novoStatus = 'AO_VIVO';
        } else if (['FINISHED', 'AWARDED'].includes(apiStatus)) {
          novoStatus = 'ENCERRADO';
        }

        // Só atualiza se algo mudou de fato
        const mudou =
          novoStatus !== jogo.status ||
          goalsHome !== (jogo.placar_a ?? null) ||
          goalsAway !== (jogo.placar_b ?? null);

        log.push({
          matchId,
          time_a: jogo.time_a,
          time_b: jogo.time_b,
          apiStatus,
          novoStatus,
          goalsHome,
          goalsAway,
          mudou,
        });

        if (mudou) {
          // Usa docId (o ID real do documento Firestore) para a referência correta
          const docRef = jogosRef.doc(jogo.docId);
          batch.update(docRef, {
            placar_a: goalsHome,
            placar_b: goalsAway,
            status: novoStatus,
          });
          updates++;
        }
      } catch (err: any) {
        log.push({ matchId, erro: err.message });
      }
    }

    if (updates > 0) {
      await batch.commit();
    }

    return NextResponse.json({
      message: 'Sincronização concluída.',
      jogosVerificados: jogosVerificar.length,
      atualizacoes: updates,
      detalhes: log,
    });
  } catch (error: any) {
    console.error('Erro na API Cron:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
