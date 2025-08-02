"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSound } from "../contexts/SoundContext";
import { useThemeClasses } from "../hooks/useThemeClasses";

interface FloatingMetronomeProps {
  className?: string;
  onToggleExpand?: () => void;
}

interface SpeedTrainerConfig {
  playMode: 'constant' | 'by_time' | 'by_bar';
  bpmRange: [number, number];
  bpmStep: number;
  byTimeInterval: number; // seconds
  byBarInterval: number; // bars
  stepsNum: number;
}

interface TrainingStep {
  bpm: number;
  duration: number;
  isCompleted: boolean;
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
  const [subdivision, setSubdivision] = useState(1);
  const [currentBeat, setCurrentBeat] = useState(1);
  const [currentSubdivision, setCurrentSubdivision] = useState(1);
  const [accentPattern, setAccentPattern] = useState([1]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [pendulumAngle, setPendulumAngle] = useState(0);
  const [volume, setVolume] = useState(70);
  const animationRef = useRef<number | null>(null);

  // Speed trainer state
  const [isSpeedTrainerMode, setIsSpeedTrainerMode] = useState(false);
  const [speedTrainerEnabled, setSpeedTrainerEnabled] = useState(false);
  const [speedConfig, setSpeedConfig] = useState<SpeedTrainerConfig>({
    playMode: 'by_time',
    bpmRange: [100, 200],
    bpmStep: 10,
    byTimeInterval: 60,
    byBarInterval: 8,
    stepsNum: 10,
  });
  const [trainingSteps, setTrainingSteps] = useState<TrainingStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepProgress, setStepProgress] = useState(0);
  const [planProgress, setPlanProgress] = useState(0);

  // Tap tempo
  const [tapTimes, setTapTimes] = useState<number[]>([]);
  const tapTimesRef = useRef<number[]>([]);

  // Audio timing
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const nextNoteTimeRef = useRef(0);
  const quarterNoteTimeRef = useRef(60.0 / 120);
  const stepTimerRef = useRef<NodeJS.Timeout | null>(null);
  const stepStartTimeRef = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);

  // Initialize audio context
  const initializeAudio = useCallback(async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      masterGainRef.current = audioContextRef.current.createGain();
      masterGainRef.current.connect(audioContextRef.current.destination);
      masterGainRef.current.gain.value = volume / 100 * 0.3;
    }

    if (audioContextRef.current.state === "suspended") {
      await audioContextRef.current.resume();
    }
  }, [volume]);

  // Update audio context volume
  useEffect(() => {
    if (masterGainRef.current) {
      masterGainRef.current.gain.value = volume / 100 * 0.3;
    }
  }, [volume]);

  // Generate training plan
  const generateTrainingPlan = useCallback((config: SpeedTrainerConfig): TrainingStep[] => {
    const steps: TrainingStep[] = [];
    const [minBpm, maxBpm] = config.bpmRange;
    let currentBpm = minBpm;

    while (currentBpm <= maxBpm && steps.length < config.stepsNum) {
      steps.push({
        bpm: currentBpm,
        duration: config.playMode === 'by_time' ? config.byTimeInterval : config.byBarInterval,
        isCompleted: false,
      });
      currentBpm += config.bpmStep;
    }

    return steps;
  }, []);

  // Start speed training
  const startSpeedTraining = useCallback(() => {
    const plan = generateTrainingPlan(speedConfig);
    setTrainingSteps(plan);
    setCurrentStepIndex(0);
    setStepProgress(0);
    setPlanProgress(0);
    
    if (plan.length > 0) {
      setTempo(plan[0].bpm);
      setSpeedTrainerEnabled(true);
    }
  }, [speedConfig, generateTrainingPlan]);

  // Stop speed training
  const stopSpeedTraining = useCallback(() => {
    setSpeedTrainerEnabled(false);
    setTrainingSteps([]);
    setCurrentStepIndex(0);
    setStepProgress(0);
    setPlanProgress(0);
    if (stepTimerRef.current) {
      clearTimeout(stepTimerRef.current);
    }
  }, []);

  // Progress to next step
  const progressToNextStep = useCallback(() => {
    if (currentStepIndex < trainingSteps.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      setTempo(trainingSteps[nextIndex].bpm);
      setStepProgress(0);
      
      // Mark current step as completed
      setTrainingSteps(prev => prev.map((step, index) => 
        index === currentStepIndex ? { ...step, isCompleted: true } : step
      ));
      
      // Update plan progress
      setPlanProgress(((nextIndex) / trainingSteps.length) * 100);
    } else {
      // Training complete
      setSpeedTrainerEnabled(false);
      setPlanProgress(100);
    }
  }, [currentStepIndex, trainingSteps]);

  // Play metronome sound
  const playClickSound = useCallback(
    async (isAccent: boolean = false) => {
      if (!audioContextRef.current || !masterGainRef.current) return;

      try {
        const context = audioContextRef.current;
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(masterGainRef.current);

        const frequency = isAccent ? 1200 : 800;
        oscillator.frequency.setValueAtTime(frequency, context.currentTime);

        gainNode.gain.setValueAtTime(0, context.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, context.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.1);

        oscillator.start(context.currentTime);
        oscillator.stop(context.currentTime + 0.1);
      } catch (error) {
        console.error("Error playing metronome sound:", error);
      }
    },
    []
  );

  // Schedule a note
  const scheduleNote = useCallback(() => {
    if (!audioContextRef.current) return;

    const currentTime = audioContextRef.current.currentTime;
    
    while (nextNoteTimeRef.current < currentTime + 0.1) {
      const isAccent = currentBeat === 1 || accentPattern.includes(currentBeat);
      playClickSound(isAccent);

      // Move to next subdivision
      if (currentSubdivision < subdivision) {
        setCurrentSubdivision(prev => prev + 1);
      } else {
        setCurrentSubdivision(1);
        if (currentBeat < timeSignature.beats) {
          setCurrentBeat(prev => prev + 1);
        } else {
          setCurrentBeat(1);
        }
      }

      // Calculate next note time
      const secondsPerBeat = 60.0 / tempo;
      const subdivisionTime = secondsPerBeat / subdivision;
      nextNoteTimeRef.current += subdivisionTime;
    }
  }, [currentBeat, currentSubdivision, subdivision, timeSignature.beats, tempo, accentPattern, playClickSound]);

  // Handle tempo change
  const handleTempoChange = (newTempo: number) => {
    if (newTempo >= 30 && newTempo <= 300) {
      setTempo(newTempo);
      quarterNoteTimeRef.current = 60.0 / newTempo;
    }
  };

  // Start metronome
  const start = async () => {
    await initializeAudio();
    
    if (!audioContextRef.current) return;

    nextNoteTimeRef.current = audioContextRef.current.currentTime;
    setIsPlaying(true);
    
    // Start speed training timer if enabled
    if (speedTrainerEnabled && trainingSteps.length > 0) {
      stepStartTimeRef.current = Date.now();
      const currentStep = trainingSteps[currentStepIndex];
      const duration = speedConfig.playMode === 'by_time' ? currentStep.duration * 1000 : (currentStep.duration * 4 * 60000) / tempo;
      
      stepTimerRef.current = setTimeout(() => {
        progressToNextStep();
      }, duration);
    }
  };

  // Stop metronome
  const stop = () => {
    setIsPlaying(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (stepTimerRef.current) {
      clearTimeout(stepTimerRef.current);
    }
  };

  // Tap tempo processing
  const processTapTempo = useCallback(() => {
    const now = Date.now();
    const newTapTimes = [...tapTimesRef.current, now].slice(-4);
    tapTimesRef.current = newTapTimes;
    setTapTimes(newTapTimes);

    if (newTapTimes.length >= 2) {
      const intervals = [];
      for (let i = 1; i < newTapTimes.length; i++) {
        intervals.push(newTapTimes[i] - newTapTimes[i - 1]);
      }
      const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
      const newTempo = Math.round(60000 / avgInterval);
      
      if (newTempo >= 30 && newTempo <= 300) {
        setTempo(newTempo);
      }
    }
  }, []);

  // Progress tracking for speed trainer
  useEffect(() => {
    if (speedTrainerEnabled && isPlaying && currentStepIndex < trainingSteps.length) {
      const interval = setInterval(() => {
        const elapsed = Date.now() - stepStartTimeRef.current;
        const currentStep = trainingSteps[currentStepIndex];
        const totalDuration = speedConfig.playMode === 'by_time' ? currentStep.duration * 1000 : (currentStep.duration * 4 * 60000) / tempo;
        const progress = Math.min((elapsed / totalDuration) * 100, 100);
        setStepProgress(progress);
      }, 100);

      return () => clearInterval(interval);
    }
  }, [speedTrainerEnabled, isPlaying, currentStepIndex, trainingSteps, speedConfig.playMode, tempo]);

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
    let animationId: number;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      
      if (isPlaying) {
        // Dynamic animation based on tempo when playing
        const beatDuration = (60 / tempo) * 1000;
        const beatProgress = (elapsed % beatDuration) / beatDuration;
        const beatNumber = Math.floor(elapsed / beatDuration);
        const isEvenBeat = beatNumber % 2 === 0;
        const swingDirection = isEvenBeat ? 1 : -1;
        const angle = Math.sin(beatProgress * Math.PI) * 25 * swingDirection;
        setPendulumAngle(angle);
      } else {
        // Gentle idle animation when not playing (slow, subtle swing)
        const idlePeriod = 3000; // 3 second period for idle swing
        const idleProgress = (elapsed % idlePeriod) / idlePeriod;
        const angle = Math.sin(idleProgress * Math.PI * 2) * 8; // Small 8-degree swing
        setPendulumAngle(angle);
      }
      
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
                    {isSpeedTrainerMode && (
                      <span className="text-xs text-purple-400 font-medium">
                        🚀
                      </span>
                    )}
                  </div>
                  {/* Beat Indicator Dots */}
                  <div className="flex gap-1 justify-center">
                    {Array.from({ length: timeSignature.beats }).map((_, i) => (
                      <div
                        key={i}
                        className={`
                          w-2 h-2 rounded-full transition-all duration-150
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
                {isSpeedTrainerMode ? "🚀 Speed Trainer" : "🎼 Metronome"}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsSpeedTrainerMode(!isSpeedTrainerMode);
                    if (speedTrainerEnabled) stopSpeedTraining();
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${
                    isSpeedTrainerMode 
                      ? 'bg-purple-500 text-white' 
                      : 'bg-white/10 hover:bg-white/20 text-[var(--text-dark)]'
                  }`}
                >
                  {isSpeedTrainerMode ? "🎼" : "🚀"}
                </button>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[var(--text-dark)] transition-all duration-200 hover:scale-105 text-sm"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Compact Metronome Visual */}
            <div className="flex justify-center mb-4">
              <div className="relative">
                <svg width="60" height="70" viewBox="0 0 60 70" className="overflow-visible">
                  {/* Base */}
                  <rect x="10" y="65" width="40" height="4" fill="#374151" stroke="#1f2937" strokeWidth="0.5"/>
                  
                  {/* Triangle Body */}
                  <polygon 
                    points="30,10 15,65 45,65" 
                    fill="#4b5563" 
                    stroke="#374151" 
                    strokeWidth="1"
                  />
                  
                  {/* Pendulum Group - rotates around the apex (30,10) */}
                  <g 
                    transform={`rotate(${pendulumAngle}, 30, 10)`}
                    style={{
                      transformOrigin: '30px 10px',
                      transition: 'transform 100ms ease-out'
                    }}
                  >
                    {/* Pendulum Rod - Made Thicker */}
                    <line x1="30" y1="10" x2="30" y2="45" stroke="#1f2937" strokeWidth="2"/>
                    
                    {/* Pendulum Weight - Made Bigger */}
                    <circle cx="30" cy="32" r="6" fill="#1f2937" stroke="#374151" strokeWidth="1"/>
                    <circle cx="30" cy="32" r="4" fill="#374151"/>
                    <circle cx="30" cy="32" r="2" fill="#4b5563"/>
                  </g>
                  
                  {/* Beat Indicators */}
                  <g transform="translate(30, 55)">
                    {Array.from({ length: Math.min(timeSignature.beats, 4) }, (_, i) => (
                      <circle 
                        key={i}
                        cx={-6 + i * 4} 
                        cy="0" 
                        r="1.5"
                        fill={currentBeat === i + 1 ? '#fbbf24' : '#6b7280'}
                        className="transition-all duration-200"
                      />
                    ))}
                  </g>
                </svg>
              </div>
            </div>

            {/* Speed Training Progress */}
            {isSpeedTrainerMode && speedTrainerEnabled && trainingSteps.length > 0 && (
              <div className="space-y-2 p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-purple-400 font-medium">
                    Step {currentStepIndex + 1} of {trainingSteps.length}
                  </span>
                  <span className="text-xs text-purple-400">
                    {Math.round(stepProgress)}%
                  </span>
                </div>
                <div className="w-full bg-purple-900/30 rounded-full h-1.5">
                  <div 
                    className="bg-purple-500 h-1.5 rounded-full transition-all duration-200"
                    style={{ width: `${stepProgress}%` }}
                  ></div>
                </div>
                <div className="text-xs text-purple-300">
                  {trainingSteps[currentStepIndex]?.bpm} BPM
                </div>
              </div>
            )}

            <div className="space-y-3">
              {/* Mode-specific controls */}
              {!isSpeedTrainerMode ? (
                <>
                  {/* Regular Metronome Controls */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Tempo Control */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[var(--text-dark)]">
                        Tempo
                      </label>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleTempoChange(tempo - 5)}
                          className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 text-[var(--text-dark)] text-xs flex items-center justify-center transition-all duration-200"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min="30"
                          max="300"
                          value={tempo}
                          onChange={(e) => handleTempoChange(parseInt(e.target.value) || 30)}
                          className="flex-1 p-1 text-xs text-center bg-white/10 border border-white/20 rounded text-[var(--text-dark)] focus:outline-none focus:ring-1 focus:ring-white/50"
                        />
                        <button
                          onClick={() => handleTempoChange(tempo + 5)}
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
                        onChange={(e) => handleTempoChange(parseInt(e.target.value))}
                        className="w-full h-1 rounded-full appearance-none bg-white/20 cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--accent-red)] [&::-webkit-slider-thumb]:cursor-pointer"
                      />
                    </div>

                    {/* Time Signature & Volume */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[var(--text-dark)]">
                        Time Sig & Vol
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
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={volume}
                        onChange={(e) => setVolume(parseInt(e.target.value))}
                        className="w-full h-1 rounded-full appearance-none bg-white/20 cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--accent-red)] [&::-webkit-slider-thumb]:cursor-pointer"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Speed Trainer Controls */}
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-[var(--text-dark)]">
                          BPM Range
                        </label>
                        <div className="flex gap-1">
                          <input
                            type="number"
                            value={speedConfig.bpmRange[0]}
                            onChange={(e) => setSpeedConfig(prev => ({
                              ...prev,
                              bpmRange: [parseInt(e.target.value) || 60, prev.bpmRange[1]]
                            }))}
                            className="w-12 p-1 text-xs text-center bg-white/10 border border-white/20 rounded text-[var(--text-dark)]"
                            min="30"
                            max="300"
                          />
                          <span className="text-xs text-[var(--neutral-gray)] self-center">-</span>
                          <input
                            type="number"
                            value={speedConfig.bpmRange[1]}
                            onChange={(e) => setSpeedConfig(prev => ({
                              ...prev,
                              bpmRange: [prev.bpmRange[0], parseInt(e.target.value) || 120]
                            }))}
                            className="w-12 p-1 text-xs text-center bg-white/10 border border-white/20 rounded text-[var(--text-dark)]"
                            min="30"
                            max="300"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-[var(--text-dark)]">
                          Step & Mode
                        </label>
                        <div className="flex gap-1">
                          <input
                            type="number"
                            value={speedConfig.bpmStep}
                            onChange={(e) => setSpeedConfig(prev => ({
                              ...prev,
                              bpmStep: parseInt(e.target.value) || 5
                            }))}
                            className="w-12 p-1 text-xs text-center bg-white/10 border border-white/20 rounded text-[var(--text-dark)]"
                            min="1"
                            max="50"
                          />
                          <select
                            value={speedConfig.playMode}
                            onChange={(e) => setSpeedConfig(prev => ({
                              ...prev,
                              playMode: e.target.value as 'constant' | 'by_time' | 'by_bar'
                            }))}
                            className="flex-1 p-1 text-xs bg-white/10 border border-white/20 rounded text-[var(--text-dark)]"
                          >
                            <option value="by_time">Time</option>
                            <option value="by_bar">Bars</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="text-xs font-medium text-[var(--text-dark)]">
                          Duration
                        </label>
                        <input
                          type="number"
                          value={speedConfig.playMode === 'by_time' ? speedConfig.byTimeInterval : speedConfig.byBarInterval}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 30;
                            setSpeedConfig(prev => ({
                              ...prev,
                              [speedConfig.playMode === 'by_time' ? 'byTimeInterval' : 'byBarInterval']: value
                            }));
                          }}
                          className="w-full p-1 text-xs text-center bg-white/10 border border-white/20 rounded text-[var(--text-dark)]"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs font-medium text-[var(--text-dark)]">
                          Steps
                        </label>
                        <input
                          type="number"
                          value={speedConfig.stepsNum}
                          onChange={(e) => setSpeedConfig(prev => ({
                            ...prev,
                            stepsNum: parseInt(e.target.value) || 5
                          }))}
                          className="w-full p-1 text-xs text-center bg-white/10 border border-white/20 rounded text-[var(--text-dark)]"
                          min="1"
                          max="20"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Bottom Controls */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--text-dark)]">
                  Control
                </label>
                <div className="flex gap-2">
                  {isSpeedTrainerMode ? (
                    <>
                      <button
                        onClick={() => speedTrainerEnabled ? stopSpeedTraining() : startSpeedTraining()}
                        className={`flex-1 py-2 px-4 rounded text-sm font-medium text-white transition-all duration-200 ${
                          speedTrainerEnabled 
                            ? 'bg-red-500 hover:bg-red-600' 
                            : 'bg-purple-500 hover:bg-purple-600'
                        }`}
                      >
                        {speedTrainerEnabled ? '⏹ Stop Training' : '🚀 Start Training'}
                      </button>
                      <button
                        onClick={isPlaying ? stop : start}
                        className={`px-4 py-2 rounded text-sm font-medium text-white transition-all duration-200 ${
                          isPlaying
                            ? "bg-red-500 hover:bg-red-600"
                            : "bg-green-500 hover:bg-green-600"
                        }`}
                      >
                        {isPlaying ? "⏸" : "▶"}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={isPlaying ? stop : start}
                        className={`flex-1 py-2 px-4 rounded text-sm font-medium text-white transition-all duration-200 ${
                          isPlaying
                            ? "bg-red-500 hover:bg-red-600"
                            : "bg-green-500 hover:bg-green-600"
                        }`}
                      >
                        {isPlaying ? "⏸ Stop" : "▶ Start"}
                      </button>
                      <button
                        onClick={processTapTempo}
                        className="px-3 py-2 rounded text-sm bg-blue-500 hover:bg-blue-600 text-white transition-all duration-200"
                      >
                        🥁
                      </button>
                      <button
                        onClick={() => {
                          handleTempoChange(120);
                          setTimeSignature({ beats: 4, noteValue: 4 });
                          setCurrentBeat(1);
                          setVolume(70);
                          if (isPlaying) stop();
                        }}
                        className="px-3 py-2 rounded text-sm bg-white/10 hover:bg-white/20 text-[var(--text-dark)] transition-all duration-200"
                      >
                        Reset
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Beat Indicator */}
            <div className="flex justify-center gap-1.5 pt-2">
              {Array.from({ length: timeSignature.beats }).map((_, i) => (
                <div
                  key={i}
                  className={`
                    w-2.5 h-2.5 rounded-full transition-all duration-200
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

