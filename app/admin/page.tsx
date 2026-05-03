
'use client';

import React, { useState } from 'react';
import { scrapeAndSyncLegislators } from '@/lib/sync-service';
import { Database, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function AdminPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [log, setLog] = useState<string[]>([]);

  const handleSync = async () => {
    setStatus('loading');
    setLog(['Iniciando conexión con BCN.cl...', 'Analizando perfiles en ejercicio...']);
    
    try {
      setLog(prev => [...prev, 'Conectando con la Biblioteca del Congreso Nacional...']);
      const result = await scrapeAndSyncLegislators();
      setStatus('success');
      setLog(prev => [
        ...prev, 
        `Sincronización parcial completada: ${result.processed.length} parlamentarios actualizados.`,
        'Imágenes y reseñas biográficas vinculadas exitosamente.'
      ]);
    } catch (error: any) {
      console.error(error);
      setStatus('error');
      const errorMsg = error?.message?.includes('Unexpected response') 
        ? 'Tiempo de espera agotado. BCN.cl está tardando demasiado en responder.'
        : 'Error de conexión con la base de datos o el servicio de scraping.';
      setLog(prev => [...prev, `ERROR: ${errorMsg}`]);
    }
  };

  const handleSeedRealData = async () => {
    setStatus('loading');
    setLog(['Cargando registros validados desde OCR...', 'Preparando inserción masiva...']);
    try {
      // We will perform the seed logic here or call a server action
      // For simplicity and to reuse sync-service logic, we'll implement it in a separate function in lib/sync-service.ts
      const { seedRealData } = await import('@/lib/sync-service');
      const result = await seedRealData();
      setStatus('success');
      setLog(prev => [...prev, `Sembrado completado: ${result.count} perfiles reales cargados.`, 'Géneros y títulos (Diputado/a, Senador/a) asignados según normativa.']);
    } catch (error: any) {
      console.error(error);
      setStatus('error');
      setLog(prev => [...prev, `ERROR: ${error?.message || 'Fallo en la carga de datos maestros.'}`]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-20 bg-forum-white min-h-screen">
      <div className="bg-forum-white border border-mist-grey rounded-sm shadow-xl overflow-hidden">
        <div className="bg-deep-civic p-8 text-white">
          <div className="flex items-center gap-3 mb-2">
            <Database className="w-6 h-6 text-civic-teal" />
            <h1 className="text-xl font-bold uppercase tracking-widest">Panel de Control de Datos</h1>
          </div>
          <p className="text-mist-grey text-xs uppercase tracking-widest">Lupa Ciudadana • Sistema de Auditoría de Datos</p>
        </div>

        <div className="p-10 space-y-8">
          <div className="grid md:grid-cols-2 gap-8 items-start">
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-deep-civic mb-2">Sincronización con BCN</h2>
                <p className="text-sm text-slate-shadow mb-4 leading-relaxed">
                  Extrae datos biográficos e imágenes reales desde la Biblioteca del Congreso Nacional.
                </p>
                
                <button 
                  onClick={handleSync}
                  disabled={status === 'loading'}
                  className={`w-full py-4 rounded-sm font-bold text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${
                    status === 'loading' 
                      ? 'bg-pale-stone text-mist-grey cursor-not-allowed' 
                      : 'bg-action-amber text-white hover:bg-civic-teal shadow-lg'
                  }`}
                >
                  <RefreshCw className={`w-4 h-4 ${status === 'loading' ? 'animate-spin' : ''}`} /> 
                  {status === 'loading' ? 'Sincronizando...' : 'Sincronizar con BCN'}
                </button>
              </div>

              <div className="pt-6 border-t border-mist-grey/30">
                <h2 className="text-lg font-bold text-deep-civic mb-2">Carga de Datos Maestros (OCR)</h2>
                <p className="text-sm text-slate-shadow mb-4 leading-relaxed">
                  Carga la lista oficial de parlamentarios extraída de las fuentes PDF proporcionadas.
                </p>
                
                <button 
                  onClick={handleSeedRealData}
                  disabled={status === 'loading'}
                  className={`w-full py-4 rounded-sm font-bold text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${
                    status === 'loading' 
                      ? 'bg-pale-stone text-mist-grey cursor-not-allowed' 
                      : 'bg-deep-civic text-white hover:bg-civic-teal shadow-lg'
                  }`}
                >
                  <Database className="w-4 h-4" /> 
                  Sembrar Datos Reales
                </button>
              </div>
            </div>

            <div className="bg-pale-stone rounded-sm border border-mist-grey/30 p-6 min-h-[400px]">
              <h3 className="text-[10px] font-bold text-slate-shadow uppercase tracking-widest mb-4">Registro de Actividad</h3>
              <div className="space-y-2 font-mono text-[10px]">
                {log.length === 0 && <p className="text-mist-grey italic">Esperando instrucciones...</p>}
                {log.map((line, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -5 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    key={i} 
                    className="flex gap-2 text-deep-civic"
                  >
                    <span className="text-mist-grey">»</span> {line}
                  </motion.div>
                ))}
                {status === 'success' && (
                  <div className="flex items-center gap-2 text-score-high font-bold mt-4">
                    <CheckCircle2 className="w-3 h-3" /> OPERACIÓN EXITOSA
                  </div>
                )}
                {status === 'error' && (
                  <div className="flex items-center gap-2 text-score-low font-bold mt-4">
                    <AlertCircle className="w-3 h-3" /> FALLO DE SISTEMA
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
