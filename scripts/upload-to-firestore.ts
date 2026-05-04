import { Firestore, FieldValue } from '@google-cloud/firestore';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const projectId = process.env.GOOGLE_CLOUD_PROJECT || 'lupa-bdd';
console.log(`📡 Usando proyecto Firestore: ${projectId}`);

const db = new Firestore({
  projectId,
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

  let batch = db.batch();
  let batchCount = 0;

  for (const leg of data) {
    const docRef = db.collection('legislators').doc(leg.id);
    const legislatorData = {
      ...leg,
      partyId: leg.party.toLowerCase().replace(/[\s\-]+/g, '_').replace(/[^a-z0-9_]/g, ''),
      regionId: leg.region.toLowerCase().replace(/región de /g, '').replace(/[\s\-]+/g, '_'),
      updatedAt: FieldValue.serverTimestamp(),
    };

    batch.set(docRef, legislatorData, { merge: true });
    batchCount++;

    if (batchCount === 20) {
      await batch.commit();
      console.log(`  ✓ Lote de 20 commiteado. Total procesado: ${data.indexOf(leg) + 1}/${data.length}`);
      batchCount = 0;
      batch = db.batch();
    }
  }

  if (batchCount > 0) {
    await batch.commit();
  }

  console.log(`✅ Subidos: ${data.length}`);
}

async function uploadToFirestore() {
  const data = JSON.parse(fs.readFileSync('./scripts/scraped_data.json', 'utf-8')) as ScrapedLegislator[];

  console.log('🚀 Iniciando upload a Firestore (Google Cloud)...');
  console.log(`   Total records: ${data.length}`);

  await uploadLegislators(data);

  console.log('\n✨ Upload completado!');
}

uploadToFirestore().catch(console.error);