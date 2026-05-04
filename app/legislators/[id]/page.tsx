import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Mail, Calendar, ShieldAlert, Award, FileText, ChevronRight } from 'lucide-react';
import Link from 'next/link';

// Temporarily hardcoded for static export until full scraper finishes
export async function generateStaticParams() {
  return [
    { id: 'pedro-araya-guerrero' },
    { id: 'danisa-astudillo-peiretti' },
    { id: 'test-legislator' }
  ];
}

export default async function LegislatorDetailPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  // This is a placeholder since we can't use hooks in server components
  // In a real app, you'd fetch from Firestore here
  return (
    <main className="max-w-6xl mx-auto px-6 py-16 bg-forum-white min-h-screen" id="main-content">
      <Link 
        href="/"
        className="flex items-center gap-2 text-slate-shadow hover:text-deep-civic font-display font-bold uppercase text-[10px] tracking-widest mb-16 transition-all"
      >
        <ArrowLeft className="w-3 h-3" aria-hidden="true" /> Volver al Directorio
      </Link>
      <div className="text-center py-20">
        <h1 className="font-serif text-4xl mb-4">Perfil en Auditoría: {id}</h1>
        <p className="text-mist-grey">Este perfil se está generando estáticamente. Por favor regrese al inicio.</p>
      </div>
    </main>
  );
}
