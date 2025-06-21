'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAudioManager } from '../hooks/useAudioManager';
import { useSound } from '../contexts/SoundContext';
import { PianoKey } from '../types';
import styles from '../styles/piano.module.css';

export default function VirtualPiano() {
  const { audioContext, masterGain, playTone, stopTone } = useAudioManager();
  const { pianoWaveType } = useSound();
  
  // Piano state
  const [volume, setVolume] = useState(0.5);
  const [sustain, setSustain] = useState(0.5);
  const [currentNote, setCurrentNote] = useState('');
  const [currentFrequency, setCurrentFrequency] = useState('');
  const [selectedChord, setSelectedChord] = useState('');
  const [highlightedKeys, setHighlightedKeys] = useState<Set<string>>(new Set());
  
  // Scrolling state
  const [currentStartKeyIndex, setCurrentStartKeyIndex] = useState(22); // Middle position
  const [edgeKeysVisible, setEdgeKeysVisible] = useState({ f2Sharp: true, d6Sharp: true });
  
  // Piano configuration
  const totalKeys = 88;
  const visibleKeys = 44;
  const scrollIncrement = 22;
  
  // Note mappings
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const whiteKeys = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const blackKeys = ['C#', 'D#', 'F#', 'G#', 'A#'];
  
  // Chord definitions
  const chords = {
    'C-major': ['C', 'E', 'G'],
    'C-minor': ['C', 'D#', 'G'],
    'D-major': ['D', 'F#', 'A'],
    'D-minor': ['D', 'F', 'A'],
    'E-major': ['E', 'G#', 'B'],
    'E-minor': ['E', 'G', 'B'],
    'F-major': ['F', 'A', 'C'],
    'F-minor': ['F', 'G#', 'C'],
    'G-major': ['G', 'B', 'D'],
    'G-minor': ['G', 'A#', 'D'],
    'A-major': ['A', 'C#', 'E'],
    'A-minor': ['A', 'C', 'E'],
    'B-major': ['B', 'D#', 'F#'],
    'B-minor': ['B', 'D', 'F#']
  };

  // Keyboard mapping
  const keyboardMap: { [key: string]: { note: string; octaveOffset: number } } = {
    'KeyZ': { note: 'C', octaveOffset: 0 },
    'KeyS': { note: 'C#', octaveOffset: 0 },
    'KeyX': { note: 'D', octaveOffset: 0 },
    'KeyD': { note: 'D#', octaveOffset: 0 },
    'KeyC': { note: 'E', octaveOffset: 0 },
    'KeyV': { note: 'F', octaveOffset: 0 },
    'KeyG': { note: 'F#', octaveOffset: 0 },
    'KeyB': { note: 'G', octaveOffset: 0 },
    'KeyH': { note: 'G#', octaveOffset: 0 },
    'KeyN': { note: 'A', octaveOffset: 0 },
    'KeyJ': { note: 'A#', octaveOffset: 0 },
    'KeyM': { note: 'B', octaveOffset: 0 },
    'KeyQ': { note: 'C', octaveOffset: 1 },
    'Digit2': { note: 'C#', octaveOffset: 1 },
    'KeyW': { note: 'D', octaveOffset: 1 },
    'Digit3': { note: 'D#', octaveOffset: 1 },
    'KeyE': { note: 'E', octaveOffset: 1 },
    'KeyR': { note: 'F', octaveOffset: 1 },
    'Digit5': { note: 'F#', octaveOffset: 1 },
    'KeyT': { note: 'G', octaveOffset: 1 },
    'Digit6': { note: 'G#', octaveOffset: 1 },
    'KeyY': { note: 'A', octaveOffset: 1 },
    'Digit7': { note: 'A#', octaveOffset: 1 },
    'KeyU': { note: 'B', octaveOffset: 1 }
  };

  const activeOscillators = useRef<Map<string, OscillatorNode>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate all 88 keys mapping
  const generateAllKeys = (): PianoKey[] => {
    const keys: PianoKey[] = [];
    
    // Start from A0 (index 0)
    for (let i = 0; i < totalKeys; i++) {
      const noteIndex = (i + 9) % 12; // A0 starts at index 9 in our note cycle
      const note = noteNames[noteIndex];
      const octave = Math.floor((i + 9) / 12);
      const frequency = 440 * Math.pow(2, (i - 48) / 12); // A4 is at index 48
      const isBlack = blackKeys.includes(note);
      
      keys.push({
        note,
        frequency,
        isBlack,
        octave,
        keyIndex: i
      });
    }
    
    return keys;
  };

  const allKeys = generateAllKeys();

  // Get visible keys based on current start index
  const getVisibleKeys = () => {
    return allKeys.slice(currentStartKeyIndex, currentStartKeyIndex + visibleKeys);
  };

  // Convert note to frequency
  const noteToFrequency = (note: string, octave: number): number => {
    const noteIndex = noteNames.indexOf(note);
    const a4Index = 57; // A4 is the 57th key (0-indexed)
    const keyIndex = octave * 12 + noteIndex;
    const semitonesFromA4 = keyIndex - a4Index;
    return 440 * Math.pow(2, semitonesFromA4 / 12);
  };

  // Play note function
  const playNote = async (note: string, octave: number) => {
    if (!audioContext || !masterGain) return;

    const frequency = noteToFrequency(note, octave);
    const noteKey = `${note}${octave}`;
    
    // Stop existing note if playing
    if (activeOscillators.current.has(noteKey)) {
      stopNote(note, octave);
    }

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(masterGain);
    
    oscillator.frequency.value = frequency;
    oscillator.type = pianoWaveType;
    
    // Set up ADSR envelope
    const now = audioContext.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(volume * 0.5, now + 0.01); // Attack
    gainNode.gain.exponentialRampToValueAtTime(volume * 0.3, now + 0.1); // Decay
    gainNode.gain.setValueAtTime(volume * 0.3 * sustain, now + 0.1); // Sustain
    
    oscillator.start(now);
    activeOscillators.current.set(noteKey, oscillator);
    
    // Update display
    setCurrentNote(`${note}${octave}`);
    setCurrentFrequency(`${frequency.toFixed(2)} Hz`);
    
    // Highlight key
    setHighlightedKeys(prev => new Set([...Array.from(prev), noteKey]));
  };

  // Stop note function
  const stopNote = (note: string, octave: number) => {
    const noteKey = `${note}${octave}`;
    const oscillator = activeOscillators.current.get(noteKey);
    
    if (oscillator) {
      const gainNode = oscillator.context.createGain();
      oscillator.disconnect();
      oscillator.connect(gainNode);
      gainNode.connect(masterGain!);
      
      const now = audioContext!.currentTime;
      gainNode.gain.setValueAtTime(volume * 0.3 * sustain, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3); // Release
      
      oscillator.stop(now + 0.3);
      activeOscillators.current.delete(noteKey);
    }
    
    // Remove highlight
    setHighlightedKeys(prev => {
      const newSet = new Set(prev);
      newSet.delete(noteKey);
      return newSet;
    });
  };

  // Scroll functions
  const scrollLeft = () => {
    const newStartIndex = Math.max(0, currentStartKeyIndex - scrollIncrement);
    setCurrentStartKeyIndex(newStartIndex);
    updateEdgeKeyVisibility(newStartIndex);
  };

  const scrollRight = () => {
    const maxStartIndex = totalKeys - visibleKeys;
    const newStartIndex = Math.min(maxStartIndex, currentStartKeyIndex + scrollIncrement);
    setCurrentStartKeyIndex(newStartIndex);
    updateEdgeKeyVisibility(newStartIndex);
  };

  // Update edge key visibility
  const updateEdgeKeyVisibility = (startIndex: number) => {
    const isMiddle = startIndex === 22; // Middle position
    setEdgeKeysVisible({
      f2Sharp: !isMiddle, // F#2 (index 21) hidden in middle
      d6Sharp: !isMiddle  // D#6 (index 66) hidden in middle
    });
  };

  // Play chord function
  const playChord = async () => {
    if (!selectedChord || !chords[selectedChord as keyof typeof chords]) return;
    
    const chordNotes = chords[selectedChord as keyof typeof chords];
    const baseOctave = 4;
    
    // Clear previous highlights
    setHighlightedKeys(new Set());
    
    // Play each note in the chord
    for (const note of chordNotes) {
      await playNote(note, baseOctave);
    }
  };

  // Clear all highlights
  const clearHighlights = () => {
    // Stop all active notes
    activeOscillators.current.forEach((osc, key) => {
      const [note, octave] = key.match(/([A-G]#?)(\d+)/)?.slice(1) || [];
      if (note && octave) {
        stopNote(note, parseInt(octave));
      }
    });
    
    setHighlightedKeys(new Set());
    setCurrentNote('');
    setCurrentFrequency('');
  };

  // Keyboard event handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      
      const mapping = keyboardMap[e.code];
      if (mapping) {
        e.preventDefault();
        const visibleKeys = getVisibleKeys();
        const baseKey = visibleKeys.find(key => key.note === mapping.note);
        if (baseKey) {
          playNote(mapping.note, baseKey.octave + mapping.octaveOffset);
        }
      }
      
      // Arrow key navigation
      if (e.code === 'ArrowLeft') {
        e.preventDefault();
        scrollLeft();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        scrollRight();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const mapping = keyboardMap[e.code];
      if (mapping) {
        e.preventDefault();
        const visibleKeys = getVisibleKeys();
        const baseKey = visibleKeys.find(key => key.note === mapping.note);
        if (baseKey) {
          stopNote(mapping.note, baseKey.octave + mapping.octaveOffset);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [currentStartKeyIndex]);

  // Get current range display
  const getCurrentRange = () => {
    const visibleKeys = getVisibleKeys();
    const firstKey = visibleKeys[0];
    const lastKey = visibleKeys[visibleKeys.length - 1];
    return `${firstKey.note}${firstKey.octave} - ${lastKey.note}${lastKey.octave}`;
  };

  // Render piano key
  const renderKey = (key: PianoKey, index: number) => {
    const noteKey = `${key.note}${key.octave}`;
    const isHighlighted = highlightedKeys.has(noteKey);
    const isEdgeKey = key.keyIndex === 21 || key.keyIndex === 66; // F#2 or D#6
    const shouldHideEdgeKey = isEdgeKey && ((key.keyIndex === 21 && !edgeKeysVisible.f2Sharp) || (key.keyIndex === 66 && !edgeKeysVisible.d6Sharp));
    
    return (
      <div
        key={`${key.note}-${key.octave}-${key.keyIndex}`}
        className={`
          ${styles.pianoKey}
          ${key.isBlack ? styles.blackKey : styles.whiteKey}
          ${isHighlighted ? styles.active : ''}
        `}
        style={{
          visibility: shouldHideEdgeKey ? 'hidden' : 'visible'
        }}
        onMouseDown={() => playNote(key.note, key.octave)}
        onMouseUp={() => stopNote(key.note, key.octave)}
        onMouseLeave={() => stopNote(key.note, key.octave)}
        data-key-index={key.keyIndex}
        data-note={`${key.note}${key.octave}`}
      >
        <span className={styles.keyLabel}>
          {key.note}{key.octave}
        </span>
      </div>
    );
  };

  return (
    <div className={styles.pianoContainer}>
      {/* Current Note Display */}
      <div className={styles.noteDisplay}>
        <div className={styles.currentNote}>
          {currentNote || '♪'}
        </div>
        <div className={styles.currentFrequency}>
          {currentFrequency || '---'}
        </div>
      </div>

      {/* Piano Navigation */}
      <div className={styles.pianoNavigation}>
        <button
          onClick={scrollLeft}
          disabled={currentStartKeyIndex === 0}
          className={styles.scrollButton}
        >
          ◀
        </button>
        
        <div className={styles.rangeDisplay}>
          {getCurrentRange()}
        </div>
        
        <button
          onClick={scrollRight}
          disabled={currentStartKeyIndex >= totalKeys - visibleKeys}
          className={styles.scrollButton}
        >
          ▶
        </button>
      </div>

      {/* Piano Keyboard */}
      <div className={styles.pianoKeyboardContainer} ref={containerRef}>
        <div className={styles.pianoKeyboard}>
          {getVisibleKeys().map((key, index) => renderKey(key, index))}
        </div>
      </div>

      {/* Piano Controls */}
      <div className={styles.pianoControls}>
        {/* Volume Control */}
        <div className={styles.controlGroup}>
          <label>Volume: {Math.round(volume * 100)}%</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            id="volume-slider"
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className={styles.slider}
          />
        </div>

        {/* Sustain Control */}
        <div className={styles.controlGroup}>
          <label>Sustain: {Math.round(sustain * 100)}%</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={sustain}
            id="sustain-slider"
            onChange={(e) => setSustain(parseFloat(e.target.value))}
            className={styles.slider}
          />
        </div>

        {/* Chord Controls */}
        <div className={styles.controlGroup}>
          <label>Chord:</label>
          <select
            value={selectedChord}
            onChange={(e) => setSelectedChord(e.target.value)}
            className={styles.select}
          >
            <option value="">Select Chord</option>
            {Object.keys(chords).map(chord => (
              <option key={chord} value={chord}>
                {chord.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </option>
            ))}
          </select>
          
          <div className={styles.buttonGroup}>
            <button onClick={playChord} className={styles.button}>
              Play Chord
            </button>
            <button onClick={clearHighlights} className={styles.button}>
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className={styles.instructions}>
        <p>🎹 <strong>Mouse:</strong> Click keys to play • <strong>Keyboard:</strong> Use ZSXDCVGBHNJM (lower octave) and QWERTYUIOP (upper octave)</p>
        <p>🔄 <strong>Navigation:</strong> Use ◀▶ buttons or ←→ arrow keys to scroll • <strong>Range:</strong> {getCurrentRange()}</p>
      </div>
    </div>
  );
} 