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
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Drag and position state
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 20, y: 20 }); // Default position

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

    // Apply ±10Hz buffer zone for "in tune" detection
    let centsDeviation;
    let isInBuffer = Math.abs(frequencyOffset) <= 10;
    
    if (isInBuffer) {
      // Within ±10Hz buffer - consider it "in tune"
      centsDeviation = 0;
    } else {
      // Outside buffer - calculate actual cents deviation
      centsDeviation = Math.round(1200 * Math.log2(freq / closestFrequency));
    }

    // Enhanced debug logging
    const bufferStatus = isInBuffer ? " [IN 10Hz BUFFER]" : "";
    console.log(`🎼 Enhanced detection: ${freq.toFixed(2)}Hz → ${closestNote} (${closestFrequency}Hz) = ${centsDeviation} cents, offset: ${frequencyOffset.toFixed(2)}Hz${bufferStatus}`);

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
        console.log(`🎯 Buffer zone: ±10Hz around each note = "in tune"`);
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
    const widgetWidth = isCollapsed ? 200 : 320; // Approximate widths
    const widgetHeight = isCollapsed ? 80 : 300; // Approximate heights
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

  // Calculate needle angle based on cents (-45° to +45°)
  const getNeedleAngle = () => {
    if (!note || cents === 0) return 0; // Center position when in tune
    
    // Map cents to angle (±50 cents = ±45 degrees)
    const maxCents = 50;
    const clampedCents = Math.max(-maxCents, Math.min(maxCents, cents));
    return (clampedCents / maxCents) * 45;
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
          className={`bg-white/10 backdrop-blur-[10px] border border-white/20 rounded-2xl p-3 shadow-[0_8px_32px_rgba(0,0,0,0.2)] flex items-center gap-3 transition-all duration-300 hover:bg-white/15 cursor-grab ${
            isDragging ? 'scale-105 shadow-[0_12px_40px_rgba(0,0,0,0.3)] cursor-grabbing' : ''
          }`}
          onMouseDown={handleMouseDown}
        >
          <button
            onClick={(e) => {
              e.stopPropagation(); // Prevent drag when clicking expand
              setIsCollapsed(false);
            }}
            className="w-10 h-10 rounded-xl bg-[color:var(--accent-red)] hover:bg-[color:var(--text-dark)] flex items-center justify-center transition-all duration-300 shadow-lg border-2 border-[color:var(--accent-red)] hover:border-[color:var(--text-dark)]"
            title="Expand tuner"
          >
            <svg className="w-5 h-5 text-[color:var(--bg-light)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 14l5-5 5 5" />
            </svg>
          </button>
          
          {note && (
            <span className="text-sm text-white font-medium">
              {note} {cents === 0 ? "✓" : cents < 0 ? "♭" : "♯"}
            </span>
          )}
          
          {/* Mini microphone button */}
          <button
            onClick={(e) => {
              e.stopPropagation(); // Prevent drag when clicking microphone
              if (isListening) {
                stopListening();
              } else {
                startListening();
              }
            }}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 shadow-md ${
              isListening 
                ? "bg-[color:var(--accent-red)] hover:bg-[color:var(--text-dark)]" 
                : "bg-white/20 hover:bg-white/30"
            }`}
          >
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              {isListening ? (
                <>
                  <rect x="6" y="5" width="2" height="10" rx="1" />
                  <rect x="12" y="5" width="2" height="10" rx="1" />
                </>
              ) : (
                <path fillRule="evenodd" d="M7 4a3 3 0 6 16 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 715 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
              )}
            </svg>
          </button>

          {/* Drag indicator dots */}
          <div className="flex flex-col gap-1 ml-1 opacity-60">
            <div className="w-1 h-1 bg-white rounded-full"></div>
            <div className="w-1 h-1 bg-white rounded-full"></div>
            <div className="w-1 h-1 bg-white rounded-full"></div>
          </div>
        </div>
      ) : (
        // Expanded state - compact floating tuner
        <div className="bg-white/10 backdrop-blur-[10px] border border-white/20 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.2)] w-80">
          
          {/* Draggable Header */}
          <div 
            className={`flex justify-between items-center p-4 pb-2 cursor-grab hover:bg-white/5 rounded-t-3xl transition-all duration-200 ${
              isDragging ? 'cursor-grabbing bg-white/10' : ''
            }`}
            onMouseDown={handleMouseDown}
          >
            <div className="flex items-center gap-2">
              <h1 className="font-['Bebas_Neue'] text-lg font-normal text-white tracking-[1px]">
                Tuner
              </h1>
              {/* Drag indicator for expanded state */}
              <div className="flex gap-1 opacity-50">
                <div className="w-1 h-1 bg-white rounded-full"></div>
                <div className="w-1 h-1 bg-white rounded-full"></div>
                <div className="w-1 h-1 bg-white rounded-full"></div>
                <div className="w-1 h-1 bg-white rounded-full"></div>
                <div className="w-1 h-1 bg-white rounded-full"></div>
                <div className="w-1 h-1 bg-white rounded-full"></div>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent drag when clicking collapse
                setIsCollapsed(true);
              }}
              className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-all duration-200"
              title="Collapse tuner"
            >
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Tuner Content */}
          <div className="px-4 pb-4">
            {/* Compact Tuner Gauge */}
            <div className="flex flex-col items-center justify-center mb-4">
              
              {/* Smaller Tuner Gauge */}
              <div className="relative w-48 h-24 mb-3">
                
                {/* Background semicircle */}
                <div className="absolute left-1/2 bottom-0 -translate-x-1/2">
                  <div className="w-40 h-20 rounded-t-full border-2 border-white/10 overflow-hidden">
                    
                    {/* Gradient arc using multiple colored segments */}
                    <div className="relative w-full h-full">
                      {/* Orange to red segment (left side - flat) */}
                      <div className="absolute left-0 top-0 w-1/4 h-full bg-gradient-to-r from-orange-500 to-orange-400"></div>
                      
                      {/* Orange to yellow segment */}
                      <div className="absolute left-1/4 top-0 w-1/4 h-full bg-gradient-to-r from-orange-400 to-yellow-400"></div>
                      
                      {/* Yellow to green segment */}
                      <div className="absolute left-2/4 top-0 w-1/4 h-full bg-gradient-to-r from-yellow-400 to-green-400"></div>
                      
                      {/* Green segment (right side - in tune) */}
                      <div className="absolute right-0 top-0 w-1/4 h-full bg-gradient-to-r from-green-400 to-green-500"></div>
                      
                      {/* Inner cutout to create arc effect */}
                      <div className="absolute top-3 left-3 right-3 bottom-0 bg-[color:var(--bg-muted)] rounded-t-full"></div>
                    </div>
                  </div>
                </div>

                {/* Enhanced gradient overlay for smoother transitions */}
                <div className="absolute left-1/2 bottom-0 -translate-x-1/2">
                  <div 
                    className="w-40 h-20 rounded-t-full overflow-hidden"
                    style={{
                      background: `conic-gradient(from 180deg, #f97316 0deg, #fbbf24 60deg, #a3e635 120deg, #22c55e 180deg)`,
                      mask: 'radial-gradient(circle at center bottom, transparent 60px, black 70px)',
                      WebkitMask: 'radial-gradient(circle at center bottom, transparent 60px, black 70px)'
                    }}
                  >
                  </div>
                </div>

                {/* Smaller Needle */}
                <div 
                  className="absolute left-1/2 bottom-0 -translate-x-1/2 origin-bottom transition-transform duration-200 ease-out z-20"
                  style={{
                    transform: `translateX(-50%) rotate(${getNeedleAngle()}deg)`,
                  }}
                >
                  {/* Needle line */}
                  <div className="w-0.5 h-16 bg-green-400 rounded-full mx-auto mb-1 shadow-lg shadow-green-400/60"></div>
                  {/* Needle base circle */}
                  <div className="w-3 h-3 bg-green-400 rounded-full mx-auto shadow-lg shadow-green-400/60 -mt-0.5"></div>
                </div>

                {/* Flat symbol */}
                <div className="absolute left-2 bottom-1 text-xl text-white/80 font-bold select-none z-30">
                  b
                </div>

                {/* Sharp symbol */}
                <div className="absolute right-2 bottom-1 text-xl text-white/80 font-bold select-none z-30">
                  #
                </div>
              </div>

              {/* Compact Note Display */}
              <div className="flex items-baseline justify-center mb-3">
                <span className="font-['Bebas_Neue'] text-3xl font-black text-white leading-none tracking-wider">
                  {note ? note.replace(/\d+/, '').replace('#', '') : 'A'}
                </span>
                {(note && note.includes('#')) ? (
                  <span className="font-['Bebas_Neue'] text-xl font-black text-white ml-1 -mt-1">♯</span>
                ) : null}
                <span className="font-['Bebas_Neue'] text-lg font-normal text-white/70 ml-2 mt-1 tracking-wider">
                  {note ? note.match(/\d+/)?.[0] : '4'}
                </span>
              </div>

              {/* Status Text */}
              <div className="text-sm text-white/80 mb-3 font-medium">
                {note ? (
                  cents === 0 ? "In tune" : cents < 0 ? "Tune up" : "Tune down"
                ) : (
                  "Play a note"
                )}
              </div>

              {/* Compact Controls */}
              <div className="flex items-center justify-center gap-3">
                {/* Microphone Button */}
                <button
                  onClick={() => {
                    if (isListening) {
                      stopListening();
                    } else {
                      startListening();
                    }
                  }}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 shadow-lg ${
                    isListening 
                      ? "bg-[color:var(--accent-red)] hover:bg-[color:var(--text-dark)]" 
                      : "bg-white/10 hover:bg-white/20 border border-white/20"
                  }`}
                >
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    {isListening ? (
                      <path fillRule="evenodd" d="M7 4a3 3 0 616 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 715 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                    ) : (
                      <path fillRule="evenodd" d="M7 4a3 3 0 6 16 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 715 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                    )}
                  </svg>
                </button>

                {/* Compact Volume Level Bars */}
                <div className="flex items-end gap-1">
                  {[6, 8, 10, 12, 14].map((height, i) => (
                    <div
                      key={i}
                      className={`w-1 rounded-sm transition-all duration-200 ${
                        volume > (i + 1) * 4 ? 'bg-[color:var(--accent-red)]' : 'bg-white/20'
                      }`}
                      style={{ height: `${height}px` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Debug Info (only in development) */}
      {isListening && !isCollapsed && process.env.NODE_ENV === 'development' && (
        <div className="absolute top-full left-0 mt-2 p-2 bg-black/80 backdrop-blur rounded-lg text-xs text-white w-64">
          <div className="flex justify-between items-center">
            <span>🎤 {frequency > 0 ? `${frequency.toFixed(1)}Hz` : "Listening..."}</span>
            {note && <span>{note} {cents !== 0 && `(${cents > 0 ? '+' : ''}${cents} cents)`}</span>}
          </div>
        </div>
      )}
    </div>
  );
}