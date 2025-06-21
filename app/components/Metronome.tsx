'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSound } from '../contexts/SoundContext';
import { MetronomeSettings } from '../types';
import styles from '../styles/components.module.css';

export default function Metronome() {
  const { metronomeSound } = useSound();
  
  // Core state
  const [isPlaying, setIsPlaying] = useState(false);
  const [tempo, setTempo] = useState(120);
  const [timeSignature, setTimeSignature] = useState({ beats: 4, noteValue: 4 });
  const [subdivision, setSubdivision] = useState(1);
  const [currentBeat, setCurrentBeat] = useState(1);
  const [currentSubdivision, setCurrentSubdivision] = useState(1);
  const [accentPattern, setAccentPattern] = useState([1]);
  const [pendulumAngle, setPendulumAngle] = useState(0);
  const animationRef = useRef<number | null>(null);
  
  // Tap tempo
  const [tapTimes, setTapTimes] = useState<number[]>([]);
  const tapTimesRef = useRef<number[]>([]);
  
  // Audio timing
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const nextNoteTimeRef = useRef(0);
  const quarterNoteTimeRef = useRef(60.0 / 120);
  
  // Audio context for metronome sounds
  const audioContextRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);

  // Initialize audio context
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

  // Create and play metronome sound
  const playMetronomeSound = useCallback(async (isAccent: boolean = false) => {
    await initializeAudio();
    
    if (!audioContextRef.current || !masterGainRef.current) return;

    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(masterGainRef.current);
    
    const now = audioContextRef.current.currentTime;
    
    // Configure sound based on type
    switch (metronomeSound) {
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
  }, [metronomeSound, initializeAudio]);

  // Tempo markings
  const tempoMarkings = {
    30: 'Larghissimo', 40: 'Grave', 60: 'Largo', 66: 'Larghetto',
    76: 'Adagio', 108: 'Andante', 120: 'Moderato', 144: 'Allegro',
    168: 'Vivace', 200: 'Presto', 300: 'Prestissimo'
  };

  // Get tempo marking
  const getTempoMarking = (bpm: number): string => {
    const sortedMarkings = Object.keys(tempoMarkings)
      .map(Number)
      .sort((a, b) => a - b);
    
    let marking = 'Moderato';
    for (const markingBpm of sortedMarkings) {
      if (bpm >= markingBpm) {
        marking = tempoMarkings[markingBpm as keyof typeof tempoMarkings];
      }
    }
    return marking;
  };

  // Update quarter note time when tempo changes
  useEffect(() => {
    quarterNoteTimeRef.current = 60.0 / tempo;
  }, [tempo]);

  // Continuous pendulum animation system
  const lastBeatTime = useRef<number>(0);

  // Scheduler function
  const scheduler = useCallback(async () => {
    const currentTime = performance.now() / 1000;
    
    while (nextNoteTimeRef.current < currentTime + 0.1) {
      const isAccent = accentPattern.includes(currentBeat);
      
      // Calculate animation duration (one beat)
      const beatDuration = 60 / tempo;
      
      // Play sound at the exact beat time
      setTimeout(async () => {
        await playMetronomeSound(isAccent);
      }, 0);
      
      // Update beat counter
      const nextSubdivision = currentSubdivision + 1;
      if (nextSubdivision > subdivision) {
        const nextBeat = currentBeat + 1;
        setCurrentBeat(nextBeat > timeSignature.beats ? 1 : nextBeat);
        setCurrentSubdivision(1);
      } else {
        setCurrentSubdivision(nextSubdivision);
      }
      
      // Calculate next note time
      const noteInterval = quarterNoteTimeRef.current / subdivision;
      nextNoteTimeRef.current += noteInterval;
      lastBeatTime.current = nextNoteTimeRef.current;
    }
  }, [currentBeat, currentSubdivision, subdivision, timeSignature.beats, accentPattern, playMetronomeSound, tempo]);

  // Main metronome loop
  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(scheduler, 25); // 25ms lookahead
      intervalRef.current = interval;
      return () => {
        clearInterval(interval);
        intervalRef.current = null;
      };
    }
    // Cleanup function will handle stopping when isPlaying becomes false
  }, [isPlaying, scheduler]);

  // Cleanup effect for when component unmounts
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  // Start/Stop functions
  const start = () => {
    nextNoteTimeRef.current = performance.now() / 1000;
    setPendulumAngle(0); // Start at center (no jump)
    setIsPlaying(true);
  };

  const stop = () => {
    setIsPlaying(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    // Cancel any running animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    setCurrentBeat(1);
    setCurrentSubdivision(1);
    setPendulumAngle(0); // Return to center when stopped
  };

  // Tap tempo function
  const processTapTempo = () => {
    const now = Date.now();
    const newTapTimes = [...tapTimesRef.current, now].slice(-8); // Keep last 8 taps
    
    // Filter out taps older than 2 seconds
    const validTaps = newTapTimes.filter(time => now - time < 2000);
    
    if (validTaps.length >= 2) {
      const intervals = [];
      for (let i = 1; i < validTaps.length; i++) {
        intervals.push(validTaps[i] - validTaps[i - 1]);
      }
      
      const averageInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const newTempo = Math.round(60000 / averageInterval);
      
      if (newTempo >= 30 && newTempo <= 300) {
        setTempo(newTempo);
      }
    }
    
    tapTimesRef.current = validTaps;
    setTapTimes(validTaps);
  };

  // Handle tempo change
  const handleTempoChange = (newTempo: number) => {
    const clampedTempo = Math.max(30, Math.min(300, newTempo));
    setTempo(clampedTempo);
  };

  // Handle time signature change
  const handleTimeSignatureChange = (signature: string) => {
    const [beats, noteValue] = signature.split('/').map(Number);
    setTimeSignature({ beats, noteValue });
    setCurrentBeat(1);
    setCurrentSubdivision(1);
    
    // Reset accent pattern if invalid
    const maxBeat = Math.max(...accentPattern);
    if (maxBeat > beats) {
      setAccentPattern([1]);
    }
  };

  // Generate subdivision indicators
  const renderSubdivisionIndicators = () => {
    const indicators = [];
    for (let i = 1; i <= subdivision; i++) {
      indicators.push(
        <div
          key={i}
          className={`${styles.subdivisionDot} ${
            currentSubdivision === i ? styles.active : ''
          }`}
        />
      );
    }
    return indicators;
  };

  // Continuous pendulum animation
  useEffect(() => {
    if (!isPlaying) return;

    let animationId: number;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const beatDuration = (60 / tempo) * 1000;
      const beatProgress = (elapsed % beatDuration) / beatDuration;
      
      // Calculate which beat we're on
      const beatNumber = Math.floor(elapsed / beatDuration);
      const isEvenBeat = beatNumber % 2 === 0;
      const swingDirection = isEvenBeat ? 1 : -1;
      
      // Calculate pendulum angle with smooth sine wave
      const angle = Math.sin(beatProgress * Math.PI) * 25 * swingDirection;
      setPendulumAngle(angle);
      
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isPlaying, tempo]);

  return (
    <div className={styles.metronome}>
      {/* Top row - Tempo display */}
      <div className={styles.tempoDisplay}>
        <span className={styles.bpmNumber}>{tempo}</span> BPM
        <div className={styles.tempoMarking}>{getTempoMarking(tempo)}</div>
      </div>
      
      {/* Left column - Time signature and subdivision controls */}
      <div className={styles.leftControls}>
        <div className={styles.timeSignatureSection}>
          <label htmlFor="time-signature">Time Signature</label>
          <select 
            id="time-signature"
            value={`${timeSignature.beats}/${timeSignature.noteValue}`}
            onChange={(e) => handleTimeSignatureChange(e.target.value)}
          >
            <option value="4/4">4/4</option>
            <option value="3/4">3/4</option>
            <option value="2/4">2/4</option>
            <option value="6/8">6/8</option>
            <option value="5/4">5/4</option>
            <option value="7/8">7/8</option>
          </select>
        </div>

        <div className={styles.subdivisionSection}>
          <label htmlFor="subdivision">Subdivision</label>
          <select 
            id="subdivision"
            value={subdivision}
            onChange={(e) => setSubdivision(parseInt(e.target.value))}
          >
            <option value="1">Quarter Notes (♩)</option>
            <option value="2">Eighth Notes (♫)</option>
            <option value="4">Sixteenth Notes (♬)</option>
            <option value="3">Triplets (♩♩♩)</option>
          </select>
        </div>

        <div className={styles.beatCounter}>
          <span>{currentBeat}</span> / <span>{timeSignature.beats}</span>
          <div className={styles.subdivisionIndicator}>
            {renderSubdivisionIndicators()}
          </div>
        </div>
      </div>

      {/* Center - Large metronome visual */}
      <div className={styles.metronomeVisual}>
        <div className={styles.metronomeBase}>
          <div className={styles.metronomeBody}>
            <div className={styles.metronomeCenterLine}></div>
          </div>
          <div 
            className={styles.metronomePendulum}
            style={{
              transform: `translateX(-50%) rotate(${pendulumAngle}deg)`
            }}
          >
            <div className={styles.metronomeWeight}></div>
          </div>
        </div>
      </div>
      
      {/* Right column - Tempo controls and buttons */}
      <div className={styles.rightControls}>
        <div className={styles.tempoSettings}>
          <div className={styles.tempoInputSection}>
            <label htmlFor="tempo-input">Tempo (BPM)</label>
            <input 
              type="number" 
              min="30" 
              max="300" 
              value={tempo} 
              id="tempo-input" 
              className={styles.tempoInput}
              onChange={(e) => handleTempoChange(parseInt(e.target.value))}
            />
          </div>
          <input 
            type="range" 
            min="30" 
            max="300" 
            value={tempo} 
            id="tempo-slider"
            className={styles.slider} 
            onChange={(e) => handleTempoChange(parseInt(e.target.value))}
          />
          <div className={styles.tempoText}>
            <span>30</span>
            <span>BPM</span>
            <span>300</span>
          </div>
        </div>
        
        <div className={styles.controls}>
          <button 
            onClick={isPlaying ? stop : start}
            className={`${styles.startStop} ${isPlaying ? styles.playing : ''}`}
          >
            {isPlaying ? 'Stop' : 'Start'}
          </button>
          <button onClick={processTapTempo} className={styles.tapTempo}>
            Tap Tempo
          </button>
        </div>
      </div>
    </div>
  );
} 