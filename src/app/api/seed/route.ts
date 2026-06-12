import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

const API_URL = 'https://api.football-data.org/v4/competitions/WC/matches';
const API_KEY = process.env.FOOTBALL_DATA_API_KEY || '';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // ATENÇÃO: Em produção, adicione uma proteção de autenticação aqui!
  // Como é apenas para o setup inicial, vamos permitir por enquanto.
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Endpoint bloqueado em produção.' }, { status: 403 });
  }

  try {
    const apiRes = await fetch(API_URL, {
      method: 'GET',
      headers: {
        'X-Auth-Token': API_KEY,
      }
    });

    if (!apiRes.ok) {
      throw new Error(`Falha na API: ${apiRes.statusText}`);
    }

    const { matches } = await apiRes.json();
    
    if (!matches || matches.length === 0) {
       return NextResponse.json({ message: 'Nenhum jogo retornado da API.' });
    }

    const jogosRef = adminDb.collection('jogos');
    const usuariosRef = adminDb.collection('usuarios');
    const palpitesRef = adminDb.collection('palpites');
    
    let batch = adminDb.batch();
    let count = 0;
    let totalInserted = 0;

    // 1. Seed Usuários
    const usersToSeed = [
      { id: 'leo', username: 'léo', senha: 'Leo' },
      { id: 'murilo', username: 'murilo', senha: 'Murilo' },
      { id: 'ian', username: 'ian', senha: 'Ian' }
    ];

    for (const u of usersToSeed) {
      batch.set(usuariosRef.doc(u.id), u, { merge: true });
      count++;
    }

    // 2. Seed Palpites para o jogo 537327 (México x África do Sul)
    const JOGO_ID = 537327;
    const palpitesToSeed = [
      { user_id: 'leo', jogo_id: JOGO_ID, palpite_a: 3, palpite_b: 0, updatedAt: new Date().toISOString() },
      { user_id: 'murilo', jogo_id: JOGO_ID, palpite_a: 2, palpite_b: 1, updatedAt: new Date().toISOString() },
      { user_id: 'ian', jogo_id: JOGO_ID, palpite_a: 1, palpite_b: 0, updatedAt: new Date().toISOString() }
    ];

    for (const p of palpitesToSeed) {
      const palpiteId = `${p.user_id}_${JOGO_ID}`;
      batch.set(palpitesRef.doc(palpiteId), p, { merge: true });
      count++;
    }

    // 3. Seed Jogos
    for (const match of matches) {
      const dbJogo = {
        id: match.id,
        time_a: match.homeTeam?.name || 'A Definir',
        time_b: match.awayTeam?.name || 'A Definir',
        bandeira_a: match.homeTeam?.crest || null,
        bandeira_b: match.awayTeam?.crest || null,
        placar_a: match.score?.fullTime?.home ?? null,
        placar_b: match.score?.fullTime?.away ?? null,
        data_hora: match.utcDate,
        status: ['IN_PLAY', 'PAUSED'].includes(match.status) ? 'AO_VIVO' 
                : ['FINISHED', 'AWARDED'].includes(match.status) ? 'ENCERRADO' 
                : 'AGENDADO',
        grupo: match.group ? match.group.replace('_', ' ') : 'Mata-Mata',
        rodada: `Rodada ${match.matchday || 1}`
      };

      const docRef = jogosRef.doc(String(match.id));
      batch.set(docRef, dbJogo, { merge: true }); // Merge true evita apagar campos extras caso você rode novamente
      
      count++;
      totalInserted++;

      // O Firestore permite no máximo 500 operações por batch
      if (count >= 400) {
        await batch.commit();
        batch = adminDb.batch();
        count = 0;
      }
    }

    // Comita os restantes
    if (count > 0) {
      await batch.commit();
    }

    return NextResponse.json({ 
      success: true, 
      message: `${totalInserted} jogos populados, além de 3 usuários e seus palpites para o primeiro jogo!`
    });

  } catch (error: any) {
    console.error('Erro no Seed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
