'use client';

import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { Legislator } from '@/lib/types';

export async function fetchLegislatorsFromFirestore(): Promise<Legislator[]> {
  try {
    const ref = collection(db, 'legislators');
    const q = query(ref, orderBy('name'));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return [];

    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
    })) as Legislator[];
  } catch (error) {
    console.error('Error fetching legislators:', error);
    return [];
  }
}
