import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

const API_URL = 'https://api.football-data.org/v4/matches';
const API_KEY = process.env.FOOTBALL_DATA_API_KEY || '';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Pega TODOS os jogos do Firestore (incluindo ENCERRADO)
    const snapshot = await adminDb.collection('jogos').get();
    const todos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

    // 2. Filtra só o jogo dos EUA (ID 537345)
    const usaMatch = todos.find(j => String(j.id) === '537345');

    // 3. Pega os jogos que o cron tentaria verificar
    const nowMillis = new Date().getTime();
    const jogosVerificar = todos
      .filter((j: any) => {
        if (j.status === 'AO_VIVO') return true;
        if (j.status === 'AGENDADO' && new Date(j.data_hora).getTime() <= nowMillis) return true;
        return false;
      });

    // 4. Busca o jogo dos EUA diretamente na API usando o ID
    const apiRes = await fetch(`${API_URL}/537345`, {
      headers: { 'X-Auth-Token': API_KEY },
      cache: 'no-store'
    });
    const apiData = apiRes.ok ? await apiRes.json() : { error: `API status: ${apiRes.status}` };

    return NextResponse.json({
      agora_utc: new Date().toISOString(),
      agora_millis: nowMillis,
      total_jogos_no_firestore: todos.length,
      jogo_eua_no_firestore: usaMatch || 'NÃO ENCONTRADO - ID 537345',
      jogos_que_o_cron_verificaria: jogosVerificar.map(j => ({
        id: j.id,
        time_a: j.time_a,
        time_b: j.time_b,
        status: j.status,
        data_hora: j.data_hora,
        data_hora_millis: new Date(j.data_hora).getTime(),
        ja_passou: new Date(j.data_hora).getTime() <= nowMillis
      })),
      api_football_data_resposta: apiData
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message });
  }
}
