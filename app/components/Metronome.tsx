"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSound } from "../contexts/SoundContext";
import { useThemeClasses } from "../hooks/useThemeClasses";
import { MetronomeSettings } from "../types";

export default function Metronome() {
  const { metronomeSound } = useSound();
  const themeClasses = useThemeClasses();

  // Core state
  const [isPlaying, setIsPlaying] = useState(false);
  const [tempo, setTempo] = useState(120);
  const [timeSignature, setTimeSignature] = useState({
    beats: 4,
    noteValue: 4,
  });
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
      audioContextRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      masterGainRef.current = audioContextRef.current.createGain();
      masterGainRef.current.connect(audioContextRef.current.destination);
      masterGainRef.current.gain.value = 0.3;
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

        // Set frequency based on accent and sound type
        const frequency = isAccent ? 1200 : 800;
        oscillator.frequency.setValueAtTime(
          frequency,
          audioContextRef.current.currentTime
        );

        // Set envelope
        gainNode.gain.setValueAtTime(0, audioContextRef.current.currentTime);
        gainNode.gain.linearRampToValueAtTime(
          0.3,
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

    // Schedule notes for subdivision
    const subdivisionInterval = quarterNote / subdivision;

    while (nextNoteTimeRef.current < currentTime + 0.1) {
      const isDownbeat = currentBeat === 1 && currentSubdivision === 1;
      const isAccent = accentPattern.includes(currentBeat);

      playSound(isDownbeat || isAccent);

      // Move to next subdivision
      setCurrentSubdivision((prev) => {
        const next = prev + 1;
        if (next > subdivision) {
          setCurrentBeat((beatPrev) => {
            const nextBeat = beatPrev + 1;
            return nextBeat > timeSignature.beats ? 1 : nextBeat;
          });
          return 1;
        }
        return next;
      });

      nextNoteTimeRef.current += subdivisionInterval;
    }
  }, [
    tempo,
    subdivision,
    currentBeat,
    currentSubdivision,
    timeSignature.beats,
    accentPattern,
    playSound,
  ]);

  // Get tempo marking
  const getTempoMarking = (bpm: number): string => {
    if (bpm < 60) return "Larghissimo";
    if (bpm < 66) return "Adagissimo";
    if (bpm < 76) return "Adagio";
    if (bpm < 108) return "Andante";
    if (bpm < 120) return "Moderato";
    if (bpm < 168) return "Allegro";
    if (bpm < 200) return "Presto";
    return "Prestissimo";
  };

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

  // Process tap tempo
  const processTapTempo = () => {
    const now = Date.now();
    const newTapTimes = [...tapTimesRef.current, now];

    // Keep only recent taps (within 2 seconds)
    const validTaps = newTapTimes.filter((time) => now - time < 2000);

    if (validTaps.length >= 2) {
      const intervals = [];
      for (let i = 1; i < validTaps.length; i++) {
        intervals.push(validTaps[i] - validTaps[i - 1]);
      }

      const averageInterval =
        intervals.reduce((a, b) => a + b, 0) / intervals.length;
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
    const [beats, noteValue] = signature.split("/").map(Number);
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
          className={`
            w-3 h-3 rounded-full transition-all duration-200
            ${
              currentSubdivision === i
                ? "bg-blue-400 scale-125 shadow-neon"
                : "bg-white/30"
            }
          `}
        />
      );
    }
    return indicators;
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
    <div
      className={`
      grid grid-cols-3 grid-rows-2 gap-8 max-w-6xl mx-auto p-8
      min-h-[500px] items-start
    `}
    >
      {/* Top row - Tempo display */}
      <div
        className={`
        col-span-3 text-center p-5 rounded-2xl mb-5
        ${themeClasses.card}
      `}
      >
        <div className="flex items-center justify-center gap-2">
          <span
            className={`
            text-6xl font-bold ${themeClasses.textDark}
            leading-none drop-shadow-lg
          `}
          >
            {tempo}
          </span>
          <span className={`${themeClasses.textDark} text-xl`}>BPM</span>
        </div>
        <div
          className={`
          text-xl ${themeClasses.textDark} opacity-80 italic mt-2
          drop-shadow-sm
        `}
        >
          {getTempoMarking(tempo)}
        </div>
      </div>

      {/* Left column - Time signature and subdivision controls */}
      <div
        className={`
        flex flex-col gap-6 p-6 rounded-2xl
        ${themeClasses.card}
        self-start
      `}
      >
        {/* Time Signature */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="time-signature"
            className={`
            ${themeClasses.textDark} font-medium drop-shadow-sm
          `}
          >
            Time Signature
          </label>
          <select
            id="time-signature"
            className={`
              ${themeClasses.input}
              p-3 rounded-lg text-base
              focus:outline-none focus:ring-2 focus:ring-white/50
            `}
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

        {/* Subdivision */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="subdivision"
            className={`
            ${themeClasses.textDark} font-medium drop-shadow-sm
          `}
          >
            Subdivision
          </label>
          <select
            id="subdivision"
            className={`
              ${themeClasses.input}
              p-3 rounded-lg text-base
              focus:outline-none focus:ring-2 focus:ring-white/50
            `}
            value={subdivision}
            onChange={(e) => setSubdivision(parseInt(e.target.value))}
          >
            <option value="1">Quarter Notes (♩)</option>
            <option value="2">Eighth Notes (♫)</option>
            <option value="4">Sixteenth Notes (♬)</option>
            <option value="3">Triplets (♩♩♩)</option>
          </select>
        </div>

        {/* Beat Counter */}
        <div
          className={`
          bg-white/10 rounded-lg p-4 text-center
          ${themeClasses.textDark} text-2xl font-bold
          drop-shadow-sm
        `}
        >
          <div className="flex items-center justify-center gap-2">
            <span>{currentBeat}</span>
            <span className="text-lg opacity-60">/</span>
            <span>{timeSignature.beats}</span>
          </div>
          <div className="flex justify-center gap-2 mt-3">
            {renderSubdivisionIndicators()}
          </div>
        </div>
      </div>

      {/* Center - Large metronome visual */}
      <div className="flex justify-center items-start min-h-[600px] relative pt-0">
        <div className="relative w-96 h-[550px] flex justify-center items-start mt-0">
          {/* Metronome Body */}
          <div
            className={`
            absolute top-0 w-80 h-96 rounded-t-3xl rounded-b-lg
            ${themeClasses.metronomeBody}
            border-4 border-[var(--shape-color-1)]/80
            shadow-2xl
            relative overflow-hidden
          `}
          >
            {/* Center Line */}
            <div className="absolute top-1/2 left-1/2 w-0.5 h-48 bg-white/20 -translate-x-1/2 -translate-y-1/2"></div>

            {/* Decorative Elements */}
            <div className="absolute top-8 left-1/2 w-16 h-2 bg-white/10 rounded-full -translate-x-1/2"></div>
            <div className="absolute bottom-8 left-1/2 w-12 h-12 bg-white/5 rounded-full -translate-x-1/2"></div>
          </div>

          {/* Pendulum */}
          <div
            className={`
              absolute top-8 left-1/2 w-1 h-72 origin-top
              ${themeClasses.metronomePendulum}
              transition-transform duration-100 ease-out
              shadow-lg
            `}
            style={{
              transform: `translateX(-50%) rotate(${pendulumAngle}deg)`,
            }}
          >
            {/* Pendulum Weight */}
            <div
              className={`
              absolute bottom-0 w-8 h-8 rounded-full -translate-x-1/2
              ${themeClasses.metronomeWeight}
              shadow-lg border-2 border-white/20
            `}
            >
              <div className="absolute inset-1 rounded-full bg-white/10"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Right column - Tempo controls and buttons */}
      <div
        className={`
        flex flex-col gap-6 p-6 rounded-2xl
        ${themeClasses.card}
        self-start
      `}
      >
        {/* Tempo Input */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="tempo-input"
              className={`
              ${themeClasses.textDark} font-medium drop-shadow-sm
            `}
            >
              Tempo (BPM)
            </label>
            <input
              type="number"
              min="30"
              max="300"
              value={tempo}
              id="tempo-input"
              className={`
                ${themeClasses.input}
                p-3 rounded-lg text-base
                focus:outline-none focus:ring-2 focus:ring-white/50
              `}
              onChange={(e) => handleTempoChange(parseInt(e.target.value))}
            />
          </div>

          {/* Tempo Slider */}
          <input
            type="range"
            min="30"
            max="300"
            value={tempo}
            id="tempo-slider"
            className={`
              w-full h-2 rounded-full appearance-none
              bg-white/20 cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-5
              [&::-webkit-slider-thumb]:h-5
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-white/90
              [&::-webkit-slider-thumb]:cursor-pointer
              [&::-webkit-slider-thumb]:shadow-lg
              [&::-webkit-slider-thumb]:hover:bg-white
              [&::-webkit-slider-thumb]:hover:scale-110
              [&::-webkit-slider-thumb]:transition-all
              [&::-webkit-slider-thumb]:duration-200
              [&::-moz-range-thumb]:w-5
              [&::-moz-range-thumb]:h-5
              [&::-moz-range-thumb]:rounded-full
              [&::-moz-range-thumb]:bg-white/90
              [&::-moz-range-thumb]:cursor-pointer
              [&::-moz-range-thumb]:border-none
              [&::-moz-range-thumb]:shadow-lg
            `}
            onChange={(e) => handleTempoChange(parseInt(e.target.value))}
          />

          {/* Tempo Range Labels */}
          <div
            className={`
            flex justify-between text-sm ${themeClasses.textNeutral}
            px-1
          `}
          >
            <span>30</span>
            <span>BPM</span>
            <span>300</span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={isPlaying ? stop : start}
            className={`
              py-3 px-6 rounded-xl font-semibold text-white text-lg
              transition-all duration-200 shadow-lg
              ${
                isPlaying
                  ? "bg-red-500 hover:bg-red-600 hover:shadow-red-500/30"
                  : "bg-green-500 hover:bg-green-600 hover:shadow-green-500/30"
              }
              hover:scale-105 hover:shadow-xl
              active:scale-95
            `}
          >
            {isPlaying ? "⏸ Stop" : "▶ Start"}
          </button>

          <button
            onClick={processTapTempo}
            className={`
              py-3 px-6 rounded-xl font-semibold text-white text-lg
              bg-blue-500 hover:bg-blue-600 hover:shadow-blue-500/30
              transition-all duration-200 shadow-lg
              hover:scale-105 hover:shadow-xl
              active:scale-95
            `}
          >
            🥁 Tap Tempo
          </button>
        </div>
      </div>
    </div>
  );
}
