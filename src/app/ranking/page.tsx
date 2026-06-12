import { adminDb } from '@/lib/firebaseAdmin';
import { getSession } from '@/lib/session';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function RankingPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const [jogosSnap, palpitesSnap, usuariosSnap] = await Promise.all([
    adminDb.collection('jogos').where('status', '==', 'ENCERRADO').get(),
    adminDb.collection('palpites').get(),
    adminDb.collection('usuarios').get(),
  ]);

  const jogos = jogosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
  const palpites = palpitesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
  const usuarios = usuariosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

  // Apenas Placares Exatos (1 cravada = 1 ponto)
  const pontuacoes = usuarios.map(usuario => {
    let pontos = 0;
    const meusPalpites = palpites.filter(p => p.user_id === usuario.id);

    meusPalpites.forEach(palpite => {
      const jogo = jogos.find(j => String(j.id) === String(palpite.jogo_id));
      if (!jogo) return;

      if (Number(palpite.palpite_a) === Number(jogo.placar_a) &&
          Number(palpite.palpite_b) === Number(jogo.placar_b)) {
        pontos += 1;
      }
    });

    return { ...usuario, pontos };
  });

  pontuacoes.sort((a, b) => b.pontos - a.pontos);

  const medalhas = ['🥇', '🥈', '🥉'];
  const totalJogosEncerrados = jogos.length;

  return (
    <main
      className="min-h-screen py-6 px-4"
      style={{ background: 'linear-gradient(180deg, #001d5e 0%, #002776 30%, #003d1a 100%)' }}
    >
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Back */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-green-200 hover:text-white transition-colors font-medium text-sm"
        >
          ← Voltar aos Jogos
        </Link>

        {/* Header card */}
        <div className="relative overflow-hidden rounded-2xl shadow-2xl">
          {/* Fundo gradiente Brasil */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #002776 0%, #003d99 50%, #009c3b 100%)' }} />
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-56 h-56 rounded-full -translate-y-1/2 translate-x-1/2 opacity-10" style={{ background: '#FFDF00' }} />
          </div>

          <div className="relative p-8">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-4xl font-black text-white flex items-center gap-3">
                  🏆 Ranking
                </h1>
                <p className="mt-1 font-semibold" style={{ color: '#FFDF00' }}>
                  {totalJogosEncerrados} jogo{totalJogosEncerrados !== 1 ? 's' : ''} encerrado{totalJogosEncerrados !== 1 ? 's' : ''} até agora
                </p>
              </div>
              <div
                className="flex items-center gap-3 rounded-xl px-4 py-3 border shadow-lg"
                style={{ background: 'rgba(255,223,0,0.12)', borderColor: 'rgba(255,223,0,0.3)' }}
              >
                <img src="/busger_logo.png" alt="Busger" className="h-10 object-contain" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(255,223,0,0.7)' }}>Prêmio em jogo</p>
                  <p className="font-black text-base" style={{ color: '#FFDF00' }}>Hambúrguer no Busger</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cards de Ranking */}
        <div className="space-y-3">
          {pontuacoes.map((user, index) => {
            const isFirst = index === 0;
            const isLast = index === pontuacoes.length - 1;
            const isMe = session?.id === user.id;

            return (
              <div
                key={user.id}
                className="rounded-2xl p-5 flex items-center justify-between gap-4 shadow-lg border transition-all"
                style={{
                  background: isFirst
                    ? 'linear-gradient(135deg, rgba(255,223,0,0.15) 0%, rgba(255,223,0,0.05) 100%)'
                    : isLast
                    ? 'rgba(239,68,68,0.08)'
                    : 'rgba(255,255,255,0.06)',
                  borderColor: isFirst
                    ? 'rgba(255,223,0,0.5)'
                    : isLast
                    ? 'rgba(239,68,68,0.3)'
                    : 'rgba(255,255,255,0.1)',
                }}
              >
                <div className="flex items-center gap-4">
                  {/* Posição */}
                  <div className="flex items-center justify-center w-12 h-12 rounded-full text-2xl font-black shrink-0"
                    style={{
                      background: isFirst ? '#FFDF00' : isLast ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.1)',
                      color: isFirst ? '#002776' : isLast ? '#fca5a5' : 'rgba(255,255,255,0.6)',
                    }}
                  >
                    {index < 3 ? medalhas[index] : `${index + 1}º`}
                  </div>

                  {/* Nome */}
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xl font-black text-white capitalize">{user.username}</span>
                      {isMe && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{ background: '#009c3b', color: 'white' }}>
                          você
                        </span>
                      )}
                    </div>
                    {isFirst && user.pontos > 0 && (
                      <p className="text-xs font-bold mt-0.5" style={{ color: '#FFDF00' }}>
                        Sentindo o cheiro do lanche grátis 😎
                      </p>
                    )}
                    {isLast && (
                      <p className="text-xs font-bold mt-0.5 text-red-400">
                        A caminho de pagar o Busger 😅
                      </p>
                    )}
                  </div>
                </div>

                {/* Pontuação */}
                <div className="text-right shrink-0">
                  <div className="text-4xl font-black"
                    style={{ color: isFirst ? '#FFDF00' : 'white' }}>
                    {user.pontos}
                  </div>
                  <div className="text-xs font-bold uppercase tracking-wider"
                    style={{ color: isFirst ? 'rgba(255,223,0,0.7)' : 'rgba(255,255,255,0.4)' }}>
                    {user.pontos === 1 ? 'Cravada' : 'Cravadas'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Regras */}
        <div className="rounded-2xl p-6 border text-sm" style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}>
          <h3 className="font-black text-white mb-3 text-base">📜 Regras da Casa</h3>
          <ul className="space-y-2 text-green-100">
            <li>✅ <strong className="text-white">1 ponto</strong> por placar <strong>exato</strong> (cravada). Sem choro.</li>
            <li>❌ <strong className="text-white">0 pontos</strong> qualquer outro resultado.</li>
            <li className="pt-2 font-bold flex items-center gap-2" style={{ color: '#FFDF00' }}>⚠️ O último colocado paga o hambúrguer na{' '}
              <img src="/busger_logo.png" alt="Busger" className="h-5 inline-block object-contain" />
              {' '}pro campeão!
            </li>
          </ul>
        </div>

      </div>
    </main>
  );
}
