'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useMetronomeSounds } from '../hooks/useMetronomeSounds';
import { MetronomeSettings } from '../types';
import styles from '../styles/components.module.css';

export default function Metronome() {
  const { currentSound, playSound } = useMetronomeSounds();
  
  // Core state
  const [isPlaying, setIsPlaying] = useState(false);
  const [tempo, setTempo] = useState(120);
  const [timeSignature, setTimeSignature] = useState({ beats: 4, noteValue: 4 });
  const [subdivision, setSubdivision] = useState(1);
  const [currentBeat, setCurrentBeat] = useState(1);
  const [currentSubdivision, setCurrentSubdivision] = useState(1);
  const [accentPattern, setAccentPattern] = useState([1]);
  const [pendulumAngle, setPendulumAngle] = useState(0);
  const [animationCycle, setAnimationCycle] = useState(0);
  const animationRef = useRef<number | null>(null);
  const animationStartTime = useRef<number>(0);
  const animationDuration = useRef<number>(0);
  const startAngle = useRef<number>(0);
  const endAngle = useRef<number>(0);
  
  // Tap tempo
  const [tapTimes, setTapTimes] = useState<number[]>([]);
  const tapTimesRef = useRef<number[]>([]);
  
  // Audio timing
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const nextNoteTimeRef = useRef(0);
  const quarterNoteTimeRef = useRef(60.0 / 120);
  
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

  // Easing function for smooth animation
  const easeInOutQuad = (t: number): number => {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  };

  // Even smoother easing function
  const easeInOutCubic = (t: number): number => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };

  // Smooth pendulum animation using requestAnimationFrame
  const animatePendulum = (fromAngle: number, toAngle: number, duration: number) => {
    startAngle.current = fromAngle;
    endAngle.current = toAngle;
    animationDuration.current = duration;
    animationStartTime.current = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - animationStartTime.current;
      const progress = Math.min(elapsed / animationDuration.current, 1);
      const easedProgress = easeInOutCubic(progress);
      
      const currentAngle = startAngle.current + (endAngle.current - startAngle.current) * easedProgress;
      setPendulumAngle(currentAngle);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  // Scheduler function
  const scheduler = useCallback(async () => {
    const currentTime = performance.now() / 1000;
    
    while (nextNoteTimeRef.current < currentTime + 0.1) {
      const isAccent = accentPattern.includes(currentBeat);
      
      // Calculate animation duration (one beat)
      const beatDuration = 60 / tempo;
      
      // Animate pendulum to opposite side
      const currentAngle = pendulumAngle;
      const targetAngle = currentAngle === 25 ? -25 : 25;
      
      // Play sound at midpoint of animation (when crossing center)
      setTimeout(async () => {
        await playSound(currentSound, isAccent);
      }, (beatDuration / 2) * 1000);
      
      // Start smooth animation
      animatePendulum(currentAngle, targetAngle, beatDuration * 1000);
      
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
    }
  }, [currentBeat, currentSubdivision, subdivision, timeSignature.beats, accentPattern, playSound, currentSound, tempo, pendulumAngle]);

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
    setAnimationCycle(prev => prev + 1); // Force re-render
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
            key={`pendulum-${animationCycle}`}
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