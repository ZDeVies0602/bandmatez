'use client';

import { useState, useEffect } from 'react';
// import TabNavigation from '../../components/TabNavigation'; // No longer needed
import VirtualPiano from '../../components/VirtualPiano';
import Metronome from '../../components/Metronome';
import PitchTuner from '../../components/PitchTuner';
import ThemeMenu from '../../components/ThemeMenu';
import SoundMenu from '../../components/SoundMenu';
import styles from './page.module.css';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('piano');

  return (
    <div className={styles.dashboardWrapper}>
      <div className="dashboard-background">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
        <div className="shape shape-4"></div>
        <div className="shape shape-5"></div>
        <div className="shape shape-6"></div>
        <div className="shape shape-7"></div>
        <div className="shape shape-8"></div>
      </div>
      
      <SoundMenu />
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
        <div className={`${styles['tool-container']} tab-content ${activeTab === 'metronome' ? 'active' : ''}`}>
          {activeTab === 'metronome' && <Metronome />}
        </div>
        <div className={`${styles['tool-container']} tab-content ${activeTab === 'tuner' ? 'active' : ''}`}>
          {activeTab === 'tuner' && <PitchTuner />}
        </div>
        <div className={`${styles['tool-container']} tab-content ${activeTab === 'piano' ? 'active' : ''}`}>
          {activeTab === 'piano' && <VirtualPiano />}
        </div>
      </div>
    </div>
  );
} 