'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '../hooks/useTheme';
import { useFont, fonts } from '../hooks/useFont';
import { ThemeType } from '../types';
import styles from '../styles/components.module.css';

export default function ThemeMenu() {
  const { theme: currentTheme, setTheme } = useTheme();
  const { font: currentFont, setFont } = useFont();
  const [isOpen, setIsOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<'themes' | 'fonts' | null>(null);

  // Apply theme to body
  useEffect(() => {
    document.body.className = `theme-${currentTheme}`;
  }, [currentTheme]);

  const getThemePreviewClass = (themeKey: string) => {
    const previewMap: { [key: string]: string } = {
      'default': 'theme-preview-default',
      'grand-canyon': 'theme-preview-canyon',
      'moon': 'theme-preview-moon',
      'sunset-beach': 'theme-preview-sunset',
      'north-pole': 'theme-preview-pole',
      'rainforest': 'theme-preview-forest',
      'ocean-depths': 'theme-preview-ocean'
    };
    return previewMap[themeKey] || 'theme-preview-default';
  };

  const themes: { value: ThemeType; name: string }[] = [
    { value: 'default', name: 'Midnight Sky' },
    { value: 'grand-canyon', name: 'Grand Canyon' },
    { value: 'moon', name: 'Lunar Surface' },
    { value: 'sunset-beach', name: 'LA Beach Sunset' },
    { value: 'north-pole', name: 'Arctic Ice' },
    { value: 'rainforest', name: 'Amazon Depths' },
    { value: 'ocean-depths', name: 'Ocean Abyss' }
  ];

  const fontOptions = [
    { value: 'inter', name: 'Inter (Clean)' },
    { value: 'bebas-neue', name: 'Bebas Neue' },
    { value: 'vt323', name: 'VT323 (Terminal)' },
    { value: 'press-start-2p', name: 'Press Start 2P' },
    { value: 'orbitron', name: 'Orbitron' },
    { value: 'russo-one', name: 'Russo One' },
    { value: 'righteous', name: 'Righteous' },
    { value: 'bangers', name: 'Bangers' }
  ];

  const handleSubmenuClick = (submenu: 'themes' | 'fonts') => {
    setActiveSubmenu(activeSubmenu === submenu ? null : submenu);
  };

  const handleBackClick = () => {
    setActiveSubmenu(null);
  };

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
          {activeSubmenu === null && (
            <>
              <h3>Customize Your Experience</h3>
              <div className={styles.menuOptions}>
                <button
                  className={styles.menuOption}
                  onClick={() => handleSubmenuClick('themes')}
                >
                  <div className={styles.menuIcon}>🎨</div>
                  <span>Color Schemes</span>
                  <div className={styles.menuArrow}>→</div>
                </button>
                <button
                  className={styles.menuOption}
                  onClick={() => handleSubmenuClick('fonts')}
                >
                  <div className={styles.menuIcon}>🔤</div>
                  <span>Typography</span>
                  <div className={styles.menuArrow}>→</div>
                </button>
              </div>
            </>
          )}

          {activeSubmenu === 'themes' && (
            <>
              <div className={styles.submenuHeader}>
                <button className={styles.backButton} onClick={handleBackClick}>
                  ← Back
                </button>
                <h3>Choose Your Vibe</h3>
              </div>
              <div className="theme-grid">
                {themes.map(theme => (
                  <button
                    key={theme.value}
                    className={`theme-option ${currentTheme === theme.value ? 'active' : ''}`}
                    onClick={() => {
                      setTheme(theme.value);
                      setActiveSubmenu(null);
                      setIsOpen(false);
                    }}
                  >
                    <div className={`theme-preview ${getThemePreviewClass(theme.value)}`}></div>
                    <span>{theme.name}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {activeSubmenu === 'fonts' && (
            <>
              <div className={styles.submenuHeader}>
                <button className={styles.backButton} onClick={handleBackClick}>
                  ← Back
                </button>
                <h3>Choose Your Font</h3>
              </div>
              <div className={styles.fontGrid}>
                {fontOptions.map(font => (
                  <button
                    key={font.value}
                    className={`${styles.fontOption} ${currentFont === font.value ? styles.active : ''}`}
                    onClick={() => {
                      setFont(font.value as any);
                      setActiveSubmenu(null);
                      setIsOpen(false);
                    }}
                    style={{ 
                      fontFamily: font.value === 'inter' ? 'Inter, sans-serif' :
                                 font.value === 'bebas-neue' ? 'Bebas Neue, sans-serif' :
                                 font.value === 'vt323' ? 'VT323, monospace' :
                                 font.value === 'press-start-2p' ? 'Press Start 2P, cursive' :
                                 font.value === 'orbitron' ? 'Orbitron, sans-serif' :
                                 font.value === 'russo-one' ? 'Russo One, sans-serif' :
                                 font.value === 'righteous' ? 'Righteous, cursive' :
                                 font.value === 'bangers' ? 'Bangers, cursive' :
                                 'Inter, sans-serif'
                    }}
                  >
                    <div className={styles.fontPreview}>
                      <span className={styles.fontName}>{font.name}</span>
                      <span className={styles.fontSample}>The quick brown fox</span>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
} 