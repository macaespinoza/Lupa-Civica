
import { Firestore } from '@google-cloud/firestore';

async function checkData() {
  const db = new Firestore({
    projectId: 'lupa-bdd',
  });
  
  const snapshot = await db.collection('legislators').count().get();
  console.log(`COUNT: ${snapshot.data().count}`);
  
  const sample = await db.collection('legislators').limit(1).get();
  if (!sample.empty) {
    console.log('SAMPLE_ID:', sample.docs[0].id);
    console.log('SAMPLE_DATA:', JSON.stringify(sample.docs[0].data(), null, 2));
  } else {
    console.log('NO_DOCUMENTS_FOUND');
  }
}

checkData().catch(console.error);
