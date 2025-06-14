'use client';

import { useState, useEffect } from 'react';

export type ThemeKey = 'default' | 'grand-canyon' | 'moon' | 'sunset-beach' | 'north-pole' | 'rainforest' | 'ocean-depths';

export const themes = {
  'default': { name: 'Midnight Sky', emoji: '🌌' },
  'grand-canyon': { name: 'Grand Canyon', emoji: '🏜️' },
  'moon': { name: 'Lunar Surface', emoji: '🌙' },
  'sunset-beach': { name: 'LA Beach Sunset', emoji: '🏖️' },
  'north-pole': { name: 'Arctic Ice', emoji: '❄️' },
  'rainforest': { name: 'Amazon Depths', emoji: '🌳' },
  'ocean-depths': { name: 'Ocean Abyss', emoji: '🌊' }
};

export function useTheme() {
  const [theme, setTheme] = useState<ThemeKey>('default');

  useEffect(() => {
    const savedTheme = localStorage.getItem('musictools-theme') as ThemeKey || 'default';
    setTheme(savedTheme);
  }, []);

  const updateTheme = (newTheme: ThemeKey) => {
    setTheme(newTheme);
    localStorage.setItem('musictools-theme', newTheme);
  };

  return {
    theme,
    setTheme: updateTheme,
    themes
  };
} 