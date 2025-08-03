"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAudioManager } from "../hooks/useAudioManager";
import { useSound } from "../contexts/SoundContext";
import { useThemeClasses } from "../hooks/useThemeClasses";
import { PianoKey } from "../types";

export default function VirtualPiano() {
  const { audioContext, masterGain, masterVolume, setMasterVolume } = useAudioManager();
  const { pianoWaveType } = useSound();
  const themeClasses = useThemeClasses();

  // Piano state
  const [currentNote, setCurrentNote] = useState("");
  const [useSharps, setUseSharps] = useState(true); // Toggle between sharps and flats
  const [pressedKeys, setPressedKeys] = useState<Set<number>>(new Set()); // Track pressed keys
  const [hoveredKey, setHoveredKey] = useState<number | null>(null); // Track hovered key
  const [pressedKeyboardKeys, setPressedKeyboardKeys] = useState<Set<string>>(new Set()); // Track keyboard keys

  // Piano configuration - Show all keys, no scrolling
  const totalKeys = 61; // C2 to C7 (5 octaves + C7)
  const visibleKeys = 61; // Show ALL keys at once

  // Keyboard to piano key mapping - intuitive layout
  const keyboardMapping: { [key: string]: number } = {
    // QWERTYUIOP row - White keys from C3 to E4
    'q': 12,  // C3
    'w': 14,  // D3  
    'e': 16,  // E3
    'r': 17,  // F3
    't': 19,  // G3
    'y': 21,  // A3
    'u': 23,  // B3
    'i': 24,  // C4
    'o': 26,  // D4
    'p': 28,  // E4
    
    // Number row - Black keys for C3-E4 range
    '2': 13,  // C#3
    '3': 15,  // D#3
    '5': 18,  // F#3
    '6': 20,  // G#3
    '7': 22,  // A#3
    '9': 25,  // C#4
    '0': 27,  // D#4
    
    // ZXCVBNM,./ row - White keys from F4 to A5
    'z': 29,  // F4
    'x': 31,  // G4
    'c': 33,  // A4
    'v': 35,  // B4
    'b': 36,  // C5
    'n': 38,  // D5
    'm': 40,  // E5
    ',': 41,  // F5
    '.': 43,  // G5
    '/': 45,  // A5
    
    // ASDFGHJKL;' row - Black keys for F4-A5 range
    's': 30,  // F#4
    'd': 32,  // G#4
    'f': 34,  // A#4
    'h': 37,  // C#5
    'j': 39,  // D#5
    'l': 42,  // F#5
    ';': 44,  // G#5
  };

  // Reverse mapping for display purposes
  const pianoToKeyboardMapping: { [key: number]: string } = {};
  Object.entries(keyboardMapping).forEach(([keyboard, piano]) => {
    pianoToKeyboardMapping[piano] = keyboard;
  });

  // Note mappings with both sharp and flat names
  const noteNames = [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B",
  ];

  const flatNoteNames = [
    "C",
    "Db",
    "D",
    "Eb",
    "E",
    "F",
    "Gb",
    "G",
    "Ab",
    "A",
    "Bb",
    "B",
  ];

  const blackKeys = ["C#", "D#", "F#", "G#", "A#"];

  const activeOscillators = useRef<Map<string, OscillatorNode>>(new Map());

  // Smooth fadeOut function like Pianosition
  const fadeOut = useCallback((oscillator: OscillatorNode, gainNode: GainNode, milliseconds: number = 300) => {
    if (!audioContext) return;
    
    const currentTime = audioContext.currentTime;
    const currentVolume = gainNode.gain.value;
    
    gainNode.gain.cancelScheduledValues(currentTime);
    gainNode.gain.setValueAtTime(currentVolume, currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + milliseconds / 1000);
    
    setTimeout(() => {
      try {
        oscillator.stop();
      } catch (error) {
        console.error("Error stopping oscillator:", error);
      }
    }, milliseconds);
  }, [audioContext]);

  // Calculate key frequency (A4 = 440 Hz)
  const calculateFrequency = (note: string, octave: number): number => {
    const noteIndex = (useSharps ? noteNames : flatNoteNames).indexOf(note);
    const semitones = (octave - 4) * 12 + noteIndex - 9;
    return 440 * Math.pow(2, semitones / 12);
  };

  // Generate piano keys from C2 to C7
  const generateKeys = (): PianoKey[] => {
    const keys: PianoKey[] = [];
    let keyIndex = 0;

    // Start from octave 2, end at octave 7 (but only include C7)
    for (let octave = 2; octave <= 7; octave++) {
      for (let noteIndex = 0; noteIndex < 12; noteIndex++) {
        // Stop after C7 (first note of octave 7)
        if (octave === 7 && noteIndex > 0) break;
        
        const sharpNote = noteNames[noteIndex];
        const flatNote = flatNoteNames[noteIndex];
        const frequency = calculateFrequency(sharpNote, octave);
        const isBlack = blackKeys.includes(sharpNote);

        keys.push({
          note: sharpNote, // Default to sharp name
          flatNote: flatNote, // Store flat alternative
          frequency,
          isBlack,
          octave,
          keyIndex: keyIndex++,
        });
      }
    }
    return keys;
  };

  const allKeys = generateKeys();

  // Stop note with smooth fadeout
  const stopNote = useCallback((note: string, octave: number, keyIndex: number) => {
    const noteKey = `${note}${octave}`;
    const oscillator = activeOscillators.current.get(noteKey);

    if (oscillator) {
      try {
        // Find the gain node (oscillator is connected to it)
        const gainNode = oscillator.context.createGain();
        fadeOut(oscillator, gainNode, 200);
        activeOscillators.current.delete(noteKey);
        
        // Remove from pressed keys
        setPressedKeys(prev => {
          const newSet = new Set(prev);
          newSet.delete(keyIndex);
          return newSet;
        });
      } catch (error) {
        console.error("Error stopping note:", error);
      }
    }
  }, [fadeOut]);

  // Play note with improved functionality
  const playNote = useCallback(
    (note: string, octave: number, keyIndex: number, rightClick: boolean = false) => {
      const frequency = calculateFrequency(note, octave);
      const noteKey = `${note}${octave}`;

      // Toggle sharp/flat notation on right click
      if (rightClick) {
        setUseSharps(!useSharps);
        return;
      }

      // Stop existing note if playing
      if (activeOscillators.current.has(noteKey)) {
        stopNote(note, octave, keyIndex);
        return;
      }

      try {
        if (audioContext && masterGain) {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();

          oscillator.connect(gainNode);
          gainNode.connect(masterGain);

          oscillator.frequency.value = frequency;
          oscillator.type = pianoWaveType;

          gainNode.gain.setValueAtTime(0, audioContext.currentTime);
          gainNode.gain.linearRampToValueAtTime(
            0.3,
            audioContext.currentTime + 0.01
          );
          gainNode.gain.exponentialRampToValueAtTime(
            0.1,
            audioContext.currentTime + 0.1
          );

          oscillator.start();
          activeOscillators.current.set(noteKey, oscillator);
          
          // Track pressed key
          setPressedKeys(prev => new Set([...prev, keyIndex]));
          setCurrentNote(noteKey);
        }
      } catch (error) {
        console.error("Error playing note:", error);
      }
    },
    [audioContext, masterGain, pianoWaveType, useSharps, stopNote]
  );

  // Keyboard event handlers
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Prevent default behavior for piano keys
    const key = event.key;
    const keyIndex = keyboardMapping[key];
    
    if (keyIndex !== undefined && !pressedKeyboardKeys.has(key)) {
      event.preventDefault();
      setPressedKeyboardKeys(prev => new Set([...prev, key]));
      
      const pianoKey = allKeys[keyIndex];
      if (pianoKey) {
        playNote(pianoKey.note, pianoKey.octave, pianoKey.keyIndex, false);
      }
    }
  }, [pressedKeyboardKeys, allKeys, playNote]);

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    const key = event.key;
    const keyIndex = keyboardMapping[key];
    
    if (keyIndex !== undefined && pressedKeyboardKeys.has(key)) {
      event.preventDefault();
      setPressedKeyboardKeys(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
      
      const pianoKey = allKeys[keyIndex];
      if (pianoKey) {
        stopNote(pianoKey.note, pianoKey.octave, pianoKey.keyIndex);
      }
    }
  }, [pressedKeyboardKeys, allKeys, stopNote]);

  // Add keyboard event listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  // Get visible keys (all keys in our case)
  const getVisibleKeys = (): PianoKey[] => {
    return allKeys.slice(
      0, // Start from the beginning
      visibleKeys
    );
  };

  // Render piano key with Pianosition-inspired professional styling
  const renderKey = (key: PianoKey, index: number) => {
    const isPressed = pressedKeys.has(key.keyIndex);
    const isHovered = hoveredKey === key.keyIndex;
    const keyboardKey = pianoToKeyboardMapping[key.keyIndex];
    const isKeyboardPressed = keyboardKey && pressedKeyboardKeys.has(keyboardKey);
    const displayNote = useSharps ? key.note : (key.flatNote || key.note);

    // Key is considered "active" if pressed by mouse or keyboard
    const isActive = isPressed || isKeyboardPressed;

    // Calculate positioning using percentage-based layout for full width
    const totalWhiteKeys = allKeys.filter(k => !k.isBlack).length; // 36 white keys
    const whiteKeyWidthPercent = 100 / totalWhiteKeys; // Revert to normal 100% width
    const blackKeyWidthPercent = whiteKeyWidthPercent * 0.6; // Black keys smaller
    
    // Count white keys before this key
    let whiteKeysBeforeThis = 0;
    for (let i = 0; i < key.keyIndex; i++) {
      if (!allKeys[i].isBlack) {
        whiteKeysBeforeThis++;
      }
    }

    let leftPositionPercent;
    if (key.isBlack) {
      // Proper piano positioning - black keys in 2-3 groups like real piano
      const noteInOctave = key.keyIndex % 12;
      const octaveStart = Math.floor(key.keyIndex / 12);
      
      // Calculate position based on actual white key positions in octave
      // Black keys should be at the boundary between two white keys
      let leftWhiteKeyIndex;
      if (noteInOctave === 1) { // C# - between C(0) and D(1)
        leftWhiteKeyIndex = 0; // Position at end of C
      } else if (noteInOctave === 3) { // D# - between D(1) and E(2)  
        leftWhiteKeyIndex = 1; // Position at end of D
      } else if (noteInOctave === 6) { // F# - between F(3) and G(4)
        leftWhiteKeyIndex = 3; // Position at end of F
      } else if (noteInOctave === 8) { // G# - between G(4) and A(5)
        leftWhiteKeyIndex = 4; // Position at end of G
      } else if (noteInOctave === 10) { // A# - between A(5) and B(6)
        leftWhiteKeyIndex = 5; // Position at end of A
      } else {
        leftWhiteKeyIndex = 0; // Fallback
      }
      
      const octaveWhiteKeyOffset = octaveStart * 7; // 7 white keys per octave
      const totalWhiteKeyIndex = octaveWhiteKeyOffset + leftWhiteKeyIndex;
      // Position at the boundary (right edge of left white key) and center the black key
      leftPositionPercent = (totalWhiteKeyIndex + 1) * whiteKeyWidthPercent - (blackKeyWidthPercent / 2);
    } else {
      // White key: normal positioning
      leftPositionPercent = whiteKeysBeforeThis * whiteKeyWidthPercent;
    }

    return (
      <div
        key={`${key.note}-${key.octave}-${key.keyIndex}`}
        className={`
          absolute top-0 select-none transition-all duration-200 ease-out
          ${key.isBlack ? 'z-50' : 'z-10'}
        `}
        style={{
          left: `${leftPositionPercent}%`,
          width: key.isBlack ? `${blackKeyWidthPercent}%` : `${whiteKeyWidthPercent}%`,
          height: key.isBlack ? '200px' : '300px'
        }}
      >
        {/* Key Shadow (rendered behind key) */}
        <div 
          className={`
            absolute top-0 left-0 w-full h-full rounded-b-lg transition-all duration-200 pointer-events-none
            ${key.isBlack ? 'z-0' : 'z-0'}
            ${key.isBlack
              ? 'shadow-[0_6px_8px_-2px_rgba(0,0,0,0.75)]'
              : 'shadow-[0_4px_6px_0_rgba(0,0,0,0.5)]'
            }
            ${isActive ? 'shadow-[0_2px_4px_-1px_rgba(0,0,0,0.3)]' : ''}
          `}
        />

        {/* The actual key */}
        <div
          className={`
            absolute top-0 left-0 w-full h-full rounded-b-lg cursor-pointer
            transition-all duration-200 ease-out select-none 
            ${key.isBlack ? 'border border-gray-700 z-20' : 'border border-black z-20'}
            ${!isActive ? 'active:scale-y-[0.99]' : ''}
          `}
          style={{
            backgroundColor: key.isBlack 
              ? (isActive ? '#60a5fa' : (isHovered ? '#4b5563' : '#1f2937'))
              : (isActive ? 'rgb(136,221,255)' : (isHovered ? 'rgb(209,242,255)' : 'white'))
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            playNote(key.note, key.octave, key.keyIndex, false);
          }}
          onMouseUp={(e) => {
            e.preventDefault();
            stopNote(key.note, key.octave, key.keyIndex);
          }}
          onMouseEnter={(e) => {
            setHoveredKey(key.keyIndex);
          }}
          onMouseLeave={(e) => {
            e.preventDefault();
            setHoveredKey(null);
            stopNote(key.note, key.octave, key.keyIndex);
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            setUseSharps(!useSharps);
          }}
        >
          {/* Key Label */}
          <div 
            className={`
              absolute bottom-0 left-0 w-full text-center transition-all duration-200
              font-medium select-none pointer-events-none
              ${key.isBlack 
                ? `pb-4 text-xs ${
                    isActive 
                      ? 'text-[var(--bg-light)] scale-y-95 font-semibold' 
                      : isHovered 
                        ? 'text-[var(--text-dark)] font-semibold'
                        : 'text-[var(--text-dark)]'
                  }`
                : `pb-6 text-sm ${
                    isActive 
                      ? 'text-[var(--bg-light)] scale-y-95 font-semibold' 
                      : isHovered
                        ? 'text-[var(--text-dark)]'
                        : 'text-[var(--text-dark)]'
                  }`
              }
            `}
          >
            <div>{displayNote}</div>
            {keyboardKey && (
              <div className={`
                text-xs opacity-60 font-normal mt-1
                ${key.isBlack ? 'text-[var(--neutral-gray)]' : 'text-[var(--neutral-gray)]'}
              `}>
                {keyboardKey === ' ' ? 'Space' : 
                 keyboardKey.length > 1 ? keyboardKey.substring(0, 3) : keyboardKey}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Cleanup oscillators on unmount
  useEffect(() => {
    return () => {
      activeOscillators.current.forEach((oscillator) => {
        try {
          oscillator.stop();
        } catch (error) {
          console.error("Error stopping oscillator:", error);
        }
      });
      activeOscillators.current.clear();
    };
  }, []);

  return (
    <div className="w-screen h-full flex flex-col" style={{ marginLeft: 'calc(-50vw + 50%)' }}>
      {/* Current Note Display with Notation Mode */}
      <div className="">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg p-2 text-center max-w-md mx-auto">
          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-[var(--text-dark)] mb-1">
                {currentNote || "♪"}
              </div>
              <div className="text-xs text-[var(--neutral-gray)]">
                {currentNote
                  ? `${calculateFrequency(
                      currentNote.slice(0, -1),
                      parseInt(currentNote.slice(-1))
                    ).toFixed(1)} Hz`
                  : "Press any key"}
              </div>
            </div>
            
            <div className="w-px h-8 bg-white/20"></div>
            
            <div className="text-center">
              <div className="text-sm font-medium text-[var(--text-dark)]">
                {useSharps ? "♯" : "♭"} Mode
              </div>
              <div className="text-xs text-[var(--neutral-gray)]">
                Right-click to toggle
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Piano Range Display with Instructions */}
      <div className="mt-2">
        <div className="flex items-center justify-center gap-4">
          <div className="text-center">
            <div className="text-sm text-[var(--neutral-gray)] font-medium">
              🎹 Tall Professional Piano: C2 - C7 (61 Keys)
            </div>
            <div className="text-xs text-[var(--neutral-gray)] mt-1">
              <span className="inline-block mr-3">• Click or use keyboard to play</span>
              <span className="inline-block mr-3">• Right-click to toggle ♯/♭ notation</span>
              <span className="inline-block">• Keyboard shortcuts shown on keys</span>
            </div>
            <div className="text-xs text-[var(--neutral-gray)] mt-1 opacity-75">
              Keyboard Layout: QWERTYUIOP (C3-E4), 23 567 90 (black keys), ZXCVBNM,./ (F4-A5), SDF HJ L; (black keys)
            </div>
          </div>
        </div>
      </div>

      {/* Piano Keyboard - Professional Layout with Absolute Positioning */}
      <div className="bg-white/10 backdrop-blur-xl border-y border-white/20 overflow-hidden flex-1 relative z-50 pl-2 mt-2">
        <div 
          className="relative bg-gradient-to-b from-gray-200 to-gray-300 w-full h-full"
        >
          {/* Piano keyboard surface background */}
          <div className="absolute inset-0 bg-gradient-to-b from-gray-100 via-gray-200 to-gray-300 rounded-t-sm" />
          
          {/* Piano keys - All in one container with proper layering */}
          <div className="absolute inset-0 z-10">
            {/* Render white keys first */}
            {getVisibleKeys().filter(key => !key.isBlack).map((key, index) => renderKey(key, index))}
            {/* Render black keys on top */}
            {getVisibleKeys().filter(key => key.isBlack).map((key, index) => renderKey(key, index))}
          </div>
          
          {/* Subtle piano brand/model text */}
          <div className="absolute bottom-2 right-3 text-xs text-[var(--neutral-gray)] opacity-60 font-light select-none pointer-events-none z-20">
            BandMatez Pro
          </div>
        </div>
      </div>
    </div>
  );
}

