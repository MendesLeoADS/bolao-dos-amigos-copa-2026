'use client';

import { useEffect, useState, useTransition, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { savePalpiteAction } from '@/app/actions';
import { format, isBefore, subMinutes, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { traduzirSelecao } from '@/lib/selecoes';

export type Jogo = {
  id: number | string;
  time_a: string;
  time_b: string;
  bandeira_a?: string;
  bandeira_b?: string;
  placar_a?: number;
  placar_b?: number;
  data_hora: string;
  status: string;
  grupo?: string;
  rodada?: string;
};

export type Palpite = {
  id: string;
  user_id: string;
  jogo_id: number;
  palpite_a: number;
  palpite_b: number;
};

export type Usuario = {
  id: string;
  username: string;
};

// ─────────────────────────────────────────────────────────────────
//  BARRA DE FILTROS
// ─────────────────────────────────────────────────────────────────
function FilterBar({
  jogos,
  grupo, setGrupo,
  selecao, setSelecao,
  data, setData,
  hora, setHora,
  onClear,
}: {
  jogos: Jogo[];
  grupo: string; setGrupo: (v: string) => void;
  selecao: string; setSelecao: (v: string) => void;
  data: string; setData: (v: string) => void;
  hora: string; setHora: (v: string) => void;
  onClear: () => void;
}) {
  const grupos = useMemo(() => {
    const set = new Set<string>();
    jogos.forEach(j => j.grupo && set.add(j.grupo));
    return Array.from(set).sort();
  }, [jogos]);

  const datas = useMemo(() => {
    const set = new Set<string>();
    jogos.forEach(j => {
      try { set.add(format(new Date(j.data_hora), 'yyyy-MM-dd')); } catch {}
    });
    return Array.from(set).sort();
  }, [jogos]);

  const horas = useMemo(() => {
    const set = new Set<string>();
    jogos.forEach(j => {
      try { set.add(format(new Date(j.data_hora), 'HH:mm')); } catch {}
    });
    return Array.from(set).sort();
  }, [jogos]);

  const temFiltro = grupo || selecao || data || hora;

  const selectStyle = {
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.15)',
    color: 'white',
  };

  return (
    <div className="rounded-xl p-4 flex flex-wrap items-end gap-3" style={{ background: 'rgba(0,39,118,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
      <span className="text-xs font-bold text-white/50 uppercase tracking-wider self-center">🔍 Filtrar:</span>

      {/* Grupo */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Grupo</label>
        <select
          value={grupo}
          onChange={e => setGrupo(e.target.value)}
          className="rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400 cursor-pointer min-w-[120px]"
          style={selectStyle}
        >
          <option value="" style={{ background: '#002776' }}>Todos</option>
          {grupos.map(g => (
            <option key={g} value={g} style={{ background: '#002776' }}>{g.replace('GROUP_', 'Grupo ')}</option>
          ))}
        </select>
      </div>

      {/* Seleção */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Seleção</label>
        <input
          type="text"
          placeholder="Ex: Brasil, Alemanha..."
          value={selecao}
          onChange={e => setSelecao(e.target.value)}
          className="rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400 min-w-[180px] placeholder-white/30"
          style={selectStyle}
        />
      </div>

      {/* Data */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Data</label>
        <select
          value={data}
          onChange={e => setData(e.target.value)}
          className="rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400 cursor-pointer min-w-[140px]"
          style={selectStyle}
        >
          <option value="" style={{ background: '#002776' }}>Todas</option>
          {datas.map(d => (
            <option key={d} value={d} style={{ background: '#002776' }}>
              {format(parseISO(d), "dd 'de' MMMM", { locale: ptBR })}
            </option>
          ))}
        </select>
      </div>

      {/* Hora */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Horário</label>
        <select
          value={hora}
          onChange={e => setHora(e.target.value)}
          className="rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400 cursor-pointer min-w-[120px]"
          style={selectStyle}
        >
          <option value="" style={{ background: '#002776' }}>Todos</option>
          {horas.map(h => (
            <option key={h} value={h} style={{ background: '#002776' }}>{h}</option>
          ))}
        </select>
      </div>

      {/* Limpar */}
      {temFiltro && (
        <button
          onClick={onClear}
          className="self-end px-3 py-2 text-xs font-bold rounded-lg transition-colors"
          style={{ background: 'rgba(239,68,68,0.2)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.3)' }}
        >
          ✕ Limpar
        </button>
      )}

      {/* Contagem */}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  COMPONENT PRINCIPAL
// ─────────────────────────────────────────────────────────────────
export default function GamesTable({
  initialJogos,
  initialPalpites,
  initialUsuarios
}: {
  initialJogos: Jogo[],
  initialPalpites: Palpite[],
  initialUsuarios: Usuario[]
}) {
  const [jogos, setJogos] = useState<Jogo[]>(initialJogos);
  const [palpites, setPalpites] = useState<Palpite[]>(initialPalpites);
  const [usuarios, setUsuarios] = useState<Usuario[]>(initialUsuarios);
  const [session, setSession] = useState<{ id: string, username: string } | null>(null);

  // Filtros
  const [filtroGrupo, setFiltroGrupo] = useState('');
  const [filtroSelecao, setFiltroSelecao] = useState('');
  const [filtroData, setFiltroData] = useState('');
  const [filtroHora, setFiltroHora] = useState('');

  useEffect(() => {
    fetch('/api/me').then(r => r.ok ? r.json() : null).then(s => s && setSession(s));
  }, []);

  useEffect(() => {
    const unsubJogos = onSnapshot(collection(db, 'jogos'), (snap) => {
      const games = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Jogo));
      games.sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime());
      setJogos(games);
    });
    const unsubPalpites = onSnapshot(collection(db, 'palpites'), (snap) => {
      setPalpites(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Palpite)));
    });
    const unsubUsuarios = onSnapshot(collection(db, 'usuarios'), (snap) => {
      setUsuarios(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Usuario)));
    });
    return () => { unsubJogos(); unsubPalpites(); unsubUsuarios(); };
  }, []);

  const todosOrdenados = useMemo(() =>
    [...usuarios].sort((a, b) => a.username.localeCompare(b.username)),
    [usuarios]
  );

  // Aplicar filtros
  const jogosFiltrados = useMemo(() => {
    return jogos.filter(jogo => {
      if (filtroGrupo && jogo.grupo !== filtroGrupo) return false;

      if (filtroSelecao) {
        const busca = filtroSelecao.toLowerCase();
        const nomeA = traduzirSelecao(jogo.time_a).toLowerCase();
        const nomeB = traduzirSelecao(jogo.time_b).toLowerCase();
        if (!nomeA.includes(busca) && !nomeB.includes(busca)) return false;
      }

      if (filtroData) {
        try {
          const dataJogo = format(new Date(jogo.data_hora), 'yyyy-MM-dd');
          if (dataJogo !== filtroData) return false;
        } catch { return false; }
      }

      if (filtroHora) {
        try {
          const horaJogo = format(new Date(jogo.data_hora), 'HH:mm');
          if (horaJogo !== filtroHora) return false;
        } catch { return false; }
      }

      return true;
    });
  }, [jogos, filtroGrupo, filtroSelecao, filtroData, filtroHora]);

  const limparFiltros = () => {
    setFiltroGrupo('');
    setFiltroSelecao('');
    setFiltroData('');
    setFiltroHora('');
  };

  const temFiltro = filtroGrupo || filtroSelecao || filtroData || filtroHora;

  return (
    <div className="space-y-4">
      {/* Barra de Filtros */}
      <FilterBar
        jogos={jogos}
        grupo={filtroGrupo} setGrupo={setFiltroGrupo}
        selecao={filtroSelecao} setSelecao={setFiltroSelecao}
        data={filtroData} setData={setFiltroData}
        hora={filtroHora} setHora={setFiltroHora}
        onClear={limparFiltros}
      />

      {/* Contagem */}
      <div className="flex items-center justify-between px-1">
        <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>
          {temFiltro
            ? `${jogosFiltrados.length} de ${jogos.length} jogos`
            : `${jogos.length} jogos no total`}
        </p>
        {temFiltro && (
          <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: 'rgba(255,223,0,0.15)', color: '#FFDF00' }}>
            Filtro ativo
          </span>
        )}
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto rounded-2xl shadow-2xl border border-white/10">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr style={{ background: 'linear-gradient(90deg, #002776 0%, #003d99 60%, #009c3b 100%)' }}>
              <th className="px-3 py-4 text-center text-xs font-bold text-white/70 uppercase tracking-wider whitespace-nowrap">Grupo</th>
              <th className="px-3 py-4 text-center text-xs font-bold text-white/70 uppercase tracking-wider whitespace-nowrap">Rodada</th>
              <th className="px-3 py-4 text-center text-xs font-bold text-white/70 uppercase tracking-wider whitespace-nowrap">Data</th>
              <th className="px-3 py-4 text-center text-xs font-bold text-white/70 uppercase tracking-wider whitespace-nowrap">Hora</th>
              <th className="px-4 py-4 text-right text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap">Seleção 1</th>
              <th className="px-3 py-4 text-center text-xs font-bold uppercase tracking-wider whitespace-nowrap" style={{ color: '#FFDF00' }}>Meu Palpite</th>
              <th className="px-4 py-4 text-center text-xs font-bold text-white/70 uppercase tracking-wider whitespace-nowrap">Placar</th>
              <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap">Seleção 2</th>
              {todosOrdenados.map(u => (
                <th key={u.id} className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider whitespace-nowrap capitalize"
                  style={{ color: u.id === session?.id ? '#FFDF00' : 'rgba(255,255,255,0.75)' }}>
                  {u.id === session?.id ? `⚽ ${u.username}` : u.username}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {jogosFiltrados.length === 0 ? (
              <tr>
                <td colSpan={8 + todosOrdenados.length} className="py-16 text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  <div className="text-4xl mb-3">🔍</div>
                  <div className="font-bold">Nenhum jogo encontrado com esses filtros</div>
                  <button onClick={limparFiltros} className="mt-3 text-sm underline" style={{ color: '#FFDF00' }}>
                    Limpar filtros
                  </button>
                </td>
              </tr>
            ) : (
              jogosFiltrados.map((jogo, i) => (
                <GameRow
                  key={jogo.id}
                  jogo={jogo}
                  session={session}
                  todos={todosOrdenados}
                  palpites={palpites.filter(p => String(p.jogo_id) === String(jogo.id))}
                  isEven={i % 2 === 0}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  LINHA DA TABELA
// ─────────────────────────────────────────────────────────────────
function GameRow({ jogo, session, todos, palpites, isEven }: {
  jogo: Jogo,
  session: any,
  todos: Usuario[],
  palpites: Palpite[],
  isEven: boolean
}) {
  const [isPending, startTransition] = useTransition();
  const meuPalpite = palpites.find(p => p.user_id === session?.id);
  const [palpiteA, setPalpiteA] = useState<string>(meuPalpite?.palpite_a != null ? String(meuPalpite.palpite_a) : '');
  const [palpiteB, setPalpiteB] = useState<string>(meuPalpite?.palpite_b != null ? String(meuPalpite.palpite_b) : '');

  useEffect(() => {
    if (meuPalpite) {
      setPalpiteA(String(meuPalpite.palpite_a));
      setPalpiteB(String(meuPalpite.palpite_b));
    }
  }, [meuPalpite?.palpite_a, meuPalpite?.palpite_b]);

  const dataJogo = new Date(jogo.data_hora);
  const podePalpitar = isBefore(new Date(), subMinutes(dataJogo, 5)) && jogo.status === 'AGENDADO';

  const handleBlur = () => {
    if (!podePalpitar || palpiteA === '' || palpiteB === '') return;
    startTransition(async () => {
      const res = await savePalpiteAction(Number(jogo.id), parseInt(palpiteA), parseInt(palpiteB));
      if (res?.error) alert(res.error);
    });
  };

  const isEncerrado = jogo.status === 'ENCERRADO';
  const isAoVivo = jogo.status === 'AO_VIVO';

  const rowBg = isAoVivo
    ? 'rgba(255, 223, 0, 0.07)'
    : isEncerrado
    ? 'rgba(0, 0, 0, 0.25)'
    : isEven
    ? 'rgba(255,255,255,0.04)'
    : 'rgba(255,255,255,0.08)';

  const textMuted = isEncerrado ? 'text-white/40' : 'text-white/60';
  const textMain = isEncerrado ? 'text-white/50' : 'text-white';

  const nomeA = traduzirSelecao(jogo.time_a);
  const nomeB = traduzirSelecao(jogo.time_b);
  const grupoLabel = jogo.grupo ? jogo.grupo.replace('GROUP_', 'Grupo ') : '';

  return (
    <tr
      className={`border-b border-white/5 transition-colors hover:brightness-125 ${isAoVivo ? 'animate-pulse-slow' : ''}`}
      style={{ background: rowBg }}
    >
      {/* Grupo */}
      <td className="px-3 py-3 text-center">
        <span className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ background: 'rgba(255,223,0,0.15)', color: '#FFDF00' }}>
          {grupoLabel}
        </span>
      </td>

      {/* Rodada */}
      <td className={`px-3 py-3 text-center text-xs font-medium ${textMuted}`}>{jogo.rodada}</td>

      {/* Data */}
      <td className={`px-3 py-3 text-center text-xs font-medium ${textMuted} whitespace-nowrap`}>
        {format(dataJogo, 'dd/MM', { locale: ptBR })}
      </td>

      {/* Hora */}
      <td className={`px-3 py-3 text-center font-mono text-xs ${textMuted} whitespace-nowrap`}>
        {format(dataJogo, 'HH:mm')}
        {isAoVivo && <span className="block font-black text-red-400 animate-pulse text-[10px] uppercase">● AO VIVO</span>}
        {isEncerrado && <span className="block text-[10px] text-white/30 font-bold uppercase">FIM</span>}
      </td>

      {/* Seleção 1 */}
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-2">
          <span className={`font-bold text-sm whitespace-nowrap ${textMain}`}>{nomeA}</span>
          {jogo.bandeira_a && (
            <img src={jogo.bandeira_a} alt={nomeA} className="w-8 h-5 object-contain rounded drop-shadow" />
          )}
        </div>
      </td>

      {/* Meu palpite */}
      <td className="px-3 py-2 text-center">
        <div className="flex items-center justify-center gap-1">
          <input
            type="number" min="0" max="99"
            value={palpiteA}
            onChange={e => setPalpiteA(e.target.value)}
            onBlur={handleBlur}
            disabled={!podePalpitar || isPending}
            className="w-10 h-9 text-center font-black text-base rounded-lg border-2 transition-all focus:outline-none"
            style={{
              background: podePalpitar ? 'rgba(255,223,0,0.12)' : 'rgba(255,255,255,0.05)',
              borderColor: podePalpitar ? 'rgba(255,223,0,0.5)' : 'rgba(255,255,255,0.1)',
              color: podePalpitar ? '#FFDF00' : 'rgba(255,255,255,0.3)',
            }}
          />
          <span className="text-white/40 font-bold text-xs">x</span>
          <input
            type="number" min="0" max="99"
            value={palpiteB}
            onChange={e => setPalpiteB(e.target.value)}
            onBlur={handleBlur}
            disabled={!podePalpitar || isPending}
            className="w-10 h-9 text-center font-black text-base rounded-lg border-2 transition-all focus:outline-none"
            style={{
              background: podePalpitar ? 'rgba(255,223,0,0.12)' : 'rgba(255,255,255,0.05)',
              borderColor: podePalpitar ? 'rgba(255,223,0,0.5)' : 'rgba(255,255,255,0.1)',
              color: podePalpitar ? '#FFDF00' : 'rgba(255,255,255,0.3)',
            }}
          />
        </div>
        {isPending && <p className="text-[10px] text-green-400 mt-0.5 text-center">salvando...</p>}
      </td>

      {/* Placar oficial */}
      <td className="px-4 py-3 text-center whitespace-nowrap">
        {isEncerrado || isAoVivo ? (
          <span className="font-black text-xl" style={{ color: isAoVivo ? '#FFDF00' : 'white' }}>
            {jogo.placar_a ?? 0} – {jogo.placar_b ?? 0}
          </span>
        ) : (
          <span className="text-white/20 font-bold text-sm">vs</span>
        )}
      </td>

      {/* Seleção 2 */}
      <td className="px-4 py-3 text-left">
        <div className="flex items-center justify-start gap-2">
          {jogo.bandeira_b && (
            <img src={jogo.bandeira_b} alt={nomeB} className="w-8 h-5 object-contain rounded drop-shadow" />
          )}
          <span className={`font-bold text-sm whitespace-nowrap ${textMain}`}>{nomeB}</span>
        </div>
      </td>

      {/* Palpites de todos (sem blur) */}
      {todos.map(user => {
        const p = palpites.find(p => p.user_id === user.id);
        const isMe = user.id === session?.id;

        const acertou = p && isEncerrado &&
          Number(p.palpite_a) === Number(jogo.placar_a) &&
          Number(p.palpite_b) === Number(jogo.placar_b);

        return (
          <td key={user.id} className="px-4 py-3 text-center border-l border-white/5">
            {p ? (
              <span
                className="font-mono font-bold text-base px-2 py-0.5 rounded-lg inline-block"
                style={{
                  background: acertou
                    ? 'rgba(0,200,80,0.2)'
                    : isMe
                    ? 'rgba(255,223,0,0.1)'
                    : 'rgba(255,255,255,0.05)',
                  color: acertou
                    ? '#4ade80'
                    : isMe
                    ? '#FFDF00'
                    : 'rgba(255,255,255,0.7)',
                  border: acertou ? '1px solid rgba(74,222,128,0.4)' : '1px solid transparent',
                }}
              >
                {p.palpite_a} x {p.palpite_b}
                {acertou && ' ✅'}
              </span>
            ) : (
              <span className="text-white/20 text-xs">—</span>
            )}
          </td>
        );
      })}
    </tr>
  );
}
