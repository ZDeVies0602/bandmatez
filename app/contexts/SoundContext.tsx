'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { MetronomeSound, WaveType } from '../types';

interface SoundContextType {
  metronomeSound: MetronomeSound;
  setMetronomeSound: (sound: MetronomeSound) => void;
  pianoWaveType: WaveType;
  setPianoWaveType: (waveType: WaveType) => void;
  previewMetronomeSound: (sound: MetronomeSound) => void;
  previewPianoSound: (waveType: WaveType) => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export const useSound = () => {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error('useSound must be used within a SoundProvider');
  }
  return context;
};

interface SoundProviderProps {
  children: ReactNode;
}

export const SoundProvider: React.FC<SoundProviderProps> = ({ children }) => {
  const [metronomeSound, setMetronomeSound] = useState<MetronomeSound>('digital');
  const [pianoWaveType, setPianoWaveType] = useState<WaveType>('sine');
  const audioContextRef = React.useRef<AudioContext | null>(null);
  const masterGainRef = React.useRef<GainNode | null>(null);

  // Initialize audio context
  const initializeAudio = async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      masterGainRef.current = audioContextRef.current.createGain();
      masterGainRef.current.connect(audioContextRef.current.destination);
      masterGainRef.current.gain.value = 0.3;
    }

    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
  };

  // Load settings from localStorage
  useEffect(() => {
    const savedMetronomeSound = localStorage.getItem('musictools-metronome-sound') as MetronomeSound;
    const savedPianoWaveType = localStorage.getItem('musictools-piano-wave-type') as WaveType;
    
    if (savedMetronomeSound) setMetronomeSound(savedMetronomeSound);
    if (savedPianoWaveType) setPianoWaveType(savedPianoWaveType);
  }, []);

  // Save settings to localStorage
  const updateMetronomeSound = (sound: MetronomeSound) => {
    setMetronomeSound(sound);
    localStorage.setItem('musictools-metronome-sound', sound);
  };

  const updatePianoWaveType = (waveType: WaveType) => {
    setPianoWaveType(waveType);
    localStorage.setItem('musictools-piano-wave-type', waveType);
  };

  // Preview metronome sound
  const previewMetronomeSound = async (soundType: MetronomeSound) => {
    await initializeAudio();
    
    if (!audioContextRef.current || !masterGainRef.current) return;

    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(masterGainRef.current);
    
    const now = audioContextRef.current.currentTime;
    
    // Configure sound based on type
    switch (soundType) {
      case 'digital':
        oscillator.frequency.value = 1000;
        oscillator.type = 'square';
        break;
      case 'wood':
        oscillator.frequency.value = 250;
        oscillator.type = 'sine';
        break;
      case 'mechanical':
        oscillator.frequency.value = 600;
        oscillator.type = 'square';
        break;
      case 'cowbell':
        oscillator.frequency.value = 600;
        oscillator.type = 'triangle';
        break;
      case 'rimshot':
        oscillator.frequency.value = 800;
        oscillator.type = 'sawtooth';
        break;
      case 'sine':
        oscillator.frequency.value = 600;
        oscillator.type = 'sine';
        break;
      case 'triangle':
        oscillator.frequency.value = 500;
        oscillator.type = 'triangle';
        break;
      case 'tick':
        oscillator.frequency.value = 800;
        oscillator.type = 'square';
        break;
      default:
        oscillator.frequency.value = 800;
        oscillator.type = 'square';
    }
    
    // Volume envelope
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    
    oscillator.start(now);
    oscillator.stop(now + 0.1);
  };

  // Preview piano sound
  const previewPianoSound = async (waveType: WaveType) => {
    await initializeAudio();
    
    if (!audioContextRef.current || !masterGainRef.current) return;

    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(masterGainRef.current);
    
    const now = audioContextRef.current.currentTime;
    
    oscillator.frequency.value = 440; // A4
    oscillator.type = waveType;
    
    // Volume envelope
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.2, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    
    oscillator.start(now);
    oscillator.stop(now + 0.3);
  };

  const value: SoundContextType = {
    metronomeSound,
    setMetronomeSound: updateMetronomeSound,
    pianoWaveType,
    setPianoWaveType: updatePianoWaveType,
    previewMetronomeSound,
    previewPianoSound
  };

  return (
    <SoundContext.Provider value={value}>
      {children}
    </SoundContext.Provider>
  );
}; 