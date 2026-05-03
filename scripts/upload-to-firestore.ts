import { initializeApp } from 'firebase/app';
import { getFirestore, writeBatch, doc, serverTimestamp } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const firebaseConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'lupa-bdd',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, process.env.NEXT_PUBLIC_FIREBASE_FIRESTORE_DB_ID || '(default)');

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

async function uploadLegislators(data: ScrapedLegislator[]) {
  console.log(`\n👤 Subiendo ${data.length} legisladores a Firestore...`);

  const BATCH_SIZE = 500;
  let batch = writeBatch(db);
  let batchCount = 0;
  let totalCommitted = 0;

  for (const leg of data) {
    const docRef = doc(db, 'legislators', leg.id);
    const legislatorData = {
      ...leg,
      partyId: leg.party.toLowerCase().replace(/[\s\-]+/g, '_').replace(/[^a-z0-9_]/g, ''),
      regionId: leg.region.toLowerCase().replace(/región de /g, '').replace(/[\s\-]+/g, '_'),
      updatedAt: serverTimestamp(),
    };

    batch.set(docRef, legislatorData, { merge: true });
    batchCount++;
    totalCommitted++;

    if (batchCount === BATCH_SIZE) {
      await batch.commit();
      console.log(`  Progreso: ${totalCommitted}/${data.length}`);
      batch = writeBatch(db);
      batchCount = 0;
    }
  }

  if (batchCount > 0) {
    await batch.commit();
  }

  console.log(`✅ Subidos: ${data.length}`);
}

async function uploadToFirestore() {
  const data = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, 'scraped_data.json'), 'utf-8')
  ) as ScrapedLegislator[];

  console.log('🚀 Iniciando upload a Firestore...');
  console.log(`   Project: ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'lupa-bdd'}`);
  console.log(`   Total records: ${data.length}`);

  await uploadLegislators(data);

  console.log('\n✨ Upload completado!');
}

uploadToFirestore().catch(console.error);
