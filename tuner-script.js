class PitchTuner {
    constructor() {
        console.log('PitchTuner constructor called');
        this.audioContext = null;
        this.microphone = null;
        this.analyser = null;
        this.dataArray = null;
        this.isListening = false;
        this.animationId = null;
        
        // Tuning settings
        this.a4Frequency = 440;
        this.sensitivity = 0.8;
        
        // Note frequencies (A4 = 440Hz as reference)
        this.noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        
        // Reference tone oscillator
        this.referenceOscillator = null;
        this.referenceGain = null;
        
        // Wait a bit for DOM to be ready, then initialize
        setTimeout(() => this.init(), 100);
    }
    
    init() {
        console.log('Initializing tuner...');
        
        // Get DOM elements with error checking
        this.noteDisplay = document.getElementById('note-display');
        this.frequencyDisplay = document.getElementById('frequency-display');
        this.centsDisplay = document.getElementById('cents-display');
        this.pitchNeedle = document.getElementById('pitch-needle');
        this.startTunerButton = document.getElementById('start-tuner');
        this.playReferenceButton = document.getElementById('play-reference');
        this.referenceNoteSelect = document.getElementById('reference-note');
        this.referenceOctaveSelect = document.getElementById('reference-octave');
        this.a4FrequencyInput = document.getElementById('a4-frequency');
        
        // Check if all elements were found
        const elements = {
            noteDisplay: this.noteDisplay,
            frequencyDisplay: this.frequencyDisplay,
            centsDisplay: this.centsDisplay,
            pitchNeedle: this.pitchNeedle,
            startTunerButton: this.startTunerButton,
            playReferenceButton: this.playReferenceButton,
            referenceNoteSelect: this.referenceNoteSelect,
            referenceOctaveSelect: this.referenceOctaveSelect,
            a4FrequencyInput: this.a4FrequencyInput
        };
        
        const missingElements = Object.entries(elements).filter(([name, element]) => !element);
        
        if (missingElements.length > 0) {
            console.error('Missing DOM elements:', missingElements.map(([name]) => name));
            return;
        }
        
        console.log('All DOM elements found successfully');
        
        // Add event listeners
        this.startTunerButton.addEventListener('click', () => {
            console.log('Start tuner button clicked');
            this.toggleTuner();
        });
        
        this.playReferenceButton.addEventListener('click', () => {
            console.log('Play reference button clicked');
            this.playReferenceTone();
        });
        
        this.a4FrequencyInput.addEventListener('input', (e) => {
            console.log('A4 frequency changed to:', e.target.value);
            this.updateA4Frequency(e.target.value);
        });
        
        console.log('Pitch tuner initialized successfully');
    }
    
    async toggleTuner() {
        if (this.isListening) {
            this.stopTuner();
        } else {
            await this.startTuner();
        }
    }
    
    async startTuner() {
        try {
            console.log('Starting tuner...');
            
            // Initialize audio context
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                console.log('Created audio context');
            }
            
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
                console.log('Resumed audio context');
            }
            
            // Get microphone access
            console.log('Requesting microphone access...');
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false,
                    sampleRate: 44100
                } 
            });
            
            console.log('Microphone access granted');
            
            this.microphone = this.audioContext.createMediaStreamSource(stream);
            
            // Create analyser
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 4096;
            this.analyser.smoothingTimeConstant = 0.8;
            
            this.microphone.connect(this.analyser);
            
            // Create data array for frequency analysis
            this.dataArray = new Float32Array(this.analyser.frequencyBinCount);
            
            this.isListening = true;
            this.startTunerButton.textContent = 'Stop Tuner';
            this.startTunerButton.classList.add('active');
            
            // Start pitch detection loop
            this.detectPitch();
            
            console.log('Tuner started successfully');
            
        } catch (error) {
            console.error('Error starting tuner:', error);
            alert('Could not access microphone. Please check permissions and try again.');
        }
    }
    
    stopTuner() {
        console.log('Stopping tuner...');
        
        this.isListening = false;
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        if (this.microphone) {
            this.microphone.disconnect();
            
            // Stop the media stream
            const stream = this.microphone.mediaStream;
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            
            this.microphone = null;
        }
        
        if (this.analyser) {
            this.analyser.disconnect();
            this.analyser = null;
        }
        
        // Reset display
        this.noteDisplay.textContent = '-';
        this.frequencyDisplay.textContent = '0.0 Hz';
        this.centsDisplay.textContent = '0 cents';
        this.pitchNeedle.style.left = '50%';
        
        // Reset colors
        this.noteDisplay.style.color = 'white';
        this.noteDisplay.style.textShadow = '0 0 20px rgba(255, 255, 255, 0.3)';
        this.centsDisplay.style.color = 'rgba(255, 255, 255, 0.7)';
        
        this.startTunerButton.textContent = 'Start Tuner';
        this.startTunerButton.classList.remove('active');
        
        console.log('Tuner stopped');
    }
    
    detectPitch() {
        if (!this.isListening) return;
        
        // Get frequency data
        this.analyser.getFloatFrequencyData(this.dataArray);
        
        // Find the fundamental frequency using autocorrelation
        const frequency = this.findFundamentalFrequency();
        
        if (frequency > 50 && frequency < 2000) { // Only process reasonable frequencies
            this.updateDisplay(frequency);
        }
        
        // Continue detection loop
        this.animationId = requestAnimationFrame(() => this.detectPitch());
    }
    
    findFundamentalFrequency() {
        // Get time domain data for autocorrelation
        const bufferLength = this.analyser.fftSize;
        const timeData = new Float32Array(bufferLength);
        this.analyser.getFloatTimeDomainData(timeData);
        
        // Find the fundamental frequency using autocorrelation
        const sampleRate = this.audioContext.sampleRate;
        const minFreq = 80;  // Lowest frequency we care about (E2)
        const maxFreq = 1200; // Highest frequency we care about
        
        const minPeriod = Math.floor(sampleRate / maxFreq);
        const maxPeriod = Math.floor(sampleRate / minFreq);
        
        let bestCorrelation = 0;
        let bestPeriod = 0;
        
        // Autocorrelation
        for (let period = minPeriod; period < maxPeriod; period++) {
            let correlation = 0;
            
            for (let i = 0; i < bufferLength - period; i++) {
                correlation += timeData[i] * timeData[i + period];
            }
            
            if (correlation > bestCorrelation) {
                bestCorrelation = correlation;
                bestPeriod = period;
            }
        }
        
        // Check if we found a strong enough correlation
        if (bestCorrelation > 0.01 && bestPeriod > 0) {
            return sampleRate / bestPeriod;
        }
        
        return 0;
    }
    
    updateDisplay(frequency) {
        // Calculate note and cents
        const noteInfo = this.frequencyToNote(frequency);
        
        // Update displays
        this.noteDisplay.textContent = noteInfo.note;
        this.frequencyDisplay.textContent = `${frequency.toFixed(1)} Hz`;
        this.centsDisplay.textContent = `${noteInfo.cents >= 0 ? '+' : ''}${noteInfo.cents} cents`;
        
        // Update needle position (cents range: -50 to +50)
        const clampedCents = Math.max(-50, Math.min(50, noteInfo.cents));
        const needlePosition = 50 + clampedCents;
        this.pitchNeedle.style.left = `${needlePosition}%`;
        
        // Update colors based on tuning accuracy
        this.updateTuningColors(noteInfo.cents);
    }
    
    frequencyToNote(frequency) {
        // Calculate how many semitones above/below A4 (440 Hz)
        const a4 = this.a4Frequency;
        const semitones = 12 * Math.log2(frequency / a4);
        
        // Find the nearest note
        const nearestSemitone = Math.round(semitones);
        
        // Calculate note index (A=0, A#=1, B=2, C=3, etc.)
        // Since A4 is our reference, we need to shift the array so A is at index 0
        const noteNamesFromA = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];
        
        // Get the note index (handle negative values properly)
        let noteIndex = nearestSemitone % 12;
        if (noteIndex < 0) noteIndex += 12;
        
        // Calculate octave - A4 is octave 4
        let octave = 4 + Math.floor(nearestSemitone / 12);
        
        // Special handling for notes below A4 that wrapped around (B and C are in the next octave)
        if (noteIndex >= 2 && nearestSemitone < 0) { // B, C notes
            octave -= 1;
        }
        
        // Calculate cents deviation from perfect pitch
        const cents = Math.round((semitones - nearestSemitone) * 100);
        
        return {
            note: noteNamesFromA[noteIndex] + octave,
            cents: cents,
            frequency: frequency
        };
    }
    
    updateTuningColors(cents) {
        const absCents = Math.abs(cents);
        
        // Check current theme
        const isArcticTheme = document.body.classList.contains('theme-north-pole');
        const isLunarTheme = document.body.classList.contains('theme-moon');
        
        // Remove any existing tuning classes
        this.noteDisplay.classList.remove('tuning-accurate', 'tuning-close', 'tuning-off');
        this.centsDisplay.classList.remove('tuning-accurate', 'tuning-close', 'tuning-off');
        
        // Update note display color
        if (absCents <= 5) {
            if (isArcticTheme || isLunarTheme) {
                this.noteDisplay.classList.add('tuning-accurate');
                this.centsDisplay.classList.add('tuning-accurate');
            } else {
                this.noteDisplay.style.color = '#44ff44'; // Green - in tune
                this.noteDisplay.style.textShadow = '0 0 20px rgba(68, 255, 68, 0.6)';
            }
        } else if (absCents <= 15) {
            if (isArcticTheme || isLunarTheme) {
                this.noteDisplay.classList.add('tuning-close');
                this.centsDisplay.classList.add('tuning-close');
            } else {
                this.noteDisplay.style.color = '#ffaa44'; // Orange - close
                this.noteDisplay.style.textShadow = '0 0 20px rgba(255, 170, 68, 0.6)';
            }
        } else {
            if (isArcticTheme || isLunarTheme) {
                this.noteDisplay.classList.add('tuning-off');
                this.centsDisplay.classList.add('tuning-off');
            } else {
                this.noteDisplay.style.color = '#ff4444'; // Red - out of tune
                this.noteDisplay.style.textShadow = '0 0 20px rgba(255, 68, 68, 0.6)';
            }
        }
        
        // Update cents display color to match note display (for non-themed cases)
        if (!isArcticTheme && !isLunarTheme) {
            this.centsDisplay.style.color = this.noteDisplay.style.color;
        }
    }
    
    async playReferenceTone() {
        try {
            // Initialize audio context if needed
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            // Stop any existing reference tone
            this.stopReferenceTone();
            
            // Get selected note and octave
            const note = this.referenceNoteSelect.value;
            const octave = parseInt(this.referenceOctaveSelect.value);
            
            // Calculate frequency
            const frequency = this.noteToFrequency(note, octave);
            
            console.log(`Playing reference tone: ${note}${octave} (${frequency.toFixed(1)} Hz)`);
            
            // Create oscillator and gain
            this.referenceOscillator = this.audioContext.createOscillator();
            this.referenceGain = this.audioContext.createGain();
            
            this.referenceOscillator.connect(this.referenceGain);
            this.referenceGain.connect(this.audioContext.destination);
            
            // Configure oscillator
            this.referenceOscillator.frequency.value = frequency;
            this.referenceOscillator.type = 'sine';
            
            // Configure gain (fade in and out)
            const currentTime = this.audioContext.currentTime;
            this.referenceGain.gain.value = 0;
            this.referenceGain.gain.setValueAtTime(0, currentTime);
            this.referenceGain.gain.linearRampToValueAtTime(0.1, currentTime + 0.1);
            this.referenceGain.gain.linearRampToValueAtTime(0.1, currentTime + 1.9);
            this.referenceGain.gain.linearRampToValueAtTime(0, currentTime + 2);
            
            // Start and stop oscillator
            this.referenceOscillator.start(currentTime);
            this.referenceOscillator.stop(currentTime + 2);
            
            // Update button temporarily
            this.playReferenceButton.textContent = 'Playing...';
            setTimeout(() => {
                if (this.playReferenceButton) {
                    this.playReferenceButton.textContent = 'Play Reference';
                }
                this.referenceOscillator = null;
                this.referenceGain = null;
            }, 2000);
            
        } catch (error) {
            console.error('Error playing reference tone:', error);
        }
    }
    
    stopReferenceTone() {
        if (this.referenceOscillator) {
            try {
                this.referenceOscillator.stop();
            } catch (e) {
                // Oscillator might already be stopped
            }
            this.referenceOscillator = null;
        }
        if (this.referenceGain) {
            this.referenceGain = null;
        }
    }
    
    noteToFrequency(note, octave) {
        // Note names starting from A (to match our frequencyToNote method)
        const noteNamesFromA = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];
        
        // Find the note index
        const noteIndex = noteNamesFromA.indexOf(note);
        if (noteIndex === -1) {
            console.error('Invalid note name:', note);
            return this.a4Frequency; // Return A4 as fallback
        }
        
        // Calculate semitones from A4
        const semitones = (octave - 4) * 12 + noteIndex;
        
        // Calculate frequency using the formula: f = f0 * 2^(n/12)
        return this.a4Frequency * Math.pow(2, semitones / 12);
    }
    
    updateA4Frequency(value) {
        const freq = parseFloat(value);
        if (freq >= 420 && freq <= 460) {
            this.a4Frequency = freq;
            console.log(`A4 frequency updated to ${freq} Hz`);
        }
    }
    
    // Cleanup method
    destroy() {
        console.log('Destroying tuner...');
        this.stopTuner();
        this.stopReferenceTone();
        
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
        }
    }
}

// Make PitchTuner available globally
window.PitchTuner = PitchTuner;
console.log('PitchTuner class loaded'); 