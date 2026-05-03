'use client';

import React, { useState, useMemo } from 'react';
import { LegislatorCard } from '@/components/legislator-card';
import { useLegislators } from '@/hooks/use-legislators';
import { Search, Filter, SortDesc, SortAsc, MapPin, Users, Info, ChevronDown, Award, AlertTriangle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';

export default function LegislatorsPage() {
  const { legislators, loading, error } = useLegislators();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterRegion, setFilterRegion] = useState('All');
  const [filterCoalition, setFilterCoalition] = useState('All');
  const [filterGender, setFilterGender] = useState('All');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [showFilters, setShowFilters] = useState(false);

  const regions = useMemo(() => ['All', ...Array.from(new Set(legislators.map(l => l.region)))], [legislators]);
  const coalitions = useMemo(() => ['All', ...Array.from(new Set(legislators.map(l => l.coalition || 'Sin Alianza')))], [legislators]);

  const filteredLegislators = useMemo(() => {
    return legislators
      .filter(l => {
        const matchesSearch = l.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             l.party.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'All' || l.type === filterType;
        const matchesRegion = filterRegion === 'All' || l.region === filterRegion;
        const matchesCoalition = filterCoalition === 'All' || (l.coalition || 'Sin Alianza') === filterCoalition;
        const matchesGender = filterGender === 'All' || l.gender === filterGender;
        
        return matchesSearch && matchesType && matchesRegion && matchesCoalition && matchesGender;
      })
      .sort((a, b) => {
        return sortOrder === 'desc' 
          ? b.efficiencyScore - a.efficiencyScore 
          : a.efficiencyScore - b.efficiencyScore;
      });
  }, [legislators, searchTerm, filterType, filterRegion, filterCoalition, filterGender, sortOrder]);

  const topThree = useMemo(() => [...legislators].sort((a, b) => b.efficiencyScore - a.efficiencyScore).slice(0, 3), [legislators]);
  const bottomThree = useMemo(() => [...legislators].sort((a, b) => a.efficiencyScore - b.efficiencyScore).slice(0, 3), [legislators]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-32 text-center">
        <Loader2 className="w-8 h-8 text-civic-teal animate-spin mx-auto mb-4" />
        <p className="text-mist-grey text-sm uppercase tracking-widest">Cargando legisladores...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {error && (
        <div className="mb-6 p-4 bg-action-amber/10 border border-action-amber/30 rounded-sm">
          <p className="text-action-amber text-xs font-bold uppercase tracking-widest">{error}</p>
        </div>
      )}

      {/* Ranking Panel / Summary */}
      <section className="mb-16 grid md:grid-cols-2 gap-8">
        <div className="bg-white border border-mist-grey p-8 rounded-sm shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Award className="w-5 h-5 text-civic-teal" />
            <h2 className="font-display font-bold text-sm uppercase tracking-widest text-deep-civic">Top 3 Eficiencia</h2>
          </div>
          <div className="space-y-4">
            {topThree.map((l, i) => (
              <div key={l.id} className="flex items-center justify-between p-3 bg-pale-stone/50 hover:bg-pale-stone transition-colors border border-transparent hover:border-mist-grey">
                <div className="flex items-center gap-4">
                  <span className="font-mono text-xs font-bold text-civic-teal">#{i+1}</span>
                  <div>
                    <p className="text-xs font-bold text-deep-civic leading-none mb-1">{l.name}</p>
                    <p className="text-[10px] text-slate-shadow uppercase">{l.party}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-civic-teal">{l.efficiencyScore.toFixed(1)}</p>
                  <p className="text-[8px] text-mist-grey uppercase">Score</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-mist-grey p-8 rounded-sm shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="w-5 h-5 text-action-amber" />
            <h2 className="font-display font-bold text-sm uppercase tracking-widest text-deep-civic">Menor Desempeño</h2>
          </div>
          <div className="space-y-4">
            {bottomThree.map((l, i) => (
              <div key={l.id} className="flex items-center justify-between p-3 bg-pale-stone/50 hover:bg-pale-stone transition-colors border border-transparent hover:border-mist-grey">
                <div className="flex items-center gap-4">
                  <span className="font-mono text-xs font-bold text-action-amber">#{legislators.length - i}</span>
                  <div>
                    <p className="text-xs font-bold text-deep-civic leading-none mb-1">{l.name}</p>
                    <p className="text-[10px] text-slate-shadow uppercase">{l.party}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-action-amber">{l.efficiencyScore.toFixed(1)}</p>
                  <p className="text-[8px] text-mist-grey uppercase">Score</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Header & Main Search */}
      <header className="mb-12 border-b border-mist-grey pb-12">
        <div className="flex flex-col md:flex-row justify-between items-end gap-12 mb-10">
          <div className="max-w-xl">
            <span className="text-civic-teal font-display text-[10px] font-bold uppercase tracking-[0.4em] mb-4 block underline underline-offset-4 decoration-civic-gold">
              Auditoría Ciudadana 2026
            </span>
            <h1 className="font-serif text-6xl md:text-7xl leading-none mb-6 text-deep-civic">
              Directorio <span className="italic text-forum-periwinkle">Nacional</span>
            </h1>
            <p className="text-slate-shadow font-sans text-base leading-relaxed border-l border-mist-grey/50 pl-6">
              Buscador avanzado de representantes. Filtra por distrito, región o pacto político para encontrar datos sobre asistencia y probidad.
            </p>
          </div>

          <div className="w-full md:w-96">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-mist-grey group-focus-within:text-civic-teal transition-colors" />
              <input 
                type="text"
                placeholder="Nombre o partido..."
                className="w-full bg-white border border-mist-grey rounded-sm px-12 py-4 text-sm focus:outline-none focus:ring-1 focus:ring-civic-teal transition-all shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Filters Toggle & Sort */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-3 px-6 py-2.5 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-all ${
                showFilters ? 'bg-deep-civic text-white' : 'bg-pale-stone text-deep-civic hover:bg-mist-grey/20'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              {showFilters ? 'Ocultar Filtros' : 'Más Filtros'}
            </button>

            <div className="flex gap-1 p-1 bg-pale-stone rounded-sm border border-mist-grey/30">
              {['All', 'Senator', 'Deputy'].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-4 py-1.5 rounded-sm text-[9px] font-bold uppercase tracking-widest transition-all ${
                    filterType === type ? 'bg-deep-civic text-white shadow-sm' : 'text-slate-shadow hover:text-deep-civic'
                  }`}
                >
                  {type === 'All' ? 'Todos' : type === 'Senator' ? 'Senado' : 'Cámara'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
             <span className="text-[10px] font-bold text-mist-grey uppercase tracking-widest">Ordenar por Puntaje:</span>
             <button 
               onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
               className="p-2.5 bg-white border border-mist-grey text-deep-civic hover:bg-pale-stone transition-colors"
               title={sortOrder === 'desc' ? 'Mayor a Menor' : 'Menor a Mayor'}
             >
               {sortOrder === 'desc' ? <SortDesc className="w-4 h-4 text-civic-teal" /> : <SortAsc className="w-4 h-4 text-action-amber" />}
             </button>
          </div>
        </div>

        {/* Expandable Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="grid md:grid-cols-3 gap-6 pt-8">
                <div>
                  <label className="block text-[10px] font-bold text-mist-grey uppercase tracking-widest mb-3">Región</label>
                  <select 
                    value={filterRegion}
                    onChange={(e) => setFilterRegion(e.target.value)}
                    className="w-full bg-white border border-mist-grey px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-civic-teal transition-all cursor-pointer"
                  >
                    {regions.map(r => (
                      <option key={r} value={r}>{r === 'All' ? 'Todas las Regiones' : r}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-mist-grey uppercase tracking-widest mb-3">Alianza / Pacto</label>
                  <select 
                    value={filterCoalition}
                    onChange={(e) => setFilterCoalition(e.target.value)}
                    className="w-full bg-white border border-mist-grey px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-civic-teal transition-all cursor-pointer"
                  >
                    {coalitions.map(c => (
                      <option key={c} value={c}>{c === 'All' ? 'Todas las Alianzas' : c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-mist-grey uppercase tracking-widest mb-3">Género</label>
                  <div className="flex gap-1 p-1 bg-pale-stone rounded-sm border border-mist-grey/30">
                    {['All', 'M', 'F'].map((g) => (
                      <button
                        key={g}
                        onClick={() => setFilterGender(g)}
                        className={`flex-1 py-2 rounded-sm text-[9px] font-bold uppercase tracking-widest transition-all ${
                          filterGender === g ? 'bg-deep-civic text-white shadow-sm' : 'text-slate-shadow hover:text-deep-civic'
                        }`}
                      >
                        {g === 'All' ? 'Ambos' : g === 'M' ? 'Hombres' : 'Mujeres'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Grid */}
      {filteredLegislators.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredLegislators.map((l, index) => (
            <motion.div
              key={l.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              layout
              className="relative"
            >
              <div className="absolute top-2 left-2 z-20 w-7 h-7 bg-white text-deep-civic rounded-sm flex items-center justify-center font-mono text-[10px] font-bold shadow-md border border-mist-grey">
                {String(index + 1).padStart(2, '0')}
              </div>
              <LegislatorCard legislator={l} />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="py-32 text-center border-t border-mist-grey/20 mt-12 bg-pale-stone/30">
          <div className="w-16 h-16 bg-deep-civic/5 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search className="w-8 h-8 text-mist-grey" />
          </div>
          <h3 className="font-display font-bold text-xl text-deep-civic uppercase tracking-widest mb-2">Sin Resultados</h3>
          <p className="text-xs text-mist-grey uppercase tracking-widest">Intenta ajustando los filtros de búsqueda</p>
          <button 
            onClick={() => {
              setSearchTerm('');
              setFilterType('All');
              setFilterRegion('All');
              setFilterCoalition('All');
              setFilterGender('All');
            }}
            className="mt-8 text-[10px] font-bold text-civic-teal uppercase tracking-widest underline underline-offset-4 decoration-civic-gold"
          >
            Limpiar todos los filtros
          </button>
        </div>
      )}
    </div>
  );
}
