'use client';

import { useState } from 'react';
import { useTheme } from '../hooks/useTheme';
import { ThemeType } from '../types';
import styles from '../styles/components.module.css';

export default function ThemeMenu() {
  const { theme: currentTheme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const themes: { value: ThemeType; name: string }[] = [
    { value: 'default', name: 'Midnight Sky' },
    { value: 'grand-canyon', name: 'Grand Canyon' },
    { value: 'moon', name: 'Lunar Surface' },
    { value: 'sunset-beach', name: 'LA Beach Sunset' },
    { value: 'north-pole', name: 'Arctic Ice' },
    { value: 'rainforest', name: 'Amazon Depths' },
    { value: 'ocean-depths', name: 'Ocean Abyss' }
  ];

  return (
    <div className={styles.themeMenu}>
      <div 
        className={styles.themeMenuToggle}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className={styles.paletteIcon}></div>
      </div>
      
      {isOpen && (
        <div className={styles.themeOptions}>
          <h3>Choose Your Vibe</h3>
          <div className={styles.themeGrid}>
            {themes.map(theme => (
              <button
                key={theme.value}
                className={`${styles.themeOption} ${currentTheme === theme.value ? styles.active : ''}`}
                onClick={() => {
                  setTheme(theme.value);
                  setIsOpen(false);
                }}
              >
                <div className={`${styles.themePreview} ${styles[`themePreview${theme.value.charAt(0).toUpperCase() + theme.value.slice(1).replace('-', '')}`]}`}></div>
                <span>{theme.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 