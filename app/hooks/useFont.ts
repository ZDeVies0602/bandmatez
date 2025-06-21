'use client';

import { useState, useEffect } from 'react';
import { FontType } from '../types';

export const fonts = {
  'inter': { name: 'Inter (Clean)', family: 'Inter, sans-serif' },
  'bebas-neue': { name: 'Bebas Neue', family: 'Bebas Neue, sans-serif' },
  'vt323': { name: 'VT323 (Terminal)', family: 'VT323, monospace' },
  'press-start-2p': { name: 'Press Start 2P', family: 'Press Start 2P, cursive' },
  'orbitron': { name: 'Orbitron', family: 'Orbitron, sans-serif' },
  'russo-one': { name: 'Russo One', family: 'Russo One, sans-serif' },
  'righteous': { name: 'Righteous', family: 'Righteous, cursive' },
  'bangers': { name: 'Bangers', family: 'Bangers, cursive' }
};

export function useFont() {
  const [font, setFont] = useState<FontType>('inter');

  useEffect(() => {
    const savedFont = localStorage.getItem('musictools-font') as FontType || 'inter';
    setFont(savedFont);
  }, []);

  const updateFont = (newFont: FontType) => {
    setFont(newFont);
    localStorage.setItem('musictools-font', newFont);
  };

  return {
    font,
    setFont: updateFont,
    fonts
  };
} 