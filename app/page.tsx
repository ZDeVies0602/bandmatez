'use client';

import { useState, useEffect } from 'react';
import TabNavigation from './components/TabNavigation';
import VirtualPiano from './components/VirtualPiano';
import Metronome from './components/Metronome';
import PitchTuner from './components/PitchTuner';
import { useTheme } from './hooks/useTheme';

export default function Home() {
  const [activeTab, setActiveTab] = useState('piano');
  const { theme, setTheme, themes } = useTheme();
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [soundMenuOpen, setSoundMenuOpen] = useState(false);

  // Apply theme to body
  useEffect(() => {
    document.body.className = `theme-${theme}`;
  }, [theme]);

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'piano':
        return <VirtualPiano />;
      case 'metronome':
        return <Metronome />;
      case 'tuner':
        return <PitchTuner />;
      default:
        return <VirtualPiano />;
    }
  };

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

  return (
    <>
      {/* Sound Menu (Top Left) */}
      <div className={`sound-menu ${soundMenuOpen ? 'open' : ''}`}>
        <div 
          className="sound-menu-toggle"
          onClick={() => setSoundMenuOpen(!soundMenuOpen)}
        >
          <div className="sound-icon"></div>
        </div>
        <div className="sound-options">
          <h3>Sound Selection</h3>
          
          {/* Metronome Sounds Section */}
          <div className="sound-section">
            <h4>Metronome Sounds</h4>
            <div className="sound-list">
              <button className="sound-option active">
                <span className="sound-name">Digital Beep</span>
                <span className="sound-preview">▶</span>
              </button>
              <button className="sound-option">
                <span className="sound-name">Wood Block</span>
                <span className="sound-preview">▶</span>
              </button>
              <button className="sound-option">
                <span className="sound-name">Mechanical Click</span>
                <span className="sound-preview">▶</span>
              </button>
              <button className="sound-option">
                <span className="sound-name">Classic Tick</span>
                <span className="sound-preview">▶</span>
              </button>
            </div>
          </div>
          
          {/* Piano Wave Types Section */}
          <div className="sound-section">
            <h4>Piano Wave Types</h4>
            <div className="sound-list">
              <button className="sound-option active">
                <span className="sound-name">Sine (Pure)</span>
                <span className="sound-preview">▶</span>
              </button>
              <button className="sound-option">
                <span className="sound-name">Triangle (Mellow)</span>
                <span className="sound-preview">▶</span>
              </button>
              <button className="sound-option">
                <span className="sound-name">Sawtooth (Bright)</span>
                <span className="sound-preview">▶</span>
              </button>
              <button className="sound-option">
                <span className="sound-name">Square (Buzzy)</span>
                <span className="sound-preview">▶</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Theme Menu (Top Right) */}
      <div className={`theme-menu ${themeMenuOpen ? 'open' : ''}`}>
        <div 
          className="theme-menu-toggle"
          onClick={() => setThemeMenuOpen(!themeMenuOpen)}
        >
          <div className="palette-icon"></div>
        </div>
        <div className="theme-options">
          <h3>Choose Your Vibe</h3>
          <div className="theme-grid">
            {Object.entries(themes).map(([key, { name, emoji }]) => (
              <button
                key={key}
                className={`theme-option ${theme === key ? 'active' : ''}`}
                onClick={() => {
                  setTheme(key as any);
                  setThemeMenuOpen(false);
                }}
              >
                <div className={`theme-preview ${getThemePreviewClass(key)}`}></div>
                <span>{name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container">
        <h1>MUSIC TOOLS</h1>
        
        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button 
            className={`tab-button ${activeTab === 'metronome' ? 'active' : ''}`}
            onClick={() => setActiveTab('metronome')}
          >
            Metronome
          </button>
          <button 
            className={`tab-button ${activeTab === 'tuner' ? 'active' : ''}`}
            onClick={() => setActiveTab('tuner')}
          >
            Pitch Tuner
          </button>
          <button 
            className={`tab-button ${activeTab === 'piano' ? 'active' : ''}`}
            onClick={() => setActiveTab('piano')}
          >
            Virtual Piano
          </button>
        </div>

        {/* Tab Content */}
        <div className={`tab-content ${activeTab === 'metronome' ? 'active' : ''}`}>
          {activeTab === 'metronome' && <Metronome />}
        </div>
        <div className={`tab-content ${activeTab === 'tuner' ? 'active' : ''}`}>
          {activeTab === 'tuner' && <PitchTuner />}
        </div>
        <div className={`tab-content ${activeTab === 'piano' ? 'active' : ''}`}>
          {activeTab === 'piano' && <VirtualPiano />}
        </div>
      </div>
    </>
  );
}