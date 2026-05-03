'use client';

import React from 'react';
import { useAccessibility } from '@/lib/accessibility-context';
import { Eye, Type, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function AccessibilityToggle() {
  const { highContrast, toggleHighContrast, fontSize, toggleFontSize } = useAccessibility();
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Opciones de accesibilidad"
        aria-expanded={isOpen}
        className="flex items-center gap-2 p-2 rounded-full hover:bg-mist-grey/10 transition-colors"
      >
        <Eye className={`w-5 h-5 ${highContrast ? 'text-civic-teal' : 'text-mist-grey'}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute right-0 top-full mt-4 w-64 bg-white border border-mist-grey shadow-2xl rounded-sm p-6 z-[100]"
            role="dialog"
            aria-label="Panel de accesibilidad"
          >
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-6 text-deep-civic border-b border-mist-grey/20 pb-2">
              Configuración de Vista
            </h3>

            <div className="space-y-6">
              <div className="flex flex-col gap-3">
                <span className="text-[10px] font-bold text-slate-shadow uppercase">Contraste</span>
                <button 
                  onClick={toggleHighContrast}
                  className={`flex items-center justify-between p-3 rounded-sm border transition-all ${
                    highContrast 
                      ? 'border-civic-teal bg-civic-teal/5 text-civic-teal' 
                      : 'border-mist-grey text-slate-shadow hover:border-civic-teal'
                  }`}
                >
                  <span className="text-xs font-bold uppercase tracking-wider">Alto Contraste</span>
                  {highContrast && <Check className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex flex-col gap-3">
                <span className="text-[10px] font-bold text-slate-shadow uppercase">Tamaño de Fuente</span>
                <button 
                  onClick={toggleFontSize}
                  className={`flex items-center justify-between p-3 rounded-sm border transition-all ${
                    fontSize === 'large' 
                      ? 'border-civic-teal bg-civic-teal/5 text-civic-teal' 
                      : 'border-mist-grey text-slate-shadow hover:border-civic-teal'
                  }`}
                >
                  <span className="text-xs font-bold uppercase tracking-wider">Fuente Grande</span>
                  {fontSize === 'large' && <Check className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button 
              onClick={() => setIsOpen(false)}
              className="mt-8 w-full py-2 bg-deep-civic text-white text-[10px] font-bold uppercase tracking-widest hover:bg-civic-teal transition-colors"
            >
              Cerrar
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
