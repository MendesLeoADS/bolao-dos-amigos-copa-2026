import { adminDb } from '@/lib/firebaseAdmin';
import { getSession } from '@/lib/session';
import GamesTable, { Jogo, Palpite, Usuario } from '@/components/GamesTable';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const session = await getSession();
  if (!session) redirect('/login');

  // Fetch initial data for SSR
  const [jogosSnapshot, palpitesSnapshot, usuariosSnapshot] = await Promise.all([
    adminDb.collection('jogos').get(),
    adminDb.collection('palpites').get(),
    adminDb.collection('usuarios').get(),
  ]);

  const initialJogos = jogosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Jogo))
    .sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime());

  const initialPalpites = palpitesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Palpite));
  const initialUsuarios = usuariosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Usuario));

  return (
    <main
      className="min-h-screen py-6 px-2 sm:px-4 lg:px-8"
      style={{ background: 'linear-gradient(180deg, #001d5e 0%, #002776 30%, #003d1a 100%)' }}
    >
      <div className="max-w-[1600px] mx-auto space-y-6">

        {/* Header */}
        <header className="relative overflow-hidden rounded-2xl shadow-2xl" style={{ background: 'linear-gradient(135deg, #002776 0%, #003d99 50%, #009c3b 100%)' }}>
          {/* Decorative elements */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full -translate-y-1/2 translate-x-1/2 opacity-10" style={{ background: '#FFDF00' }} />
            <div className="absolute bottom-0 left-20 w-32 h-32 rounded-full translate-y-1/2 opacity-10" style={{ background: '#FFDF00' }} />
          </div>

          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-5">
            <div className="flex items-center gap-4">
              <div className="text-4xl sm:text-5xl animate-float">🇧🇷</div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                  Bolão da Copa <span className="shimmer-gold">2026</span>
                </h1>
                <p className="text-sm text-green-200 font-medium mt-0.5">
                  ⚽ Palpites de {initialUsuarios.map(u => u.username).join(', ')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Ranking badge */}
              <Link
                href="/ranking"
                className="flex items-center gap-2 font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105 duration-200 text-sm"
                style={{ background: '#FFDF00', color: '#002776' }}
              >
                <span className="text-lg">🏆</span>
                <span className="hidden sm:inline">Ver Ranking</span>
                <span className="sm:hidden">Ranking</span>
              </Link>

              {/* User + Logout */}
              <div className="flex items-center gap-3 bg-white/10 border border-white/20 rounded-xl px-4 py-2.5">
                <span className="text-sm font-bold text-white capitalize hidden sm:inline">{session.username}</span>
                <form action="/api/logout" method="POST">
                  <button type="submit" className="text-xs font-bold text-red-300 hover:text-red-100 transition-colors uppercase tracking-wider">
                    Sair
                  </button>
                </form>
              </div>
            </div>
          </div>
        </header>

        {/* Aposta do Busger */}
        <div
          className="flex items-center gap-3 px-5 py-3 rounded-xl border text-sm font-bold shadow"
          style={{ background: 'rgba(255, 223, 0, 0.1)', borderColor: 'rgba(255, 223, 0, 0.3)', color: '#FFDF00' }}
        >
          <img src="/busger_logo.png" alt="Busger" className="h-8 object-contain shrink-0" />
          <span style={{ color: 'rgba(255,255,255,0.8)' }}>
            Aposta em jogo: <strong style={{ color: '#FFDF00' }}>Hambúrguer no Busger</strong> para o vencedor — pago pelo último colocado!
          </span>
        </div>

        {/* Table */}
        <GamesTable
          initialJogos={initialJogos}
          initialPalpites={initialPalpites}
          initialUsuarios={initialUsuarios}
        />
      </div>
    </main>
  );
}
