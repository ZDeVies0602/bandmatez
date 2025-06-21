'use client';

import { useState, useEffect } from 'react';
import TabNavigation from '../../components/TabNavigation';
import VirtualPiano from '../../components/VirtualPiano';
import Metronome from '../../components/Metronome';
import PitchTuner from '../../components/PitchTuner';
import ThemeMenu from '../../components/ThemeMenu';
import SoundMenu from '../../components/SoundMenu';
import { useFont } from '../../hooks/useFont';
import styles from './page.module.css';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('piano');
  const { font, setFont } = useFont();
  const [currentFontFamily, setCurrentFontFamily] = useState('Inter, sans-serif');

  // Apply font to body
  useEffect(() => {
    const fontFamilies = {
      'inter': 'Inter, sans-serif',
      'bebas-neue': 'Bebas Neue, sans-serif',
      'vt323': 'VT323, monospace',
      'press-start-2p': 'Press Start 2P, cursive',
      'orbitron': 'Orbitron, sans-serif',
      'russo-one': 'Russo One, sans-serif',
      'righteous': 'Righteous, cursive',
      'bangers': 'Bangers, cursive'
    };
    const fontFamily = fontFamilies[font] || 'Inter, sans-serif';
    document.body.style.setProperty('font-family', fontFamily, 'important');
    setCurrentFontFamily(fontFamily);
    console.log('Font applied:', font, fontFamily);
    console.log('Body font-family:', document.body.style.fontFamily);
  }, [font]);

  // Apply initial font on mount
  useEffect(() => {
    const fontFamilies = {
      'inter': 'Inter, sans-serif',
      'bebas-neue': 'Bebas Neue, sans-serif',
      'vt323': 'VT323, monospace',
      'press-start-2p': 'Press Start 2P, cursive',
      'orbitron': 'Orbitron, sans-serif',
      'russo-one': 'Russo One, sans-serif',
      'righteous': 'Righteous, cursive',
      'bangers': 'Bangers, cursive'
    };
    const fontFamily = fontFamilies[font] || 'Inter, sans-serif';
    document.body.style.setProperty('font-family', fontFamily, 'important');
    setCurrentFontFamily(fontFamily);
    console.log('Initial font applied:', font, fontFamily);
    console.log('Body font-family:', document.body.style.fontFamily);
  }, []);

  return (
    <>
      {/* Sound Menu (Top Left) */}
      <SoundMenu />

      {/* Floating Theme Menu (Top Right) */}
      <ThemeMenu />

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