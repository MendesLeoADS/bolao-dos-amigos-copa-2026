'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { loginAction } from '@/app/actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-base font-bold rounded-xl text-white shadow-lg transition-all duration-200 disabled:opacity-60"
      style={{ background: 'linear-gradient(135deg, #009c3b 0%, #007a2f 100%)' }}
    >
      <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-xl">
        {pending ? '⏳' : '⚽'}
      </span>
      {pending ? 'Entrando...' : 'Entrar no Bolão'}
    </button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useFormState(loginAction, null);

  return (
    <div
      className="min-h-screen flex items-center justify-center py-12 px-4"
      style={{
        background: 'linear-gradient(160deg, #002776 0%, #003d99 40%, #009c3b 100%)',
      }}
    >
      {/* Decorative circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-10" style={{ background: '#FFDF00' }} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-10" style={{ background: '#FFDF00' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5 border-4" style={{ borderColor: '#FFDF00' }} />
      </div>

      <div className="relative max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-7xl mb-4 drop-shadow-lg">🇧🇷</div>
          <h1 className="text-4xl font-black text-white drop-shadow-lg tracking-tight">
            Bolão da Copa
          </h1>
          <p className="text-2xl font-black mt-1 drop-shadow" style={{ color: '#FFDF00' }}>
            2026 🏆
          </p>
          <p className="text-blue-100 mt-3 font-medium">
            Entre e dê seus palpites
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 shadow-2xl">
          <form className="space-y-5" action={formAction}>
            <div>
              <label htmlFor="username" className="block text-sm font-bold text-blue-100 mb-2 uppercase tracking-wider">
                Usuário
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                autoComplete="username"
                className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-xl text-white placeholder-blue-200 font-medium focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                style={{ '--tw-ring-color': '#FFDF00' } as any}
                placeholder="léo, murilo ou ian"
              />
            </div>

            <div>
              <label htmlFor="senha" className="block text-sm font-bold text-blue-100 mb-2 uppercase tracking-wider">
                Senha
              </label>
              <input
                id="senha"
                name="senha"
                type="password"
                required
                autoComplete="current-password"
                className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-xl text-white placeholder-blue-200 font-medium focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                placeholder="••••••••"
              />
            </div>

            {state?.error && (
              <div className="flex items-center gap-2 bg-red-500/20 border border-red-400/30 text-red-100 px-4 py-3 rounded-xl text-sm font-medium">
                <span>⚠️</span>
                <span>{state.error}</span>
              </div>
            )}

            <div className="pt-2">
              <SubmitButton />
            </div>
          </form>

          <div className="mt-6 pt-5 border-t border-white/10 text-center">
            <p className="text-sm font-black text-yellow-300 tracking-wide">
              🍔 SE PERDER, PAGA A BUSGER Hein!?
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
