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
        <div className="shape shape-9"></div>
        <div className="shape shape-10"></div>
      </div>
      
      <SoundMenu />
      <ThemeMenu />
      
      {/* Account Link */}
      <div className="account-nav">
        <a href="/practice" className="nav-link practice-link">
          📊 Practice
        </a>
        <a href="/account" className="nav-link account-link">
          👤 Account
        </a>
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

      <style jsx>{`
        .account-nav {
          position: fixed;
          top: 20px;
          right: 90px;
          z-index: 1000;
          display: flex;
          gap: 10px;
        }

        .nav-link {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(10px);
          border: 2px solid rgba(255, 255, 255, 0.2);
          color: var(--text-dark);
          text-decoration: none;
          font-weight: 600;
          font-size: 0.9rem;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          border-radius: 25px;
        }

        .nav-link:hover {
          background: rgba(255, 255, 255, 0.25);
          color: var(--accent-red);
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
        }

        .practice-link:hover {
          color: rgba(34, 197, 94, 0.9);
        }

        @media (max-width: 768px) {
          .account-nav {
            top: 15px;
            right: 15px;
            flex-direction: column;
            gap: 8px;
          }
          
          .nav-link {
            padding: 0.5rem 1rem;
            font-size: 0.8rem;
          }
        }
      `}</style>
    </div>
  );
} 