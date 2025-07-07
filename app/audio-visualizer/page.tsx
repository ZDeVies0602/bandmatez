'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export default function AudioVisualizer() {
  const [isListening, setIsListening] = useState(false);
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationRef = useRef<number | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  
  // Visual state
  const particlesRef = useRef<Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    color: string;
    life: number;
  }>>([]);

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
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.3;
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
    particlesRef.current = [];
  }, []);

  const getColorFromFrequency = (frequency: number, intensity: number) => {
    // Map frequency to hue (0-360)
    const hue = (frequency / 1024) * 360;
    // Map intensity to saturation and lightness
    const saturation = Math.min(100, intensity * 1.5);
    const lightness = Math.min(80, 30 + intensity * 0.8);
    
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  const createParticle = (x: number, y: number, frequency: number, intensity: number) => {
    const angle = Math.random() * Math.PI * 2;
    const speed = intensity * 0.1;
    
    return {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: Math.random() * intensity * 0.3 + 2,
      color: getColorFromFrequency(frequency, intensity),
      life: 1.0
    };
  };

  const startVisualization = () => {
    const canvas = canvasRef.current;
    if (!canvas || !analyserRef.current || !dataArrayRef.current) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    const draw = () => {
      if (!analyserRef.current || !dataArrayRef.current) return;
      
      analyserRef.current.getByteFrequencyData(dataArrayRef.current);
      
      // Clear canvas with fade effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Create particles based on audio data
      const dataArray = dataArrayRef.current;
      const frequencyStep = dataArray.length / 16; // Sample 16 frequency bands
      
      for (let i = 0; i < 16; i++) {
        const frequency = Math.floor(i * frequencyStep);
        const intensity = dataArray[frequency] / 255;
        
        if (intensity > 0.1) {
          // Create particles in a circular pattern
          const angle = (i / 16) * Math.PI * 2;
          const centerX = canvas.width / 2;
          const centerY = canvas.height / 2;
          const radius = Math.min(canvas.width, canvas.height) * 0.2;
          
          const x = centerX + Math.cos(angle) * radius;
          const y = centerY + Math.sin(angle) * radius;
          
          // Add multiple particles for higher intensities
          const particleCount = Math.floor(intensity * 3) + 1;
          for (let j = 0; j < particleCount; j++) {
            const offsetX = (Math.random() - 0.5) * 50;
            const offsetY = (Math.random() - 0.5) * 50;
            particlesRef.current.push(createParticle(x + offsetX, y + offsetY, frequency, intensity * 100));
          }
        }
      }
      
      // Draw and update particles
      particlesRef.current = particlesRef.current.filter(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life -= 0.02;
        
        if (particle.life <= 0) return false;
        
        // Draw particle
        ctx.save();
        ctx.globalAlpha = particle.life;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        // Add glow effect
        ctx.save();
        ctx.globalAlpha = particle.life * 0.3;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        return true;
      });
      
      // Draw frequency spectrum as background waves
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.moveTo(0, canvas.height);
      
      const barWidth = canvas.width / dataArray.length;
      for (let i = 0; i < dataArray.length; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.8;
        const x = i * barWidth;
        const y = canvas.height - barHeight;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      
      ctx.lineTo(canvas.width, canvas.height);
      ctx.closePath();
      
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, 'rgba(255, 100, 200, 0.5)');
      gradient.addColorStop(1, 'rgba(100, 200, 255, 0.2)');
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.restore();
      
      animationRef.current = requestAnimationFrame(draw);
    };
    
    draw();
  };

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
          Audio Visualizer
        </h1>
        
        <div className="text-center mb-8">
          <p className="text-lg mb-4">
            Create unique, colorful artwork based on music and sound
          </p>
          <p className="text-sm text-gray-400 mb-6">
            Play music near your microphone to see the visualization come to life
          </p>
          
          <div className="flex justify-center gap-4">
            {!isListening ? (
              <button
                onClick={startListening}
                className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 rounded-full font-semibold transition-all duration-300 transform hover:scale-105"
              >
                Start Listening
              </button>
            ) : (
              <button
                onClick={stopListening}
                className="px-8 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-full font-semibold transition-all duration-300 transform hover:scale-105"
              >
                Stop Listening
              </button>
            )}
          </div>
          
          {isListening && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm">Listening...</span>
            </div>
          )}
        </div>
        
        <div className="relative">
          <canvas
            ref={canvasRef}
            className="w-full h-[600px] border border-gray-800 rounded-lg bg-black"
            style={{ imageRendering: 'pixelated' }}
          />
          
          {!isListening && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">🎵</div>
                <p className="text-gray-400">
                  {isPermissionGranted 
                    ? "Click 'Start Listening' to begin visualization" 
                    : "Grant microphone access to start"}
                </p>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-8 text-center">
          <h2 className="text-xl font-semibold mb-4">How it works:</h2>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="bg-gray-900 p-4 rounded-lg">
              <div className="text-2xl mb-2">🎤</div>
              <h3 className="font-semibold mb-2">Audio Capture</h3>
              <p className="text-gray-400">
                Captures audio from your microphone in real-time
              </p>
            </div>
            <div className="bg-gray-900 p-4 rounded-lg">
              <div className="text-2xl mb-2">📊</div>
              <h3 className="font-semibold mb-2">Frequency Analysis</h3>
              <p className="text-gray-400">
                Analyzes different frequency ranges of the audio
              </p>
            </div>
            <div className="bg-gray-900 p-4 rounded-lg">
              <div className="text-2xl mb-2">🎨</div>
              <h3 className="font-semibold mb-2">Visual Generation</h3>
              <p className="text-gray-400">
                Creates unique particles and colors based on the music
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 