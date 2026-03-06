'use client';

import React, { createContext, useContext, useEffect, useState, useSyncExternalStore } from 'react';

export type VisualStyle = 'glass' | 'clay' | 'spatial' | 'parchment';

interface StyleContextType {
  style: VisualStyle;
  setStyle: (style: VisualStyle) => void;
}

const StyleContext = createContext<StyleContextType | undefined>(undefined);

const emptySubscribe = () => () => { };

export default function StyleProvider({ children }: { children: React.ReactNode }) {
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const [style, setStyle] = useState<VisualStyle>('glass');

  useEffect(() => {
    if (!mounted) return;
    let savedStyle = localStorage.getItem('l2c-ui-style') as VisualStyle | 'cute';
    if (savedStyle === 'cute') {
      savedStyle = 'spatial';
      localStorage.setItem('l2c-ui-style', 'spatial');
    }
    if (savedStyle && ['glass', 'clay', 'spatial', 'parchment'].includes(savedStyle)) {
      document.documentElement.setAttribute('data-style', savedStyle);
    }
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute('data-style', style);
    localStorage.setItem('l2c-ui-style', style);
  }, [style, mounted]);

  return <StyleContext.Provider value={{ style, setStyle }}>{children}</StyleContext.Provider>;
}

export function useStyle() {
  const context = useContext(StyleContext);
  if (context === undefined) {
    throw new Error('useStyle must be used within a StyleProvider');
  }
  return context;
}
