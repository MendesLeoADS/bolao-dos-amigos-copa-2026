import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

// URL base do Football-Data.org
const API_URL = 'https://api.football-data.org/v4/matches';
const API_KEY = process.env.FOOTBALL_DATA_API_KEY || '';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const jogosRef = adminDb.collection('jogos');
    const snapshot = await jogosRef.get();
    
    const nowMillis = new Date().getTime();
    
    // Jogos no nosso banco de dados que devem ser monitorados hoje
    const jogosVerificar = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as any))
      .filter((j: any) => {
        if (j.status === 'AO_VIVO') return true;
        // Se agendado e já passou da hora (com 1 hora de tolerância pra frente ou pra trás)
        if (j.status === 'AGENDADO' && new Date(j.data_hora).getTime() <= nowMillis) return true;
        return false;
      });

    if (jogosVerificar.length === 0) {
      return NextResponse.json({ message: 'Nenhum jogo ocorrendo no momento.' });
    }

    // Como o football-data.org filtra por data e não IDs, pegamos a data de hoje (YYYY-MM-DD)
    const today = new Date().toISOString().split('T')[0];

    const apiRes = await fetch(`${API_URL}?dateFrom=${today}&dateTo=${today}`, {
      method: 'GET',
      headers: {
        'X-Auth-Token': API_KEY,
      }
    });

    // Verificação de Rate Limit recomendada pelo football-data.org
    const requestsAvailable = apiRes.headers.get('X-Requests-Available-Minute');
    if (requestsAvailable) {
      console.log(`[Football-Data API] Requisições restantes neste minuto: ${requestsAvailable}`);
    }

    if (!apiRes.ok) {
      if (apiRes.status === 429) {
        throw new Error('Rate limit da Football-Data.org excedido. Tente novamente em 1 minuto.');
      }
      throw new Error('Falha ao comunicar com a Football-Data.org');
    }

    const { matches } = await apiRes.json();
    let updates = 0;
    const batch = adminDb.batch();

    for (const match of matches) {
      // Procura o jogo no nosso banco cujo ID seja igual ao ID da match da API
      const dbJogo = jogosVerificar.find(j => String(j.id) === String(match.id));
      if (!dbJogo) continue;

      const apiStatus = match.status; // 'SCHEDULED', 'TIMED', 'IN_PLAY', 'PAUSED', 'FINISHED', etc.
      
      // O score pode estar em fullTime ou regularTime
      const goalsHome = match.score?.fullTime?.home ?? match.score?.regularTime?.home ?? dbJogo.placar_a;
      const goalsAway = match.score?.fullTime?.away ?? match.score?.regularTime?.away ?? dbJogo.placar_b;

      let novoStatus = dbJogo.status;

      if (['IN_PLAY', 'PAUSED'].includes(apiStatus)) {
        novoStatus = 'AO_VIVO';
      } 
      else if (['FINISHED', 'AWARDED'].includes(apiStatus)) {
        novoStatus = 'ENCERRADO';
      }

      const jogoDocRef = jogosRef.doc(String(match.id));
      batch.update(jogoDocRef, {
        placar_a: goalsHome,
        placar_b: goalsAway,
        status: novoStatus
      });

      updates++;
    }

    if (updates > 0) {
      await batch.commit();
    }

    return NextResponse.json({ 
      message: 'Sincronização concluída.', 
      jogosVerificados: jogosVerificar.length,
      jogosEncontradosNaAPI: matches?.length || 0,
      atualizacoes: updates
    });

  } catch (error: any) {
    console.error('Erro na API Cron:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

