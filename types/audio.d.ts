// Audio context type extensions
interface Window {
  webkitAudioContext?: typeof AudioContext;
}

// Custom audio types
export interface AudioNote {
  note: string;
  octave: number;
  isBlack: boolean;
}

export interface ActiveOscillator {
  oscillator: OscillatorNode;
  gainNode: GainNode;
} 