'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeType } from '../types';

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeType>('default');

  useEffect(() => {
    const savedTheme = localStorage.getItem('musictools-theme') as ThemeType || 'default';
    setThemeState(savedTheme);
    document.body.className = `theme-${savedTheme}`;
  }, []);

  const setTheme = (newTheme: ThemeType) => {
    console.log('ThemeContext: Setting theme to:', newTheme);
    setThemeState(newTheme);
    localStorage.setItem('musictools-theme', newTheme);
    document.body.className = `theme-${newTheme}`;
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
} 