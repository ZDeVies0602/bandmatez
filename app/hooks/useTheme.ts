'use client';

import { useState, useEffect } from 'react';
import { ThemeType } from '../types';

export function useTheme() {
  const [theme, setTheme] = useState<ThemeType>('default');

  useEffect(() => {
    const savedTheme = localStorage.getItem('musictools-theme') as ThemeType || 'default';
    setTheme(savedTheme);
  }, []);

  const updateTheme = (newTheme: ThemeType) => {
    setTheme(newTheme);
    localStorage.setItem('musictools-theme', newTheme);
  };

  return {
    theme,
    setTheme: updateTheme,
  };
} 