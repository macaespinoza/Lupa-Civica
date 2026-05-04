import { Firestore } from '@google-cloud/firestore';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const projectId = process.env.GOOGLE_CLOUD_PROJECT || 'lupa-bdd';
console.log(`📡 Verificando conexión a Firestore en proyecto: ${projectId}`);

const db = new Firestore({
  projectId,
});

async function countLegislators() {
  const snapshot = await db.collection('legislators').count().get();
  console.log(`Total legislators in Firestore: ${snapshot.data().count}`);
  
  // Also list the first 5 to see what's there
  const firstFive = await db.collection('legislators').limit(5).get();
  firstFive.forEach(doc => {
    console.log(` - ${doc.id}: ${doc.data().name}`);
  });
}

countLegislators().catch(console.error);
