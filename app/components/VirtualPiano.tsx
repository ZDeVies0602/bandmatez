"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAudioManager } from "../hooks/useAudioManager";
import { useSound } from "../contexts/SoundContext";
import { useThemeClasses } from "../hooks/useThemeClasses";
import { PianoKey } from "../types";

export default function VirtualPiano() {
  const { audioContext, masterGain } = useAudioManager();
  const { pianoWaveType } = useSound();
  const themeClasses = useThemeClasses();

  // Piano state
  const [volume, setVolume] = useState(0.5);
  const [currentNote, setCurrentNote] = useState("");
  const [currentStartKeyIndex, setCurrentStartKeyIndex] = useState(22); // Middle position

  // Piano configuration
  const totalKeys = 88;
  const visibleKeys = 24; // Reduced for compact view
  const scrollIncrement = 12;

  // Note mappings
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
  const blackKeys = ["C#", "D#", "F#", "G#", "A#"];

  const activeOscillators = useRef<Map<string, OscillatorNode>>(new Map());

  // Calculate key frequency (A4 = 440 Hz)
  const calculateFrequency = (note: string, octave: number): number => {
    const noteIndex = noteNames.indexOf(note);
    const semitones = (octave - 4) * 12 + noteIndex - 9;
    return 440 * Math.pow(2, semitones / 12);
  };

  // Generate all piano keys
  const generateKeys = (): PianoKey[] => {
    const keys: PianoKey[] = [];
    let keyIndex = 0;

    for (let octave = 0; octave <= 8; octave++) {
      for (let noteIndex = 0; noteIndex < 12; noteIndex++) {
        if (keyIndex >= totalKeys) break;
        const note = noteNames[noteIndex];
        const frequency = calculateFrequency(note, octave);
        const isBlack = blackKeys.includes(note);

        if (
          (octave === 0 && noteIndex < 9) ||
          (octave === 8 && noteIndex > 0)
        ) {
          continue;
        }

        keys.push({
          note,
          frequency,
          isBlack,
          octave,
          keyIndex: keyIndex++,
        });
      }
    }
    return keys.slice(0, totalKeys);
  };

  const allKeys = generateKeys();

  // Get visible keys
  const getVisibleKeys = (): PianoKey[] => {
    return allKeys.slice(
      currentStartKeyIndex,
      currentStartKeyIndex + visibleKeys
    );
  };

  // Scroll functions
  const scrollLeft = () => {
    const newStart = Math.max(0, currentStartKeyIndex - scrollIncrement);
    setCurrentStartKeyIndex(newStart);
  };

  const scrollRight = () => {
    const newStart = Math.min(
      totalKeys - visibleKeys,
      currentStartKeyIndex + scrollIncrement
    );
    setCurrentStartKeyIndex(newStart);
  };

  // Play note
  const playNote = useCallback(
    (note: string, octave: number) => {
      const frequency = calculateFrequency(note, octave);
      const noteKey = `${note}${octave}`;

      if (activeOscillators.current.has(noteKey)) {
        stopNote(note, octave);
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
            volume,
            audioContext.currentTime + 0.01
          );
          gainNode.gain.exponentialRampToValueAtTime(
            volume * 0.5,
            audioContext.currentTime + 0.1
          );

          oscillator.start();
          activeOscillators.current.set(noteKey, oscillator);
          setCurrentNote(noteKey);
        }
      } catch (error) {
        console.error("Error playing note:", error);
      }
    },
    [audioContext, masterGain, volume, pianoWaveType]
  );

  // Stop note
  const stopNote = useCallback((note: string, octave: number) => {
    const noteKey = `${note}${octave}`;
    const oscillator = activeOscillators.current.get(noteKey);

    if (oscillator) {
      try {
        oscillator.stop();
        activeOscillators.current.delete(noteKey);
      } catch (error) {
        console.error("Error stopping note:", error);
      }
    }
  }, []);

  // Render piano key
  const renderKey = (key: PianoKey, index: number) => {
    return (
      <div
        key={`${key.note}-${key.octave}-${key.keyIndex}`}
        className={`
          relative cursor-pointer select-none transition-all duration-150 ease-out
          flex items-end justify-center pb-2 rounded-b-lg
          ${
            key.isBlack
              ? `w-6 h-20 bg-gradient-to-b from-gray-800 to-gray-900
                 border border-gray-700 shadow-lg z-10 -mx-1
                 hover:from-gray-700 hover:to-gray-800
                 active:scale-95`
              : `w-8 h-32 bg-gradient-to-b from-white to-gray-100
                 border border-gray-300 shadow-md
                 hover:from-gray-50 hover:to-gray-200
                 active:scale-95`
          }
          hover:transform hover:-translate-y-1
        `}
        onMouseDown={() => playNote(key.note, key.octave)}
        onMouseUp={() => stopNote(key.note, key.octave)}
        onMouseLeave={() => stopNote(key.note, key.octave)}
      >
        <span
          className={`text-xs font-mono ${
            key.isBlack ? "text-white" : "text-gray-700"
          }`}
        >
          {key.note}
        </span>
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
    <div className="space-y-4">
      {/* Current Note Display */}
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4 text-center">
        <div className="text-2xl font-bold text-[var(--text-dark)] mb-1">
          {currentNote || "♪"}
        </div>
        <div className="text-sm text-[var(--neutral-gray)]">
          {currentNote
            ? `${calculateFrequency(
                currentNote.slice(0, -1),
                parseInt(currentNote.slice(-1))
              ).toFixed(1)} Hz`
            : "Press any key"}
        </div>
      </div>

      {/* Piano Navigation */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={scrollLeft}
          disabled={currentStartKeyIndex === 0}
          className={`
            px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-sm font-medium
            ${
              currentStartKeyIndex === 0
                ? "opacity-40 cursor-not-allowed"
                : "hover:bg-white/30"
            }
          `}
        >
          ←
        </button>

        <div className="text-xs text-[var(--neutral-gray)]">
          {getVisibleKeys()[0]?.note}
          {getVisibleKeys()[0]?.octave} -{" "}
          {getVisibleKeys()[visibleKeys - 1]?.note}
          {getVisibleKeys()[visibleKeys - 1]?.octave}
        </div>

        <button
          onClick={scrollRight}
          disabled={currentStartKeyIndex >= totalKeys - visibleKeys}
          className={`
            px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-sm font-medium
            ${
              currentStartKeyIndex >= totalKeys - visibleKeys
                ? "opacity-40 cursor-not-allowed"
                : "hover:bg-white/30"
            }
          `}
        >
          →
        </button>
      </div>

      {/* Piano Keyboard */}
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4">
        <div className="flex h-32 relative justify-center gap-px bg-gradient-to-b from-gray-200 to-gray-300 p-2 rounded-lg">
          {getVisibleKeys().map((key, index) => renderKey(key, index))}
        </div>
      </div>

      {/* Volume Control */}
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-[var(--text-dark)]">
            🔊
          </span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="flex-1 h-2 rounded-full appearance-none bg-white/20 cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--accent-red)]"
          />
          <span className="text-sm text-[var(--neutral-gray)] w-8">
            {Math.round(volume * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
}
