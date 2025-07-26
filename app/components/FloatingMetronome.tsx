"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSound } from "../contexts/SoundContext";
import { useThemeClasses } from "../hooks/useThemeClasses";

interface FloatingMetronomeProps {
  className?: string;
  onToggleExpand?: () => void;
}

export default function FloatingMetronome({
  className = "",
  onToggleExpand,
}: FloatingMetronomeProps) {
  const { metronomeSound } = useSound();
  const themeClasses = useThemeClasses();

  // Core state
  const [isPlaying, setIsPlaying] = useState(false);
  const [tempo, setTempo] = useState(120);
  const [timeSignature, setTimeSignature] = useState({
    beats: 4,
    noteValue: 4,
  });
  const [currentBeat, setCurrentBeat] = useState(1);
  const [isExpanded, setIsExpanded] = useState(false);
  const [pendulumAngle, setPendulumAngle] = useState(0);
  const [noteSubdivision, setNoteSubdivision] = useState<'whole' | 'quarter' | 'eighth' | 'sixteenth' | 'triplet'>('quarter');

  // Audio timing
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const nextNoteTimeRef = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);

  // Initialize audio context
  const initializeAudio = useCallback(async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      masterGainRef.current = audioContextRef.current.createGain();
      masterGainRef.current.connect(audioContextRef.current.destination);
      masterGainRef.current.gain.value = 0.2;
    }

    if (audioContextRef.current.state === "suspended") {
      await audioContextRef.current.resume();
    }
  }, []);

  // Play metronome sound
  const playSound = useCallback(
    async (isAccent: boolean = false) => {
      if (!audioContextRef.current || !masterGainRef.current) return;

      try {
        await initializeAudio();

        const oscillator = audioContextRef.current.createOscillator();
        const gainNode = audioContextRef.current.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(masterGainRef.current);

        const frequency = isAccent ? 1200 : 800;
        oscillator.frequency.setValueAtTime(
          frequency,
          audioContextRef.current.currentTime
        );

        gainNode.gain.setValueAtTime(0, audioContextRef.current.currentTime);
        gainNode.gain.linearRampToValueAtTime(
          0.2,
          audioContextRef.current.currentTime + 0.01
        );
        gainNode.gain.exponentialRampToValueAtTime(
          0.001,
          audioContextRef.current.currentTime + 0.1
        );

        oscillator.start(audioContextRef.current.currentTime);
        oscillator.stop(audioContextRef.current.currentTime + 0.1);
      } catch (error) {
        console.error("Error playing metronome sound:", error);
      }
    },
    [initializeAudio]
  );

  // Metronome scheduler
  const scheduleNote = useCallback(() => {
    if (!audioContextRef.current) return;

    const currentTime = audioContextRef.current.currentTime;
    
    // Calculate note duration based on subdivision
    const getNoteDuration = () => {
      const quarterNote = 60.0 / tempo;
      switch (noteSubdivision) {
        case 'whole':
          return quarterNote * 4;
        case 'quarter':
          return quarterNote;
        case 'eighth':
          return quarterNote / 2;
        case 'sixteenth':
          return quarterNote / 4;
        case 'triplet':
          return quarterNote / 3;
        default:
          return quarterNote;
      }
    };

    const noteDuration = getNoteDuration();

    while (nextNoteTimeRef.current < currentTime + 0.1) {
      // Determine if this is an accent beat
      let isAccent = false;
      
      if (noteSubdivision === 'quarter' || noteSubdivision === 'whole') {
        isAccent = currentBeat === 1;
      } else if (noteSubdivision === 'eighth') {
        // Accent on downbeats (1, 3, 5, 7 for 4/4)
        isAccent = currentBeat % 2 === 1;
      } else if (noteSubdivision === 'sixteenth') {
        // Accent on quarter note beats (1, 5, 9, 13 for 4/4)
        isAccent = (currentBeat - 1) % 4 === 0;
      } else if (noteSubdivision === 'triplet') {
        // Accent on beat 1 of each triplet group
        isAccent = (currentBeat - 1) % 3 === 0;
      }

      playSound(isAccent);

      // Update beat counter based on subdivision
      const getMaxBeats = () => {
        const baseBeats = timeSignature.beats;
        switch (noteSubdivision) {
          case 'whole':
            return Math.max(1, baseBeats / 4);
          case 'quarter':
            return baseBeats;
          case 'eighth':
            return baseBeats * 2;
          case 'sixteenth':
            return baseBeats * 4;
          case 'triplet':
            return baseBeats * 3;
          default:
            return baseBeats;
        }
      };

      const maxBeats = getMaxBeats();
      setCurrentBeat((prev) => (prev >= maxBeats ? 1 : prev + 1));
      nextNoteTimeRef.current += noteDuration;
    }
  }, [tempo, currentBeat, timeSignature.beats, noteSubdivision, playSound]);

  // Start metronome
  const start = async () => {
    await initializeAudio();
    if (!audioContextRef.current) return;
    nextNoteTimeRef.current = audioContextRef.current.currentTime;
    setIsPlaying(true);
  };

  // Stop metronome
  const stop = () => {
    setIsPlaying(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  // Metronome scheduling effect
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(scheduleNote, 25);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, scheduleNote]);

  // Pendulum animation
  useEffect(() => {
    if (!isPlaying) return;

    let animationId: number;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const beatDuration = (60 / tempo) * 1000;
      const beatProgress = (elapsed % beatDuration) / beatDuration;
      const beatNumber = Math.floor(elapsed / beatDuration);
      const isEvenBeat = beatNumber % 2 === 0;
      const swingDirection = isEvenBeat ? 1 : -1;
      // Increased swing angle from 15 to 35 degrees for more prominent animation
      const angle = Math.sin(beatProgress * Math.PI) * 35 * swingDirection;
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
    <div
      className={`
        transition-all duration-300 ease-in-out
        ${isExpanded ? "w-96 h-auto" : "w-96 h-20"}
        ${className}
      `}
    >
      <div
        className={`
          bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl
          shadow-[0_8px_32px_rgba(0,0,0,0.1)] overflow-hidden
          ${isExpanded ? "p-6" : "p-4"}
        `}
      >
        {/* Collapsed View */}
        {!isExpanded && (
          <div className="flex items-center justify-between">
            {/* Simple Metronome Visual */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-[var(--text-dark)]">
                    {tempo}
                  </span>
                  <span className="text-sm font-medium text-[var(--neutral-gray)]">
                    BPM
                  </span>
                </div>

                <div className="w-px h-8 bg-white/20"></div>

                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-[var(--neutral-gray)]">
                      {timeSignature.beats}/{timeSignature.noteValue}
                    </span>
                    <span className="text-xs text-[var(--accent-red)] font-medium">
                      {noteSubdivision === 'whole' ? '𝅝' : 
                       noteSubdivision === 'quarter' ? '♩' :
                       noteSubdivision === 'eighth' ? '♫' :
                       noteSubdivision === 'sixteenth' ? '♬' :
                       noteSubdivision === 'triplet' ? '3' : '♩'}
                    </span>
                  </div>
                  {/* Centered Beat Indicator Dots */}
                  <div className="flex gap-2 justify-center">
                    {Array.from({ length: (() => {
                      const baseBeats = timeSignature.beats;
                      switch (noteSubdivision) {
                        case 'whole':
                          return Math.max(1, baseBeats / 4);
                        case 'quarter':
                          return baseBeats;
                        case 'eighth':
                          return baseBeats * 2;
                        case 'sixteenth':
                          return Math.min(baseBeats * 4, 16); // Cap at 16 for visual clarity
                        case 'triplet':
                          return baseBeats * 3;
                        default:
                          return baseBeats;
                      }
                    })() }).map((_, i) => (
                      <div
                        key={i}
                        className={`
                          ${noteSubdivision === 'sixteenth' ? 'w-2 h-2' : 'w-3 h-3'} 
                          rounded-full transition-all duration-150
                          ${
                            currentBeat === i + 1
                              ? "bg-[var(--accent-red)] scale-150 shadow-lg shadow-[var(--accent-red)]/50"
                              : "bg-white/40 scale-100"
                          }
                        `}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={isPlaying ? stop : start}
                className={`
                  px-5 py-2 rounded-xl font-medium text-white transition-all duration-200
                  ${
                    isPlaying
                      ? "bg-red-500 hover:bg-red-600 shadow-lg"
                      : "bg-green-500 hover:bg-green-600 shadow-lg"
                  }
                  hover:scale-105 active:scale-95
                `}
              >
                {isPlaying ? "⏸" : "▶"}
              </button>

              <button
                onClick={() => setIsExpanded(true)}
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-[var(--text-dark)] transition-all duration-200 hover:scale-105"
              >
                ⚙️
              </button>
            </div>
          </div>
        )}

        {/* Expanded View */}
        {isExpanded && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[var(--text-dark)]">
                🎼 Metronome
              </h3>
              <button
                onClick={() => setIsExpanded(false)}
                className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[var(--text-dark)] transition-all duration-200 hover:scale-105 text-sm"
              >
                ✕
              </button>
            </div>

            {/* Large Visual Metronome */}
            <div className="flex justify-center mb-4">
              <div className="relative w-32 h-24 flex items-center justify-center">
                {/* Placeholder for new metronome design */}
                <div className="text-center text-[var(--neutral-gray)]">
                  <div className="text-4xl mb-2">🎼</div>
                  <p className="text-sm">Metronome Visual</p>
                  <p className="text-xs opacity-70">Ready for new design</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {/* Top Row - Tempo and Time/Notes Controls */}
              <div className="grid grid-cols-2 gap-4">
                {/* Tempo Control */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--text-dark)]">
                    Tempo
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setTempo(Math.max(30, tempo - 5))}
                      className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 text-[var(--text-dark)] text-xs flex items-center justify-center transition-all duration-200"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="30"
                      max="300"
                      value={tempo}
                      onChange={(e) => setTempo(Math.min(300, Math.max(30, parseInt(e.target.value) || 30)))}
                      className="flex-1 p-1 text-xs text-center bg-white/10 border border-white/20 rounded text-[var(--text-dark)] focus:outline-none focus:ring-1 focus:ring-white/50"
                    />
                    <button
                      onClick={() => setTempo(Math.min(300, tempo + 5))}
                      className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 text-[var(--text-dark)] text-xs flex items-center justify-center transition-all duration-200"
                    >
                      +
                    </button>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="300"
                    value={tempo}
                    onChange={(e) => setTempo(parseInt(e.target.value))}
                    className="w-full h-1 rounded-full appearance-none bg-white/20 cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--accent-red)] [&::-webkit-slider-thumb]:cursor-pointer"
                  />
                </div>

                {/* Time Signature & Note Subdivision */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--text-dark)]">
                    Time & Notes
                  </label>
                  <div className="flex gap-1">
                    <select
                      value={`${timeSignature.beats}/${timeSignature.noteValue}`}
                      onChange={(e) => {
                        const [beats, noteValue] = e.target.value
                          .split("/")
                          .map(Number);
                        setTimeSignature({ beats, noteValue });
                        setCurrentBeat(1);
                      }}
                      className="flex-1 p-1 text-xs bg-white/10 border border-white/20 rounded text-[var(--text-dark)] focus:outline-none focus:ring-1 focus:ring-white/50"
                    >
                      <option value="4/4">4/4</option>
                      <option value="3/4">3/4</option>
                      <option value="2/4">2/4</option>
                      <option value="6/8">6/8</option>
                    </select>
                    <select
                      value={noteSubdivision}
                      onChange={(e) => {
                        setNoteSubdivision(e.target.value as 'whole' | 'quarter' | 'eighth' | 'sixteenth' | 'triplet');
                        setCurrentBeat(1);
                      }}
                      className="flex-1 p-1 text-xs bg-white/10 border border-white/20 rounded text-[var(--text-dark)] focus:outline-none focus:ring-1 focus:ring-white/50"
                    >
                      <option value="whole">♩</option>
                      <option value="quarter">♩</option>
                      <option value="eighth">♫</option>
                      <option value="sixteenth">♬</option>
                      <option value="triplet">3</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Bottom Row - Full Width Controls */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--text-dark)]">
                  Control
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={isPlaying ? stop : start}
                    className={`
                      flex-1 py-2 px-4 rounded text-sm font-medium text-white transition-all duration-200
                      ${
                        isPlaying
                          ? "bg-red-500 hover:bg-red-600"
                          : "bg-green-500 hover:bg-green-600"
                      }
                      hover:scale-105 active:scale-95
                    `}
                  >
                    {isPlaying ? "⏸ Stop" : "▶ Start"}
                  </button>
                  <button
                    onClick={() => {
                      setTempo(120);
                      setTimeSignature({ beats: 4, noteValue: 4 });
                      setNoteSubdivision('quarter');
                      setCurrentBeat(1);
                      if (isPlaying) stop();
                    }}
                    className="px-3 py-2 rounded text-sm bg-white/10 hover:bg-white/20 text-[var(--text-dark)] transition-all duration-200"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>

            {/* Beat Indicator */}
            <div className="flex justify-center gap-1.5 pt-2">
              {Array.from({ length: (() => {
                const baseBeats = timeSignature.beats;
                switch (noteSubdivision) {
                  case 'whole':
                    return Math.max(1, baseBeats / 4);
                  case 'quarter':
                    return baseBeats;
                  case 'eighth':
                    return baseBeats * 2;
                  case 'sixteenth':
                    return Math.min(baseBeats * 4, 16); // Cap at 16 for visual clarity
                  case 'triplet':
                    return baseBeats * 3;
                  default:
                    return baseBeats;
                }
              })() }).map((_, i) => (
                <div
                  key={i}
                  className={`
                    ${noteSubdivision === 'sixteenth' ? 'w-2 h-2' : 'w-2.5 h-2.5'}
                    rounded-full transition-all duration-200
                    ${
                      currentBeat === i + 1
                        ? "bg-[var(--accent-red)] scale-125 shadow-lg"
                        : "bg-white/30"
                    }
                  `}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

