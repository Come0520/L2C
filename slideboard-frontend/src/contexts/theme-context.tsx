'use client';

import React from 'react';

export type ThemeName = 'warmRicePaper' | 'liquidGlass' | 'linear';

const THEME_STORAGE_KEY = 'l2cTheme';

interface ThemeContextValue {
  theme: ThemeName;
  setTheme: (name: ThemeName) => void;
}

export const ThemeContext = React.createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<ThemeName>('linear');

  React.useEffect(() => {
    const saved = (typeof window !== 'undefined' && window.localStorage.getItem(THEME_STORAGE_KEY)) as ThemeName | null;
    if (saved) {
      setThemeState(saved);
      applyTheme(saved);
    } else {
      // Default to Warm Rice Paper (Light mode) to avoid dark mode issues
      applyTheme('warmRicePaper');
      setThemeState('warmRicePaper');
    }
  }, []);

  const setTheme = React.useCallback((name: ThemeName) => {
    setThemeState(name);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(THEME_STORAGE_KEY, name);
    }
    applyTheme(name);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

function applyTheme(name: ThemeName) {
  if (typeof document === 'undefined') return;
  const body = document.body;
  body.classList.remove('theme-warm', 'theme-glass', 'theme-linear');
  
  // Remove dark mode class by default
  document.documentElement.classList.remove('dark');
  
  if (name === 'warmRicePaper') {
    body.classList.add('theme-warm');
  } else if (name === 'liquidGlass') {
    body.classList.add('theme-glass');
  } else {
    body.classList.add('theme-linear');
    // Only enable dark mode if explicitly supported
    // document.documentElement.classList.add('dark');
  }
}

export function useTheme() {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
