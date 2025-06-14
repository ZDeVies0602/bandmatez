'use client';

import { useState } from 'react';
import styles from '../styles/components.module.css';

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  const tabs = [
    { id: 'piano', label: '🎹 Virtual Piano', icon: '🎹' },
    { id: 'metronome', label: '🎵 Metronome', icon: '🎵' },
    { id: 'tuner', label: '🎤 Pitch Tuner', icon: '🎤' }
  ];

  return (
    <nav className={styles.tabNavigation}>
      <div className={styles.tabContainer}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`${styles.tabButton} ${activeTab === tab.id ? styles.active : ''}`}
            aria-selected={activeTab === tab.id}
          >
            <span className={styles.tabIcon}>{tab.icon}</span>
            <span className={styles.tabLabel}>{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
} 