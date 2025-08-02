"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSound } from "../contexts/SoundContext";
import { useThemeClasses } from "../hooks/useThemeClasses";
import { MetronomeSettings } from "../types";

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
  const [volume, setVolume] = useState(70);

  // Speed trainer state
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
      setTrainingSteps(prev => 
        prev.map((step, idx) => 
          idx === currentStepIndex ? { ...step, isCompleted: true } : step
        )
      );
      
      // Update plan progress
      setPlanProgress((nextIndex / trainingSteps.length) * 100);
    } else {
      // Training complete
      stopSpeedTraining();
      setIsPlaying(false);
    }
  }, [currentStepIndex, trainingSteps, stopSpeedTraining]);

  // Play a click sound
  const playClickSound = useCallback(
    (isAccent: boolean = false) => {
      if (!audioContextRef.current) return;

      const context = audioContextRef.current;
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(masterGainRef.current!);

      // Set frequency based on accent
      oscillator.frequency.setValueAtTime(
        isAccent ? 800 : 400,
        context.currentTime
      );
      oscillator.type = "sine";

      // Set volume envelope
      gainNode.gain.setValueAtTime(0, context.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, context.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.1);

      oscillator.start(context.currentTime);
      oscillator.stop(context.currentTime + 0.1);
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
    setCurrentBeat(1);
    setCurrentSubdivision(1);
    
    if (stepTimerRef.current) {
      clearTimeout(stepTimerRef.current);
    }
  };

  // Tap tempo processing
  const processTapTempo = () => {
    const now = Date.now();
    const newTapTimes = [...tapTimesRef.current, now].slice(-8);
    tapTimesRef.current = newTapTimes;
    setTapTimes(newTapTimes);

    if (newTapTimes.length >= 2) {
      const intervals = [];
      for (let i = 1; i < newTapTimes.length; i++) {
        intervals.push(newTapTimes[i] - newTapTimes[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const bpm = Math.round(60000 / avgInterval);
      if (bpm >= 30 && bpm <= 300) {
        handleTempoChange(bpm);
      }
    }
  };

  // Update step progress
  useEffect(() => {
    if (speedTrainerEnabled && isPlaying && stepStartTimeRef.current > 0) {
      const updateProgress = () => {
        const elapsed = Date.now() - stepStartTimeRef.current;
        const currentStep = trainingSteps[currentStepIndex];
        if (currentStep) {
          const totalDuration = speedConfig.playMode === 'by_time' ? currentStep.duration * 1000 : (currentStep.duration * 4 * 60000) / tempo;
          const progress = Math.min((elapsed / totalDuration) * 100, 100);
          setStepProgress(progress);
        }
      };

      const interval = setInterval(updateProgress, 100);
      return () => clearInterval(interval);
    }
  }, [speedTrainerEnabled, isPlaying, currentStepIndex, trainingSteps, speedConfig.playMode, tempo]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          isPlaying ? stop() : start();
          break;
        case 'Escape':
          e.preventDefault();
          stop();
          break;
        case 'ArrowUp':
          e.preventDefault();
          handleTempoChange(tempo + (e.shiftKey ? 10 : 1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleTempoChange(tempo - (e.shiftKey ? 10 : 1));
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (speedTrainerEnabled && currentStepIndex > 0) {
            const prevIndex = currentStepIndex - 1;
            setCurrentStepIndex(prevIndex);
            setTempo(trainingSteps[prevIndex].bpm);
            setStepProgress(0);
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (speedTrainerEnabled) {
            progressToNextStep();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying, tempo, speedTrainerEnabled, currentStepIndex, trainingSteps, progressToNextStep, start, stop]);

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
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header with Speed Trainer Toggle */}
      <div className={`${themeClasses.card} p-6 rounded-2xl`}>
        <div className="flex items-center justify-between mb-4">
          <h1 className={`text-3xl font-bold ${themeClasses.textDark}`}>
            🥁 Speed Trainer Metronome
          </h1>
          <button
            onClick={() => speedTrainerEnabled ? stopSpeedTraining() : startSpeedTraining()}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
              speedTrainerEnabled 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-purple-500 hover:bg-purple-600 text-white'
            }`}
          >
            {speedTrainerEnabled ? '⏹ Stop Training' : '🚀 Start Speed Training'}
          </button>
        </div>

        {/* Speed Training Progress */}
        {speedTrainerEnabled && trainingSteps.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className={`text-sm font-medium ${themeClasses.textDark}`}>
                Step {currentStepIndex + 1} of {trainingSteps.length}
              </span>
              <span className={`text-sm ${themeClasses.textNeutral}`}>
                {trainingSteps[currentStepIndex]?.bpm} BPM
              </span>
              <span className={`text-sm ${themeClasses.textNeutral}`}>
                {Math.round(stepProgress)}% complete
              </span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${stepProgress}%` }}
              />
            </div>
            <div className="w-full bg-white/10 rounded-full h-1">
              <div 
                className="bg-blue-500 h-1 rounded-full transition-all duration-300" 
                style={{ width: `${planProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Speed Training Controls */}
        <div className={`${themeClasses.card} p-6 rounded-2xl space-y-6`}>
          <h3 className={`text-xl font-bold ${themeClasses.textDark} mb-4`}>
            Speed Training Setup
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium ${themeClasses.textDark} mb-2`}>
                Play Mode
              </label>
              <select
                value={speedConfig.playMode}
                onChange={(e) => setSpeedConfig(prev => ({ ...prev, playMode: e.target.value as any }))}
                className={`w-full p-3 rounded-lg ${themeClasses.input}`}
              >
                <option value="constant">Constant BPM</option>
                <option value="by_time">By Time (seconds)</option>
                <option value="by_bar">By Bars</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium ${themeClasses.textDark} mb-2`}>
                  Start BPM
                </label>
                <input
                  type="number"
                  min="30"
                  max="300"
                  value={speedConfig.bpmRange[0]}
                  onChange={(e) => setSpeedConfig(prev => ({ 
                    ...prev, 
                    bpmRange: [parseInt(e.target.value), prev.bpmRange[1]] 
                  }))}
                  className={`w-full p-3 rounded-lg ${themeClasses.input}`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${themeClasses.textDark} mb-2`}>
                  End BPM
                </label>
                <input
                  type="number"
                  min="30"
                  max="300"
                  value={speedConfig.bpmRange[1]}
                  onChange={(e) => setSpeedConfig(prev => ({ 
                    ...prev, 
                    bpmRange: [prev.bpmRange[0], parseInt(e.target.value)] 
                  }))}
                  className={`w-full p-3 rounded-lg ${themeClasses.input}`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium ${themeClasses.textDark} mb-2`}>
                  BPM Step
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={speedConfig.bpmStep}
                  onChange={(e) => setSpeedConfig(prev => ({ ...prev, bpmStep: parseInt(e.target.value) }))}
                  className={`w-full p-3 rounded-lg ${themeClasses.input}`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${themeClasses.textDark} mb-2`}>
                  Max Steps
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={speedConfig.stepsNum}
                  onChange={(e) => setSpeedConfig(prev => ({ ...prev, stepsNum: parseInt(e.target.value) }))}
                  className={`w-full p-3 rounded-lg ${themeClasses.input}`}
                />
              </div>
            </div>

            {speedConfig.playMode === 'by_time' && (
              <div>
                <label className={`block text-sm font-medium ${themeClasses.textDark} mb-2`}>
                  Time per Step (seconds)
                </label>
                <input
                  type="number"
                  min="5"
                  max="300"
                  value={speedConfig.byTimeInterval}
                  onChange={(e) => setSpeedConfig(prev => ({ ...prev, byTimeInterval: parseInt(e.target.value) }))}
                  className={`w-full p-3 rounded-lg ${themeClasses.input}`}
                />
              </div>
            )}

            {speedConfig.playMode === 'by_bar' && (
              <div>
                <label className={`block text-sm font-medium ${themeClasses.textDark} mb-2`}>
                  Bars per Step
                </label>
                <input
                  type="number"
                  min="1"
                  max="32"
                  value={speedConfig.byBarInterval}
                  onChange={(e) => setSpeedConfig(prev => ({ ...prev, byBarInterval: parseInt(e.target.value) }))}
                  className={`w-full p-3 rounded-lg ${themeClasses.input}`}
                />
              </div>
            )}
          </div>

          {/* Training Steps Preview */}
          {!speedTrainerEnabled && (
            <div className="mt-6">
              <h4 className={`text-lg font-semibold ${themeClasses.textDark} mb-3`}>
                Training Preview
              </h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {generateTrainingPlan(speedConfig).map((step, index) => (
                  <div key={index} className="flex justify-between items-center text-sm p-2 bg-white/5 rounded">
                    <span>Step {index + 1}</span>
                    <span>{step.bpm} BPM</span>
                    <span>{step.duration} {speedConfig.playMode === 'by_time' ? 'sec' : 'bars'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Center: Metronome Visual */}
        <div className="flex justify-center items-start">
          <div className="relative w-96 h-[550px] flex justify-center items-start">
            {/* Tempo Display */}
            <div className={`absolute -top-16 left-1/2 transform -translate-x-1/2 text-center p-4 rounded-2xl ${themeClasses.card}`}>
              <div className={`text-6xl font-bold ${themeClasses.textDark} mb-2`}>
                {tempo}
              </div>
              <div className={`text-lg font-semibold ${themeClasses.textNeutral}`}>
                BPM
              </div>
            </div>

            {/* Metronome Body */}
            <div className={`
              absolute top-0 w-80 h-96 rounded-t-3xl rounded-b-lg
              ${themeClasses.metronomeBody}
              border-4 border-[var(--shape-color-1)]/80
              shadow-2xl relative overflow-hidden
            `}>
              {/* Center Line */}
              <div className="absolute top-1/2 left-1/2 w-0.5 h-48 bg-white/20 -translate-x-1/2 -translate-y-1/2"></div>
              
              {/* Beat Indicators */}
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                {Array.from({ length: timeSignature.beats }, (_, i) => (
                  <div
                    key={i}
                    className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                      currentBeat === i + 1
                        ? 'bg-yellow-400 border-yellow-300 shadow-lg'
                        : 'bg-white/10 border-white/30'
                    }`}
                  />
                ))}
              </div>

              {/* Decorative Elements */}
              <div className="absolute top-16 left-1/2 w-16 h-2 bg-white/10 rounded-full -translate-x-1/2"></div>
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
              <div className={`
                absolute bottom-0 w-8 h-8 rounded-full -translate-x-1/2
                ${themeClasses.metronomeWeight}
                shadow-lg border-2 border-white/20
              `}>
                <div className="absolute inset-1 rounded-full bg-white/10"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Controls */}
        <div className={`${themeClasses.card} p-6 rounded-2xl space-y-6`}>
          <h3 className={`text-xl font-bold ${themeClasses.textDark}`}>
            Controls
          </h3>

          {/* Tempo Control */}
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium ${themeClasses.textDark} mb-2`}>
                Tempo (BPM)
              </label>
              <input
                type="number"
                min="30"
                max="300"
                value={tempo}
                onChange={(e) => handleTempoChange(parseInt(e.target.value))}
                className={`w-full p-3 rounded-lg ${themeClasses.input}`}
              />
            </div>

            <input
              type="range"
              min="30"
              max="300"
              value={tempo}
              onChange={(e) => handleTempoChange(parseInt(e.target.value))}
              className="w-full h-2 rounded-full appearance-none bg-white/20 cursor-pointer"
            />

            <div className="flex justify-between gap-2">
              <button
                onClick={() => handleTempoChange(tempo - 10)}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                -10
              </button>
              <button
                onClick={() => handleTempoChange(tempo - 1)}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                -1
              </button>
              <button
                onClick={() => handleTempoChange(tempo + 1)}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
              >
                +1
              </button>
              <button
                onClick={() => handleTempoChange(tempo + 10)}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
              >
                +10
              </button>
            </div>
          </div>

          {/* Volume Control */}
          <div>
            <label className={`block text-sm font-medium ${themeClasses.textDark} mb-2`}>
              Volume ({volume}%)
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => setVolume(parseInt(e.target.value))}
              className="w-full h-2 rounded-full appearance-none bg-white/20 cursor-pointer"
            />
          </div>

          {/* Time Signature */}
          <div>
            <label className={`block text-sm font-medium ${themeClasses.textDark} mb-2`}>
              Time Signature
            </label>
            <select
              value={`${timeSignature.beats}/${timeSignature.noteValue}`}
              onChange={(e) => {
                const [beats, noteValue] = e.target.value.split('/').map(Number);
                setTimeSignature({ beats, noteValue });
                setCurrentBeat(1);
              }}
              className={`w-full p-3 rounded-lg ${themeClasses.input}`}
            >
              <option value="2/4">2/4</option>
              <option value="3/4">3/4</option>
              <option value="4/4">4/4</option>
              <option value="5/4">5/4</option>
              <option value="6/8">6/8</option>
              <option value="7/8">7/8</option>
            </select>
          </div>

          {/* Control Buttons */}
          <div className="space-y-3">
            <button
              onClick={isPlaying ? stop : start}
              className={`w-full py-4 px-6 rounded-xl font-semibold text-white text-lg transition-all duration-200 shadow-lg ${
                isPlaying
                  ? "bg-red-500 hover:bg-red-600 hover:shadow-red-500/30"
                  : "bg-green-500 hover:bg-green-600 hover:shadow-green-500/30"
              } hover:scale-105 hover:shadow-xl active:scale-95`}
            >
              {isPlaying ? "⏸ Stop" : "▶ Start"}
            </button>

            <button
              onClick={processTapTempo}
              className="w-full py-3 px-6 rounded-xl font-semibold text-white text-lg bg-blue-500 hover:bg-blue-600 hover:shadow-blue-500/30 transition-all duration-200 shadow-lg hover:scale-105 hover:shadow-xl active:scale-95"
            >
              🥁 Tap Tempo
            </button>
          </div>

          {/* Keyboard Shortcuts */}
          <div className="mt-6 p-4 bg-white/5 rounded-lg">
            <h4 className={`text-sm font-medium ${themeClasses.textDark} mb-2`}>
              Keyboard Shortcuts
            </h4>
            <div className="text-xs space-y-1 text-gray-300">
              <div><kbd className="bg-gray-700 px-1 rounded">Space</kbd> Start/Stop</div>
              <div><kbd className="bg-gray-700 px-1 rounded">Esc</kbd> Stop</div>
              <div><kbd className="bg-gray-700 px-1 rounded">↑/↓</kbd> BPM ±1</div>
              <div><kbd className="bg-gray-700 px-1 rounded">Shift+↑/↓</kbd> BPM ±10</div>
              <div><kbd className="bg-gray-700 px-1 rounded">←/→</kbd> Training Steps</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
