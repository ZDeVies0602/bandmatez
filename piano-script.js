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
        
        // Scrollable piano settings
        this.currentStartOctave = 2; // Starting octave for the visible range (changed to show C2-C6 initially)
        this.visibleOctaves = 4; // How many octaves to show at once
        this.minOctave = 0; // Minimum octave (A0) - changed from 1
        this.maxOctave = 8; // Maximum octave (C8)
        this.totalOctaves = 8; // Total octaves to generate (A0 to C8) - changed from 7
        
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
        
        // Keyboard mapping - map to current visible octaves
        this.keyboardMap = {
            'KeyZ': { note: 'C', octaveOffset: 0 },    // C
            'KeyS': { note: 'C#', octaveOffset: 0 },   // C#
            'KeyX': { note: 'D', octaveOffset: 0 },    // D
            'KeyD': { note: 'D#', octaveOffset: 0 },   // D#
            'KeyC': { note: 'E', octaveOffset: 0 },    // E
            'KeyV': { note: 'F', octaveOffset: 0 },    // F
            'KeyG': { note: 'F#', octaveOffset: 0 },   // F#
            'KeyB': { note: 'G', octaveOffset: 0 },    // G
            'KeyH': { note: 'G#', octaveOffset: 0 },   // G#
            'KeyN': { note: 'A', octaveOffset: 0 },    // A
            'KeyJ': { note: 'A#', octaveOffset: 0 },   // A#
            'KeyM': { note: 'B', octaveOffset: 0 },    // B
            'KeyQ': { note: 'C', octaveOffset: 1 },    // C (next octave)
            'Digit2': { note: 'C#', octaveOffset: 1 }, // C# (next octave)
            'KeyW': { note: 'D', octaveOffset: 1 },    // D (next octave)
            'Digit3': { note: 'D#', octaveOffset: 1 }, // D# (next octave)
            'KeyE': { note: 'E', octaveOffset: 1 },    // E (next octave)
            'KeyR': { note: 'F', octaveOffset: 1 },    // F (next octave)
            'Digit5': { note: 'F#', octaveOffset: 1 }, // F# (next octave)
            'KeyT': { note: 'G', octaveOffset: 1 },    // G (next octave)
            'Digit6': { note: 'G#', octaveOffset: 1 }, // G# (next octave)
            'KeyY': { note: 'A', octaveOffset: 1 },    // A (next octave)
            'Digit7': { note: 'A#', octaveOffset: 1 }, // A# (next octave)
            'KeyU': { note: 'B', octaveOffset: 1 }     // B (next octave)
        };
        
        // Initialize after DOM loads - will be called manually now
        // setTimeout(() => this.init(), 100);
    }
    
    init() {
        console.log('Initializing virtual piano...');
        console.log('Current DOM state:');
        console.log('- Document ready state:', document.readyState);
        console.log('- Piano tab exists:', !!document.getElementById('piano-tab'));
        console.log('- Piano tab active:', document.getElementById('piano-tab')?.classList.contains('active'));
        console.log('- Piano keyboard element exists:', !!document.getElementById('piano-keyboard'));
        
        // Get DOM elements
        this.pianoKeyboard = document.getElementById('piano-keyboard');
        this.currentNote = document.getElementById('current-note');
        this.currentFrequency = document.getElementById('current-frequency');
        this.volumeControl = document.getElementById('volume-control');
        this.volumeDisplay = document.getElementById('volume-display');
        this.sustainControl = document.getElementById('sustain-control');
        this.sustainDisplay = document.getElementById('sustain-display');
        this.chordSelect = document.getElementById('chord-select');
        this.playChordButton = document.getElementById('play-chord');
        this.clearChordButton = document.getElementById('clear-chord');
        
        // New navigation elements
        this.scrollLeftBtn = document.getElementById('scroll-left');
        this.scrollRightBtn = document.getElementById('scroll-right');
        this.currentRangeDisplay = document.getElementById('current-range');
        
        // Check if required elements exist with detailed logging
        const requiredElements = {
            'piano-keyboard': this.pianoKeyboard,
            'current-note': this.currentNote,
            'current-frequency': this.currentFrequency,
            'volume-control': this.volumeControl,
            'volume-display': this.volumeDisplay,
            'sustain-control': this.sustainControl,
            'sustain-display': this.sustainDisplay,
            'chord-select': this.chordSelect,
            'play-chord': this.playChordButton,
            'clear-chord': this.clearChordButton,
            'scroll-left': this.scrollLeftBtn,
            'scroll-right': this.scrollRightBtn,
            'current-range': this.currentRangeDisplay
        };
        
        const missingElements = Object.entries(requiredElements).filter(([id, element]) => !element);
        
        if (missingElements.length > 0) {
            console.error('Piano initialization failed - missing DOM elements:', missingElements.map(([id]) => id));
            console.error('Current tab content visible:', document.querySelector('#piano-tab.active') ? 'Yes' : 'No');
            console.error('Piano keyboard element in DOM:', !!document.querySelector('#piano-keyboard'));
            return;
        }
        
        console.log('All piano DOM elements found successfully');
        console.log('Piano keyboard element details:');
        console.log('- tagName:', this.pianoKeyboard.tagName);
        console.log('- className:', this.pianoKeyboard.className);
        console.log('- computed style display:', window.getComputedStyle(this.pianoKeyboard).display);
        console.log('- computed style visibility:', window.getComputedStyle(this.pianoKeyboard).visibility);
        console.log('- offsetParent:', this.pianoKeyboard.offsetParent);
        console.log('- clientHeight:', this.pianoKeyboard.clientHeight);
        console.log('- clientWidth:', this.pianoKeyboard.clientWidth);
        
        // Check if AudioManager is available
        if (!this.audioManager) {
            console.warn('AudioManager not available for piano');
        }
        
        // Generate piano keys
        console.log('About to generate piano keys...');
        this.generateKeys();
        console.log('Keys generation completed');
        
        this.updateRangeDisplay();
        this.updateScrollButtons();
        
        // Add event listeners
        this.addEventListeners();
        
        // Listen for wave type changes from sound menu
        window.addEventListener('pianoWaveTypeChanged', (e) => {
            this.waveType = e.detail.waveType;
            console.log('Piano wave type updated from sound menu:', this.waveType);
        });
        
        // Get initial wave type from sound menu
        if (window.MetronomeSounds && window.MetronomeSounds.getCurrentPianoWaveType) {
            this.waveType = window.MetronomeSounds.getCurrentPianoWaveType();
            console.log('Piano wave type loaded from MetronomeSounds:', this.waveType);
        } else {
            console.log('MetronomeSounds not available yet, using default wave type:', this.waveType);
        }
        
        console.log('Virtual piano initialized successfully');
        console.log('Piano keyboard element contains', this.pianoKeyboard.children.length, 'child elements');
        console.log('Generated keys for octave range:', this.currentStartOctave, 'to', this.currentStartOctave + this.visibleOctaves - 1);
        
        // Final check of what was created
        setTimeout(() => {
            console.log('POST-INIT CHECK:');
            console.log('- Piano keyboard children count:', this.pianoKeyboard.children.length);
            console.log('- Keyboard container exists:', !!document.getElementById('keyboard-container'));
            console.log('- White keys found:', document.querySelectorAll('.white-key').length);
            console.log('- Black keys found:', document.querySelectorAll('.black-key').length);
            console.log('- First few children:', Array.from(this.pianoKeyboard.children).slice(0, 3).map(el => el.tagName + '.' + el.className));
            
            if (this.pianoKeyboard.children.length === 0) {
                console.error('CRITICAL: No children generated in piano keyboard!');
                console.log('Attempting to regenerate keys...');
                this.generateKeys();
            }
        }, 100);
    }
    
    generateKeys() {
        console.log('generateKeys() called');
        console.log('Current piano keyboard element:', this.pianoKeyboard);
        console.log('Piano keyboard innerHTML before clear:', this.pianoKeyboard.innerHTML.length, 'characters');
        
        this.pianoKeyboard.innerHTML = '';
        console.log('Piano keyboard cleared');
        
        // Create a container for all octaves (wider than visible area)
        const keyboardContainer = document.createElement('div');
        keyboardContainer.style.display = 'flex';
        keyboardContainer.style.height = '100%';
        keyboardContainer.style.position = 'relative';
        // Fix: Calculate proper width accounting for partial octaves
        // Octave 0 = 2/7 of normal width (A0, B0), Octaves 1-7 = full width, Octave 8 = 1/7 of normal width (C8)
        // Total relative width = (2/7) + 7*(7/7) + (1/7) = 2/7 + 7 + 1/7 = 7.43 octave equivalents
        // But we show 4 octaves at a time, so total width = (7.43/4) * 100% = 185.7%
        const totalWidthPercent = Math.round((2/7 + 7 + 1/7) / 4 * 100 * 10) / 10; // Round to 1 decimal
        keyboardContainer.style.width = `${totalWidthPercent}%`;
        keyboardContainer.id = 'keyboard-container';
        
        console.log('Created keyboard container with width:', keyboardContainer.style.width);
        console.log('Total octaves to generate:', this.totalOctaves);
        console.log('Visible octaves:', this.visibleOctaves);
        console.log('Octave range:', this.minOctave, 'to', this.maxOctave);
        
        // Generate all octaves from minOctave to maxOctave
        for (let octave = this.minOctave; octave <= this.maxOctave; octave++) {
            console.log(`Generating octave ${octave}...`);
            
            const octaveContainer = document.createElement('div');
            octaveContainer.className = 'octave';
            octaveContainer.setAttribute('data-octave', octave); // Add data attribute for CSS targeting
            octaveContainer.style.position = 'relative';
            octaveContainer.style.display = 'flex';
            octaveContainer.style.flex = '0 0 auto'; /* Don't grow/shrink, use CSS width */
            octaveContainer.style.height = '100%';
            // CSS now handles the width with calc(100% / 4) for visible octaves
            // Each octave will be exactly 1/4 of the visible area
            octaveContainer.style.flexShrink = '0'; // Prevent shrinking
            
            console.log(`Octave container ${octave} created with width:`, octaveContainer.style.width);
            
            // Handle special case for octave 0 (only A0, A#0, B0)
            if (octave === 0) {
                // Only create A, B for octave 0 (2 white keys)
                const notesToCreate = ['A', 'B']; // White keys
                const blackNotesToCreate = ['A#']; // Black keys
                
                notesToCreate.forEach(note => {
                    const key = this.createKey(note, octave, false);
                    octaveContainer.appendChild(key);
                    console.log(`Created white key: ${note}${octave}`);
                });
                
                blackNotesToCreate.forEach(note => {
                    const key = this.createKey(note, octave, true);
                    octaveContainer.appendChild(key);
                    console.log(`Created black key: ${note}${octave}`);
                });
            } else if (octave === 8) {
                // Only create C for octave 8
                const key = this.createKey('C', octave, false);
                octaveContainer.appendChild(key);
                console.log(`Created white key: C${octave}`);
            } else {
                // Create full octave (C, D, E, F, G, A, B)
                this.whiteKeys.forEach(note => {
                    const key = this.createKey(note, octave, false);
                    octaveContainer.appendChild(key);
                    console.log(`Created white key: ${note}${octave}`);
                });
                
                // Create black keys and position them absolutely
                this.blackKeys.forEach(note => {
                    const key = this.createKey(note, octave, true);
                    octaveContainer.appendChild(key);
                    console.log(`Created black key: ${note}${octave}`);
                });
            }
            
            console.log(`Octave ${octave} completed with ${octaveContainer.children.length} keys`);
            keyboardContainer.appendChild(octaveContainer);
        }
        
        console.log('All octaves generated, appending to piano keyboard...');
        console.log('Keyboard container has', keyboardContainer.children.length, 'octave containers');
        console.log('About to append to:', this.pianoKeyboard);
        
        this.pianoKeyboard.appendChild(keyboardContainer);
        
        console.log('Keyboard container appended to piano keyboard');
        console.log('Piano keyboard now has', this.pianoKeyboard.children.length, 'children');
        console.log('Total keys in all octaves:', keyboardContainer.querySelectorAll('.piano-key').length);
        
        this.updateScrollPosition();
        
        console.log('generateKeys() completed');
    }
    
    createKey(note, octave, isBlack) {
        console.log(`createKey called: ${note}${octave}, isBlack: ${isBlack}`);
        
        const key = document.createElement('div');
        const noteId = `${note}${octave}`;
        
        key.className = isBlack ? 'piano-key black-key' : 'piano-key white-key';
        key.dataset.note = note;
        key.dataset.octave = octave;
        key.dataset.noteId = noteId;
        key.textContent = noteId;
        
        console.log(`Key created with className: ${key.className}, noteId: ${noteId}`);
        
        // Set black key positions using data attribute for CSS targeting
        if (isBlack) {
            key.setAttribute('data-note', note);
            console.log(`Black key ${noteId} data-note attribute set to: ${note}`);
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
        
        console.log(`Event listeners added to ${noteId}`);
        
        return key;
    }
    
    addEventListeners() {
        // Control events
        this.volumeControl.addEventListener('input', (e) => {
            this.volume = e.target.value / 100;
            this.volumeDisplay.textContent = `${e.target.value}%`;
        });
        
        this.sustainControl.addEventListener('input', (e) => {
            this.sustain = parseFloat(e.target.value);
            this.sustainDisplay.textContent = `${e.target.value}s`;
        });
        
        this.playChordButton.addEventListener('click', () => this.playChord());
        this.clearChordButton.addEventListener('click', () => this.clearHighlights());
        
        // Piano scroll navigation
        this.scrollLeftBtn.addEventListener('click', () => this.scrollLeft());
        this.scrollRightBtn.addEventListener('click', () => this.scrollRight());
        
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (document.querySelector('#piano-tab.active')) {
                // Handle piano key presses
                if (this.keyboardMap[e.code] && !e.repeat) {
                    e.preventDefault();
                    this.handleKeyDown(e);
                }
                // Handle arrow key navigation
                else if (e.code === 'ArrowLeft') {
                    e.preventDefault();
                    this.scrollLeft();
                }
                else if (e.code === 'ArrowRight') {
                    e.preventDefault();
                    this.scrollRight();
                }
            }
        });
        
        document.addEventListener('keyup', (e) => {
            if (document.querySelector('#piano-tab.active') && this.keyboardMap[e.code]) {
                e.preventDefault();
                this.handleKeyUp(e);
            }
        });
        
        // Mouse events for key release
        document.addEventListener('mouseup', () => {
            document.querySelectorAll('.piano-key.active').forEach(key => {
                key.classList.remove('active');
            });
        });
    }
    
    handleKeyDown(e) {
        const keyMapping = this.keyboardMap[e.code];
        if (!keyMapping) return;
        
        // Calculate octave based on current start octave and offset
        const octave = this.currentStartOctave + keyMapping.octaveOffset;
        
        // Make sure the octave is within the valid range
        if (octave >= this.minOctave && octave <= this.maxOctave) {
            this.playNote(keyMapping.note, octave);
            this.highlightKey(keyMapping.note, octave);
        }
    }
    
    handleKeyUp(e) {
        const keyMapping = this.keyboardMap[e.code];
        if (!keyMapping) return;
        
        // Calculate octave based on current start octave and offset
        const octave = this.currentStartOctave + keyMapping.octaveOffset;
        
        // Make sure the octave is within the valid range
        if (octave >= this.minOctave && octave <= this.maxOctave) {
            this.stopNote(keyMapping.note, octave);
            this.unhighlightKey(keyMapping.note, octave);
        }
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
        const baseOctave = this.currentStartOctave + 1; // Use middle octave
        
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
    
    scrollLeft() {
        if (this.currentStartOctave > this.minOctave) {
            this.currentStartOctave--;
            this.updateScrollPosition();
            this.updateRangeDisplay();
            this.updateScrollButtons();
            console.log('Scrolled left to octave:', this.currentStartOctave);
        }
    }
    
    scrollRight() {
        const maxStartOctave = this.maxOctave - this.visibleOctaves + 1;
        if (this.currentStartOctave < maxStartOctave) {
            this.currentStartOctave++;
            this.updateScrollPosition();
            this.updateRangeDisplay();
            this.updateScrollButtons();
            console.log('Scrolled right to octave:', this.currentStartOctave);
        }
    }
    
    updateScrollPosition() {
        const keyboardContainer = document.getElementById('keyboard-container');
        if (keyboardContainer) {
            // Calculate the scroll percentage based on current octave
            // Total effective octaves = 2/7 + 7 + 1/7 = 7.43 octave equivalents
            const totalEffectiveOctaves = 2/7 + 7 + 1/7;
            const scrollPercent = ((this.currentStartOctave - this.minOctave) / (totalEffectiveOctaves - this.visibleOctaves)) * 100;
            keyboardContainer.style.transform = `translateX(-${scrollPercent}%)`;
            console.log(`Scroll position updated: ${scrollPercent}% for octave ${this.currentStartOctave}`);
        }
    }
    
    updateRangeDisplay() {
        if (this.currentRangeDisplay) {
            const endOctave = this.currentStartOctave + this.visibleOctaves - 1;
            
            // Handle special cases for the display
            let startNote, endNote;
            
            if (this.currentStartOctave === 0) {
                startNote = `A${this.currentStartOctave}`; // A0
            } else {
                startNote = `C${this.currentStartOctave}`;
            }
            
            if (endOctave >= 8) {
                endNote = 'C8'; // Piano ends at C8
            } else {
                endNote = `B${endOctave}`;
            }
            
            this.currentRangeDisplay.textContent = `${startNote} - ${endNote}`;
        }
    }
    
    updateScrollButtons() {
        if (this.scrollLeftBtn) {
            this.scrollLeftBtn.disabled = this.currentStartOctave <= this.minOctave;
        }
        if (this.scrollRightBtn) {
            const maxStartOctave = this.maxOctave - this.visibleOctaves + 1;
            this.scrollRightBtn.disabled = this.currentStartOctave >= maxStartOctave;
        }
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