import { cookies } from 'next/headers';

export type UserSession = {
  id: string;
  username: string;
};

export async function setSession(user: UserSession) {
  cookies().set('bolao_session', JSON.stringify(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30, // 30 dias
    path: '/',
  });
}

export async function getSession(): Promise<UserSession | null> {
  const session = cookies().get('bolao_session')?.value;
  if (!session) return null;
  try {
    return JSON.parse(session) as UserSession;
  } catch (e) {
    return null;
  }
}

export async function clearSession() {
  cookies().delete('bolao_session');
}
