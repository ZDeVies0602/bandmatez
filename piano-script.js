class VirtualPiano {
    constructor() {
        console.log('VirtualPiano constructor called');
        // Remove direct audio context management - use AudioManager instead
        this.audioManager = window.AudioManager;
        this.activeOscillators = new Map();
        
        // Piano settings
        this.volume = 0.5;
        this.sustain = 0.5;
        this.waveType = 'sine';
        this.octaveRange = 3; // Starting octave
        
        // Note names and their relationships
        this.noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        this.whiteKeys = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
        this.blackKeys = ['C#', 'D#', 'F#', 'G#', 'A#'];
        
        // Chord definitions
        this.chords = {
            'C-major': ['C', 'E', 'G'],
            'C-minor': ['C', 'D#', 'G'],
            'D-major': ['D', 'F#', 'A'],
            'D-minor': ['D', 'F', 'A'],
            'E-major': ['E', 'G#', 'B'],
            'E-minor': ['E', 'G', 'B'],
            'F-major': ['F', 'A', 'C'],
            'F-minor': ['F', 'G#', 'C'],
            'G-major': ['G', 'B', 'D'],
            'G-minor': ['G', 'A#', 'D'],
            'A-major': ['A', 'C#', 'E'],
            'A-minor': ['A', 'C', 'E'],
            'B-major': ['B', 'D#', 'F#'],
            'B-minor': ['B', 'D', 'F#']
        };
        
        // Keyboard mapping
        this.keyboardMap = {
            'KeyZ': 'C',    // C
            'KeyS': 'C#',   // C#
            'KeyX': 'D',    // D
            'KeyD': 'D#',   // D#
            'KeyC': 'E',    // E
            'KeyV': 'F',    // F
            'KeyG': 'F#',   // F#
            'KeyB': 'G',    // G
            'KeyH': 'G#',   // G#
            'KeyN': 'A',    // A
            'KeyJ': 'A#',   // A#
            'KeyM': 'B',    // B
            'KeyQ': 'C',    // C (next octave)
            'Digit2': 'C#', // C# (next octave)
            'KeyW': 'D',    // D (next octave)
            'Digit3': 'D#', // D# (next octave)
            'KeyE': 'E',    // E (next octave)
            'KeyR': 'F',    // F (next octave)
            'Digit5': 'F#', // F# (next octave)
            'KeyT': 'G',    // G (next octave)
            'Digit6': 'G#', // G# (next octave)
            'KeyY': 'A',    // A (next octave)
            'Digit7': 'A#', // A# (next octave)
            'KeyU': 'B'     // B (next octave)
        };
        
        // Initialize after DOM loads - will be called manually now
        // setTimeout(() => this.init(), 100);
    }
    
    init() {
        console.log('Initializing virtual piano...');
        
        // Get DOM elements
        this.pianoKeyboard = document.getElementById('piano-keyboard');
        this.currentNote = document.getElementById('current-note');
        this.currentFrequency = document.getElementById('current-frequency');
        this.octaveRangeSelect = document.getElementById('octave-range');
        this.waveTypeSelect = document.getElementById('wave-type');
        this.volumeControl = document.getElementById('volume-control');
        this.volumeDisplay = document.getElementById('volume-display');
        this.sustainControl = document.getElementById('sustain-control');
        this.sustainDisplay = document.getElementById('sustain-display');
        this.chordSelect = document.getElementById('chord-select');
        this.playChordButton = document.getElementById('play-chord');
        this.clearChordButton = document.getElementById('clear-chord');
        
        // Check if required elements exist with detailed logging
        const requiredElements = {
            'piano-keyboard': this.pianoKeyboard,
            'current-note': this.currentNote,
            'current-frequency': this.currentFrequency,
            'octave-range': this.octaveRangeSelect,
            'wave-type': this.waveTypeSelect,
            'volume-control': this.volumeControl,
            'volume-display': this.volumeDisplay,
            'sustain-control': this.sustainControl,
            'sustain-display': this.sustainDisplay,
            'chord-select': this.chordSelect,
            'play-chord': this.playChordButton,
            'clear-chord': this.clearChordButton
        };
        
        const missingElements = Object.entries(requiredElements).filter(([id, element]) => !element);
        
        if (missingElements.length > 0) {
            console.error('Piano initialization failed - missing DOM elements:', missingElements.map(([id]) => id));
            console.error('Current tab content visible:', document.querySelector('#piano-tab.active') ? 'Yes' : 'No');
            console.error('Piano keyboard element in DOM:', !!document.querySelector('#piano-keyboard'));
            return;
        }
        
        console.log('All piano DOM elements found successfully');
        
        // Check if AudioManager is available
        if (!this.audioManager) {
            console.warn('AudioManager not available for piano');
        }
        
        // Generate piano keys
        this.generateKeys();
        
        // Add event listeners
        this.addEventListeners();
        
        console.log('Virtual piano initialized successfully');
    }
    
    generateKeys() {
        this.pianoKeyboard.innerHTML = '';
        const startOctave = this.octaveRange;
        const endOctave = startOctave + 2; // 3 octaves
        
        // Create a container for all octaves
        const keyboardContainer = document.createElement('div');
        keyboardContainer.style.display = 'flex';
        keyboardContainer.style.height = '100%';
        keyboardContainer.style.position = 'relative';
        keyboardContainer.style.width = '100%';
        
        // Generate all octaves
        for (let octave = startOctave; octave <= endOctave; octave++) {
            const octaveContainer = document.createElement('div');
            octaveContainer.className = 'octave';
            octaveContainer.style.position = 'relative';
            octaveContainer.style.display = 'flex';
            octaveContainer.style.flex = '1';
            octaveContainer.style.height = '100%';
            
            // Create white keys first (7 per octave: C, D, E, F, G, A, B)
            this.whiteKeys.forEach(note => {
                const key = this.createKey(note, octave, false);
                octaveContainer.appendChild(key);
            });
            
            // Create black keys and position them absolutely
            this.blackKeys.forEach(note => {
                const key = this.createKey(note, octave, true);
                octaveContainer.appendChild(key);
            });
            
            keyboardContainer.appendChild(octaveContainer);
        }
        
        this.pianoKeyboard.appendChild(keyboardContainer);
    }
    
    createKey(note, octave, isBlack) {
        const key = document.createElement('div');
        const noteId = `${note}${octave}`;
        
        key.className = isBlack ? 'piano-key black-key' : 'piano-key white-key';
        key.dataset.note = note;
        key.dataset.octave = octave;
        key.dataset.noteId = noteId;
        key.textContent = noteId;
        
        // Set black key positions using data attribute for CSS targeting
        if (isBlack) {
            key.setAttribute('data-note', note);
        }
        
        // Add event listeners
        key.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.playNote(note, octave); // No await needed here, fire and forget
            key.classList.add('active');
        });
        
        key.addEventListener('mouseup', () => {
            this.stopNote(note, octave);
            key.classList.remove('active');
        });
        
        key.addEventListener('mouseleave', () => {
            this.stopNote(note, octave);
            key.classList.remove('active');
        });
        
        return key;
    }
    
    addEventListeners() {
        // Control events
        this.octaveRangeSelect.addEventListener('change', (e) => {
            this.octaveRange = parseInt(e.target.value);
            this.generateKeys();
        });
        
        this.waveTypeSelect.addEventListener('change', (e) => {
            this.waveType = e.target.value;
        });
        
        this.volumeControl.addEventListener('input', (e) => {
            this.volume = e.target.value / 100;
            this.volumeDisplay.textContent = `${e.target.value}%`;
        });
        
        this.sustainControl.addEventListener('input', (e) => {
            this.sustain = parseFloat(e.target.value);
            this.sustainDisplay.textContent = `${e.target.value}s`;
        });
        
        this.playChordButton.addEventListener('click', () => {
            this.playChord();
        });
        
        this.clearChordButton.addEventListener('click', () => {
            this.clearHighlights();
        });
        
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.repeat) return; // Ignore repeated keydown events
            this.handleKeyDown(e);
        });
        
        document.addEventListener('keyup', (e) => {
            this.handleKeyUp(e);
        });
    }
    
    handleKeyDown(e) {
        const note = this.keyboardMap[e.code];
        if (!note) return;
        
        e.preventDefault();
        
        // Determine octave based on key position
        const isUpperRow = ['KeyQ', 'Digit2', 'KeyW', 'Digit3', 'KeyE', 'KeyR', 'Digit5', 'KeyT', 'Digit6', 'KeyY', 'Digit7', 'KeyU'].includes(e.code);
        const octave = this.octaveRange + (isUpperRow ? 1 : 0);
        
        this.playNote(note, octave); // No await needed here, fire and forget
        this.highlightKey(note, octave);
    }
    
    handleKeyUp(e) {
        const note = this.keyboardMap[e.code];
        if (!note) return;
        
        const isUpperRow = ['KeyQ', 'Digit2', 'KeyW', 'Digit3', 'KeyE', 'KeyR', 'Digit5', 'KeyT', 'Digit6', 'KeyY', 'Digit7', 'KeyU'].includes(e.code);
        const octave = this.octaveRange + (isUpperRow ? 1 : 0);
        
        this.stopNote(note, octave);
        this.unhighlightKey(note, octave);
    }
    
    async playNote(note, octave) {
        console.log(`Piano playNote called: ${note}${octave}`);
        
        if (!this.audioManager) {
            console.warn('AudioManager not available for piano');
            return;
        }
        
        console.log('AudioManager available, initializing...');
        // Initialize audio context if needed
        const audioReady = await this.audioManager.initialize();
        if (!audioReady) {
            console.warn('Audio context not available for piano');
            return;
        }
        
        console.log('Audio ready, creating sound...');
        
        const noteId = `${note}${octave}`;
        
        // Stop existing note if playing
        this.stopNote(note, octave);
        
        const frequency = this.noteToFrequency(note, octave);
        console.log(`Frequency calculated: ${frequency} Hz`);
        
        // Create oscillator and gain
        const oscillator = this.audioManager.createOscillator();
        const gainNode = this.audioManager.createGain();
        
        if (!oscillator || !gainNode) {
            console.warn('Could not create audio nodes for piano');
            return;
        }
        
        console.log('Audio nodes created successfully');
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioManager.getMasterGain());
        
        // Configure oscillator
        oscillator.frequency.value = frequency;
        oscillator.type = this.waveType;
        
        // Configure envelope (ADSR) with volume control
        const currentTime = this.audioManager.getCurrentTime();
        const finalVolume = this.volume * 0.3; // Scale down to prevent clipping
        
        console.log(`Starting oscillator at ${currentTime}, volume: ${finalVolume}`);
        
        gainNode.gain.setValueAtTime(0, currentTime);
        gainNode.gain.linearRampToValueAtTime(finalVolume, currentTime + 0.02); // Attack
        gainNode.gain.linearRampToValueAtTime(finalVolume * 0.7, currentTime + 0.1);  // Decay
        gainNode.gain.setValueAtTime(finalVolume * 0.7, currentTime + this.sustain);   // Sustain
        
        // Start oscillator
        oscillator.start(currentTime);
        
        // Store for cleanup
        this.activeOscillators.set(noteId, { oscillator, gainNode });
        
        // Update display
        this.currentNote.textContent = noteId;
        this.currentFrequency.textContent = `${frequency.toFixed(1)} Hz`;
        
        console.log(`Playing ${noteId} at ${frequency.toFixed(1)} Hz - oscillator started`);
    }
    
    stopNote(note, octave) {
        const noteId = `${note}${octave}`;
        const activeNote = this.activeOscillators.get(noteId);
        
        if (activeNote && this.audioManager) {
            const { oscillator, gainNode } = activeNote;
            const currentTime = this.audioManager.getCurrentTime();
            
            // Fade out
            gainNode.gain.cancelScheduledValues(currentTime);
            gainNode.gain.setValueAtTime(gainNode.gain.value, currentTime);
            gainNode.gain.linearRampToValueAtTime(0, currentTime + 0.1);
            
            // Stop oscillator
            oscillator.stop(currentTime + 0.1);
            
            // Remove from active oscillators
            this.activeOscillators.delete(noteId);
        }
    }
    
    highlightKey(note, octave) {
        const key = document.querySelector(`[data-note-id="${note}${octave}"]`);
        if (key) {
            key.classList.add('active');
        }
    }
    
    unhighlightKey(note, octave) {
        const key = document.querySelector(`[data-note-id="${note}${octave}"]`);
        if (key) {
            key.classList.remove('active');
        }
    }
    
    async playChord() {
        const selectedChord = this.chordSelect.value;
        if (!selectedChord || !this.chords[selectedChord]) return;
        
        this.clearHighlights();
        
        const chordNotes = this.chords[selectedChord];
        const baseOctave = this.octaveRange + 1; // Use middle octave
        
        // Play all chord notes
        for (const [index, note] of chordNotes.entries()) {
            let octave = baseOctave;
            // Adjust octave for chord voicing
            if (note === 'C' && index > 0) octave += 1; // C an octave higher if not root
            
            await this.playNote(note, octave);
            this.highlightKey(note, octave);
            
            // Auto-stop after 2 seconds
            setTimeout(() => {
                this.stopNote(note, octave);
                this.unhighlightKey(note, octave);
            }, 2000);
        }
    }
    
    clearHighlights() {
        document.querySelectorAll('.piano-key.active').forEach(key => {
            key.classList.remove('active');
        });
    }
    
    noteToFrequency(note, octave) {
        // Use shared FrequencyUtils if available for consistent tuning
        if (window.FrequencyUtils) {
            return window.FrequencyUtils.noteToFrequency(note, octave);
        }
        
        // Fallback to original calculation
        // A4 = 440 Hz reference
        const A4 = 440;
        const noteIndex = this.noteNames.indexOf(note);
        
        // Calculate semitones from A4
        const semitonesFromA4 = (octave - 4) * 12 + (noteIndex - 9);
        
        // Calculate frequency using equal temperament formula
        return A4 * Math.pow(2, semitonesFromA4 / 12);
    }
    
    // Cleanup method
    destroy() {
        console.log('Destroying virtual piano...');
        
        // Stop all active notes
        this.activeOscillators.forEach((activeNote, noteId) => {
            const { oscillator } = activeNote;
            try {
                oscillator.stop();
            } catch (e) {
                // Oscillator might already be stopped
            }
        });
        this.activeOscillators.clear();
    }
}

// Remove auto-initialization - will be handled by main HTML
// Initialize virtual piano when DOM loads
// window.addEventListener('load', () => {
//     window.virtualPiano = new VirtualPiano();
// });

// Make VirtualPiano available globally
window.VirtualPiano = VirtualPiano;
console.log('Virtual piano script loaded'); 