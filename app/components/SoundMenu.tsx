'use client';

import { useState } from 'react';
import { useSound } from '../contexts/SoundContext';
import { MetronomeSound, WaveType } from '../types';
import styles from '../styles/components.module.css';

export default function SoundMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { 
    metronomeSound, 
    setMetronomeSound, 
    pianoWaveType, 
    setPianoWaveType,
    previewMetronomeSound,
    previewPianoSound
  } = useSound();

  const metronomeSounds = [
    { value: 'digital', name: 'Digital Beep', description: 'Clean electronic beep' },
    { value: 'wood', name: 'Wood Block', description: 'Natural wooden sound' },
    { value: 'mechanical', name: 'Mechanical Click', description: 'Classic metronome click' },
    { value: 'cowbell', name: 'Cowbell', description: 'Percussive cowbell sound' },
    { value: 'rimshot', name: 'Rimshot', description: 'Sharp rimshot sound' },
    { value: 'sine', name: 'Sine Wave', description: 'Pure sine wave tone' },
    { value: 'triangle', name: 'Triangle Wave', description: 'Mellow triangle wave' },
    { value: 'tick', name: 'Classic Tick', description: 'Traditional tick sound' }
  ];

  const pianoWaveTypes = [
    { value: 'sine', name: 'Sine (Pure)', description: 'Clean, pure tone' },
    { value: 'triangle', name: 'Triangle (Mellow)', description: 'Soft, mellow sound' },
    { value: 'sawtooth', name: 'Sawtooth (Bright)', description: 'Bright, rich harmonics' },
    { value: 'square', name: 'Square (Buzzy)', description: 'Buzzy, electronic sound' }
  ];

  const handleMetronomeSoundSelect = (sound: MetronomeSound) => {
    setMetronomeSound(sound);
    previewMetronomeSound(sound);
  };

  const handlePianoWaveSelect = (waveType: WaveType) => {
    setPianoWaveType(waveType);
    previewPianoSound(waveType);
  };

  const handlePreviewMetronome = (sound: MetronomeSound) => {
    previewMetronomeSound(sound);
  };

  const handlePreviewPiano = (waveType: WaveType) => {
    previewPianoSound(waveType);
  };

  return (
    <div className={`sound-menu ${isOpen ? 'open' : ''}`}>
      <div 
        className="sound-menu-toggle"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="sound-icon"></div>
      </div>
      
      {isOpen && (
        <div className="sound-options">
          <h3>Sound Selection</h3>
          
          {/* Metronome Sounds Section */}
          <div className="sound-section">
            <h4>Metronome Sounds</h4>
            <div className="sound-list">
              {metronomeSounds.map(sound => (
                <button 
                  key={sound.value}
                  className={`sound-option ${metronomeSound === sound.value ? 'active' : ''}`}
                  onClick={() => handleMetronomeSoundSelect(sound.value as MetronomeSound)}
                >
                  <div className="sound-info">
                    <span className="sound-name">{sound.name}</span>
                    <span className="sound-description">{sound.description}</span>
                  </div>
                  <button 
                    className="sound-preview"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePreviewMetronome(sound.value as MetronomeSound);
                    }}
                  >
                    ▶
                  </button>
                </button>
              ))}
            </div>
          </div>
          
          {/* Piano Wave Types Section */}
          <div className="sound-section">
            <h4>Piano Wave Types</h4>
            <div className="sound-list">
              {pianoWaveTypes.map(wave => (
                <button 
                  key={wave.value}
                  className={`sound-option ${pianoWaveType === wave.value ? 'active' : ''}`}
                  onClick={() => handlePianoWaveSelect(wave.value as WaveType)}
                >
                  <div className="sound-info">
                    <span className="sound-name">{wave.name}</span>
                    <span className="sound-description">{wave.description}</span>
                  </div>
                  <button 
                    className="sound-preview"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePreviewPiano(wave.value as WaveType);
                    }}
                  >
                    ▶
                  </button>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 