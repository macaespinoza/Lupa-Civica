'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, MapPin, Mail, Users, Calendar, Vote, TrendingUp, TrendingDown, AlertTriangle, Shield, Eye } from 'lucide-react';
import { useLegislator } from '@/hooks/use-legislator';
import { getScoreGrade } from '@/lib/evaluator';
import { cn } from '@/lib/utils';

function BentoSkeleton() {
  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-12 lg:col-span-4">
        <div className="bg-white border border-mist-grey rounded-sm shadow-sm overflow-hidden">
          <div className="aspect-[3/4] bg-pale-stone animate-pulse" />
          <div className="p-6 space-y-4">
            <div className="h-4 bg-pale-stone rounded animate-pulse w-20" />
            <div className="h-6 bg-pale-stone rounded animate-pulse w-48" />
            <div className="h-4 bg-pale-stone rounded animate-pulse w-32" />
          </div>
        </div>
      </div>
      <div className="col-span-12 lg:col-span-8 space-y-6">
        <div className="bg-deep-civic rounded-sm p-6 h-32 animate-pulse" />
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white border border-mist-grey rounded-sm p-6 h-40 animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export default function LegislatorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const { legislator: l, loading, error } = useLegislator(id);

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto px-6 py-12">
        <Link href="/legislators" className="flex items-center gap-2 text-slate-shadow hover:text-deep-civic font-display font-bold uppercase text-[10px] tracking-widest mb-8 transition-all w-fit">
          <ArrowLeft className="w-3 h-3" /> Volver al Directorio
        </Link>
        <BentoSkeleton />
      </main>
    );
  }

  if (error || !l) {
    return (
      <main className="max-w-6xl mx-auto px-6 py-16">
        <Link href="/legislators" className="flex items-center gap-2 text-slate-shadow hover:text-deep-civic font-display font-bold uppercase text-[10px] tracking-widest mb-16 transition-all">
          <ArrowLeft className="w-3 h-3" /> Volver al Directorio
        </Link>
        <div className="text-center py-20">
          <h1 className="font-serif text-4xl mb-4">Legislador no encontrado</h1>
          <p className="text-mist-grey">Este perfil no existe o aún no tenemos datos disponibles.</p>
        </div>
      </main>
    );
  }

  const grade = getScoreGrade(l.efficiencyScore);
  const stats = l.stats;
  const votingSummary = stats.votingSummary || { inFavor: 0, against: 0, abstention: 0, paired: 0, absent: 0 };
  const totalVotes = votingSummary.inFavor + votingSummary.against + votingSummary.abstention + votingSummary.paired + votingSummary.absent;

  return (
    <main className="max-w-7xl mx-auto px-6 py-12" id="main-content">
      <Link href="/legislators" className="flex items-center gap-2 text-slate-shadow hover:text-deep-civic font-display font-bold uppercase text-[10px] tracking-widest mb-8 transition-all w-fit">
        <ArrowLeft className="w-3 h-3" /> Volver al Directorio
      </Link>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-4">
          <div className="bg-white border border-mist-grey rounded-sm shadow-sm overflow-hidden">
            <div className="aspect-[3/4] bg-pale-stone relative overflow-hidden">
              <img
                src={l.imageUrl}
                alt={`Retrato oficial de ${l.name}`}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-4 right-4 bg-deep-civic text-white px-4 py-3 rounded-sm shadow-lg flex flex-col items-center min-w-[60px]">
                <span className="text-[8px] text-mist-grey uppercase font-bold tracking-tighter mb-1">Puntaje</span>
                <span className="font-serif italic font-bold text-3xl leading-none">{Math.round(l.efficiencyScore)}</span>
              </div>
            </div>
            <div className="p-6">
              <span className="bg-civic-teal text-white px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.2em] rounded-sm mb-3 inline-block">
                {l.title}
              </span>
              <h1 className="font-serif text-2xl font-bold text-deep-civic mb-1 leading-tight">{l.name}</h1>
              <p className="text-sm text-slate-shadow mb-6">{l.party}</p>

              <div className="space-y-4 text-xs">
                <div className="flex items-center gap-3 text-slate-shadow">
                  <MapPin className="w-4 h-4 text-forum-periwinkle" />
                  <span>{l.region} · {l.district}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-shadow">
                  <Mail className="w-4 h-4 text-forum-periwinkle" />
                  <a href={`mailto:${l.email}`} className="hover:text-civic-teal transition-colors font-mono text-[10px]">
                    {l.email}
                  </a>
                </div>
                {l.coalition && (
                  <div className="flex items-center gap-3 text-slate-shadow">
                    <Users className="w-4 h-4 text-forum-periwinkle" />
                    <span>{l.coalition}</span>
                  </div>
                )}
              </div>

              {l.bio && (
                <div className="mt-6 pt-6 border-t border-mist-grey/20">
                  <p className="text-xs text-slate-shadow leading-relaxed line-clamp-4">{l.bio}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-8 space-y-6">
          <div className="bg-deep-civic text-white p-6 rounded-sm shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-mist-grey uppercase tracking-widest mb-1">Índice de Eficiencia</p>
                <div className="flex items-baseline gap-2">
                  <span className="font-serif text-5xl font-bold">{Math.round(l.efficiencyScore)}</span>
                  <span className="text-mist-grey text-sm">/100</span>
                </div>
              </div>
              <div className="text-right">
                <span className={cn('text-lg font-bold uppercase tracking-wider', grade.color)}>
                  {grade.label}
                </span>
                <p className="text-[10px] text-mist-grey mt-1">Clasificación</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-mist-grey rounded-sm p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 bg-pale-stone rounded-sm flex items-center justify-center text-civic-teal">
                <Calendar className="w-4 h-4" />
              </div>
              <h2 className="font-display font-bold text-xs uppercase tracking-widest text-deep-civic">
                Asistencia Parlamentaria
              </h2>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-pale-stone/50 rounded-sm">
                <span className="text-3xl font-bold text-civic-teal">{stats.attendanceRate}%</span>
                <p className="text-[10px] text-slate-shadow uppercase tracking-wider mt-1">Asistencia</p>
              </div>
              <div className="text-center p-4 bg-pale-stone/50 rounded-sm">
                <span className={cn(
                  'text-3xl font-bold',
                  stats.unjustifiedAbsences > 5 ? 'text-score-low' : stats.unjustifiedAbsences > 2 ? 'text-score-mid' : 'text-score-high'
                )}>
                  {stats.unjustifiedAbsences}
                </span>
                <p className="text-[10px] text-slate-shadow uppercase tracking-wider mt-1">Injustificadas</p>
              </div>
              <div className="text-center p-4 bg-pale-stone/50 rounded-sm">
                <span className="text-3xl font-bold text-forum-periwinkle">{stats.votingParticipation}%</span>
                <p className="text-[10px] text-slate-shadow uppercase tracking-wider mt-1">Participación</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-mist-grey rounded-sm p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 bg-pale-stone rounded-sm flex items-center justify-center text-civic-teal">
                <Vote className="w-4 h-4" />
              </div>
              <h2 className="font-display font-bold text-xs uppercase tracking-widest text-deep-civic">
                Historial de Votaciones
              </h2>
            </div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] text-slate-shadow uppercase tracking-wider">
                {totalVotes} votaciones registradas
              </span>
              <span className="text-xs font-bold text-civic-teal">
                {stats.votingParticipation}% participación
              </span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              <div className="text-center p-2 bg-living-sage/10 rounded-sm border border-living-sage/20">
                <TrendingUp className="w-4 h-4 text-living-sage mx-auto mb-1" />
                <span className="text-lg font-bold text-living-sage">{votingSummary.inFavor}</span>
                <p className="text-[8px] text-slate-shadow uppercase">A favor</p>
              </div>
              <div className="text-center p-2 bg-score-low/10 rounded-sm border border-score-low/20">
                <TrendingDown className="w-4 h-4 text-score-low mx-auto mb-1" />
                <span className="text-lg font-bold text-score-low">{votingSummary.against}</span>
                <p className="text-[8px] text-slate-shadow uppercase">En contra</p>
              </div>
              <div className="text-center p-2 bg-slate-shadow/10 rounded-sm border border-slate-shadow/20">
                <span className="text-lg font-bold text-slate-shadow">{votingSummary.abstention}</span>
                <p className="text-[8px] text-slate-shadow uppercase">Abstención</p>
              </div>
              <div className="text-center p-2 bg-forum-periwinkle/10 rounded-sm border border-forum-periwinkle/20">
                <Users className="w-4 h-4 text-forum-periwinkle mx-auto mb-1" />
                <span className="text-lg font-bold text-forum-periwinkle">{votingSummary.paired}</span>
                <p className="text-[8px] text-slate-shadow uppercase">Pareos</p>
              </div>
              <div className="text-center p-2 bg-action-amber/10 rounded-sm border border-action-amber/20">
                <AlertTriangle className="w-4 h-4 text-action-amber mx-auto mb-1" />
                <span className="text-lg font-bold text-action-amber">{votingSummary.absent}</span>
                <p className="text-[8px] text-slate-shadow uppercase">Ausentes</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white border border-mist-grey rounded-sm p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 bg-pale-stone rounded-sm flex items-center justify-center text-civic-teal">
                  <Shield className="w-4 h-4" />
                </div>
                <h2 className="font-display font-bold text-xs uppercase tracking-widest text-deep-civic">
                  Probidad · Ley 20.880
                </h2>
              </div>
              <div className="text-center py-4">
                <p className="text-3xl font-bold text-action-amber mb-1">
                  {stats.probityFinesUTM > 0 ? `${stats.probityFinesUTM} UTM` : '0 UTM'}
                </p>
                <p className="text-[10px] text-slate-shadow uppercase tracking-wider">
                  {stats.probityFinesUTM > 0 ? 'Sanciones registradas' : 'Sin sanciones'}
                </p>
              </div>
            </div>

            <div className="bg-white border border-mist-grey rounded-sm p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 bg-pale-stone rounded-sm flex items-center justify-center text-civic-teal">
                  <Eye className="w-4 h-4" />
                </div>
                <h2 className="font-display font-bold text-xs uppercase tracking-widest text-deep-civic">
                  Lobby · Ley 20.730
                </h2>
              </div>
              <div className="text-center py-4">
                <p className="text-3xl font-bold text-forum-periwinkle mb-1">
                  {stats.lobbyMeetingsCount}
                </p>
                <p className="text-[10px] text-slate-shadow uppercase tracking-wider">
                  Reuniones registradas
                </p>
                {stats.missedLobbyRegistrations > 0 && (
                  <div className="flex items-center justify-center gap-2 mt-3 p-2 bg-action-amber/10 rounded-sm">
                    <AlertTriangle className="w-3 h-3 text-action-amber" />
                    <span className="text-[9px] font-bold text-action-amber">
                      {stats.missedLobbyRegistrations} omisiones
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}