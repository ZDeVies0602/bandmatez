'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

// Note frequencies for pitch detection (in Hz) - Using A4 = 440Hz as reference
const NOTE_FREQUENCIES = {
  'C': 261.63,   // C4
  'C#': 277.18,  // C#4
  'D': 293.66,   // D4
  'D#': 311.13,  // D#4
  'E': 329.63,   // E4
  'F': 349.23,   // F4
  'F#': 369.99,  // F#4
  'G': 392.00,   // G4
  'G#': 415.30,  // G#4
  'A': 440.00,   // A4
  'A#': 466.16,  // A#4
  'B': 493.88    // B4
};

// Color mapping for each note
const NOTE_COLORS = {
  'C': { hue: 0, name: 'Red' },      // C - Red
  'C#': { hue: 30, name: 'Orange' },  // C# - Orange
  'D': { hue: 60, name: 'Yellow' },   // D - Yellow
  'D#': { hue: 90, name: 'Yellow-Green' }, // D# - Yellow-Green
  'E': { hue: 120, name: 'Green' },   // E - Green
  'F': { hue: 180, name: 'Cyan' },    // F - Cyan
  'F#': { hue: 210, name: 'Light Blue' }, // F# - Light Blue
  'G': { hue: 240, name: 'Blue' },    // G - Blue
  'G#': { hue: 270, name: 'Purple' }, // G# - Purple
  'A': { hue: 300, name: 'Magenta' }, // A - Magenta
  'A#': { hue: 330, name: 'Pink' },   // A# - Pink
  'B': { hue: 355, name: 'Rose' }     // B - Rose
};

export default function AudioVisualizer() {
  const [isListening, setIsListening] = useState(false);
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);
  const [dominantNote, setDominantNote] = useState<string>('');
  const [volume, setVolume] = useState(0);
  const [detectedFrequency, setDetectedFrequency] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationRef = useRef<number | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  
  // Visual state - now tracking permanent static shapes
  const permanentShapesRef = useRef<Array<{
    x: number;
    y: number;
    size: number;
    color: string;
    note: string;
    shape: string;
    rotation: number;
    baseSize: number;
  }>>([]);

  // Cooldown to prevent multiple shapes from same sound
  const lastShapeCreationRef = useRef<number>(0);
  const SHAPE_CREATION_COOLDOWN = 500; // 500ms cooldown between shapes

  // Available shape types - mostly brushstrokes with occasional geometric shapes
  const BRUSHSTROKE_SHAPES = ['brushstroke-1', 'brushstroke-2', 'brushstroke-3', 'brushstroke-4', 'brushstroke-5', 'splash', 'drip'];
  const GEOMETRIC_SHAPES = ['circle', 'square', 'triangle', 'diamond'];

  // Convert frequency to nearest musical note using mathematical formula
  const frequencyToNote = (frequency: number) => {
    if (frequency < 80 || frequency > 2000) return 'C'; // Filter out noise
    
    // Use the formula: note = 12 * log2(frequency / 440) + 69
    // Where 69 is the MIDI note number for A4 (440 Hz)
    const noteNumber = 12 * Math.log2(frequency / 440) + 69;
    const noteIndex = Math.round(noteNumber) % 12;
    
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    return noteNames[noteIndex];
  };

  // Function to draw different brushstroke and geometric shapes
  const drawShape = (ctx: CanvasRenderingContext2D, shape: string, x: number, y: number, size: number, rotation: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    
    switch (shape) {
      case 'brushstroke-1':
        // Organic flowing brushstroke with irregular edges
        ctx.beginPath();
        ctx.moveTo(-size * 0.9, -size * 0.15);
        ctx.quadraticCurveTo(-size * 0.25, -size * 0.9, size * 0.15, -size * 0.2);
        ctx.quadraticCurveTo(size * 0.85, size * 0.25, size * 0.95, size * 0.45);
        ctx.quadraticCurveTo(size * 0.35, size * 0.75, -size * 0.15, size * 0.3);
        ctx.quadraticCurveTo(-size * 0.75, size * 0.05, -size * 0.9, -size * 0.15);
        ctx.closePath();
        ctx.fill();
        
        // Add organic texture spots
        for (let i = 0; i < 3; i++) {
          const spotX = (Math.random() - 0.5) * size * 1.4;
          const spotY = (Math.random() - 0.5) * size * 0.8;
          const spotSize = Math.random() * size * 0.15 + size * 0.05;
          ctx.beginPath();
          ctx.arc(spotX, spotY, spotSize, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
        
      case 'brushstroke-2':
        // Curved organic brushstroke with paint texture
        ctx.beginPath();
        ctx.moveTo(-size * 0.85, -size * 0.25);
        ctx.bezierCurveTo(-size * 0.15, -size * 1.1, size * 0.45, -size * 0.6, size * 0.92, size * 0.08);
        ctx.bezierCurveTo(size * 0.65, size * 0.85, size * 0.05, size * 0.7, -size * 0.35, size * 0.15);
        ctx.bezierCurveTo(-size * 0.95, size * 0.05, -size * 0.85, -size * 0.25, -size * 0.85, -size * 0.25);
        ctx.closePath();
        ctx.fill();
        
        // Add paint drips
        ctx.beginPath();
        ctx.arc(size * 0.3, size * 0.9, size * 0.08, 0, Math.PI * 2);
        ctx.fill();
        break;
        
      case 'brushstroke-3':
        // Thick impasto paint stroke with texture
        ctx.beginPath();
        ctx.moveTo(-size * 0.95, -size * 0.05);
        ctx.quadraticCurveTo(-size * 0.05, -size * 0.95, size * 0.25, -size * 0.25);
        ctx.quadraticCurveTo(size * 0.75, size * 0.15, size * 0.15, size * 0.8);
        ctx.quadraticCurveTo(-size * 0.05, size * 0.95, -size * 0.65, size * 0.05);
        ctx.quadraticCurveTo(-size * 0.95, -size * 0.05, -size * 0.95, -size * 0.05);
        ctx.closePath();
        ctx.fill();
        
        // Add impasto texture bumps
        for (let i = 0; i < 4; i++) {
          const bumpX = (Math.random() - 0.5) * size * 1.2;
          const bumpY = (Math.random() - 0.5) * size * 0.6;
          const bumpSize = Math.random() * size * 0.12 + size * 0.06;
          ctx.beginPath();
          ctx.arc(bumpX, bumpY, bumpSize, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
        
      case 'brushstroke-4':
        // Energetic organic stroke with splatter
        ctx.beginPath();
        ctx.moveTo(-size * 0.98, 0);
        ctx.bezierCurveTo(-size * 0.45, -size * 0.85, size * 0.15, -size * 0.7, size * 0.65, -size * 0.1);
        ctx.bezierCurveTo(size * 0.85, size * 0.35, size * 0.25, size * 0.9, -size * 0.25, size * 0.25);
        ctx.bezierCurveTo(-size * 0.85, size * 0.05, -size * 0.98, 0, -size * 0.98, 0);
        ctx.closePath();
        ctx.fill();
        
        // Add paint splatter
        for (let i = 0; i < 6; i++) {
          const angle = Math.random() * Math.PI * 2;
          const distance = size * (0.6 + Math.random() * 0.8);
          const splatterSize = Math.random() * size * 0.08 + size * 0.02;
          ctx.beginPath();
          ctx.arc(Math.cos(angle) * distance, Math.sin(angle) * distance, splatterSize, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
        
      case 'brushstroke-5':
        // Fluid organic stroke with paint flow
        ctx.beginPath();
        ctx.moveTo(-size * 0.75, -size * 0.35);
        ctx.quadraticCurveTo(-size * 0.1, -size * 1.15, size * 0.55, -size * 0.15);
        ctx.quadraticCurveTo(size * 0.95, size * 0.25, size * 0.25, size * 0.85);
        ctx.quadraticCurveTo(-size * 0.15, size * 0.45, -size * 0.75, -size * 0.35);
        ctx.closePath();
        ctx.fill();
        
        // Add paint flow lines
        ctx.beginPath();
        ctx.moveTo(-size * 0.3, -size * 0.1);
        ctx.quadraticCurveTo(size * 0.2, size * 0.1, size * 0.4, size * 0.3);
        ctx.lineWidth = size * 0.04;
        ctx.strokeStyle = ctx.fillStyle;
        ctx.stroke();
        break;
        
      case 'splash':
        // Paint splash
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.6, 0, Math.PI * 2);
        ctx.fill();
        // Add smaller splashes around
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2;
          const distance = size * (0.8 + Math.random() * 0.4);
          const splashSize = size * (0.1 + Math.random() * 0.2);
          ctx.beginPath();
          ctx.arc(Math.cos(angle) * distance, Math.sin(angle) * distance, splashSize, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
        
      case 'drip':
        // Paint drip
        ctx.beginPath();
        ctx.arc(0, -size * 0.5, size * 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(-size * 0.1, -size * 0.2, size * 0.2, size * 1.2);
        ctx.beginPath();
        ctx.arc(0, size * 0.7, size * 0.2, 0, Math.PI * 2);
        ctx.fill();
        break;
        
      case 'circle':
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        ctx.fill();
        break;
        
      case 'square':
        ctx.fillRect(-size, -size, size * 2, size * 2);
        break;
        
      case 'triangle':
        ctx.beginPath();
        ctx.moveTo(0, -size);
        ctx.lineTo(-size * 0.866, size * 0.5);
        ctx.lineTo(size * 0.866, size * 0.5);
        ctx.closePath();
        ctx.fill();
        break;
        
      case 'diamond':
        ctx.beginPath();
        ctx.moveTo(0, -size);
        ctx.lineTo(size, 0);
        ctx.lineTo(0, size);
        ctx.lineTo(-size, 0);
        ctx.closePath();
        ctx.fill();
        break;
    }
    
    ctx.restore();
  };

  // Get more vibrant, playful colors
  const getColorForNote = (note: string, volume: number, intensity: number) => {
    const noteColor = NOTE_COLORS[note as keyof typeof NOTE_COLORS] || NOTE_COLORS['C'];
    const hue = noteColor.hue;
    
    // Much more vibrant colors for painterly effect
    const normalizedIntensity = Math.min(1, intensity);
    const normalizedVolume = Math.min(1, volume * 2);
    
    // Combined intensity factor
    const colorStrength = Math.min(1, (normalizedIntensity + normalizedVolume) / 2);
    
    // High saturation for vibrant paint colors: 70% to 95%
    const saturation = Math.floor(70 + (colorStrength * 25));
    
    // Varied lightness for paint-like depth: 45% to 65%
    const lightness = Math.floor(45 + (colorStrength * 20));
    
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  // Improved dominant frequency detection
  const detectDominantNote = (dataArray: Uint8Array, sampleRate: number) => {
    // Find peak frequency using more sophisticated method
    let maxIntensity = 0;
    let dominantFrequencyBin = 0;
    
    // Focus on musical frequency range (80 Hz to 2000 Hz)
    const minBin = Math.floor((80 * dataArray.length * 2) / sampleRate);
    const maxBin = Math.floor((2000 * dataArray.length * 2) / sampleRate);
    
    for (let i = minBin; i < maxBin && i < dataArray.length; i++) {
      if (dataArray[i] > maxIntensity) {
        maxIntensity = dataArray[i];
        dominantFrequencyBin = i;
      }
    }
    
    // Convert bin to frequency
    const frequency = (dominantFrequencyBin * sampleRate) / (2 * dataArray.length);
    
    // Calculate overall volume
    const avgVolume = dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length / 255;
    
    // Only process if we have a strong enough signal
    if (maxIntensity > 50 && frequency > 80) {
      const note = frequencyToNote(frequency);
      setDominantNote(note);
      setVolume(avgVolume);
      setDetectedFrequency(frequency);
      return { note, volume: avgVolume, frequency };
    }
    
    return { note: '', volume: avgVolume, frequency: 0 };
  };

  const startListening = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false 
        } 
      });
      
      mediaStreamRef.current = stream;
      setIsPermissionGranted(true);
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 4096; // Increased for better frequency resolution
      analyser.smoothingTimeConstant = 0.2;
      analyserRef.current = analyser;
      
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      dataArrayRef.current = dataArray;
      
      setIsListening(true);
      startVisualization();
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Please allow microphone access to use the audio visualizer');
    }
  }, []);

  const stopListening = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    setIsListening(false);
    setDominantNote('');
    setVolume(0);
    permanentShapesRef.current = [];
    lastShapeCreationRef.current = 0; // Reset cooldown
  }, []);

  const createParticle = (note: string, volume: number, intensity: number) => {
    // Random position across entire screen
    const x = Math.random() * window.innerWidth;
    const y = Math.random() * window.innerHeight;
    
    // Primarily brushstrokes (85% chance) with occasional geometric shapes (15% chance)
    const isGeometric = Math.random() < 0.15;
    const shape = isGeometric 
      ? GEOMETRIC_SHAPES[Math.floor(Math.random() * GEOMETRIC_SHAPES.length)]
      : BRUSHSTROKE_SHAPES[Math.floor(Math.random() * BRUSHSTROKE_SHAPES.length)];
    
    // Varied sizes for organic painterly effect
    const baseSize = Math.random() * 100 + 80; // 80-180 pixels for bold paint presence
    const sizeMultiplier = Math.max(1.2, (volume + intensity) * 3.5 + Math.random() * 1.5);
    
    return {
      x,
      y,
      baseSize,
      size: baseSize * sizeMultiplier,
      color: getColorForNote(note, volume, intensity),
      note,
      shape,
      rotation: Math.random() * Math.PI * 2, // Random but fixed rotation
    };
  };

  const startVisualization = () => {
    const canvas = canvasRef.current;
    if (!canvas || !analyserRef.current || !dataArrayRef.current || !audioContextRef.current) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size to viewport dimensions
    const updateCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    updateCanvasSize();
    
    const draw = () => {
      if (!analyserRef.current || !dataArrayRef.current || !audioContextRef.current) return;
      
      // Ensure canvas size matches viewport
      if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }

      analyserRef.current.getByteFrequencyData(dataArrayRef.current);
      
      const dataArray = dataArrayRef.current;
      const sampleRate = audioContextRef.current.sampleRate;
      
      // Detect dominant note and volume
      const { note, volume, frequency } = detectDominantNote(dataArray, sampleRate);
      
      // Clear canvas with subtle fade for paint buildup effect
      ctx.fillStyle = 'rgba(252, 252, 252, 0.02)'; // Very subtle fade to let paint accumulate
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add subtle texture overlay occasionally
      if (Math.random() < 0.1) {
        ctx.fillStyle = 'rgba(248, 248, 248, 0.01)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      
      // Create particles for all 12 chromatic notes
      const chromaticNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      const baseFreq = 130.81; // C3
      
      // Calculate overall energy and noise floor
      const totalEnergy = dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length;
      const maxEnergy = Math.max(...dataArray);
      
      // Only process if there's some audio signal
      if (totalEnergy < 8 || maxEnergy < 30) {
        // Update and draw all permanent shapes
        permanentShapesRef.current.forEach((particle) => {
          updateAndDrawParticle(particle, ctx, volume);
        });
        
        animationRef.current = requestAnimationFrame(draw);
        return;
      }
      
      // Calculate a more sophisticated noise floor with lower thresholds
      const sortedValues = [...dataArray].sort((a, b) => a - b);
      const noiseFloor = sortedValues[Math.floor(sortedValues.length * 0.8)]; // 80th percentile as noise floor
      const minThreshold = Math.max(20, noiseFloor * 1.5); // Lower minimum threshold
      const significantThreshold = Math.max(35, totalEnergy * 0.8); // Lower significant threshold
      
      // Store note intensities to find the strongest notes
      const noteData: Array<{
        note: string;
        intensity: number;
        peak: number;
        index: number;
      }> = [];
      
      chromaticNotes.forEach((noteName, i) => {
        // Calculate frequency for this note
        const noteFreq = baseFreq * Math.pow(2, i / 12);
        
        // Moderate frequency range for better detection
        const freqTolerance = 0.04; // ~30 cents tolerance
        const minFreq = noteFreq * (1 - freqTolerance);
        const maxFreq = noteFreq * (1 + freqTolerance);
        
        // Convert to FFT bins
        const minBin = Math.floor((minFreq * dataArray.length * 2) / sampleRate);
        const maxBin = Math.floor((maxFreq * dataArray.length * 2) / sampleRate);
        
        // Calculate intensity for this specific note
        let noteIntensity = 0;
        let peakInRange = 0;
        let validBins = 0;
        
        for (let j = minBin; j <= maxBin && j < dataArray.length; j++) {
          if (j >= 0) {
            noteIntensity += dataArray[j];
            peakInRange = Math.max(peakInRange, dataArray[j]);
            validBins++;
          }
        }
        
        if (validBins > 0) {
          noteIntensity = noteIntensity / validBins;
        }
        
        // Store note data for comparison
        noteData.push({
          note: noteName,
          intensity: noteIntensity,
          peak: peakInRange,
          index: i
        });
      });
      
      // Sort notes by peak intensity to find the strongest one
      const sortedNotes = noteData.sort((a, b) => b.peak - a.peak);
      
      // Find the single most prominent note and create one shape
      const currentTime = Date.now();
      const timeSinceLastShape = currentTime - lastShapeCreationRef.current;
      let shapeCreated = false;
      
      // Only create a shape if enough time has passed since the last one
      if (timeSinceLastShape >= SHAPE_CREATION_COOLDOWN) {
        for (const noteInfo of sortedNotes) {
          if (shapeCreated) break; // Only create one shape per detection
          
          const { note: noteName, intensity: noteIntensity, peak: peakInRange, index: i } = noteInfo;
          
          // Conditions for note detection
          const isValidNote = (
            peakInRange > minThreshold && // Above minimum threshold
            noteIntensity > minThreshold * 0.6 && // Average intensity reasonable
            (peakInRange > significantThreshold || noteIntensity > significantThreshold * 0.7) && // Either peak or average is significant
            peakInRange > maxEnergy * 0.15 // Must be at least 15% of max energy
          );
          
          // Check if this note is stronger than nearby frequencies
          const isLocalPeak = (() => {
            const noteFreq = baseFreq * Math.pow(2, i / 12);
            const centerBin = Math.floor((noteFreq * dataArray.length * 2) / sampleRate);
            const checkRange = 2; // Check neighboring bins
            
            let strongNeighbors = 0;
            for (let offset = -checkRange; offset <= checkRange; offset++) {
              const checkBin = centerBin + offset;
              if (checkBin >= 0 && checkBin < dataArray.length && offset !== 0) {
                if (dataArray[checkBin] > peakInRange * 0.9) {
                  strongNeighbors++;
                }
              }
            }
            return strongNeighbors < 2; // Allow note if less than 2 strong neighbors
          })();
          
          // Create one shape for the most prominent valid note
          if (isValidNote && isLocalPeak) {
            // Calculate relative intensity (0-1) for this note
            const relativeIntensity = Math.min(1, (peakInRange - minThreshold) / (255 - minThreshold));
            
            // Create exactly one shape for this sound detection
            const newParticle = createParticle(noteName, volume, relativeIntensity);
            permanentShapesRef.current.push(newParticle);
            
            // Update the last shape creation time
            lastShapeCreationRef.current = currentTime;
            shapeCreated = true; // Ensure we only create one shape
          }
        }
      }
      
      // Update and draw all permanent shapes
      permanentShapesRef.current.forEach((particle) => {
        updateAndDrawParticle(particle, ctx, volume);
      });
      
      animationRef.current = requestAnimationFrame(draw);
    };
    
    draw();
  };

  // Helper function to update and draw a single particle
  const updateAndDrawParticle = (particle: any, ctx: CanvasRenderingContext2D, currentVolume: number) => {
    // No movement - shapes are permanently static once placed
    
    // Update size based on current volume for slight responsiveness
    const volume = currentVolume || 0;
    const sizeMultiplier = Math.max(0.9, (volume + 0.8) * 1.1); // Subtle size response
    particle.size = particle.baseSize * sizeMultiplier;
    
    // Draw particle with enhanced painterly effects
    ctx.save();
    
    // Paint texture base layer (darker undertone)
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = adjustColorBrightness(particle.color, -30);
    drawShape(ctx, particle.shape, particle.x, particle.y, particle.size * 1.1, particle.rotation);
    
    // Main paint layer with organic texture
    ctx.globalAlpha = 0.88;
    ctx.fillStyle = particle.color;
    drawShape(ctx, particle.shape, particle.x, particle.y, particle.size, particle.rotation);
    
    // Paint highlight/wet look
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = adjustColorBrightness(particle.color, 25);
    drawShape(ctx, particle.shape, particle.x, particle.y, particle.size * 0.7, particle.rotation);
    
    // Subtle paint reflection
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = adjustColorBrightness(particle.color, 40);
    drawShape(ctx, particle.shape, particle.x, particle.y, particle.size * 0.4, particle.rotation);
    
    ctx.restore();
  };

  // Helper function to adjust color brightness
  const adjustColorBrightness = (hslColor: string, adjustment: number) => {
    const match = hslColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
    if (match) {
      const [, hue, saturation, lightness] = match;
      const newLightness = Math.max(0, Math.min(100, parseInt(lightness) + adjustment));
      return `hsl(${hue}, ${saturation}%, ${newLightness}%)`;
    }
    return hslColor;
  };

  const clearArtwork = () => {
    permanentShapesRef.current = [];
    lastShapeCreationRef.current = 0; // Reset cooldown so new shapes can be created immediately
  };

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };
    
    window.addEventListener('resize', handleResize);
    // Initial size set
    handleResize();
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return (
    <div className="fixed inset-0 bg-gray-50 text-black overflow-hidden">
      {/* Full Screen Canvas */}
      <canvas
        ref={canvasRef}
        className="w-screen h-screen block"
        style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 0,
          background: 'linear-gradient(135deg, #fefefe 0%, #f8f8f8 25%, #fcfcfc 50%, #f9f9f9 75%, #ffffff 100%)',
          backgroundColor: '#fafafa'
        }}
      />
      
      {/* Compact Header */}
      <div className="absolute top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Audio Visualizer
              </h1>
              
              {/* Note Detection Display - Compact */}
              {isListening && dominantNote && (
                <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-1 border">
                  <span className="text-xs text-gray-600">Note:</span>
                  <span 
                    className="inline-block px-2 py-1 rounded text-sm font-bold text-white"
                    style={{ 
                      backgroundColor: getColorForNote(dominantNote, volume, 0.5),
                      textShadow: '0 0 4px rgba(0,0,0,0.8)'
                    }}
                  >
                    {dominantNote}
                  </span>
                  <span className="text-xs text-gray-500">
                    {Math.round(detectedFrequency)}Hz
                  </span>
                  <div className="w-12 h-1 bg-gray-300 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-500 to-yellow-500 transition-all duration-150"
                      style={{ width: `${volume * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              {isListening && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span>Listening</span>
                </div>
              )}
              
              {/* Clear Artwork Button */}
              <button
                onClick={clearArtwork}
                className="px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 relative z-10 shadow-lg"
              >
                Clear Artwork
              </button>
              
              {!isListening ? (
                <button
                  onClick={startListening}
                  className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 relative z-10 shadow-lg"
                >
                  Start Listening
                </button>
              ) : (
                <button
                  onClick={stopListening}
                  className="px-6 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 relative z-10 shadow-lg"
                >
                  Stop
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {!isListening && (
        <div className="absolute inset-0 flex items-center justify-center z-40">
          <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-200 shadow-xl">
            <div className="text-8xl mb-6">🎵</div>
            <h2 className="text-3xl font-bold mb-4 text-gray-800">Audio Visualizer</h2>
            <p className="text-lg text-gray-600 mb-2">
              Create painterly artwork from your music
            </p>
            <p className="text-gray-500 mb-6">
              Each sound creates one painterly shape - most prominent note wins
            </p>
            <p className="text-gray-500 mb-6">
              {isPermissionGranted 
                ? "Click 'Start Listening' to begin creating artwork" 
                : "Grant microphone access to start"}
            </p>
            
            {/* Note Color Preview */}
            <div className="grid grid-cols-6 gap-2 max-w-md mx-auto mb-6">
              {Object.entries(NOTE_COLORS).map(([note, color]) => (
                <div 
                  key={note} 
                  className="p-2 rounded text-center text-white font-bold text-sm shadow-md"
                  style={{ 
                    backgroundColor: `hsl(${color.hue}, 70%, 55%)`,
                    textShadow: '0 0 4px rgba(0,0,0,0.8)'
                  }}
                >
                  {note}
                </div>
              ))}
            </div>
            
            <div className="text-sm text-gray-500">
              Volume increases paint vibrance and creates larger brushstrokes
            </div>
          </div>
        </div>
      )}
      
      {/* Collapsible Info Panel */}
      <div className="fixed bottom-4 right-4 z-50">
        <details className="bg-white/90 backdrop-blur-sm rounded-lg border border-gray-200 shadow-lg">
          <summary className="px-4 py-2 cursor-pointer text-sm font-semibold text-gray-700 hover:text-gray-900">
            ℹ️ Info
          </summary>
          <div className="absolute bottom-full right-0 mb-2 w-80 bg-white/95 backdrop-blur-sm rounded-lg p-4 text-xs border border-gray-200 shadow-xl">
            <h3 className="font-semibold mb-2 text-gray-800">Note Color Mapping:</h3>
            <div className="grid grid-cols-4 gap-1 mb-3">
              {Object.entries(NOTE_COLORS).map(([note, color]) => (
                <div 
                  key={note} 
                  className="p-1 rounded text-center text-white font-bold text-xs"
                  style={{ 
                    backgroundColor: `hsl(${color.hue}, 70%, 55%)`,
                    textShadow: '0 0 4px rgba(0,0,0,0.8)'
                  }}
                >
                  {note}
                </div>
              ))}
            </div>
            <div className="space-y-1 text-gray-600">
              <div>🎤 Real-time pitch detection</div>
              <div>🎨 One painterly shape per sound</div>
              <div>🔊 Volume-responsive paint effects</div>
              <div>🖼️ Permanent artwork creation</div>
              <div>🎵 Most prominent note creates color</div>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
} 