'use server';

import { adminDb } from '@/lib/firebaseAdmin';
import { setSession, getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { subMinutes, isBefore } from 'date-fns';

// prevState é necessário pois é chamada via useFormState
export async function loginAction(_prevState: any, formData: FormData) {
  const username = formData.get('username') as string;
  const senha = formData.get('senha') as string;

  if (!username || !senha) {
    return { error: 'Preencha todos os campos.' };
  }

  try {
    const usersRef = adminDb.collection('usuarios');
    const snapshot = await usersRef
      .where('username', '==', username.toLowerCase())
      .where('senha', '==', senha)
      .get();

    if (snapshot.empty) {
      return { error: 'Usuário ou senha inválidos.' };
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    await setSession({ id: userDoc.id, username: userData.username });
  } catch (err: any) {
    return { error: 'Erro ao conectar. Tente novamente.' };
  }

  redirect('/');
}

export async function savePalpiteAction(jogo_id: number, palpite_a: number, palpite_b: number) {
  const session = await getSession();
  if (!session) {
    return { error: 'Não autenticado.' };
  }

  try {
    const jogoRef = adminDb.collection('jogos').doc(String(jogo_id));
    const jogoDoc = await jogoRef.get();

    if (!jogoDoc.exists) {
      return { error: 'Jogo não encontrado.' };
    }

    const jogoData = jogoDoc.data();
    
    // Regra de validação dos 5 minutos no Backend
    if (jogoData?.status !== 'AGENDADO') {
       return { error: 'O jogo já iniciou ou encerrou.' };
    }

    // data_hora pode estar como Timestamp do Firestore ou string ISO. Assumimos string para simplificar
    const dataJogo = new Date(jogoData?.data_hora);
    const dataLimite = subMinutes(dataJogo, 5);

    if (isBefore(dataLimite, new Date())) {
       return { error: 'Tempo esgotado. O palpite só pode ser feito ou alterado até 5 minutos antes do início do jogo.' };
    }

    const palpiteId = `${session.id}_${jogo_id}`;
    
    await adminDb.collection('palpites').doc(palpiteId).set({
      user_id: session.id,
      jogo_id,
      palpite_a,
      palpite_b,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    return { success: true };
  } catch (error: any) {
    return { error: error.message || 'Erro ao salvar palpite.' };
  }
}

