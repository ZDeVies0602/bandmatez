'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import styles from '../styles/components.module.css';

export default function PitchTuner() {
  const [isListening, setIsListening] = useState(false);
  const [frequency, setFrequency] = useState(0);
  const [note, setNote] = useState('');
  const [cents, setCents] = useState(0);
  const [volume, setVolume] = useState(0);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number>();

  // Note frequencies (A4 = 440 Hz)
  const noteFrequencies = {
    'C': 261.63, 'C#': 277.18, 'D': 293.66, 'D#': 311.13,
    'E': 329.63, 'F': 349.23, 'F#': 369.99, 'G': 392.00,
    'G#': 415.30, 'A': 440.00, 'A#': 466.16, 'B': 493.88
  };

  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  // Convert frequency to note
  const frequencyToNote = useCallback((freq: number) => {
    if (freq < 80 || freq > 2000) return { note: '', cents: 0, octave: 0 };
    
    // Calculate which note this frequency is closest to
    const A4 = 440;
    const noteNumber = 12 * (Math.log2(freq / A4)) + 69;
    const roundedNoteNumber = Math.round(noteNumber);
    
    const noteName = noteNames[((roundedNoteNumber - 60) % 12 + 12) % 12];
    const octave = Math.floor((roundedNoteNumber - 12) / 12);
    
    // Calculate cents deviation
    const centsDeviation = Math.round((noteNumber - roundedNoteNumber) * 100);
    
    return {
      note: `${noteName}${octave}`,
      cents: centsDeviation,
      octave
    };
  }, []);

  // Get pitch from audio data
  const getPitch = useCallback((buffer: Float32Array, sampleRate: number) => {
    // Autocorrelation pitch detection
    const bufferSize = buffer.length;
    const correlations = new Float32Array(bufferSize);
    
    for (let lag = 0; lag < bufferSize; lag++) {
      let correlation = 0;
      for (let i = 0; i < bufferSize - lag; i++) {
        correlation += buffer[i] * buffer[i + lag];
      }
      correlations[lag] = correlation;
    }
    
    // Find the peak after the first zero crossing
    let maxCorrelation = 0;
    let bestLag = 0;
    
    for (let lag = Math.floor(sampleRate / 1000); lag < Math.floor(sampleRate / 80); lag++) {
      if (correlations[lag] > maxCorrelation) {
        maxCorrelation = correlations[lag];
        bestLag = lag;
      }
    }
    
    if (maxCorrelation > 0.3 && bestLag > 0) {
      return sampleRate / bestLag;
    }
    
    return 0;
  }, []);

  // Audio processing loop
  const processAudio = useCallback(() => {
    if (!analyserRef.current) return;
    
    const bufferLength = analyserRef.current.fftSize;
    const buffer = new Float32Array(bufferLength);
    const frequencyData = new Uint8Array(analyserRef.current.frequencyBinCount);
    
    analyserRef.current.getFloatTimeDomainData(buffer);
    analyserRef.current.getByteFrequencyData(frequencyData);
    
    // Calculate volume (RMS)
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
      sum += buffer[i] * buffer[i];
    }
    const rmsVolume = Math.sqrt(sum / buffer.length);
    setVolume(Math.round(rmsVolume * 100));
    
    // Only process pitch if there's sufficient volume
    if (rmsVolume > 0.01) {
      const detectedFreq = getPitch(buffer, audioContextRef.current!.sampleRate);
      
      if (detectedFreq > 0) {
        setFrequency(Math.round(detectedFreq * 10) / 10);
        const noteInfo = frequencyToNote(detectedFreq);
        setNote(noteInfo.note);
        setCents(noteInfo.cents);
      }
    } else {
      setFrequency(0);
      setNote('');
      setCents(0);
    }
    
    if (isListening) {
      animationRef.current = requestAnimationFrame(processAudio);
    }
  }, [isListening, getPitch, frequencyToNote]);

  // Start listening
  const startListening = async () => {
    try {
      // Initialize audio context
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      
      // Get microphone access
      streamRef.current = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        } 
      });
      
      // Create audio nodes
      microphoneRef.current = audioContextRef.current.createMediaStreamSource(streamRef.current);
      analyserRef.current = audioContextRef.current.createAnalyser();
      
      // Configure analyser
      analyserRef.current.fftSize = 4096;
      analyserRef.current.smoothingTimeConstant = 0.3;
      
      // Connect audio nodes
      microphoneRef.current.connect(analyserRef.current);
      
      setIsListening(true);
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  // Stop listening
  const stopListening = () => {
    setIsListening(false);
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    
    // Reset state
    setFrequency(0);
    setNote('');
    setCents(0);
    setVolume(0);
  };

  // Start processing when listening begins
  useEffect(() => {
    if (isListening && analyserRef.current) {
      processAudio();
    }
  }, [isListening, processAudio]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isListening) {
        stopListening();
      }
    };
  }, []);

  // Get tuning status
  const getTuningStatus = () => {
    if (!note || Math.abs(cents) < 5) return 'in-tune';
    if (cents < -5) return 'flat';
    return 'sharp';
  };

  return (
    <div className={styles.tunerContainer}>
      {/* Main Display */}
      <div className={styles.tunerDisplay}>
        <div className={styles.noteDisplay}>
          {note || '♪'}
        </div>
        
        <div className={styles.frequencyDisplay}>
          {frequency > 0 ? `${frequency} Hz` : '---'}
        </div>
        
        {/* Cents Meter */}
        <div className={styles.centsMeter}>
          <div className={styles.centsScale}>
            {[-50, -25, 0, 25, 50].map(cent => (
              <div key={cent} className={styles.centsMarkLine}>
                <span className={styles.centsMark}>{cent}</span>
              </div>
            ))}
          </div>
          
          <div 
            className={`${styles.centsIndicator} ${styles[getTuningStatus()]}`}
            style={{
              transform: `translateX(${Math.max(-50, Math.min(50, cents)) * 2}px)`
            }}
          />
        </div>
        
        <div className={`${styles.centsDisplay} ${styles[getTuningStatus()]}`}>
          {Math.abs(cents) < 5 ? 'In Tune' : `${cents > 0 ? '+' : ''}${cents} cents`}
        </div>
      </div>

      {/* Controls */}
      <div className={styles.tunerControls}>
        <button
          onClick={isListening ? stopListening : startListening}
          className={`${styles.tunerButton} ${isListening ? styles.listening : ''}`}
        >
          {isListening ? '⏸ Stop' : '🎤 Start Tuning'}
        </button>
        
        <div className={styles.volumeMeter}>
          <label>Input Level:</label>
          <div className={styles.volumeBar}>
            <div 
              className={styles.volumeLevel}
              style={{ width: `${Math.min(100, volume * 3)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Instructions */}
      {!isListening && (
        <div className={styles.tunerInstructions}>
          <p>Click "Start Tuning" and play a note on your instrument.</p>
          <p>The tuner will show the detected pitch and how many cents sharp or flat you are.</p>
        </div>
      )}
    </div>
  );
} 