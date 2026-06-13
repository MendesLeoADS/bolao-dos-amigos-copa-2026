import * as admin from 'firebase-admin';

function formatPrivateKey(key?: string) {
  if (!key) return undefined;
  // Remove aspas do começo e fim se o usuário tiver colado com aspas
  let formattedKey = key.replace(/^"|"$/g, '');
  // Dá replace nos \n literais para quebras de linha reais
  return formattedKey.replace(/\\n/g, '\n');
}

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY),
      }),
    });
  } catch (error: any) {
    console.error('Firebase admin initialization error:', error.message);
  }
}

// Proxy para lançar erro descritivo em tempo de execução ao invés de crashar no build
export const adminDb = new Proxy({} as admin.firestore.Firestore, {
  get(target, prop) {
    if (!admin.apps.length) {
      throw new Error('Firebase não foi inicializado. Verifique as variáveis de ambiente na Vercel (FIREBASE_PRIVATE_KEY, etc).');
    }
    const firestore = admin.firestore();
    const value = (firestore as any)[prop];
    return typeof value === 'function' ? value.bind(firestore) : value;
  }
});
