'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface AccessibilityContextType {
  highContrast: boolean;
  toggleHighContrast: () => void;
  fontSize: 'normal' | 'large';
  toggleFontSize: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [highContrast, setHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState<'normal' | 'large'>('normal');

  // Load preferences once on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedHC = localStorage.getItem('hc-mode') === 'true';
      const savedFS = localStorage.getItem('fs-mode') as 'normal' | 'large';
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (savedHC) setHighContrast(true);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (savedFS) setFontSize(savedFS);
    }
  }, []);

  const toggleHighContrast = () => {
    setHighContrast(prev => {
      const newVal = !prev;
      localStorage.setItem('hc-mode', String(newVal));
      return newVal;
    });
  };

  const toggleFontSize = () => {
    setFontSize(prev => {
      const newVal = prev === 'normal' ? 'large' : 'normal';
      localStorage.setItem('fs-mode', newVal);
      return newVal;
    });
  };

  return (
    <AccessibilityContext.Provider value={{ highContrast, toggleHighContrast, fontSize, toggleFontSize }}>
      <div className={`
        ${highContrast ? 'accessibility-hc' : ''} 
        ${fontSize === 'large' ? 'accessibility-fs-large' : ''}
        min-h-screen
      `}>
        {children}
      </div>
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) throw new Error('useAccessibility must be used within AccessibilityProvider');
  return context;
}
