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
      console.log('Datos recibidos de Firestore:', data.length);

      if (data.length > 0) {
        setLegislators(data);
      } else {
        console.warn('Firestore no devolvió documentos para la colección "legislators"');
        setLegislators([]);
      }
    } catch (err) {
      console.error('Error crítico al cargar legisladores:', err);
      setError('No se pudieron cargar los datos reales de la base de datos.');
      setLegislators([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { legislators, loading, error, refetch: fetchData };
}
