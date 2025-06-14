'use client';

import { useState, useRef, useCallback } from 'react';
import { MetronomeSound } from '../types';

export const useMetronomeSounds = () => {
  const [currentSound, setCurrentSound] = useState<MetronomeSound>('digital');
  const audioContextRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);

  const initializeAudio = useCallback(async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      masterGainRef.current = audioContextRef.current.createGain();
      masterGainRef.current.connect(audioContextRef.current.destination);
      masterGainRef.current.gain.value = 0.3;
    }

    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
  }, []);

  const createSound = useCallback(async (soundType: MetronomeSound, isAccent: boolean = false) => {
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
        oscillator.frequency.value = isAccent ? 1200 : 1000;
        oscillator.type = 'square';
        break;
      case 'wood':
        oscillator.frequency.value = isAccent ? 300 : 250;
        oscillator.type = 'sine';
        break;
      case 'mechanical':
        oscillator.frequency.value = isAccent ? 800 : 600;
        oscillator.type = 'square';
        break;
      case 'cowbell':
        oscillator.frequency.value = isAccent ? 800 : 600;
        oscillator.type = 'triangle';
        break;
      case 'rimshot':
        oscillator.frequency.value = isAccent ? 1000 : 800;
        oscillator.type = 'sawtooth';
        break;
      case 'sine':
        oscillator.frequency.value = isAccent ? 800 : 600;
        oscillator.type = 'sine';
        break;
      case 'triangle':
        oscillator.frequency.value = isAccent ? 600 : 500;
        oscillator.type = 'triangle';
        break;
      case 'tick':
        oscillator.frequency.value = isAccent ? 1000 : 800;
        oscillator.type = 'square';
        break;
      default:
        oscillator.frequency.value = isAccent ? 1000 : 800;
        oscillator.type = 'square';
    }
    
    // Volume envelope
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    
    oscillator.start(now);
    oscillator.stop(now + 0.1);
  }, [initializeAudio]);

  const playSound = useCallback(async (soundType: MetronomeSound = currentSound, isAccent: boolean = false) => {
    try {
      await createSound(soundType, isAccent);
    } catch (error) {
      console.warn('Audio playback failed:', error);
    }
  }, [createSound, currentSound]);

  return {
    currentSound,
    setCurrentSound,
    playSound
  };
}; 