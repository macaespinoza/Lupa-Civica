'use client';

import React from 'react';
import { Gavel, Shield, Scale, Info, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function MetodologiaPage() {
  const formulas = [
    {
      title: "Asistencia (Base)",
      formula: "Puntaje Base = 100",
      penalty: "Cada inasistencia injustificada reduce -2 puntos.",
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />
    },
    {
      title: "Probidad (Ley 20.880)",
      formula: "Multas UTM",
      penalty: "Descuento proporcional a multas (5 a 50 UTM) por declaraciones inexactas.",
      icon: <Shield className="w-5 h-5 text-blue-500" />
    },
    {
      title: "Lobby (Ley 20.730)",
      formula: "Transparencia Activa",
      penalty: "Penalización de -5 puntos por omisiones en registro de audiencias o viajes.",
      icon: <Scale className="w-5 h-5 text-amber-500" />
    }
  ];

  return (
    <div className="max-w-5xl mx-auto px-6 py-24">
      <header className="mb-20 text-center">
        <div className="inline-block p-4 rounded-full bg-[#c1121f]/5 mb-6 text-[#c1121f]">
          <Info className="w-8 h-8" />
        </div>
        <h1 className="font-serif text-6xl mb-6">Metodología <span className="italic">y Algoritmo</span></h1>
        <p className="text-[#1a1a1a]/60 text-xl max-w-2xl mx-auto">
          Transparencia y Explicabilidad: Siguiendo la Política Nacional de IA, 
          exponemos la trazabilidad matemática detrás de cada puntaje.
        </p>
      </header>

      <div className="grid md:grid-cols-3 gap-8 mb-20">
        {formulas.map((f, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-8 rounded-3xl border border-[#1a1a1a]/10 shadow-sm"
          >
            <div className="mb-6">{f.icon}</div>
            <h3 className="font-display font-bold text-lg uppercase tracking-tight mb-4">{f.title}</h3>
            <div className="font-mono text-xs bg-[#1a1a1a]/5 p-3 rounded mb-4 text-[#1a1a1a]/60">
              {f.formula}
            </div>
            <p className="text-sm text-[#1a1a1a]/70 leading-relaxed italic">
              {f.penalty}
            </p>
          </motion.div>
        ))}
      </div>

      <section className="bg-[#1a1a1a] text-white p-12 rounded-[40px] shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="font-serif text-4xl mb-8">Compromiso Ético <span className="italic text-[#c1121f]">Ley 19.628</span></h2>
          <div className="space-y-6 text-white/70 max-w-3xl">
            <p>
              Toda la información procesada por este sistema proviene de fuentes públicas oficiales bajo la 
              <strong> Ley 20.285 sobre Acceso a la Información Pública</strong>.
            </p>
            <p>
              Respetamos la privacidad de nuestros usuarios: no almacenamos ideologías políticas, 
              creencias o datos sensibles. El &quot;Match Legislativo&quot; es un proceso local y anónimo.
            </p>
            <div className="pt-6 border-t border-white/10 flex gap-4">
              <div className="w-2 h-2 rounded-full bg-[#c1121f] animate-pulse" />
              <span className="text-xs font-mono tracking-widest uppercase">Sistema de Datos Abiertos V1.0</span>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <Gavel className="w-64 h-64" />
        </div>
      </section>
    </div>
  );
}
