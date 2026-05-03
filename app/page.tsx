'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { Search, BarChart3, Users, Mail, Gavel, Globe, ChevronRight, Loader2, LogOut } from 'lucide-react';
import { useLegislators } from '@/hooks/use-legislators';
import { useAuth } from '@/hooks/use-auth';
import { LegislatorCard } from '@/components/legislator-card';
import { AccessibilityToggle } from '@/components/accessibility-toggle';
import { LoginModal } from '@/components/login-modal';

export default function LandingPage() {
  const { legislators, loading } = useLegislators();
  const { user, signOut } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  return (
    <div className="flex flex-col min-h-screen bg-forum-white">
      {/* Skip to Content for screen readers */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-civic-teal text-white px-4 py-2 z-[100] font-bold"
      >
        Saltar al contenido principal
      </a>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-deep-civic border-b border-mist-grey/20" role="navigation">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-civic-teal rounded-sm" aria-hidden="true"></div>
            <span className="font-display font-bold text-lg tracking-tighter text-white uppercase">
              Lupa <span className="text-forum-periwinkle">Cívica</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-6 font-display text-[10px] font-bold uppercase tracking-[0.2em] text-mist-grey">
            <Link href="/legislators" className="hover:text-white transition-colors">Parlamentarios</Link>
            <Link href="/projects" className="hover:text-white transition-colors">Tramitación</Link>
            <Link href="/match" className="hover:text-white transition-colors text-civic-gold">Match Legislativo ★</Link>
          </div>
          <div className="flex items-center gap-4">
            <AccessibilityToggle />
            {user ? (
              <div className="flex items-center gap-3">
                <Link href="/admin" className="text-[10px] font-bold text-white/80 hover:text-white uppercase tracking-widest transition-colors">
                  Admin
                </Link>
                <button 
                  onClick={() => signOut()}
                  className="flex items-center gap-2 bg-deep-civic/40 border border-mist-grey/20 text-white px-4 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest hover:bg-civic-teal transition-colors"
                >
                  <LogOut className="w-3 h-3" />
                  Salir
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setShowLoginModal(true)}
                className="bg-deep-civic/40 border border-mist-grey/20 text-white px-4 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest hover:bg-civic-teal transition-colors"
              >
                Acceso
              </button>
            )}
          </div>
        </div>
      </nav>

      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />

      <main id="main-content">
        {/* Hero Section */}
        <section className="relative h-[70vh] flex items-center overflow-hidden border-b border-mist-grey" aria-labelledby="hero-title">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(#d4cfc8_1px,transparent_1px)] [background-size:24px_24px] opacity-20" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full grid md:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block px-3 py-1 bg-civic-teal text-white text-[10px] font-bold uppercase tracking-[0.3em] mb-6 rounded-sm">
              Fiscalización Ciudadana CL
            </span>
            <h1 className="font-serif text-6xl md:text-8xl leading-none tracking-tighter mb-8 text-deep-civic">
              Datos que <span className="italic block mt-2 text-forum-periwinkle">Auditan</span>
            </h1>
            <p className="font-sans text-lg text-slate-shadow max-w-md mb-10 leading-relaxed">
              Plataforma ciudadana para el control de asistencia, probidad y votaciones del Congreso Nacional.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/legislators">
                <button className="bg-action-amber text-white px-8 py-4 rounded text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-deep-civic transition-all shadow-lg">
                  Explorar Rankings
                </button>
              </Link>
              <Link href="/metodologia">
                <button className="bg-white border border-mist-grey text-deep-civic px-8 py-4 rounded text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-pale-stone transition-all">
                  Nuestra Metodología
                </button>
              </Link>
            </div>
          </motion.div>
          
          <div className="hidden md:block relative">
            <div className="bg-deep-civic p-8 rounded-sm shadow-2xl border border-mist-grey/10">
              <div className="flex justify-between items-center mb-6">
                 <p className="text-[10px] font-bold text-mist-grey uppercase tracking-widest">Dashboard Global</p>
                 <div className="w-2 h-2 rounded-full bg-civic-gold animate-pulse"></div>
              </div>
              <div className="space-y-6">
                <div className="border-l-2 border-action-amber pl-4">
                  <p className="text-[10px] text-mist-grey uppercase">Probidad Nacional</p>
                  <p className="text-4xl font-serif italic font-bold text-white">74.2 <span className="text-sm text-mist-grey">/ 100</span></p>
                </div>
                <div className="border-l-2 border-forum-periwinkle pl-4">
                  <p className="text-[10px] text-mist-grey uppercase">Asistencia Promedio</p>
                  <p className="text-4xl font-serif italic font-bold text-white">92.0%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-deep-civic text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                icon: <BarChart3 className="w-8 h-8" />,
                title: "Índice de Probidad",
                desc: "Algoritmo neutral que evalúa la eficiencia parlamentaria basado en leyes vigentes."
              },
              {
                icon: <Globe className="w-8 h-8" />,
                title: "Mapa del Lobby",
                desc: "Visualiza conexiones entre empresas, viajes y donativos recibidos por tus representantes."
              },
              {
                icon: <Users className="w-8 h-8" />,
                title: "Match Ciudadano",
                desc: "Cruza tus posturas con las votaciones reales en sala para encontrar afinidad ideológica."
              }
            ].map((f, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.2 }}
                className="group"
              >
                <div className="mb-6 p-4 border border-white/20 inline-block group-hover:bg-civic-teal group-hover:border-civic-teal transition-colors">
                  {f.icon}
                </div>
                <h3 className="font-display font-bold text-xl uppercase tracking-tighter mb-4 text-forum-white">{f.title}</h3>
                <p className="text-mist-grey font-sans leading-relaxed">
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Rankings Preview */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
          <div>
            <span className="text-civic-teal text-[10px] font-bold uppercase tracking-[0.4em] mb-4 block underline underline-offset-4 decoration-civic-gold">Auditoría en Tiempo Real</span>
            <h2 className="font-serif text-5xl md:text-6xl tracking-tight text-deep-civic leading-none">
              Líderes en <span className="italic text-forum-periwinkle">Desempeño</span>
            </h2>
          </div>
          <Link href="/legislators">
            <button className="px-6 py-3 border-b-2 border-deep-civic group flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest hover:text-civic-teal hover:border-civic-teal transition-all font-sans">
              Ver Ranking Completo <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? (
            <div className="col-span-4 text-center py-12">
              <Loader2 className="w-6 h-6 text-civic-teal animate-spin mx-auto mb-2" />
              <p className="text-mist-grey text-xs uppercase tracking-widest">Cargando...</p>
            </div>
          ) : (
            legislators.slice(0, 4).map((l) => (
              <LegislatorCard key={l.id} legislator={l} />
            ))
          )}
        </div>
      </section>

      <footer className="py-12 border-t border-mist-grey/20 bg-deep-civic text-mist-grey">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-civic-teal rounded-sm"></div>
            <span className="font-display font-bold uppercase tracking-tighter text-white">Lupa Cívica</span>
            <span className="text-[10px] uppercase font-mono">© 2026 • v2.0 Civic System</span>
          </div>
          <div className="flex gap-8 text-[10px] font-bold uppercase tracking-[0.2em]">
            <Link href="/metodologia" className="hover:text-white transition-colors">Metodología</Link>
            <Link href="/datos-abiertos" className="hover:text-white transition-colors">Datos Abiertos</Link>
            <Link href="/privacidad" className="hover:text-white transition-colors">Privacidad</Link>
          </div>
        </div>
      </footer>
    </main>
    </div>
  );
}
