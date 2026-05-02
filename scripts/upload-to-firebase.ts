import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore';
import * as fs from 'fs';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

interface ScrapedLegislator {
  id: string;
  name: string;
  type: 'Senator' | 'Deputy';
  title: string;
  gender: 'M' | 'F';
  party: string;
  region: string;
  district: string;
  email: string;
  imageUrl: string;
  bio: string;
  bcnUrl: string;
  updatedAt: string;
  efficiencyScore: number;
  stats: {
    attendanceRate: number;
    unjustifiedAbsences: number;
    probityFinesUTM: number;
    lobbyMeetingsCount: number;
    missedLobbyRegistrations: number;
    votingParticipation: number;
  };
}

async function uploadToFirestore() {
  const data = JSON.parse(fs.readFileSync('./scripts/scraped_data.json', 'utf-8')) as ScrapedLegislator[];
  
  console.log(`Subiendo ${data.length} legisladores a Firestore...`);
  
  const legislatorsRef = collection(db, 'legislators');
  let uploaded = 0;
  let errors = 0;
  
  for (const leg of data) {
    try {
      await setDoc(doc(legislatorsRef, leg.id), leg, { merge: true });
      uploaded++;
      if (uploaded % 20 === 0) {
        console.log(`  Progreso: ${uploaded}/${data.length}`);
      }
    } catch (err) {
      errors++;
      console.error(`  Error con ${leg.name}:`, err);
    }
  }
  
  console.log(`\n✅ Subidos: ${uploaded}, Errores: ${errors}`);
}

uploadToFirestore().catch(console.error);
