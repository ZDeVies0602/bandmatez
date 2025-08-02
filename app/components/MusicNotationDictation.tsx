"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAudioManager } from "../hooks/useAudioManager";
import { useSound } from "../contexts/SoundContext";
import { useThemeClasses } from "../hooks/useThemeClasses";
import { MusicNotationStaff } from "./music-notation/MusicNotationStaff";
import { Note } from "../lib/music-theory/Note";
import { TonalKey } from "../lib/music-theory/TonalKey";
import { chromaticScale, pitchClasses } from "../lib/music-theory/globals";

interface PianoKey {
  note: string;
  flatNote?: string;
  frequency: number;
  isBlack: boolean;
  octave: number;
  keyIndex: number;
  sharpPitchClass: string;
  flatPitchClass: string;
  type: string;
  indent: number;
  index: number;
  audio: HTMLAudioElement;
  reactKey: string;
}

export default function MusicNotationDictation() {
  const { audioContext, masterGain, masterVolume, setMasterVolume } = useAudioManager();
  const { pianoWaveType } = useSound();
  const themeClasses = useThemeClasses();
  const [showInstructions, setShowInstructions] = useState(true);

  // Music theory state
  const [bars, setBars] = useState<Array<Note[]>>(new Array<Note[]>(8).fill([]));
  const [useSharps, setUseSharps] = useState(false);
  const [tonalKey, setTonalKey] = useState<TonalKey>();
  const [currentBar, setCurrentBar] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [playingSpeed, setPlayingSpeed] = useState(0.5);
  const [keyMode, setKeyMode] = useState("major");
  const [keySelection, setKeySelection] = useState(true);
  const [keyJumps, setKeyJumps] = useState<number[]>([]);
  const [activeKeys, setActiveKeys] = useState<number[]>([]);

  // Piano state
  const [currentNote, setCurrentNote] = useState("");
  const [pressedKeys, setPressedKeys] = useState<Set<number>>(new Set());
  const [hoveredKey, setHoveredKey] = useState<number | null>(null);

  const totalKeys = 48; // 4 octaves for dictation purposes
  const playingRef = useRef(playing);
  const activeOscillators = useRef<Map<string, OscillatorNode>>(new Map());

  // Generate piano keys
  const generateKeys = useCallback((): PianoKey[] => {
    const keys: PianoKey[] = [];
    let whiteIndex = 0;
    
    for (let i = 0; i < totalKeys; i++) {
      const note = chromaticScale[i % 12];
      const octave = Math.floor(i / 12) + 3; // Start from C3
      const frequency = 440 * Math.pow(2, (i - 21) / 12); // A4 = 440Hz

      const noteAudio = new Audio();
      noteAudio.volume = masterVolume;

      const key: PianoKey = {
        note: note.sharpPitchClass,
        flatNote: note.flatPitchClass,
        frequency,
        isBlack: note.type === "black",
        octave,
        keyIndex: i,
        sharpPitchClass: note.sharpPitchClass,
        flatPitchClass: note.flatPitchClass,
        type: note.type,
        indent: note.type === "white" ? whiteIndex * 40 + whiteIndex : whiteIndex * 40 - 10 + whiteIndex,
        index: i,
        audio: noteAudio,
        reactKey: note.sharpPitchClass + octave
      };

      keys.push(key);

      if (note.type === "white") {
        whiteIndex++;
      }
    }

    return keys;
  }, [totalKeys, masterVolume]);

  const [pianoKeys] = useState(() => generateKeys());

  // Reset function
  const reset = () => {
    setBars(new Array<Note[]>(8).fill([]));
    setTonalKey(undefined);
    setKeySelection(true);
    setCurrentBar(0);
    setPlaying(false);
    setActiveKeys([]);
    setKeyJumps([]);
  };

  // Key selection for music theory
  const selectKey = (tonic: string, tonicChromaticIndex: number, index: number) => {
    setActiveKeys([]);
    setActiveKeys([index]);

    // Animation for key selection
    for (let i = 1; i < Math.max(index + 1, totalKeys - index); i++) {
      setTimeout(() => {
        let keysToJump: number[] = [];
        setActiveKeys(prevActiveKeys => {
          let updatedActiveKeys = [...prevActiveKeys];
          if (index - i >= 0) {
            keysToJump.push(index - i);
            updatedActiveKeys.push(index - i);
          }
          if (index + i < totalKeys) {
            keysToJump.push(index + i);
            updatedActiveKeys.push(index + i);
          }
          return updatedActiveKeys;
        });

        setKeyJumps(keysToJump);

        if ((index + 1 > totalKeys - index && i == index) || (totalKeys - index > index + 1 && i == totalKeys - index - 1)) {
          setKeyJumps([]);
        }
      }, 22 * i - Math.pow(i, 1.6));
    }

    const newKey = new TonalKey(tonic, tonicChromaticIndex, keyMode);
    setUseSharps(newKey.sharps);
    setTonalKey(newKey);
    setKeySelection(false);
  };

  // Switch between major and minor
  const switchMode = () => {
    const newMode = keyMode === "major" ? "minor" : "major";
    setKeyMode(newMode);

    if (tonalKey) {
      const newTonalKey = new TonalKey(tonalKey.tonic, tonalKey.tonicChromaticIndex, newMode);
      setTonalKey(newTonalKey);
      setUseSharps(newTonalKey.sharps);
    }
  };

  // Add note to current bar
  const addNote = (pitchClass: string, octave: number, chromaticIndex: number, audio: HTMLAudioElement) => {
    if (!tonalKey) return;

    let updatedNotes = [...bars[currentBar], new Note(pitchClass, octave, 0, chromaticIndex, tonalKey, new Audio(audio.src))];
    updatedNotes = updatedNotes.sort((noteA, noteB) => noteA.index - noteB.index);

    // Calculate offsets for close notes
    let noteIndex = 0;
    for (let note of updatedNotes) {
      if (noteIndex + 1 < updatedNotes.length) {
        let nextNote = updatedNotes[noteIndex + 1];
        if (Math.min((7 - Math.abs(nextNote.letterIndex - note.letterIndex) % 7), Math.abs(nextNote.letterIndex - note.letterIndex)) <= 1 && Math.abs(nextNote.index - note.index) < 3) {
          if (note.offset == 0) {
            nextNote.offset = 1;
          } else {
            if (noteIndex > 0 && updatedNotes[noteIndex - 1].pitchClass == note.pitchClass) {
              nextNote.offset = 2;
            } else {
              nextNote.offset = 0;
            }
          }
        }
      }
      noteIndex++;
    }

    const updatedBars = [...bars];
    updatedBars[currentBar] = updatedNotes;
    setBars(updatedBars);
  };

  // Delete note from current bar
  const deleteNote = (octave: number, chromaticIndex: number) => {
    let updatedNotes = [...bars[currentBar]];
    const terminatedNote = updatedNotes.find(note => note.chromaticIndex === chromaticIndex && note.octave === octave);

    if (terminatedNote === undefined) return;

    terminatedNote.terminated = true;

    setBars(prevBars => {
      let updatedBars = [...prevBars];
      updatedBars[currentBar] = updatedNotes;
      return updatedBars;
    });

    setTimeout(() => {
      updatedNotes = [...bars[currentBar]].filter(note => note.chromaticIndex !== chromaticIndex || note.octave !== octave);

      if (updatedNotes.length != 0) {
        updatedNotes[0].offset = 0;
        let noteIndex = 0;
        for (let note of updatedNotes) {
          if (noteIndex + 1 < updatedNotes.length) {
            let nextNote = updatedNotes[noteIndex + 1];
            let nextNoteLetterIndex = pitchClasses.indexOf(nextNote.pitchClass);
            let noteLetterIndex = pitchClasses.indexOf(note.pitchClass);

            if (Math.min((7 - Math.abs(nextNoteLetterIndex - noteLetterIndex) % 7), Math.abs(nextNoteLetterIndex - noteLetterIndex)) <= 1 && Math.abs(nextNote.index - note.index) < 3) {
              if (note.offset == 0) {
                nextNote.offset = 1;
              } else {
                if (noteIndex > 0 && updatedNotes[noteIndex - 1].pitchClass == note.pitchClass) {
                  nextNote.offset = 2;
                } else {
                  nextNote.offset = 0;
                }
              }
            } else {
              nextNote.offset = 0;
            }
          }
          noteIndex++;
        }
      }

      setBars(prevBars => {
        let updatedBars = [...prevBars];
        updatedBars[currentBar] = updatedNotes;
        return updatedBars;
      });
    }, 200);
  };

  // Play a single note using Web Audio API
  const playNote = useCallback((frequency: number, keyIndex: number, pitchClass: string, octave: number) => {
    if (!audioContext || !masterGain) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(masterGain);

    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.type = pianoWaveType;

    // ADSR envelope
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(masterVolume * 0.8, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(masterVolume * 0.6, audioContext.currentTime + 0.1);

    oscillator.start(audioContext.currentTime);

    const noteKey = `${keyIndex}`;
    activeOscillators.current.set(noteKey, oscillator);

    setCurrentNote(`${pitchClass}${octave}`);
    setPressedKeys(prev => new Set(prev).add(keyIndex));

    // Add note to staff if not in key selection mode and have a key
    if (!keySelection && tonalKey) {
      const chromaticIndex = keyIndex % 12;
      addNote(pitchClass, octave, chromaticIndex, pianoKeys[keyIndex].audio);
    }
  }, [audioContext, masterGain, masterVolume, pianoWaveType, keySelection, tonalKey, pianoKeys, addNote]);

  // Stop a note
  const stopNote = useCallback((keyIndex: number, pitchClass: string, octave: number) => {
    if (!audioContext) return;

    const noteKey = `${keyIndex}`;
    const oscillator = activeOscillators.current.get(noteKey);

    if (oscillator) {
      try {
        oscillator.stop(audioContext.currentTime + 0.1);
      } catch (e) {
        // Oscillator might already be stopped
      }
      activeOscillators.current.delete(noteKey);
    }

    setPressedKeys(prev => {
      const newSet = new Set(prev);
      newSet.delete(keyIndex);
      return newSet;
    });

    if (pressedKeys.size === 1) {
      setCurrentNote("");
    }
  }, [audioContext, pressedKeys]);

  // Handle piano key click
  const handleKeyClick = (key: PianoKey, isRightClick = false) => {
    if (isRightClick) {
      // Right click to delete note or toggle notation
      if (!keySelection && tonalKey) {
        const chromaticIndex = key.index % 12;
        deleteNote(key.octave, chromaticIndex);
      } else {
        setUseSharps(!useSharps);
      }
      return;
    }

    if (keySelection) {
      // Select key for music theory
      const tonic = useSharps ? key.sharpPitchClass : key.flatPitchClass;
      const tonicChromaticIndex = key.index % 12;
      selectKey(tonic.replace('♯', '').replace('♭', ''), tonicChromaticIndex, key.index);
    } else {
      // Play note
      const pitchClass = useSharps ? key.sharpPitchClass : key.flatPitchClass;
      playNote(key.frequency, key.keyIndex, pitchClass.replace('♯', '').replace('♭', ''), key.octave);
      
      // Auto-stop after a short duration
      setTimeout(() => {
        stopNote(key.keyIndex, pitchClass.replace('♯', '').replace('♭', ''), key.octave);
      }, 500);
    }
  };

  // Render piano key
  const renderKey = (key: PianoKey) => {
    const isPressed = pressedKeys.has(key.keyIndex);
    const isHovered = hoveredKey === key.keyIndex;
    const isActive = activeKeys.includes(key.index);
    const isJumping = keyJumps.includes(key.index);

    const displayName = useSharps ? key.sharpPitchClass : key.flatPitchClass;
    const keyClasses = `
      ${key.isBlack ? 'piano-black-key' : 'piano-white-key'}
      ${isPressed ? 'pressed' : ''}
      ${isHovered ? 'hovered' : ''}
      ${isActive ? 'active-key' : ''}
      ${isJumping ? 'jumping-key' : ''}
      ${keySelection ? 'key-selection-mode' : ''}
    `;

    const keyStyle = {
      position: 'absolute' as const,
      left: `${key.indent}px`,
      zIndex: key.isBlack ? 20 : 10,
      transform: isPressed ? 'translateY(2px)' : 'translateY(0px)',
      transition: 'all 0.1s ease',
      cursor: 'pointer',
      userSelect: 'none' as const,
      ...(key.isBlack ? {
        width: '32px',
        height: '120px',
        backgroundColor: isPressed ? '#333' : isActive ? '#ff6b6b' : '#000',
        borderRadius: '0 0 4px 4px',
        border: '1px solid #666',
        color: 'white',
        fontSize: '10px',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        paddingBottom: '8px',
        boxShadow: isPressed ? 'inset 0 2px 4px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.3)'
      } : {
        width: '40px',
        height: '180px',
        backgroundColor: isPressed ? '#f0f0f0' : isActive ? '#ffeb3b' : '#fff',
        border: '1px solid #ccc',
        borderRadius: '0 0 4px 4px',
        color: '#333',
        fontSize: '12px',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        paddingBottom: '12px',
        boxShadow: isPressed ? 'inset 0 2px 4px rgba(0,0,0,0.1)' : '0 2px 4px rgba(0,0,0,0.1)'
      })
    };

    return (
      <div
        key={key.reactKey}
        style={keyStyle}
        onMouseDown={() => handleKeyClick(key)}
        onContextMenu={(e) => {
          e.preventDefault();
          handleKeyClick(key, true);
        }}
        onMouseEnter={() => setHoveredKey(key.keyIndex)}
        onMouseLeave={() => setHoveredKey(null)}
      >
        {!key.isBlack && displayName}
      </div>
    );
  };

  return (
    <div className={`min-h-screen ${themeClasses.backgroundGradient} ${themeClasses.textDark} p-8`}>
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-['Bebas_Neue'] text-4xl md:text-6xl mb-4 tracking-wider">
            Music Notation & Theory Dictation
          </h1>
          <p className="text-lg opacity-80 max-w-2xl mx-auto">
            Create chord progressions and analyze them with real-time staff notation, 
            chord symbols, and Roman numeral analysis.
          </p>
        </div>

        {/* Control Panel */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg p-6 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-4">
            
            {/* Volume Control */}
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-2">Volume</label>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={masterVolume * 100}
                onChange={(e) => setMasterVolume(Number(e.target.value) / 100)}
                className="w-full"
              />
            </div>

            {/* Speed Control */}
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-2">Speed</label>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={playingSpeed * 100}
                onChange={(e) => setPlayingSpeed(Number(e.target.value) / 100)}
                className="w-full"
              />
            </div>

            {/* Key Mode */}
            <button
              onClick={switchMode}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              {keyMode === "major" ? "Use Minor" : "Use Major"}
            </button>

            {/* Accidentals */}
            <button
              onClick={() => setUseSharps(!useSharps)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              {useSharps ? "Use Flats" : "Use Sharps"}
            </button>

            {/* Key Selection */}
            <button
              onClick={() => setKeySelection(!keySelection)}
              className={`px-4 py-2 rounded-lg transition-colors text-sm ${
                keySelection 
                  ? "bg-yellow-600 text-white hover:bg-yellow-700" 
                  : "bg-gray-600 text-white hover:bg-gray-700"
              }`}
            >
              {keySelection ? "Key Selection" : "Note Entry"}
            </button>

            {/* Reset */}
            <button
              onClick={reset}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              Reset
            </button>
          </div>

          {/* Bar Navigation */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setCurrentBar(Math.max(0, currentBar - 1))}
              disabled={currentBar === 0}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition-colors"
            >
              ← Prev Chord
            </button>
            
            <span className="text-lg font-medium">
              Bar {currentBar + 1} / 8
            </span>
            
            <button
              onClick={() => setCurrentBar(Math.min(7, currentBar + 1))}
              disabled={currentBar === 7}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition-colors"
            >
              Next Chord →
            </button>
          </div>
        </div>

        {/* Music Notation Staff */}
        {tonalKey && (
          <div className="mb-8">
            <MusicNotationStaff
              bars={bars}
              tonalKey={tonalKey}
              currentBar={currentBar}
              onBarClick={setCurrentBar}
            />
          </div>
        )}

        {/* Instructions */}
        {showInstructions && (
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg p-4 mb-6 relative">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-semibold mb-2">Instructions:</h3>
                <div className="text-sm space-y-1">
                  <p><strong>1.</strong> Click "Key Selection" and choose a key on the piano to set the tonal center</p>
                  <p><strong>2.</strong> Switch to "Note Entry" mode and click piano keys to add notes to the current chord</p>
                  <p><strong>3.</strong> Right-click keys to remove notes from the staff</p>
                  <p><strong>4.</strong> Use "Prev/Next Chord" to navigate between the 8 available bars</p>
                  <p><strong>5.</strong> View real-time chord symbols and Roman numeral analysis above and below the staff</p>
                </div>
              </div>
              <button
                onClick={() => setShowInstructions(false)}
                className="ml-4 w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-all duration-200 group flex-shrink-0"
                title="Hide instructions"
              >
                <svg 
                  className="w-3 h-3 text-white/70 group-hover:text-white" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Piano Keyboard */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg p-4">
          <div className="text-center mb-4">
            <h3 className="text-lg font-semibold">
              {keySelection ? "🎹 Select a Key Center" : "🎹 Add Notes to Current Chord"}
            </h3>
            <p className="text-sm opacity-75">
              {keySelection 
                ? "Click any key to set the tonal center for analysis" 
                : "Left-click to add notes • Right-click to remove notes"
              }
            </p>
          </div>

          <div className="relative bg-gradient-to-b from-gray-200 to-gray-300 rounded-lg p-4" style={{ height: '200px' }}>
            {pianoKeys.map(key => renderKey(key))}
          </div>
        </div>
      </div>
    </div>
  );
} 