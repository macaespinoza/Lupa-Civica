import { Firestore } from '@google-cloud/firestore';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const db = new Firestore({
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'lupa-bdd',
});

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

  let uploaded = 0;
  let errors = 0;

  for (const leg of data) {
    try {
      const docRef = db.collection('legislators').doc(leg.id);
      const legislatorData = {
        ...leg,
        partyId: leg.party.toLowerCase().replace(/[\s\-]+/g, '_').replace(/[^a-z0-9_]/g, ''),
        regionId: leg.region.toLowerCase().replace(/región de /g, '').replace(/[\s\-]+/g, '_'),
      };

      await docRef.set(legislatorData, { merge: true });
      uploaded++;

      if (uploaded % 20 === 0) {
        console.log(`  Progreso: ${uploaded}/${data.length}`);
      }
    } catch (err) {
      errors++;
      console.error(`  Error en ${leg.id}:`, err instanceof Error ? err.message : err);
    }
  }

  console.log(`\n✅ Subidos: ${uploaded}/${data.length}`);
  if (errors > 0) console.error(`❌ Errores: ${errors}`);
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
