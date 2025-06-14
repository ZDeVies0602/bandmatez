'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export const useAudioManager = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [masterVolume, setMasterVolume] = useState(0.5);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);

  const initialize = useCallback(async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      masterGainRef.current = audioContextRef.current.createGain();
      masterGainRef.current.connect(audioContextRef.current.destination);
      masterGainRef.current.gain.value = masterVolume;
    }

    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    setIsInitialized(true);
  }, [masterVolume]);

  const playTone = useCallback(async (frequency: number, duration: number = 0.5, type: OscillatorType = 'sine') => {
    await initialize();
    
    if (!audioContextRef.current || !masterGainRef.current) return;

    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(masterGainRef.current);
    
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    
    const now = audioContextRef.current.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);
    
    oscillator.start(now);
    oscillator.stop(now + duration);
  }, [initialize]);

  const stopTone = useCallback((oscillator: OscillatorNode) => {
    if (oscillator && audioContextRef.current) {
      const now = audioContextRef.current.currentTime;
      try {
        oscillator.stop(now + 0.1);
      } catch (e) {
        // Oscillator might already be stopped
      }
    }
  }, []);

  // Update master volume
  useEffect(() => {
    if (masterGainRef.current) {
      masterGainRef.current.gain.value = masterVolume;
    }
  }, [masterVolume]);

  // Initialize on first user interaction
  useEffect(() => {
    const handleFirstInteraction = () => {
      initialize();
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };

    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('keydown', handleFirstInteraction);

    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };
  }, [initialize]);

  return {
    audioContext: audioContextRef.current,
    masterGain: masterGainRef.current,
    isInitialized,
    masterVolume,
    setMasterVolume,
    playTone,
    stopTone,
    initialize
  };
}; 