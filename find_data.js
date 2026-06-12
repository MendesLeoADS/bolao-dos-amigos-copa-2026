const admin = require('firebase-admin');
const dotenv = require('dotenv');

// Carrega variáveis do .env.local
dotenv.config({ path: '.env.local' });

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
});

const db = admin.firestore();

async function run() {
  try {
    const jogosSnapshot = await db.collection('jogos').get();
    const jogos = [];
    jogosSnapshot.forEach(doc => jogos.push({ id: doc.id, ...doc.data() }));

    console.log("Jogos:");
    jogos.forEach(j => {
      if (
        j.time_a.toLowerCase().includes('canad') || 
        j.time_b.toLowerCase().includes('canad') || 
        j.time_a.toLowerCase().includes('corei') || 
        j.time_b.toLowerCase().includes('corei') ||
        j.time_a.toLowerCase().includes('bosnia') ||
        j.time_b.toLowerCase().includes('bosnia')
      ) {
        console.log(`[${j.id}] ${j.time_a} x ${j.time_b} - ${j.data_hora} - Placar: ${j.placar_a}x${j.placar_b} - Status: ${j.status}`);
      }
    });

    const usuariosSnapshot = await db.collection('usuarios').get();
    console.log("\nUsuários:");
    usuariosSnapshot.forEach(doc => {
        console.log(`[${doc.id}] ${doc.data().username || doc.data().nome}`);
    });

  } catch (error) {
    console.error(error);
  }
}

run();
