"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useThemeClasses } from "../hooks/useThemeClasses";

export default function PitchTuner() {
  const themeClasses = useThemeClasses();

  const [isListening, setIsListening] = useState(false);
  const [frequency, setFrequency] = useState(0);
  const [note, setNote] = useState("");
  const [cents, setCents] = useState(0);
  const [volume, setVolume] = useState(0);
  const [isNearPitch, setIsNearPitch] = useState(false);
  const [isCalibrationMode, setIsCalibrationMode] = useState(false);
  const [calibrationResults, setCalibrationResults] = useState<Array<{target: number, detected: number, note: string}>>([]);
  const [isCollapsed, setIsCollapsed] = useState(true); // Changed from false to true
  
  // Drag and position state
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 600, y: 20 }); // Default position, will be adjusted on mount

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number>();
  const frameCountRef = useRef<number>(0);
  const isListeningRef = useRef<boolean>(false);
  const lastLoggedNoteRef = useRef<string>("");
  const frequencyHistoryRef = useRef<number[]>([]);
  const smoothedFrequencyRef = useRef<number>(0);

  // Update ref when isListening changes
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  // Set initial position relative to viewport center on mount
  useEffect(() => {
    const initialX = window.innerWidth / 2 + 200; // Position to the right of metronome
    setPosition({ x: initialX, y: 20 });
  }, []);

  // Frequency smoothing function to reduce jitter
  const smoothFrequency = (newFrequency: number) => {
    const history = frequencyHistoryRef.current;
    
    // Add new frequency to history
    history.push(newFrequency);
    
    // Keep only last 5 readings for smoothing
    if (history.length > 5) {
      history.shift();
    }
    
    // Calculate weighted average (more weight to recent readings)
    let weightedSum = 0;
    let totalWeight = 0;
    
    for (let i = 0; i < history.length; i++) {
      const weight = i + 1; // More weight to recent readings
      weightedSum += history[i] * weight;
      totalWeight += weight;
    }
    
    const smoothed = weightedSum / totalWeight;
    smoothedFrequencyRef.current = smoothed;
    
    console.log(`🎛️ Frequency smoothing: raw=${newFrequency.toFixed(2)}Hz, smoothed=${smoothed.toFixed(2)}Hz, history=[${history.map(f => f.toFixed(1)).join(', ')}]`);
    
    return smoothed;
  };

  // Exact frequency table for all notes and octaves (Equal Temperament)
  const noteFrequencies = {
    "C0": 16.35, "C1": 32.70, "C2": 65.41, "C3": 130.81, "C4": 261.63, "C5": 523.25, "C6": 1046.50, "C7": 2093.00, "C8": 4186.01,
    "C#0": 17.32, "C#1": 34.65, "C#2": 69.30, "C#3": 138.59, "C#4": 277.18, "C#5": 554.37, "C#6": 1108.73, "C#7": 2217.46, "C#8": 4434.92,
    "Db0": 17.32, "Db1": 34.65, "Db2": 69.30, "Db3": 138.59, "Db4": 277.18, "Db5": 554.37, "Db6": 1108.73, "Db7": 2217.46, "Db8": 4434.92,
    "D0": 18.35, "D1": 36.71, "D2": 73.42, "D3": 146.83, "D4": 293.66, "D5": 587.33, "D6": 1174.66, "D7": 2349.32, "D8": 4698.63,
    "D#0": 19.45, "D#1": 38.89, "D#2": 77.78, "D#3": 155.56, "D#4": 311.13, "D#5": 622.25, "D#6": 1244.51, "D#7": 2489.02, "D#8": 4978.03,
    "Eb0": 19.45, "Eb1": 38.89, "Eb2": 77.78, "Eb3": 155.56, "Eb4": 311.13, "Eb5": 622.25, "Eb6": 1244.51, "Eb7": 2489.02, "Eb8": 4978.03,
    "E0": 20.60, "E1": 41.20, "E2": 82.41, "E3": 164.81, "E4": 329.63, "E5": 659.25, "E6": 1318.51, "E7": 2637.02, "E8": 5274.04,
    "F0": 21.83, "F1": 43.65, "F2": 87.31, "F3": 174.61, "F4": 349.23, "F5": 698.46, "F6": 1396.91, "F7": 2793.83, "F8": 5587.65,
    "F#0": 23.12, "F#1": 46.25, "F#2": 92.50, "F#3": 185.00, "F#4": 369.99, "F#5": 739.99, "F#6": 1479.98, "F#7": 2959.96, "F#8": 5919.91,
    "Gb0": 23.12, "Gb1": 46.25, "Gb2": 92.50, "Gb3": 185.00, "Gb4": 369.99, "Gb5": 739.99, "Gb6": 1479.98, "Gb7": 2959.96, "Gb8": 5919.91,
    "G0": 24.50, "G1": 49.00, "G2": 98.00, "G3": 196.00, "G4": 392.00, "G5": 783.99, "G6": 1567.98, "G7": 3135.96, "G8": 6271.93,
    "G#0": 25.96, "G#1": 51.91, "G#2": 103.83, "G#3": 207.65, "G#4": 415.30, "G#5": 830.61, "G#6": 1661.22, "G#7": 3322.44, "G#8": 6644.88,
    "Ab0": 25.96, "Ab1": 51.91, "Ab2": 103.83, "Ab3": 207.65, "Ab4": 415.30, "Ab5": 830.61, "Ab6": 1661.22, "Ab7": 3322.44, "Ab8": 6644.88,
    "A0": 27.50, "A1": 55.00, "A2": 110.00, "A3": 220.00, "A4": 440.00, "A5": 880.00, "A6": 1760.00, "A7": 3520.00, "A8": 7040.00,
    "A#0": 29.14, "A#1": 58.27, "A#2": 116.54, "A#3": 233.08, "A#4": 466.16, "A#5": 932.33, "A#6": 1864.66, "A#7": 3729.31, "A#8": 7458.62,
    "Bb0": 29.14, "Bb1": 58.27, "Bb2": 116.54, "Bb3": 233.08, "Bb4": 466.16, "Bb5": 932.33, "Bb6": 1864.66, "Bb7": 3729.31, "Bb8": 7458.62,
    "B0": 30.87, "B1": 61.74, "B2": 123.47, "B3": 246.94, "B4": 493.88, "B5": 987.77, "B6": 1975.53, "B7": 3951.07, "B8": 7902.13
  };

  // Convert frequency to note using exact frequency table
  const frequencyToNote = useCallback((freq: number) => {
    if (freq < 15 || freq > 8500) return { note: "", cents: 0, octave: 0 }; // Slightly wider tolerance for detection

    let closestNote = "";
    let closestFrequency = 0;
    let smallestDifference = Infinity;

    // Find the closest frequency in our exact table
    Object.entries(noteFrequencies).forEach(([noteName, noteFreq]) => {
      const difference = Math.abs(freq - noteFreq);
      if (difference < smallestDifference) {
        smallestDifference = difference;
        closestNote = noteName;
        closestFrequency = noteFreq;
      }
    });

    if (!closestNote) return { note: "", cents: 0, octave: 0 };

    // Calculate frequency offset for calibration analysis
    const frequencyOffset = freq - closestFrequency;

    // Calculate actual cents deviation first
    const actualCentsDeviation = Math.round(1200 * Math.log2(freq / closestFrequency));
    
    // Apply ±7 cents buffer zone for "in tune" detection
    let centsDeviation;
    let isInBuffer = Math.abs(actualCentsDeviation) <= 7;
    
    if (isInBuffer) {
      // Within ±7 cents buffer - consider it "in tune"
      centsDeviation = 0;
    } else {
      // Outside buffer - show actual cents deviation
      centsDeviation = actualCentsDeviation;
    }

    // Enhanced debug logging
    const bufferStatus = isInBuffer ? " [IN 7¢ BUFFER]" : "";
    console.log(`🎼 Enhanced detection: ${freq.toFixed(2)}Hz → ${closestNote} (${closestFrequency}Hz) = ${centsDeviation} cents (actual: ${actualCentsDeviation}¢), offset: ${frequencyOffset.toFixed(2)}Hz${bufferStatus}`);

    // Track calibration data for known test frequencies
    const testFrequencies = [440.00, 261.63, 392.00, 329.63]; // A4, C4, G4, E4
    const isTestFrequency = testFrequencies.some(testFreq => Math.abs(closestFrequency - testFreq) < 1);
    
    if (isTestFrequency && Math.abs(frequencyOffset) > 2) {
      console.log(`⚠️ CALIBRATION ALERT: ${closestNote} should be ${closestFrequency}Hz but detected ${freq.toFixed(2)}Hz (${frequencyOffset > 0 ? '+' : ''}${frequencyOffset.toFixed(2)}Hz offset)`);
    }

    // Extract octave from note name (e.g., "C4" -> 4)
    const octave = parseInt(closestNote.match(/\d+/)?.[0] || "0");

    return {
      note: closestNote,
      cents: centsDeviation,
      octave,
    };
  }, []);

  // Circle of Fifths note arrangement (starting from C and going clockwise)
  const circleOfFifths = [
    'C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'G#', 'D#', 'A#', 'F'
  ];

  // Get note name without octave (e.g., "C4" -> "C", "F#3" -> "F#")
  const getNoteWithoutOctave = (noteName: string) => {
    if (!noteName) return '';
    return noteName.replace(/\d+$/, ''); // Remove trailing numbers
  };

  // Check if a note is currently detected (regardless of octave)
  const isNoteActive = (circleNote: string) => {
    if (!note) return false;
    const currentNote = getNoteWithoutOctave(note);
    // Handle enharmonic equivalents
    const enharmonics: { [key: string]: string[] } = {
      'C#': ['C#', 'Db'],
      'Db': ['C#', 'Db'],
      'D#': ['D#', 'Eb'],
      'Eb': ['D#', 'Eb'],
      'F#': ['F#', 'Gb'],
      'Gb': ['F#', 'Gb'],
      'G#': ['G#', 'Ab'],
      'Ab': ['G#', 'Ab'],
      'A#': ['A#', 'Bb'],
      'Bb': ['A#', 'Bb']
    };
    
    // Check direct match
    if (currentNote === circleNote) return true;
    
    // Check enharmonic equivalents
    if (enharmonics[currentNote]?.includes(circleNote)) return true;
    if (enharmonics[circleNote]?.includes(currentNote)) return true;
    
    return false;
  };

  // Get tuning color classes
  const getTuningColorClasses = () => {
    if (!note) return { text: 'text-white', glow: '', bg: '' };
    
    const isInTune = cents === 0; // Within ±7 cents buffer (already handled in detection)
    
    if (isInTune) {
      return {
        text: 'text-green-400',
        glow: 'drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]',
        bg: 'bg-green-400/20'
      };
    } else {
      return {
        text: 'text-red-400', 
        glow: 'drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]',
        bg: 'bg-red-400/20'
      };
    }
  };

  // Hybrid pitch detection - FFT + Autocorrelation for accuracy
  const detectPitch = useCallback(
    (buffer: Float32Array, sampleRate: number) => {
      const bufferSize = buffer.length;
      
      // First, use FFT to get a rough estimate and check if there's enough signal
      const analyser = analyserRef.current;
      if (!analyser) return { frequency: 0, correlation: 0, isNearPitch: false };
      
      const frequencyData = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(frequencyData);
      
      let maxAmplitude = 0;
      let maxIndex = 0;
      
      // Find the frequency bin with the highest amplitude for signal strength check
      const minBin = Math.floor((16 * frequencyData.length) / (sampleRate / 2));
      const maxBin = Math.floor((8000 * frequencyData.length) / (sampleRate / 2));
      
      // Track top 3 peaks for analysis
      const peaks = [];
      for (let i = minBin; i < Math.min(maxBin, frequencyData.length); i++) {
        if (frequencyData[i] > maxAmplitude) {
          maxAmplitude = frequencyData[i];
          maxIndex = i;
        }
        if (frequencyData[i] > 50) { // Track significant peaks
          peaks.push({
            bin: i,
            amplitude: frequencyData[i],
            frequency: (i * sampleRate) / (2 * frequencyData.length)
          });
        }
      }
      
      // Sort peaks by amplitude
      peaks.sort((a, b) => b.amplitude - a.amplitude);
      
      const result = {
        frequency: 0,
        correlation: maxAmplitude / 255,
        isNearPitch: false
      };
      
      // If we have enough signal, use autocorrelation for more accurate pitch detection
      if (maxAmplitude > 20) { // Lowered from 30 for better sensitivity
        console.log(`🔊 Strong signal detected: amplitude=${maxAmplitude}/255, proceeding to autocorrelation...`);
        console.log(`📊 FFT Analysis: Sample rate=${sampleRate}Hz, Max bin=${maxIndex}, Max freq=${((maxIndex * sampleRate) / (2 * frequencyData.length)).toFixed(2)}Hz`);
        
        if (peaks.length > 0) {
          console.log(`🎵 Top FFT peaks:`, peaks.slice(0, 3).map(p => `${p.frequency.toFixed(2)}Hz (${p.amplitude})`).join(', '));
        }
        
        // Autocorrelation method for better pitch accuracy
        const halfBuffer = Math.floor(bufferSize / 2);
        const correlation = new Array(halfBuffer);

        // Calculate autocorrelation
        for (let lag = 0; lag < halfBuffer; lag++) {
          let sum = 0;
          for (let index = 0; index < halfBuffer; index++) {
            const indexLagged = index + lag;
            if (indexLagged < bufferSize) {
              sum += buffer[index] * buffer[indexLagged];
            }
          }
          correlation[lag] = sum / halfBuffer;
        }

        // Find the best correlation in musical frequency range
        let bestCorrelation = 0;
        let bestLag = 0;
        
        const minLag = Math.floor(sampleRate / 8000); // 8000Hz max
        const maxLag = Math.floor(sampleRate / 16);   // 16Hz min
        
        for (let lag = minLag; lag < Math.min(maxLag, halfBuffer); lag++) {
          if (correlation[lag] > bestCorrelation) {
            bestCorrelation = correlation[lag];
            bestLag = lag;
          }
        }
        
        // Lower threshold for autocorrelation detection
        if (bestCorrelation > 0.05 && bestLag > 0) { // Reduced threshold for better sensitivity
          const frequency = sampleRate / bestLag;
          
          if (frequency >= 16 && frequency <= 8000) {
            console.log(`🎯 Hybrid detection: freq=${frequency.toFixed(2)}Hz, correlation=${bestCorrelation.toFixed(4)}, FFT_amp=${maxAmplitude}/255`);
            console.log(`🔍 Lag analysis: bestLag=${bestLag}, sampleRate=${sampleRate}, calculated freq=${frequency.toFixed(2)}`);
            
            // Apply frequency smoothing to reduce jitter
            const smoothedFreq = smoothFrequency(frequency);
            result.frequency = smoothedFreq;
            return result;
          }
        } else {
          // Fallback to FFT if autocorrelation fails - with improved interpolation
          console.log(`⚠️ Autocorrelation failed (correlation=${bestCorrelation.toFixed(4)}), falling back to FFT...`);
          
          // Enhanced FFT with parabolic interpolation
          let frequency = (maxIndex * sampleRate) / (2 * frequencyData.length);
          
          // Parabolic interpolation for sub-bin accuracy
          if (maxIndex > 0 && maxIndex < frequencyData.length - 1) {
            const y1 = frequencyData[maxIndex - 1];
            const y2 = frequencyData[maxIndex];
            const y3 = frequencyData[maxIndex + 1];
            
            // Parabolic interpolation formula
            const a = (y1 - 2 * y2 + y3) / 2;
            const b = (y3 - y1) / 2;
            
            if (a !== 0) {
              const xOffset = -b / (2 * a);
              frequency = ((maxIndex + xOffset) * sampleRate) / (2 * frequencyData.length);
              console.log(`🔬 Parabolic interpolation: offset=${xOffset.toFixed(3)}, improved freq=${frequency.toFixed(2)}Hz`);
            }
          }
          
          if (frequency >= 16 && frequency <= 8000) {
            console.log(`🎯 FFT Fallback: freq=${frequency.toFixed(2)}Hz, amplitude=${maxAmplitude}/255`);
            console.log(`🔍 FFT calculation: maxIndex=${maxIndex}, sampleRate=${sampleRate}, bufferLength=${frequencyData.length}, calculated freq=${frequency.toFixed(2)}`);
            
            // Apply frequency smoothing to reduce jitter
            const smoothedFreq = smoothFrequency(frequency);
            result.frequency = smoothedFreq;
            return result;
          }
        }
      } else if (maxAmplitude > 10) { // Lowered from 15
        // Near-miss detection
        const frequency = (maxIndex * sampleRate) / (2 * frequencyData.length);
        console.log(`🔍 Signal detected but too weak: freq=${frequency.toFixed(2)}Hz, amplitude=${maxAmplitude}/255 (need >20)`);
        result.isNearPitch = true;
      }

      return result;
    },
    []
  );

  // Simple animation loop function
  const startAnimationLoop = () => {
    const loop = () => {
      try {
        // More detailed logging to debug the issue
        const hasAnalyser = !!analyserRef.current;
        const isCurrentlyListening = isListeningRef.current;
        
        if (!hasAnalyser) {
          console.log("🛑 Animation loop stopped: no analyser");
          return;
        }
        
        if (!isCurrentlyListening) {
          console.log("🛑 Animation loop stopped: not listening");
          return;
        }

        frameCountRef.current += 1;
        const frameCount = frameCountRef.current;

        // Log every 100 frames (~every 1.5 seconds) to show the loop is running
        if (frameCount % 100 === 0) {
          console.log(`🔄 Analysis loop running (frame ${frameCount})`);
        }

        const bufferLength = analyserRef.current!.fftSize;
        const dataArray = new Float32Array(bufferLength);

        analyserRef.current!.getFloatTimeDomainData(dataArray);

        // Calculate volume (RMS)
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i] * dataArray[i];
        }
        const rms = Math.sqrt(sum / bufferLength);
        const volumePercent = rms * 100;
        setVolume(volumePercent);

        // Log volume every 30 frames for debugging
        if (Math.random() < 0.02) {  // Reduced from 0.1 to make less noisy
          console.log(`🔊 Current volume: ${volumePercent.toFixed(3)}% (RMS: ${rms.toFixed(6)})`);
        }

        // Extremely sensitive threshold - should pick up any voice
        if (rms > 0.0001) {  // Ultra-low threshold for maximum sensitivity
          const detectedFreq = detectPitch(
            dataArray,
            audioContextRef.current!.sampleRate
          );

          console.log(`🎤 Pitch detection result: freq=${detectedFreq.frequency}, isNear=${detectedFreq.isNearPitch}, amplitude=${(detectedFreq.correlation * 255).toFixed(0)}`);

          if (detectedFreq.frequency > 0) {
            console.log(`🎵 Detected frequency: ${detectedFreq.frequency.toFixed(2)} Hz`);
            setFrequency(Math.round(detectedFreq.frequency * 10) / 10);
            const noteInfo = frequencyToNote(detectedFreq.frequency);
            setNote(noteInfo.note);
            setCents(noteInfo.cents);
            setIsNearPitch(false); // Clear near-pitch when we have actual pitch
          } else {
            // Reset if no frequency detected but volume is present
            setFrequency(0);
            setNote("");
            setCents(0);
            setIsNearPitch(detectedFreq.isNearPitch); // Set near-pitch state from detection result
          }
        } else {
          setFrequency(0);
          setNote("");
          setCents(0);
          setIsNearPitch(false);
        }

        // Continue the animation loop
        if (isListeningRef.current) {
          animationRef.current = requestAnimationFrame(loop);
        } else {
          console.log("🛑 Not scheduling next frame - listening stopped");
        }
      } catch (error) {
        console.error("❌ Error in analysis loop:", error);
        // Try to continue despite errors
        if (isListeningRef.current) {
          animationRef.current = requestAnimationFrame(loop);
        }
      }
    };

    // Start the loop
    console.log("🎬 Starting animation loop...");
    loop();
  };

  // Start listening
  const startListening = async () => {
    try {
      console.log("🎤 Requesting microphone access...");

      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("getUserMedia is not supported in this browser");
      }

      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,  // Enable for voice - helps with feedback
          noiseSuppression: true,  // Enable for voice - reduces background noise
          autoGainControl: true,   // Enable for voice - normalizes volume
          sampleRate: 44100,       // Standard sample rate
          channelCount: 1,         // Mono is fine for pitch detection
        },
      });

      console.log("✅ Microphone access granted");
      streamRef.current = stream;

      // Create audio context
      console.log("🔊 Creating audio context...");
      audioContextRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)();

      // Resume audio context if suspended (required by some browsers)
      if (audioContextRef.current.state === "suspended") {
        await audioContextRef.current.resume();
      }

      // Create analyser with voice-optimized settings
      console.log("📊 Creating analyser...");
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 8192;  // Larger for better frequency resolution
      analyserRef.current.smoothingTimeConstant = 0.2;  // Balanced smoothing - responsive but stable
      analyserRef.current.minDecibels = -95;  // More sensitive to quiet sounds
      analyserRef.current.maxDecibels = -15;   // Better range for voice and instruments

      // Connect microphone to analyser
      console.log("🔗 Connecting microphone to analyser...");
      microphoneRef.current =
        audioContextRef.current.createMediaStreamSource(stream);
      microphoneRef.current.connect(analyserRef.current);

      // Set listening state and ref immediately
      setIsListening(true);
      isListeningRef.current = true;
      console.log("✅ Pitch tuner started successfully");

      // Reset frame counter and start analysis loop
      frameCountRef.current = 0;
      console.log("🎬 Starting audio analysis loop...");
      
      // Add a small delay to ensure everything is ready
      setTimeout(() => {
        console.log(`📊 Pre-loop check: analyser=${!!analyserRef.current}, listening=${isListeningRef.current}`);
        console.log(`🎯 Using calibrated frequency table: C0 (16.35Hz) to B8 (7902.13Hz)`);
        console.log(`🔊 Audio context sample rate: ${audioContextRef.current?.sampleRate}Hz`);
        console.log(`🎚️ Audio processing: Echo cancellation=${true}, Noise suppression=${true}, Auto gain=${true}`);
        console.log(`📏 FFT buffer size: ${analyserRef.current?.fftSize}, Frequency bins: ${analyserRef.current?.frequencyBinCount}`);
        console.log(`🎛️ Frequency smoothing: 5-point weighted average + parabolic interpolation`);
        console.log(`🎯 Buffer zone: ±7 cents around each note = "in tune"`);
        startAnimationLoop();
      }, 100);
    } catch (error) {
      console.error("❌ Error accessing microphone:", error);

      let errorMessage = "Could not access microphone. ";

      if (error instanceof Error) {
        if (error.name === "NotAllowedError") {
          errorMessage +=
            "Permission denied. Please allow microphone access and try again. Check for a microphone icon in your browser's address bar.";
        } else if (error.name === "NotFoundError") {
          errorMessage +=
            "No microphone found. Please connect a microphone and try again.";
        } else if (error.name === "NotReadableError") {
          errorMessage +=
            "Microphone is already in use by another application. Please close other apps using your microphone.";
        } else if (error.name === "AbortError") {
          errorMessage += "Request was aborted.";
        } else if (error.name === "NotSupportedError") {
          errorMessage += "Your browser doesn't support microphone access. Try using Chrome, Firefox, or Safari.";
        } else {
          errorMessage += `Error: ${error.message}`;
        }
      } else {
        errorMessage += "Unknown error occurred.";
      }

      console.log("💡 Troubleshooting tips:");
      console.log("1. Make sure you allowed microphone permission");
      console.log("2. Check if another app is using your microphone");
      console.log("3. Try refreshing the page");
      console.log("4. Make sure you're using HTTPS (required for microphone access)");

      alert(errorMessage);
    }
  };

  // Stop listening
  const stopListening = () => {
    setIsListening(false);

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    microphoneRef.current = null;

    // Reset display and counters
    frameCountRef.current = 0;
    setFrequency(0);
    setNote("");
    setCents(0);
    setVolume(0);
    setIsNearPitch(false);
    lastLoggedNoteRef.current = "";
    frequencyHistoryRef.current = []; // Reset frequency history
    smoothedFrequencyRef.current = 0;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isListening) {
        stopListening();
      }
    };
  }, []);

  // Drag event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    e.preventDefault();
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    
    // Keep within screen bounds - adjust for different sizes
    const widgetWidth = isCollapsed ? 100 : 480; // Very compact width as requested
    const widgetHeight = isCollapsed ? 100 : 480; // Increased for larger collapsed tuner
    const maxX = window.innerWidth - widgetWidth;
    const maxY = window.innerHeight - widgetHeight;
    
    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    });
  }, [isDragging, dragOffset, isCollapsed]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add global mouse event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none'; // Prevent text selection while dragging
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = '';
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Get tuning status
  const getTuningStatus = () => {
    if (!note) return "neutral";
    if (cents === 0) return "in-tune"; // Buffer zone or exactly in tune
    if (cents < 0) return "flat";
    return "sharp";
  };

  const getTuningColor = () => {
    const status = getTuningStatus();
    if (status === "in-tune") return "text-green-400";
    if (status === "flat") return "text-blue-400";
    return "text-red-400";
  };

  const getTuningBgColor = () => {
    const status = getTuningStatus();
    if (status === "in-tune") return "bg-green-400";
    if (status === "flat") return "bg-blue-400";
    return "bg-red-400";
  };

  // Get active segment based on tuning
  const getActiveSegment = () => {
    if (!note) return -1;
    
    if (cents === 0) return 5; // Center segment (in tune)
    
    const maxCents = 50;
    const normalizedCents = Math.max(-maxCents, Math.min(maxCents, cents));
    
    if (cents < 0) {
      // Flat (left side) - segments 0-4
      const segment = Math.floor(Math.abs(normalizedCents) / 10);
      return Math.min(4, 4 - segment);
    } else {
      // Sharp (right side) - segments 6-10
      const segment = Math.floor(normalizedCents / 10);
      return Math.min(10, 6 + segment);
    }
  };

  return (
    <div className="fixed z-50"
         style={{ 
           left: `${position.x}px`, 
           top: `${position.y}px`,
           cursor: isDragging ? 'grabbing' : 'default'
         }}>
      {isCollapsed ? (
        // Collapsed state - floating draggable widget
        <div 
          className={`bg-white/10 backdrop-blur-[10px] border border-white/20 rounded-2xl px-4 py-4 shadow-[0_8px_32px_rgba(0,0,0,0.2)] flex items-center justify-between transition-all duration-300 hover:bg-white/15 cursor-grab ${
            isDragging ? 'scale-105 shadow-[0_12px_40px_rgba(0,0,0,0.3)] cursor-grabbing' : ''
          }`}
          style={{ minWidth: '100px', width: '100px' }}
          onMouseDown={handleMouseDown}
        >
          <button
            onClick={(e) => {
              e.stopPropagation(); // Prevent drag when clicking expand
              setIsCollapsed(false);
            }}
            className="flex items-center justify-center transition-all duration-300 hover:scale-110"
            style={{ marginLeft: '-8px' }}
            title="Expand tuner"
          >
            <span className="text-white text-lg">▼</span>
          </button>
          
          {/* Mini play button with note display */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (isListening) {
                stopListening();
              } else {
                startListening();
              }
            }}
            style={{ width: '40px', height: '40px', borderRadius: '50%' }}
            className={`flex-shrink-0 flex items-center justify-center transition-all duration-300 shadow-lg border-2 ${
              isListening 
                ? "bg-[color:var(--accent-red)] border-[color:var(--accent-red)] hover:bg-[color:var(--text-dark)] hover:border-[color:var(--text-dark)]" 
                : "bg-white/30 border-white/50 hover:bg-white/40 hover:border-white/60"
            }`}
          >
            {note && isListening ? (
              <span className={`text-lg font-black ${getTuningColorClasses().text}`} style={{ WebkitTextStroke: '0.5px currentColor' }}>
                {getNoteWithoutOctave(note)}
              </span>
            ) : (
              <span className="text-white text-lg font-bold">
                {isListening ? "⏸" : "▶"}
              </span>
            )}
          </button>

        </div>
      ) : (
        // Expanded state - large square tuner
        <div 
          className="bg-white/10 backdrop-blur-[10px] border border-white/20 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.2)] flex flex-col relative"
          style={{ width: '480px', height: '480px', minWidth: '480px', minHeight: '480px' }}
        >
          
          {/* Draggable Header - positioned absolutely */}
          <div 
            className={`absolute top-0 left-0 right-0 flex justify-between items-center p-4 cursor-grab hover:bg-white/5 rounded-t-3xl transition-all duration-200 z-10 ${
              isDragging ? 'cursor-grabbing bg-white/10' : ''
            }`}
            onMouseDown={handleMouseDown}
          >
            <div className="flex items-center gap-2">
              <h1 className="font-['Bebas_Neue'] text-lg font-normal text-white tracking-[1px]">
                Tuner
              </h1>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent drag when clicking collapse
                setIsCollapsed(true);
              }}
              className="flex items-center justify-center transition-all duration-300 hover:scale-110"
              title="Collapse tuner"
            >
              <span className="text-white text-xl">▲</span>
            </button>
          </div>

          {/* Tuner Content - centered in the container */}
          <div className="flex-1 flex flex-col items-center justify-center gap-6">
            {/* Circle of Fifths Section */}
            <div className="flex justify-center">
              {/* Circle of Fifths */}
              <div className="relative w-72 h-72">
                {/* Outer circle background */}
                {/* Removed outer circle border as it was causing a vertical line artifact */}
                
                {/* Note positions around the circle */}
                {circleOfFifths.map((circleNote, index) => {
                  const angle = (index * 30) - 90; // 30 degrees per note, start at top
                  const radian = (angle * Math.PI) / 180;
                  const radius = 125; // Reduced for smaller w-72 h-72 circle
                  const x = radius * Math.cos(radian);
                  const y = radius * Math.sin(radian);
                  
                  const isActive = isNoteActive(circleNote);
                  const tuningColors = getTuningColorClasses();
                  
                  return (
                    <div
                      key={circleNote}
                      className={`absolute w-12 h-12 rounded-full border-2 flex items-center justify-center text-base font-bold transition-all duration-300 ${
                        isActive 
                          ? `${tuningColors.bg} ${tuningColors.text} ${tuningColors.glow} scale-110 shadow-lg border-white/40` 
                          : 'bg-white/5 border-white/20 text-white/70 hover:bg-white/10'
                      }`}
                      style={{
                        left: `calc(50% + ${x}px - 24px)`,
                        top: `calc(50% + ${y}px - 24px)`,
                      }}
                    >
                      {circleNote}
                    </div>
                  );
                })}
                
                {/* Center display */}
                <div className="absolute inset-0 z-20 pointer-events-none">
                  {/* Current note display - positioned in upper portion of circle */}
                  <div 
                    className={`absolute left-1/2 transform -translate-x-1/2 text-center transition-all duration-300 pointer-events-auto ${getTuningColorClasses().glow}`}
                    style={{ top: '90px' }}
                  >
                    <div className={`font-['Bebas_Neue'] text-6xl font-black leading-none tracking-wider ${getTuningColorClasses().text}`}>
                      {note ? getNoteWithoutOctave(note) : '♪'}
                    </div>
                  </div>
                  
                  {/* Cents display - positioned in lower portion of circle */}
                  <div 
                    className="absolute left-1/2 transform -translate-x-1/2"
                    style={{ bottom: '70px' }}
                  >
                    <div className="text-center h-14 flex flex-col justify-start">
                      <div className={`text-xs font-medium ${getTuningColorClasses().text} h-5 w-20 flex items-center justify-center`}>
                        {note ? (
                          cents !== 0 ? (
                            <span>{cents > 0 ? '+' : ''}{cents} cents</span>
                          ) : (
                            <span className="text-white/40">In Tune</span>
                          )
                        ) : (
                          <span className="text-white/60">Play a note</span>
                        )}
                      </div>
                      {frequency > 0 && (
                        <div className="text-xs text-white/50 mt-2 h-5 w-20 flex items-center justify-center">
                          {frequency.toFixed(1)}Hz
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Controls Section */}
            <div className="flex flex-col items-center gap-4">
              {/* Start/Stop Button underneath circle */}
              <button
                onClick={() => {
                  if (isListening) {
                    stopListening();
                  } else {
                    startListening();
                  }
                }}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
                  isListening 
                    ? "bg-red-500 hover:bg-red-600 text-white" 
                    : "bg-green-500 hover:bg-green-600 text-white"
                }`}
                title={isListening ? "Stop tuner" : "Start tuner"}
              >
                {isListening ? (
                  // Pause/Stop icon
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                  </svg>
                ) : (
                  // Play icon
                  <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}