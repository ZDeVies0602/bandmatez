'use client';

import { useState } from 'react';
import { useMetronomeSounds } from '../hooks/useMetronomeSounds';
import { MetronomeSound, WaveType } from '../types';
import styles from '../styles/components.module.css';

export default function SoundMenu() {
  const { currentSound, setCurrentSound, playSound } = useMetronomeSounds();
  const [isOpen, setIsOpen] = useState(false);
  const [currentPianoWave, setCurrentPianoWave] = useState<WaveType>('sine');

  const metronomeSounds: { value: MetronomeSound; name: string }[] = [
    { value: 'digital', name: 'Digital Beep' },
    { value: 'wood', name: 'Wood Block' },
    { value: 'mechanical', name: 'Mechanical Click' },
    { value: 'cowbell', name: 'Cowbell' },
    { value: 'rimshot', name: 'Rim Shot' },
    { value: 'sine', name: 'Pure Tone' },
    { value: 'triangle', name: 'Triangle Wave' },
    { value: 'tick', name: 'Classic Tick' }
  ];

  const pianoWaves: { value: WaveType; name: string }[] = [
    { value: 'sine', name: 'Sine (Pure)' },
    { value: 'triangle', name: 'Triangle (Mellow)' },
    { value: 'sawtooth', name: 'Sawtooth (Bright)' },
    { value: 'square', name: 'Square (Buzzy)' }
  ];

  const handleSoundPreview = async (sound: MetronomeSound) => {
    await playSound(sound, false, 0.5);
  };

  return (
    <div className={styles.soundMenu}>
      <div 
        className={styles.soundMenuToggle}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className={styles.soundIcon}></div>
      </div>
      
      {isOpen && (
        <div className={styles.soundOptions}>
          <h3>Sound Selection</h3>
          
          <div className={styles.soundSection}>
            <h4>Metronome Sounds</h4>
            <div className={styles.soundList}>
              {metronomeSounds.map(sound => (
                <button
                  key={sound.value}
                  className={`${styles.soundOption} ${currentSound === sound.value ? styles.active : ''}`}
                  onClick={() => setCurrentSound(sound.value)}
                >
                  <span className={styles.soundName}>{sound.name}</span>
                  <span 
                    className={styles.soundPreview}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSoundPreview(sound.value);
                    }}
                  >
                    ▶
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className={styles.soundSection}>
            <h4>Piano Wave Types</h4>
            <div className={styles.soundList}>
              {pianoWaves.map(wave => (
                <button
                  key={wave.value}
                  className={`${styles.soundOption} ${currentPianoWave === wave.value ? styles.active : ''}`}
                  onClick={() => setCurrentPianoWave(wave.value)}
                >
                  <span className={styles.soundName}>{wave.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 