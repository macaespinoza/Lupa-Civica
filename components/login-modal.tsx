'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { X, Mail, Lock, User, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, error, clearError, loading } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (mode === 'login') {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password, displayName);
      }
      onClose();
    } catch (err) {
      // Error is handled by useAuth
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      onClose();
    } catch (err) {
      // Error is handled by useAuth
    }
  };

  const handleClose = () => {
    clearError();
    setEmail('');
    setPassword('');
    setDisplayName('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-sm shadow-2xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-deep-civic p-6 text-white relative">
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <h2 className="font-display font-bold text-xl uppercase tracking-widest">
                {mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
              </h2>
              <p className="text-mist-grey text-xs uppercase tracking-widest mt-1">
                Lupa Cívica • Acceso Ciudadano
              </p>
            </div>

            {/* Body */}
            <div className="p-6">
              {error && (
                <div className="mb-4 p-3 bg-score-low/10 border border-score-low/30 rounded-sm flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-score-low mt-0.5 flex-shrink-0" />
                  <p className="text-score-low text-xs">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'signup' && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-shadow uppercase tracking-widest mb-2">
                      Nombre
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mist-grey" />
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Tu nombre"
                        className="w-full pl-10 pr-4 py-3 bg-pale-stone border border-mist-grey rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-civic-teal transition-all"
                        required
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-slate-shadow uppercase tracking-widest mb-2">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mist-grey" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@correo.cl"
                      className="w-full pl-10 pr-4 py-3 bg-pale-stone border border-mist-grey rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-civic-teal transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-shadow uppercase tracking-widest mb-2">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mist-grey" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-3 bg-pale-stone border border-mist-grey rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-civic-teal transition-all"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-action-amber text-white rounded-sm font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-civic-teal transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'
                  )}
                </button>
              </form>

              <div className="mt-4 relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-mist-grey/30"></div>
                </div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
                  <span className="bg-white px-2 text-mist-grey">O continúa con</span>
                </div>
              </div>

              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full mt-4 py-3 bg-white border border-mist-grey text-deep-civic rounded-sm font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-pale-stone transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </button>

              <div className="mt-6 text-center">
                <button
                  onClick={() => {
                    setMode(mode === 'login' ? 'signup' : 'login');
                    clearError();
                  }}
                  className="text-[10px] text-civic-teal uppercase tracking-widest hover:underline"
                >
                  {mode === 'login' 
                    ? '¿No tienes cuenta? Regístrate' 
                    : '¿Ya tienes cuenta? Inicia sesión'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
