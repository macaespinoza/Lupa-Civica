'use client';

import { useState, useEffect, useCallback } from 'react';
import { Legislator } from '@/lib/types';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface UseLegislatorResult {
  legislator: Legislator | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useLegislator(id: string): UseLegislatorResult {
  const [legislator, setLegislator] = useState<Legislator | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const docRef = doc(db, 'legislators', id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setLegislator({ ...docSnap.data(), id: docSnap.id } as Legislator);
      } else {
        setError('Legislador no encontrado en la base de datos.');
        setLegislator(null);
      }
    } catch (err) {
      console.error('Error fetching legislator:', err);
      setError('No se pudieron cargar los datos del legislador.');
      setLegislator(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { legislator, loading, error, refetch: fetchData };
}