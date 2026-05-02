import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore, doc, getDocFromServer } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCHAw38mdBeVyRLRSEIzoPwoi5md_jOC6Y",
  authDomain: "gen-lang-client-0691963058.firebaseapp.com",
  projectId: "gen-lang-client-0691963058",
  storageBucket: "gen-lang-client-0691963058.firebasestorage.app",
  messagingSenderId: "874645869869",
  appId: "1:874645869869:web:85178e358086b71b322fa4"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

export const auth = getAuth(app);

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}

if (typeof window !== 'undefined') {
  testConnection();
}