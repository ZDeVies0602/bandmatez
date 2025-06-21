'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '../hooks/useTheme';
import { ThemeType } from '../types';
import styles from '../styles/components.module.css';

export default function ThemeMenu() {
  const { theme: currentTheme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  // Apply theme to body
  useEffect(() => {
    document.body.className = `theme-${currentTheme}`;
  }, [currentTheme]);

  const getThemePreviewClass = (themeKey: string) => {
    const previewMap: { [key: string]: string } = {
      'default': 'theme-preview-default',
      'royal-gold': 'theme-preview-royal-gold',
      'terra-cotta': 'theme-preview-terra-cotta',
      'desert-clay': 'theme-preview-desert-clay',
      'dusty-lilac': 'theme-preview-dusty-lilac',
      'crimson-night': 'theme-preview-crimson-night',
      'forest-floor': 'theme-preview-forest-floor',
    };
    return previewMap[themeKey] || 'theme-preview-default';
  };

  const themes: { value: ThemeType; name: string }[] = [
    { value: 'default', name: 'Geometric Dusk' },
    { value: 'royal-gold', name: 'Royal Gold' },
    { value: 'terra-cotta', name: 'Terra Cotta' },
    { value: 'desert-clay', name: 'Desert Clay' },
    { value: 'dusty-lilac', name: 'Dusty Lilac' },
    { value: 'crimson-night', name: 'Crimson Night' },
    { value: 'forest-floor', name: 'Forest Floor' },
  ];

  return (
    <div className={`theme-menu ${isOpen ? 'open' : ''}`}>
      <div 
        className="theme-menu-toggle"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="palette-icon"></div>
      </div>
      
      {isOpen && (
        <div className="theme-options">
          <h3>Choose Your Vibe</h3>
          <div className="theme-grid">
            {themes.map(theme => (
              <button
                key={theme.value}
                className={`theme-option ${currentTheme === theme.value ? 'active' : ''}`}
                onClick={() => {
                  setTheme(theme.value);
                  setIsOpen(false);
                }}
              >
                <div className={`theme-preview ${getThemePreviewClass(theme.value)}`}></div>
                <span>{theme.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 