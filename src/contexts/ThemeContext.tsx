import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { applyContrastGuard, ensureContrastGuardsBound } from '../utils/themeGuard';

export type ThemePreference = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  preference: ThemePreference;
  resolved: 'light' | 'dark';
  setPreference: (pref: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }>
  = ({ children }) => {
  const [preference, setPreference] = useState<ThemePreference>(() => {
    const saved = localStorage.getItem('theme-preference') as ThemePreference | null;
    return saved || 'system';
  });

  const resolved = useMemo<'light' | 'dark'>(() => {
    if (preference === 'system') return getSystemTheme();
    return preference;
  }, [preference]);

  // Apply to document root as data-theme attr for CSS vars
  useEffect(() => {
    const root = document.documentElement;
    if (resolved === 'dark') {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.removeAttribute('data-theme');
    }
    // After toggling theme, run a small contrast guard to adjust variables if needed
    try {
      applyContrastGuard();
      ensureContrastGuardsBound();
    } catch {}
  }, [resolved]);

  // Listen to system changes when preference is system
  useEffect(() => {
    if (preference !== 'system') return;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      const root = document.documentElement;
      if (mql.matches) root.setAttribute('data-theme', 'dark');
      else root.removeAttribute('data-theme');
    };
    try {
      mql.addEventListener('change', handler);
      return () => mql.removeEventListener('change', handler);
    } catch {
      // Safari fallback
      mql.addListener(handler);
      return () => mql.removeListener(handler);
    }
  }, [preference]);

  const setPreferencePersist = (pref: ThemePreference) => {
    setPreference(pref);
    localStorage.setItem('theme-preference', pref);
  };

  return (
    <ThemeContext.Provider value={{ preference, resolved, setPreference: setPreferencePersist }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
