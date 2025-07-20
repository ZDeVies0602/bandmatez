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

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number>();

  // Note frequencies (A4 = 440 Hz)
  const noteFrequencies = {
    C: 261.63,
    "C#": 277.18,
    D: 293.66,
    "D#": 311.13,
    E: 329.63,
    F: 349.23,
    "F#": 369.99,
    G: 392.0,
    "G#": 415.3,
    A: 440.0,
    "A#": 466.16,
    B: 493.88,
  };

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

  // Convert frequency to note
  const frequencyToNote = useCallback((freq: number) => {
    if (freq < 80 || freq > 2000) return { note: "", cents: 0, octave: 0 };

    // Calculate which note this frequency is closest to
    const A4 = 440;
    const noteNumber = 12 * Math.log2(freq / A4) + 69;
    const roundedNoteNumber = Math.round(noteNumber);

    const noteName = noteNames[(((roundedNoteNumber - 60) % 12) + 12) % 12];
    const octave = Math.floor((roundedNoteNumber - 12) / 12);

    // Calculate cents deviation
    const centsDeviation = Math.round((noteNumber - roundedNoteNumber) * 100);

    return {
      note: `${noteName}${octave}`,
      cents: centsDeviation,
      octave,
    };
  }, []);

  // Autocorrelation pitch detection
  const detectPitch = useCallback(
    (buffer: Float32Array, sampleRate: number) => {
      const bufferSize = buffer.length;
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

      // Find the best correlation
      let bestCorrelation = 0;
      let bestLag = 0;

      // Start from lag 2 to avoid the DC component
      for (let lag = 2; lag < halfBuffer; lag++) {
        if (correlation[lag] > bestCorrelation) {
          bestCorrelation = correlation[lag];
          bestLag = lag;
        }
      }

      // Calculate frequency
      if (bestCorrelation > 0.01 && bestLag > 0) {
        return sampleRate / bestLag;
      }

      return 0;
    },
    []
  );

  // Audio analysis loop
  const analyzeAudio = useCallback(() => {
    if (!analyserRef.current || !isListening) return;

    const bufferLength = analyserRef.current.fftSize;
    const dataArray = new Float32Array(bufferLength);

    analyserRef.current.getFloatTimeDomainData(dataArray);

    // Calculate volume (RMS)
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i] * dataArray[i];
    }
    const rms = Math.sqrt(sum / bufferLength);
    setVolume(rms * 100);

    // Only detect pitch if volume is above threshold
    if (rms > 0.001) {
      const detectedFreq = detectPitch(
        dataArray,
        audioContextRef.current!.sampleRate
      );

      if (detectedFreq > 0) {
        setFrequency(Math.round(detectedFreq * 10) / 10);
        const noteInfo = frequencyToNote(detectedFreq);
        setNote(noteInfo.note);
        setCents(noteInfo.cents);
      }
    } else {
      setFrequency(0);
      setNote("");
      setCents(0);
    }

    if (isListening) {
      animationRef.current = requestAnimationFrame(analyzeAudio);
    }
  }, [isListening, detectPitch, frequencyToNote]);

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
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
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

      // Create analyser
      console.log("📊 Creating analyser...");
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 4096;
      analyserRef.current.smoothingTimeConstant = 0.3;

      // Connect microphone to analyser
      console.log("🔗 Connecting microphone to analyser...");
      microphoneRef.current =
        audioContextRef.current.createMediaStreamSource(stream);
      microphoneRef.current.connect(analyserRef.current);

      setIsListening(true);
      console.log("✅ Pitch tuner started successfully");

      // Start analysis loop
      analyzeAudio();
    } catch (error) {
      console.error("❌ Error accessing microphone:", error);

      let errorMessage = "Could not access microphone. ";

      if (error instanceof Error) {
        if (error.name === "NotAllowedError") {
          errorMessage +=
            "Permission denied. Please allow microphone access and try again.";
        } else if (error.name === "NotFoundError") {
          errorMessage +=
            "No microphone found. Please connect a microphone and try again.";
        } else if (error.name === "NotReadableError") {
          errorMessage +=
            "Microphone is already in use by another application.";
        } else if (error.name === "AbortError") {
          errorMessage += "Request was aborted.";
        } else {
          errorMessage += `Error: ${error.message}`;
        }
      } else {
        errorMessage += "Unknown error occurred.";
      }

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

    // Reset display
    setFrequency(0);
    setNote("");
    setCents(0);
    setVolume(0);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isListening) {
        stopListening();
      }
    };
  }, []);

  // Get tuning status
  const getTuningStatus = () => {
    if (!note || Math.abs(cents) < 5) return "in-tune";
    if (cents < -5) return "flat";
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

  return (
    <div className="flex flex-col items-center gap-3 max-w-lg mx-auto">
      {/* Compact Main Display */}
      <div className={`text-center p-3 rounded-xl w-full ${themeClasses.card}`}>
        {/* Note Display */}
        <div
          className={`
          text-3xl font-bold ${themeClasses.textDark} mb-2
          leading-none drop-shadow-lg
          ${note ? "animate-scale-pulse" : ""}
        `}
        >
          {note || "♪"}
        </div>

        {/* Frequency Display */}
        <div
          className={`
          text-sm ${themeClasses.textDark} opacity-80 mb-3
          drop-shadow-sm font-mono
        `}
        >
          {frequency > 0 ? `${frequency} Hz` : "---"}
        </div>

        {/* Compact Cents Meter */}
        <div className="relative w-full max-w-xs mx-auto mb-3">
          <div className="relative h-8 bg-gray-200/20 rounded-full overflow-hidden">
            {/* Scale Marks */}
            <div className="absolute inset-0 flex items-center justify-between px-2">
              {[-50, 0, 50].map((cent) => (
                <div key={cent} className="flex flex-col items-center">
                  <div className="w-0.5 h-3 bg-white/40"></div>
                  <span className={`text-xs ${themeClasses.textDark} font-mono`}>
                    {cent}
                  </span>
                </div>
              ))}
            </div>

            {/* Tuning Indicator */}
            {note && (
              <div
                className={`
                  absolute top-1/2 w-2 h-4 rounded-full -translate-y-1/2
                  ${getTuningBgColor()}
                  shadow-lg border border-white
                  transition-all duration-200 ease-out
                  ${getTuningStatus() === "in-tune" ? "animate-pulse-fast" : ""}
                `}
                style={{
                  left: `calc(50% + ${Math.max(-50, Math.min(50, cents)) * 0.8}%)`,
                }}
              />
            )}
          </div>
        </div>

        {/* Cents Display */}
        <div className={`text-sm font-semibold ${getTuningColor()} drop-shadow-sm`}>
          {Math.abs(cents) < 5
            ? "🎯 In Tune!"
            : cents < -5
            ? `♭ ${Math.abs(cents)} cents flat`
            : `♯ ${cents} cents sharp`}
        </div>
      </div>

      {/* Compact Controls */}
      <div className="flex items-center gap-3 w-full">
        {/* Main Control Button */}
        <button
          onClick={() => {
            if (isListening) {
              stopListening();
            } else {
              startListening();
            }
          }}
          className={`
            py-2 px-4 rounded-lg font-medium text-white text-sm
            transition-all duration-300 shadow-md
            ${
              isListening
                ? "bg-red-500 hover:bg-red-600"
                : "bg-green-500 hover:bg-green-600"
            }
            hover:scale-105 active:scale-95 flex-1
          `}
        >
          {isListening ? "⏸ Stop" : "🎤 Start"}
        </button>

        {/* Volume Indicator */}
        <div className="flex items-center gap-2 flex-1">
          <span className="text-xs text-[var(--neutral-gray)]">Level:</span>
          <div className="flex-1 h-2 bg-gray-200/20 rounded-full overflow-hidden">
            <div
              className={`
                h-full rounded-full transition-all duration-200
                ${volume > 50 ? "bg-red-400" : volume > 25 ? "bg-yellow-400" : "bg-green-400"}
              `}
              style={{ width: `${Math.min(100, volume * 3)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
