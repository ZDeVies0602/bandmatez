'use client';

import { useState, useRef, useCallback } from 'react';

export const useMetronomeSounds = () => {
  const [currentSound, setCurrentSound] = useState('click');
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

  const createSound = useCallback(async (type: 'normal' | 'accent') => {
    await initializeAudio();
    
    if (!audioContextRef.current || !masterGainRef.current) return;

    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(masterGainRef.current);
    
    // Different frequencies for normal vs accent
    oscillator.frequency.value = type === 'accent' ? 1000 : 800;
    oscillator.type = 'square';
    
    // Volume envelope
    const now = audioContextRef.current.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    
    oscillator.start(now);
    oscillator.stop(now + 0.1);
  }, [initializeAudio]);

  const playSound = useCallback(async (type: 'normal' | 'accent' = 'normal') => {
    try {
      await createSound(type);
    } catch (error) {
      console.warn('Audio playback failed:', error);
    }
  }, [createSound]);

  return {
    currentSound,
    setCurrentSound,
    playSound
  };
}; 