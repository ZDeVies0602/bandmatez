export interface AudioNote {
  note: string;
  octave: number;
  isBlack: boolean;
}

export interface ActiveOscillator {
  oscillator: OscillatorNode;
  gainNode: GainNode;
}

export type TabType = 'metronome' | 'tuner' | 'piano';

export type ThemeType = 'default' | 'grand-canyon' | 'moon' | 'sunset-beach' | 'north-pole' | 'rainforest' | 'ocean-depths';

export type FontType = 'inter' | 'bebas-neue' | 'vt323' | 'press-start-2p' | 'orbitron' | 'russo-one' | 'righteous' | 'bangers';

export type WaveType = 'sine' | 'triangle' | 'sawtooth' | 'square';

export type MetronomeSound = 'digital' | 'wood' | 'mechanical' | 'cowbell' | 'rimshot' | 'sine' | 'triangle' | 'tick';

export interface MetronomeSettings {
  tempo: number;
  timeSignature: {
    beats: number;
    noteValue: number;
  };
  subdivision: number;
  volume: number;
  sound: string;
}

export interface TunerSettings {
  a4Frequency: number;
  sensitivity: number;
}

export interface PianoSettings {
  volume: number;
  sustain: number;
  waveType: WaveType;
}

export interface Chord {
  name: string;
  notes: string[];
}

export interface PianoKey {
  note: string;
  frequency: number;
  isBlack: boolean;
  octave: number;
  keyIndex: number;
}

export interface AudioSettings {
  masterVolume: number;
  pianoVolume: number;
  metronomeVolume: number;
}

export interface ThemeSettings {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
  };
}

export type Theme = 'dark' | 'light' | 'blue' | 'green' | 'purple';

export interface TunerData {
  frequency: number;
  note: string;
  cents: number;
  volume: number;
  isListening: boolean;
}

export interface ChordDefinition {
  name: string;
  notes: string[];
}

export interface KeyboardMapping {
  [key: string]: {
    note: string;
    octaveOffset: number;
  };
}

// Audio Context Extensions
declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
} 