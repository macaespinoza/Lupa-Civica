'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { mockProjects, mockLegislators } from '@/lib/mockData';
import { Check, X, ArrowRight, RotateCcw, Award, Gavel } from 'lucide-react';
import { LegislatorCard } from '@/components/legislator-card';
import { Legislator } from '@/lib/types';

export default function MatchPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userVotes, setUserVotes] = useState<{ [projectId: string]: string }>({});
  const [showResults, setShowResults] = useState(false);

  const currentProject = mockProjects[currentIndex];

  const handleVote = (vote: 'Yes' | 'No') => {
    setUserVotes({ ...userVotes, [currentProject.id]: vote });
    if (currentIndex < mockProjects.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setShowResults(true);
    }
  };

  const calculateMatch = (legislator: Legislator) => {
    // In a real app, we'd fetch actual votes. For mock, we'll randomize or use a simple logic.
    // Let's simulate: higher efficiency score legislators "vote like the user" more often for the demo.
    let matches = 0;
    Object.keys(userVotes).forEach(pid => {
      // Fake logic: if legislator ID parity matches user vote
      const legVote = (parseInt(legislator.id.slice(1)) + parseInt(pid.slice(1))) % 2 === 0 ? 'Yes' : 'No';
      if (userVotes[pid] === legVote) matches++;
    });
    return Math.round((matches / mockProjects.length) * 100);
  };

  const matchedLegislators = mockLegislators
    .map(l => ({ ...l, matchPercentage: calculateMatch(l) }))
    .sort((a, b) => b.matchPercentage - a.matchPercentage);

  if (showResults) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-24">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center mb-16"
        >
          <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
            <Award className="w-10 h-10" />
          </div>
          <h1 className="font-serif text-6xl mb-4">Tu Match <span className="italic">Legislativo</span></h1>
          <p className="text-[#1a1a1a]/60 text-lg">Estos son los parlamentarios que más coinciden con tu visión de país.</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {matchedLegislators.slice(0, 2).map((l, i) => (
            <div key={l.id} className="relative">
              <div className="absolute -top-4 -right-4 z-20 bg-emerald-500 text-white px-4 py-2 rounded-full font-display font-bold text-lg shadow-lg">
                {l.matchPercentage}% Afinidid
              </div>
              <LegislatorCard legislator={l} />
            </div>
          ))}
        </div>

        <div className="flex justify-center">
          <button 
            onClick={() => {
              setCurrentIndex(0);
              setUserVotes({});
              setShowResults(false);
            }}
            className="flex items-center gap-2 font-display font-bold uppercase tracking-widest text-[#1a1a1a]/50 hover:text-[#c1121f] transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> Reiniciar Test
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-24 min-h-[80vh] flex flex-col justify-center">
      <div className="mb-12 flex justify-between items-end">
        <div>
          <span className="font-display text-[10px] uppercase font-bold tracking-[0.4em] text-[#c1121f] mb-2 block">
            Pregunta {currentIndex + 1} de {mockProjects.length}
          </span>
          <h2 className="font-serif text-4xl leading-tight">¿Cómo habrías votado tú?</h2>
        </div>
        <div className="flex gap-1">
          {mockProjects.map((_, i) => (
            <div 
              key={i} 
              className={`h-1 w-8 rounded-full transition-all duration-500 ${i <= currentIndex ? 'bg-[#c1121f]' : 'bg-[#1a1a1a]/10'}`} 
            />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentProject.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-white border border-[#1a1a1a]/10 p-10 rounded-[32px] shadow-sm relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
            <Gavel className="w-32 h-32" />
          </div>
          
          <span className="bg-[#1a1a1a]/5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/60 mb-6 inline-block">
            {currentProject.bulletinNumber}
          </span>
          <h3 className="font-display font-bold text-2xl mb-6 leading-tight uppercase tracking-tight">
            {currentProject.title}
          </h3>
          <p className="text-[#1a1a1a]/70 text-lg leading-relaxed mb-12">
            {currentProject.summary}
          </p>

          <div className="grid grid-cols-2 gap-6">
            <button 
              onClick={() => handleVote('Yes')}
              className="group bg-emerald-50 border border-emerald-200 text-emerald-700 py-6 rounded-2xl flex flex-col items-center gap-3 hover:bg-emerald-500 hover:text-white transition-all shadow-sm hover:shadow-emerald-200"
            >
              <Check className="w-8 h-8 group-hover:scale-110 transition-transform" />
              <span className="font-display font-bold uppercase tracking-widest text-xs">A Favor</span>
            </button>
            <button 
              onClick={() => handleVote('No')}
              className="group bg-red-50 border border-red-200 text-red-700 py-6 rounded-2xl flex flex-col items-center gap-3 hover:bg-red-500 hover:text-white transition-all shadow-sm hover:shadow-red-200"
            >
              <X className="w-8 h-8 group-hover:scale-110 transition-transform" />
              <span className="font-display font-bold uppercase tracking-widest text-xs">En Contra</span>
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
      
      <p className="text-center mt-12 text-[#1a1a1a]/30 text-xs font-medium uppercase tracking-widest">
        Tus respuestas son anónimas (Ley 19.628)
      </p>
    </div>
  );
}
