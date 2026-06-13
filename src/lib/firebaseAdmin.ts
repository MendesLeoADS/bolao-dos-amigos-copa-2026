import * as admin from 'firebase-admin';

let firestoreDb: any = null;
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Resolve escapes in private key string
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
    firestoreDb = admin.firestore();
  } catch (error: any) {
    console.error('Firebase admin initialization error:', error.message);
  }
} else {
  firestoreDb = admin.firestore();
}

export const adminDb = firestoreDb as admin.firestore.Firestore;
