'use client';

import { useState, useEffect, useCallback } from 'react';
import { Legislator } from '@/lib/types';
import { fetchLegislatorsFromFirestore } from '@/lib/firestore-client';
import { mockLegislators } from '@/lib/mockData';

interface UseLegislatorsResult {
  legislators: Legislator[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useLegislators(): UseLegislatorsResult {
  const [legislators, setLegislators] = useState<Legislator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchLegislatorsFromFirestore();

      if (data.length > 0) {
        setLegislators(data);
      } else {
        // Fallback to mock data if Firestore is empty
        console.warn('Firestore vacío, usando datos mock como fallback');
        setLegislators(mockLegislators);
      }
    } catch (err) {
      console.error('Error al cargar legisladores:', err);
      setError('Error al cargar datos. Usando datos de ejemplo.');
      // Fallback to mock data on error
      setLegislators(mockLegislators);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { legislators, loading, error, refetch: fetchData };
}
