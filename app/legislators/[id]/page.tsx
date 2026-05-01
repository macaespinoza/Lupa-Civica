'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { mockLegislators } from '@/lib/mockData';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, Calendar, ShieldAlert, Award, FileText, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function LegislatorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const legislator = mockLegislators.find(l => l.id === params.id);

  if (!legislator) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="font-serif text-4xl mb-4">Parlamentario no encontrado</h1>
        <button onClick={() => router.back()} className="text-[#c1121f] font-bold underline">Volver</button>
      </div>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-6 py-16 bg-forum-white min-h-screen" id="main-content">
      <button 
        onClick={() => router.back()}
        className="flex items-center gap-2 text-slate-shadow hover:text-deep-civic font-display font-bold uppercase text-[10px] tracking-widest mb-16 transition-all"
        aria-label="Volver al directorio de parlamentarios"
      >
        <ArrowLeft className="w-3 h-3" aria-hidden="true" /> Volver al Directorio
      </button>

      <div className="grid lg:grid-cols-12 gap-16">
        {/* Left Column: Image & Basic Info */}
        <div className="lg:col-span-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="sticky top-24 space-y-8"
            role="complementary"
            aria-label="Perfil básico"
          >
            <div className="rounded-sm overflow-hidden shadow-2xl border border-mist-grey bg-pale-stone aspect-[3/4]">
              <img 
                src={legislator.imageUrl} 
                alt={`Retrato de ${legislator.name}`}
                className="w-full h-full object-cover grayscale active:grayscale-0 transition-all duration-700"
                referrerPolicy="no-referrer"
              />
            </div>
            
            <div className="bg-forum-white p-8 border border-mist-grey rounded-sm shadow-sm">
              <h1 className="font-serif text-4xl mb-4 text-deep-civic" id="legislator-name">{legislator.name}</h1>
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="bg-civic-teal text-white px-3 py-1 text-[8px] font-bold uppercase tracking-[0.2em] rounded-sm">
                  {legislator.title}
                </span>
                <span className="bg-pale-stone text-slate-shadow px-3 py-1 text-[8px] font-bold uppercase tracking-[0.2em] border border-mist-grey/50 rounded-sm">
                  {legislator.party}
                </span>
              </div>
              <p className="text-slate-shadow text-sm leading-relaxed border-t border-mist-grey/20 pt-6 font-sans">
                {legislator.bio}
              </p>
              
              <div className="mt-8 space-y-3">
                <button className="w-full bg-action-amber text-white py-4 rounded-sm flex items-center justify-center gap-3 font-display font-bold text-[10px] uppercase tracking-widest hover:bg-civic-teal transition-colors">
                  <Mail className="w-4 h-4" /> Enviar Petición Directa
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Detailed Stats */}
        <div className="lg:col-span-8 space-y-12">
          {/* Main Score Board */}
          <section className="bg-forum-white border border-mist-grey p-12 rounded-sm shadow-sm relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row gap-16 items-start md:items-center">
              <div>
                <span className="text-civic-teal font-display text-[9px] font-bold uppercase tracking-[0.5em] mb-4 block underline underline-offset-8 decoration-civic-gold">
                  Auditoría de Desempeño
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-9xl font-serif italic font-bold leading-none text-deep-civic">
                    {Math.round(legislator.efficiencyScore)}
                  </span>
                  <span className="text-xl text-mist-grey font-mono">/100</span>
                </div>
              </div>
              
              <div className="flex-1 grid grid-cols-2 gap-12 border-l border-mist-grey/20 pl-16">
                <div className="space-y-4">
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-shadow mb-2">Asistencia</span>
                    <span className="text-4xl font-mono font-bold text-deep-civic">{legislator.stats.attendanceRate}%</span>
                    <div className="w-full h-1 bg-mist-grey/20 mt-2">
                      <div className="h-full bg-civic-teal" style={{ width: `${legislator.stats.attendanceRate}%` }} />
                    </div>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-shadow mb-2">Votaciones</span>
                    <span className="text-4xl font-mono font-bold text-deep-civic">{legislator.stats.votingParticipation}%</span>
                  </div>
                </div>
                <div className="flex flex-col justify-center">
                  <div className="p-6 bg-pale-stone border border-mist-grey/40 text-center">
                    <span className="text-[10px] font-bold uppercase text-slate-shadow block mb-1">Rendimiento</span>
                    <span className="text-xs font-bold uppercase tracking-widest text-deep-civic">Nivel Nacional N° {Math.floor(legislator.efficiencyScore / 10)}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Metrics Section */}
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-forum-white p-8 border border-mist-grey rounded-sm shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-display font-bold text-xs uppercase tracking-widest text-slate-shadow">Transparencia Lobby</h3>
                <Calendar className="w-4 h-4 text-mist-grey" />
              </div>
              <p className="text-5xl font-serif italic font-bold text-deep-civic">{legislator.stats.lobbyMeetingsCount}</p>
              <p className="text-[10px] font-bold uppercase text-slate-shadow mt-2">Reuniones registradas (Mes)</p>
            </div>
            
            <div className="bg-forum-white p-8 border border-mist-grey rounded-sm shadow-sm border-l-4 border-l-score-low">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-display font-bold text-xs uppercase tracking-widest text-slate-shadow">Alertas Probidad</h3>
                <ShieldAlert className="w-4 h-4 text-score-low" />
              </div>
              <p className="text-5xl font-serif italic font-bold text-score-low">{legislator.stats.probityFinesUTM}</p>
              <p className="text-[10px] font-bold uppercase text-slate-shadow mt-2">UTM Multadas (Ley 20.880)</p>
            </div>
          </div>

          {/* Timeline */}
          <section className="bg-deep-civic text-white p-12 rounded-sm overflow-hidden relative">
            <div className="relative z-10">
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-shadow mb-10 pb-4 border-b border-white/5">
                Bitácora Legislativa
              </h3>
              <div className="space-y-10">
                {[
                  { date: '12 ABR', type: 'VOTO', content: 'Votó a favor del Proyecto de Ley de Protección de Glaciares.' },
                  { date: '10 ABR', type: 'LOBBY', content: 'Reunión con representantes del Gremio Minero del Norte.' },
                  { date: '08 ABR', type: 'SALA', content: 'Inasistencia injustificada a la Comisión de Hacienda.' }
                ].map((act, i) => (
                  <div key={i} className="flex gap-8 group">
                    <div className="w-16 font-mono text-[10px] text-mist-grey font-bold border-r border-white/5 pr-4 flex flex-col justify-center text-right">
                      {act.date}
                    </div>
                    <div>
                      <span className={`text-[8px] font-bold tracking-[0.3em] uppercase mb-2 block ${act.type === 'SALA' ? 'text-score-low' : 'text-forum-periwinkle'}`}>
                        {act.type}
                      </span>
                      <p className="text-sm font-medium leading-relaxed max-w-lg text-forum-white">
                        {act.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
