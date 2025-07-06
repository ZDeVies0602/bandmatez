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
    const quarterNote = 60.0 / tempo;

    while (nextNoteTimeRef.current < currentTime + 0.1) {
      const isDownbeat = currentBeat === 1;
      playSound(isDownbeat);

      setCurrentBeat((prev) => (prev >= timeSignature.beats ? 1 : prev + 1));
      nextNoteTimeRef.current += quarterNote;
    }
  }, [tempo, currentBeat, timeSignature.beats, playSound]);

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
      const angle = Math.sin(beatProgress * Math.PI) * 15 * swingDirection;
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
        ${isExpanded ? "w-96 h-auto" : "w-80 h-16"}
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
            {/* Mini Metronome Visual */}
            <div className="flex items-center gap-4">
              <div className="relative w-8 h-8">
                <div className="absolute inset-0 bg-[var(--accent-red)]/20 rounded-full"></div>
                <div
                  className="absolute top-1 left-1/2 w-0.5 h-6 bg-[var(--accent-red)] origin-top transform -translate-x-1/2 transition-transform duration-100"
                  style={{
                    transform: `translateX(-50%) rotate(${pendulumAngle}deg)`,
                  }}
                >
                  <div className="absolute bottom-0 w-2 h-2 bg-[var(--accent-red)] rounded-full -translate-x-1/2"></div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-[var(--text-dark)]">
                  {tempo}
                </span>
                <span className="text-sm text-[var(--neutral-gray)]">BPM</span>
              </div>

              <div className="flex gap-1">
                {Array.from({ length: timeSignature.beats }).map((_, i) => (
                  <div
                    key={i}
                    className={`
                      w-2 h-2 rounded-full transition-all duration-200
                      ${
                        currentBeat === i + 1
                          ? "bg-[var(--accent-red)] scale-125"
                          : "bg-white/30"
                      }
                    `}
                  />
                ))}
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={isPlaying ? stop : start}
                className={`
                  px-4 py-2 rounded-lg font-medium text-white transition-all duration-200
                  ${
                    isPlaying
                      ? "bg-red-500 hover:bg-red-600"
                      : "bg-green-500 hover:bg-green-600"
                  }
                  hover:scale-105 active:scale-95
                `}
              >
                {isPlaying ? "⏸" : "▶"}
              </button>

              <button
                onClick={() => setIsExpanded(true)}
                className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-[var(--text-dark)] transition-all duration-200 hover:scale-105"
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
                Metronome
              </h3>
              <button
                onClick={() => setIsExpanded(false)}
                className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-[var(--text-dark)] transition-all duration-200 hover:scale-105"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {/* Tempo Control */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-dark)]">
                  Tempo
                </label>
                <input
                  type="range"
                  min="30"
                  max="300"
                  value={tempo}
                  onChange={(e) => setTempo(parseInt(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none bg-white/20 cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--accent-red)] [&::-webkit-slider-thumb]:cursor-pointer"
                />
                <div className="text-center text-sm text-[var(--neutral-gray)]">
                  {tempo} BPM
                </div>
              </div>

              {/* Time Signature */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-dark)]">
                  Time Signature
                </label>
                <select
                  value={`${timeSignature.beats}/${timeSignature.noteValue}`}
                  onChange={(e) => {
                    const [beats, noteValue] = e.target.value
                      .split("/")
                      .map(Number);
                    setTimeSignature({ beats, noteValue });
                    setCurrentBeat(1);
                  }}
                  className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-[var(--text-dark)] focus:outline-none focus:ring-2 focus:ring-white/50"
                >
                  <option value="4/4">4/4</option>
                  <option value="3/4">3/4</option>
                  <option value="2/4">2/4</option>
                  <option value="6/8">6/8</option>
                </select>
              </div>

              {/* Controls */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-dark)]">
                  Control
                </label>
                <button
                  onClick={isPlaying ? stop : start}
                  className={`
                    w-full py-2 px-4 rounded-lg font-medium text-white transition-all duration-200
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
              </div>
            </div>

            {/* Visual Metronome */}
            <div className="flex justify-center">
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 bg-[var(--accent-red)]/20 rounded-full"></div>
                <div
                  className="absolute top-2 left-1/2 w-1 h-16 bg-[var(--accent-red)] origin-top transform -translate-x-1/2 transition-transform duration-100"
                  style={{
                    transform: `translateX(-50%) rotate(${pendulumAngle}deg)`,
                  }}
                >
                  <div className="absolute bottom-0 w-3 h-3 bg-[var(--accent-red)] rounded-full -translate-x-1/2"></div>
                </div>
              </div>
            </div>

            {/* Beat Indicator */}
            <div className="flex justify-center gap-2">
              {Array.from({ length: timeSignature.beats }).map((_, i) => (
                <div
                  key={i}
                  className={`
                    w-3 h-3 rounded-full transition-all duration-200
                    ${
                      currentBeat === i + 1
                        ? "bg-[var(--accent-red)] scale-125"
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
