class PitchTuner {
    constructor() {
        console.log('PitchTuner constructor called');
        // Remove direct audio context management - use AudioManager instead
        this.audioManager = window.AudioManager;
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
        
        // Reference tone override
        this.isPlayingReference = false;
        this.referenceNote = null;
        this.referenceOctave = null;
        
        // Wait a bit for DOM to be ready, then initialize - now handled by metronome
        // setTimeout(() => this.init(), 100);
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
        
        // Load saved A4 frequency
        const savedA4 = localStorage.getItem('music-tools-a4-frequency');
        if (savedA4) {
            this.a4Frequency = parseFloat(savedA4);
            this.a4FrequencyInput.value = this.a4Frequency;
            if (window.FrequencyUtils) {
                window.FrequencyUtils.setA4Frequency(this.a4Frequency);
            }
        }
        
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
            
            // Initialize shared audio context
            if (!this.audioManager) {
                console.error('AudioManager not available');
                alert('Audio system not available. Please refresh the page.');
                return;
            }
            
            const audioReady = await this.audioManager.initialize();
            if (!audioReady) {
                console.error('Failed to initialize audio context');
                alert('Could not initialize audio. Please check your browser permissions.');
                return;
            }
            
            const audioContext = await this.audioManager.getContext();
            if (!audioContext) {
                console.error('Could not get audio context');
                return;
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
            
            this.microphone = this.audioManager.createMediaStreamSource(stream);
            
            // Create analyser
            this.analyser = this.audioManager.createAnalyser();
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
        
        // Reset display - check if elements exist first
        if (this.noteDisplay) {
            this.noteDisplay.textContent = '-';
            this.noteDisplay.style.color = 'white';
            this.noteDisplay.style.textShadow = '0 0 20px rgba(255, 255, 255, 0.3)';
        }
        
        if (this.frequencyDisplay) {
            this.frequencyDisplay.textContent = '0.0 Hz';
        }
        
        if (this.centsDisplay) {
            this.centsDisplay.textContent = '0 cents';
            this.centsDisplay.style.color = 'rgba(255, 255, 255, 0.7)';
        }
        
        if (this.pitchNeedle) {
            this.pitchNeedle.style.left = '50%';
        }
        
        if (this.startTunerButton) {
            this.startTunerButton.textContent = 'Start Tuner';
            this.startTunerButton.classList.remove('active');
        }
        
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
        const sampleRate = this.audioManager.getContext().sampleRate;
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
        // Check if display elements exist
        if (!this.noteDisplay || !this.frequencyDisplay || !this.centsDisplay) {
            console.warn('Display elements not available for tuner');
            return;
        }
        
        // If playing reference tone, override display to show perfect tuning
        if (this.isPlayingReference && this.referenceNote && this.referenceOctave) {
            const perfectNote = `${this.referenceNote}${this.referenceOctave}`;
            const perfectFrequency = this.noteToFrequency(this.referenceNote, this.referenceOctave);
            
            this.noteDisplay.textContent = perfectNote;
            this.frequencyDisplay.textContent = perfectFrequency.toFixed(1) + ' Hz';
            this.centsDisplay.textContent = '0 cents';
            
            // Set needle to center (perfect tune)
            if (this.pitchNeedle) {
                this.pitchNeedle.style.left = '50%';
            }
            
            // Show as perfectly tuned (green)
            this.updateTuningColors(0);
            return;
        }
        
        // Normal tuning display
        const noteInfo = this.frequencyToNote(frequency);
        
        this.noteDisplay.textContent = noteInfo.note;
        this.frequencyDisplay.textContent = frequency.toFixed(1) + ' Hz';
        this.centsDisplay.textContent = noteInfo.cents + ' cents';
        
        // Update needle position (-50 to +50 cents maps to 0% to 100%)
        const needlePosition = Math.max(0, Math.min(100, 50 + noteInfo.cents));
        if (this.pitchNeedle) {
            this.pitchNeedle.style.left = `${needlePosition}%`;
        }
        
        // Update colors based on tuning accuracy
        this.updateTuningColors(noteInfo.cents);
    }
    
    frequencyToNote(frequency) {
        // Use shared FrequencyUtils if available for consistent calculations
        if (window.FrequencyUtils) {
            return window.FrequencyUtils.frequencyToNote(frequency);
        }
        
        // Fallback to original calculation
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
        
        // Check current theme using ThemeManager if available
        let isSpecialTheme = false;
        if (window.ThemeManager) {
            const currentTheme = window.ThemeManager.getCurrentTheme();
            isSpecialTheme = window.ThemeManager.hasSpecialTextHandling();
        } else {
            // Fallback to checking body classes
            isSpecialTheme = document.body.classList.contains('theme-north-pole') || 
                            document.body.classList.contains('theme-moon');
        }
        
        // Check if elements exist before manipulating them
        if (!this.noteDisplay || !this.centsDisplay) {
            console.warn('Tuning display elements not available');
            return;
        }
        
        // Remove any existing tuning classes
        this.noteDisplay.classList.remove('tuning-accurate', 'tuning-close', 'tuning-off');
        this.centsDisplay.classList.remove('tuning-accurate', 'tuning-close', 'tuning-off');
        
        // Update note display color
        if (absCents <= 5) {
            if (isSpecialTheme) {
                this.noteDisplay.classList.add('tuning-accurate');
                this.centsDisplay.classList.add('tuning-accurate');
            } else {
                this.noteDisplay.style.color = '#44ff44'; // Green - in tune
                this.noteDisplay.style.textShadow = '0 0 20px rgba(68, 255, 68, 0.6)';
            }
        } else if (absCents <= 15) {
            if (isSpecialTheme) {
                this.noteDisplay.classList.add('tuning-close');
                this.centsDisplay.classList.add('tuning-close');
            } else {
                this.noteDisplay.style.color = '#ffaa44'; // Orange - close
                this.noteDisplay.style.textShadow = '0 0 20px rgba(255, 170, 68, 0.6)';
            }
        } else {
            if (isSpecialTheme) {
                this.noteDisplay.classList.add('tuning-off');
                this.centsDisplay.classList.add('tuning-off');
            } else {
                this.noteDisplay.style.color = '#ff4444'; // Red - out of tune
                this.noteDisplay.style.textShadow = '0 0 20px rgba(255, 68, 68, 0.6)';
            }
        }
        
        // Update cents display color to match note display (for non-themed cases)
        if (!isSpecialTheme) {
            this.centsDisplay.style.color = this.noteDisplay.style.color;
        }
    }
    
    async playReferenceTone() {
        try {
            console.log('Tuner playReferenceTone called');
            
            // Initialize shared audio context if needed
            if (!this.audioManager) {
                console.error('AudioManager not available');
                alert('Audio system not available. Please refresh the page.');
                return;
            }
            
            console.log('AudioManager available, initializing...');
            const audioReady = await this.audioManager.initialize();
            if (!audioReady) {
                console.error('Failed to initialize audio context');
                alert('Could not initialize audio. Please check your browser permissions.');
                return;
            }
            
            const audioContext = await this.audioManager.getContext();
            if (!audioContext) {
                console.error('Could not get audio context');
                return;
            }
            
            console.log('Audio context ready, creating reference tone...');
            
            // Stop any existing reference tone
            this.stopReferenceTone();
            
            // Get selected note and octave
            const note = this.referenceNoteSelect.value;
            const octave = parseInt(this.referenceOctaveSelect.value);
            
            // Set reference override flags
            this.isPlayingReference = true;
            this.referenceNote = note;
            this.referenceOctave = octave;
            
            // Calculate frequency
            const frequency = this.noteToFrequency(note, octave);
            
            console.log(`Playing reference tone: ${note}${octave} (${frequency.toFixed(1)} Hz)`);
            
            // Create oscillator and gain
            this.referenceOscillator = audioContext.createOscillator();
            this.referenceGain = audioContext.createGain();
            
            this.referenceOscillator.connect(this.referenceGain);
            this.referenceGain.connect(audioContext.destination);
            
            // Configure oscillator
            this.referenceOscillator.frequency.value = frequency;
            this.referenceOscillator.type = 'sine';
            
            // Configure gain (fade in and out)
            const currentTime = audioContext.currentTime;
            this.referenceGain.gain.value = 0;
            this.referenceGain.gain.setValueAtTime(0, currentTime);
            this.referenceGain.gain.linearRampToValueAtTime(0.1, currentTime + 0.1);
            this.referenceGain.gain.linearRampToValueAtTime(0.1, currentTime + 1.9);
            this.referenceGain.gain.linearRampToValueAtTime(0, currentTime + 2);
            
            console.log('Starting reference tone oscillator...');
            
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
                
                // Clear reference override flags
                this.isPlayingReference = false;
                this.referenceNote = null;
                this.referenceOctave = null;
                
                console.log('Reference tone finished');
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
        
        // Clear reference override flags
        this.isPlayingReference = false;
        this.referenceNote = null;
        this.referenceOctave = null;
        
        // Reset button text if needed
        if (this.playReferenceButton) {
            this.playReferenceButton.textContent = 'Play Reference';
        }
    }
    
    noteToFrequency(note, octave) {
        // Use shared FrequencyUtils if available for consistent tuning
        if (window.FrequencyUtils) {
            return window.FrequencyUtils.noteToFrequency(note, octave);
        }
        
        // Fallback to original calculation
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const noteIndex = noteNames.indexOf(note);
        const a4 = this.a4Frequency;
        
        // Calculate semitones from A4
        const semitonesFromA4 = (octave - 4) * 12 + (noteIndex - 9);
        
        return a4 * Math.pow(2, semitonesFromA4 / 12);
    }
    
    updateA4Frequency(value) {
        const freq = parseFloat(value);
        if (freq >= 420 && freq <= 460) {
            this.a4Frequency = freq;
            localStorage.setItem('music-tools-a4-frequency', freq.toString());
            console.log(`A4 frequency updated to ${freq} Hz`);
            if (window.FrequencyUtils) {
                window.FrequencyUtils.setA4Frequency(this.a4Frequency);
            }
        }
    }
    
    // Cleanup method
    destroy() {
        console.log('Destroying tuner...');
        this.stopTuner();
        this.stopReferenceTone();
        
        // Don't close the shared audio context - it's managed by AudioManager
        // The AudioManager singleton will handle its own cleanup
        console.log('Tuner destroyed');
    }
}

// Make PitchTuner available globally
window.PitchTuner = PitchTuner;
console.log('PitchTuner class loaded'); 