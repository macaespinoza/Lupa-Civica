'use client';

import React from 'react';
import { Legislator } from '@/lib/types';
import { getScoreGrade } from '@/lib/evaluator';
import { motion } from 'framer-motion';
import { ExternalLink, Award, FileText, Calendar, Mail, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface Props {
  legislator: Legislator;
}

export function LegislatorCard({ legislator }: Props) {
  const grade = getScoreGrade(legislator.efficiencyScore);

  return (
    <motion.div 
      whileHover={{ scale: 1.02 }}
      className="bg-forum-white border border-mist-grey rounded-sm shadow-sm overflow-hidden flex flex-col group h-full"
      role="article"
      aria-label={`Perfil de ${legislator.name}`}
    >
      <div className="relative aspect-[3/4] bg-pale-stone overflow-hidden">
        <img 
          src={legislator.imageUrl} 
          alt={`Retrato oficial de ${legislator.name}`}
          className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
          referrerPolicy="no-referrer"
        />
        <div 
          className={`absolute top-2 right-2 bg-deep-civic text-white px-2 py-3 rounded-sm shadow-lg border-b-2 ${grade.color.replace('text-', 'border-')} flex flex-col items-center min-w-[45px]`}
          aria-label={`Puntaje de desempeño: ${Math.round(legislator.efficiencyScore)} de 100`}
        >
          <span className="text-[8px] text-mist-grey uppercase font-bold tracking-tighter mb-1" aria-hidden="true">Puntaje</span>
          <span className="font-serif italic font-bold text-xl leading-none">{Math.round(legislator.efficiencyScore)}</span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-deep-civic/90 to-transparent">
          <span className="bg-civic-teal text-white px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.2em] rounded-sm mb-2 inline-block">
            {legislator.title.toUpperCase()}
          </span>
          <h3 className="text-white font-display font-bold text-lg leading-tight tracking-tight uppercase group-hover:text-action-amber transition-colors">
            {legislator.name}
          </h3>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <div className="space-y-4 mb-5">
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-deep-civic uppercase tracking-wider">{legislator.partySigla || legislator.party}</span>
              <span className="text-[9px] text-slate-shadow uppercase">{legislator.region}</span>
            </div>
            <span className="text-[9px] bg-pale-stone px-2 py-1 rounded-sm font-mono text-slate-shadow" aria-label={`Distrito o circunscripción: ${legislator.district}`}>{legislator.district}</span>
          </div>
          
          <div className="pt-3 border-t border-mist-grey/20">
             <div className="flex items-center gap-2 text-slate-shadow">
               <Mail className="w-3 h-3 text-forum-periwinkle" aria-hidden="true" />
               <span className="text-[10px] font-mono lowercase truncate" aria-label={`Correo electrónico: ${legislator.email}`}>{legislator.email}</span>
             </div>
          </div>
        </div>

        <div className="mt-auto">
          <Link href={`/legislators/${legislator.id}`} aria-label={`Auditar historial completo de ${legislator.name}`}>
            <button className="w-full bg-action-amber text-white py-3 rounded-sm text-[9px] font-bold uppercase tracking-[0.2em] hover:bg-civic-teal transition-all flex items-center justify-center gap-2">
              Auditar Historial <ChevronRight className="w-3 h-3" aria-hidden="true" />
            </button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
