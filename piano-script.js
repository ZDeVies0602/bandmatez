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
        
        // Note names and their relationships (define before using in generateAllKeyMapping)
        this.noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        this.whiteKeys = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
        this.blackKeys = ['C#', 'D#', 'F#', 'G#', 'A#'];
        
        // New scrollable piano settings for 44-key view with 22-key increments
        this.totalKeys = 88; // Total keys from A0 to C8
        this.visibleKeys = 44; // Show 44 keys at once
        this.scrollIncrement = 22; // Scroll by 22 keys at a time
        this.currentStartKeyIndex = 22; // Start at middle range (keys 22-65)
        this.minKeyIndex = 0; // Minimum key index (A0)
        this.maxKeyIndex = 87; // Maximum key index (C8)
        
        // Calculate the true middle starting position
        // For 88 keys (0-87), the center is around key 44
        // For middle 44 keys, we want keys centered around 44: (44-22) to (44+22-1) = keys 22-65
        this.currentStartKeyIndex = Math.floor((this.totalKeys - this.visibleKeys) / 2); // This gives us 22
        
        console.log('Piano constructor - Starting key index set to:', this.currentStartKeyIndex);
        console.log('This will show keys', this.currentStartKeyIndex, 'to', this.currentStartKeyIndex + this.visibleKeys - 1);
        
        // Generate the complete key mapping for all 88 keys (now after blackKeys is defined)
        this.allKeys = this.generateAllKeyMapping();
        
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
        
        // Keyboard mapping - map to current visible keys
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
            
            // If we're missing elements, try again in a moment when tab might be active
            console.log('Retrying piano initialization in 500ms...');
            setTimeout(() => {
                console.log('RETRY: Attempting piano initialization again...');
                this.init();
            }, 500);
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
        try {
            this.generateKeys();
            console.log('Keys generation completed successfully');
        } catch (error) {
            console.error('Error during key generation:', error);
            return;
        }
        
        this.updateRangeDisplay();
        this.updateScrollButtons();
        
        // Add event listeners
        try {
            this.addEventListeners();
            console.log('Event listeners added successfully');
        } catch (error) {
            console.error('Error adding event listeners:', error);
        }
        
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
        console.log('Generated keys for octave range:', this.currentStartKeyIndex, 'to', this.currentStartKeyIndex + this.visibleKeys - 1);
        
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
                try {
                    this.generateKeys();
                    console.log('Key regeneration completed');
                } catch (error) {
                    console.error('Key regeneration failed:', error);
                }
            }
        }, 100);
    }
    
    generateKeys() {
        console.log('generateKeys() called');
        console.log('Current piano keyboard element:', this.pianoKeyboard);
        console.log('Piano keyboard innerHTML before clear:', this.pianoKeyboard.innerHTML.length, 'characters');
        
        this.pianoKeyboard.innerHTML = '';
        console.log('Piano keyboard cleared');
        
        // Get the parent container width to calculate proper sizing
        const parentContainer = this.pianoKeyboard.parentElement;
        const containerWidth = parentContainer.offsetWidth;
        console.log('Parent container width:', containerWidth, 'px');
        
        // Create a container for all keys
        const keyboardContainer = document.createElement('div');
        keyboardContainer.style.display = 'flex';
        keyboardContainer.style.height = '100%';
        keyboardContainer.style.position = 'relative';
        
        // CRITICAL FIX: Calculate the exact width needed for 88 keys
        // If 44 keys fit in the container width, then 88 keys need exactly 2x that width
        const totalWidth = Math.round(containerWidth * (this.totalKeys / this.visibleKeys));
        keyboardContainer.style.width = `${totalWidth}px`;
        keyboardContainer.style.flexShrink = '0'; // Prevent shrinking
        keyboardContainer.style.minWidth = `${totalWidth}px`; // Ensure minimum width
        keyboardContainer.id = 'keyboard-container';
        
        console.log('Created keyboard container with width:', totalWidth, 'px');
        console.log('This should be', (this.totalKeys / this.visibleKeys), 'times the container width of', containerWidth, 'px');
        
        // Create separate containers for white and black keys for better positioning
        const whiteKeysContainer = document.createElement('div');
        whiteKeysContainer.style.display = 'flex';
        whiteKeysContainer.style.height = '100%';
        whiteKeysContainer.style.width = '100%';
        whiteKeysContainer.style.position = 'relative';
        whiteKeysContainer.style.flexShrink = '0';
        
        const blackKeysContainer = document.createElement('div');
        blackKeysContainer.style.position = 'absolute';
        blackKeysContainer.style.top = '0';
        blackKeysContainer.style.left = '0';
        blackKeysContainer.style.width = '100%';
        blackKeysContainer.style.height = '100%';
        blackKeysContainer.style.pointerEvents = 'none'; // Allow clicks to pass through to white keys
        
        // Count white keys for proper spacing
        const whiteKeyIndices = [];
        for (let i = this.minKeyIndex; i <= this.maxKeyIndex; i++) {
            if (!this.allKeys[i].isBlack) {
                whiteKeyIndices.push(i);
            }
        }
        
        const totalWhiteKeys = whiteKeyIndices.length; // Should be 52 white keys total
        console.log('Total white keys:', totalWhiteKeys);
        
        // Generate all keys
        for (let keyIndex = this.minKeyIndex; keyIndex <= this.maxKeyIndex; keyIndex++) {
            const keyData = this.allKeys[keyIndex];
            console.log(`Generating key ${keyIndex}: ${keyData.note}${keyData.octave}...`);
            
            const key = this.createKey(keyData.note, keyData.octave, keyData.isBlack, keyIndex, totalWhiteKeys, whiteKeyIndices);
            
            if (keyData.isBlack) {
                blackKeysContainer.appendChild(key);
            } else {
                whiteKeysContainer.appendChild(key);
            }
            
            console.log(`Created key: ${keyData.note}${keyData.octave}`);
        }
        
        // Add containers to main keyboard container
        keyboardContainer.appendChild(whiteKeysContainer);
        keyboardContainer.appendChild(blackKeysContainer);
        
        console.log('All keys generated, appending to piano keyboard...');
        console.log('White keys container has', whiteKeysContainer.children.length, 'keys');
        console.log('Black keys container has', blackKeysContainer.children.length, 'keys');
        
        this.pianoKeyboard.appendChild(keyboardContainer);
        
        console.log('Keyboard container appended to piano keyboard');
        console.log('Piano keyboard now has', this.pianoKeyboard.children.length, 'children');
        
        // Force layout calculation and verify dimensions
        setTimeout(() => {
            const actualWidth = keyboardContainer.offsetWidth;
            const parentActualWidth = parentContainer.offsetWidth;
            console.log('POST-RENDER: Keyboard container actual width:', actualWidth, 'px');
            console.log('POST-RENDER: Parent container actual width:', parentActualWidth, 'px');
            console.log('POST-RENDER: Width ratio:', (actualWidth / parentActualWidth).toFixed(2));
            console.log('POST-RENDER: Scrollable area?', actualWidth > parentActualWidth);
            
            // Force middle position and scroll
            this.currentStartKeyIndex = Math.floor((this.totalKeys - this.visibleKeys) / 2);
            console.log('Setting currentStartKeyIndex to middle position:', this.currentStartKeyIndex);
            
            this.updateScrollPosition();
            this.updateRangeDisplay();
            this.updateScrollButtons();
            
            console.log('generateKeys() completed - should now be showing keys', this.currentStartKeyIndex, 'to', this.currentStartKeyIndex + this.visibleKeys - 1);
        }, 50);
    }
    
    createKey(note, octave, isBlack, keyIndex, totalWhiteKeys, whiteKeyIndices) {
        console.log(`createKey called: ${note}${octave}, isBlack: ${isBlack}, keyIndex: ${keyIndex}`);
        
        const key = document.createElement('div');
        const noteId = `${note}${octave}`;
        
        key.className = isBlack ? 'piano-key black-key' : 'piano-key white-key';
        key.dataset.note = note;
        key.dataset.octave = octave;
        key.dataset.noteId = noteId;
        key.dataset.keyIndex = keyIndex;
        key.textContent = noteId;
        
        if (isBlack) {
            // Black keys: position absolutely relative to white keys
            key.style.position = 'absolute';
            key.style.pointerEvents = 'auto'; // Re-enable pointer events for black keys
            key.style.zIndex = '10';
            key.style.height = '60%';
            key.style.width = '20px'; // Fixed width for black keys
            
            // Calculate position based on the white key it sits between
            const whiteKeyIndex = whiteKeyIndices.indexOf(keyIndex - 1) >= 0 ? whiteKeyIndices.indexOf(keyIndex - 1) : 
                                  whiteKeyIndices.indexOf(keyIndex + 1) - 1;
            
            if (whiteKeyIndex >= 0) {
                const whiteKeyWidth = 100 / totalWhiteKeys; // Percentage width of each white key
                const leftPosition = (whiteKeyIndex * whiteKeyWidth) + (whiteKeyWidth * 0.7); // Position between white keys
                key.style.left = `${leftPosition}%`;
            }
            
        } else {
            // White keys: evenly distributed using flexbox
            key.style.flex = '1'; // Equal width distribution
            key.style.position = 'relative';
            key.style.height = '100%';
            key.style.border = '1px solid #ccc';
            key.style.boxSizing = 'border-box';
        }
        
        console.log(`Key created with className: ${key.className}, noteId: ${noteId}`);
        
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
        
        // Find the first occurrence of the note in the current visible range
        const startIndex = this.currentStartKeyIndex;
        const endIndex = Math.min(this.currentStartKeyIndex + this.visibleKeys - 1, this.maxKeyIndex);
        
        for (let i = startIndex; i <= endIndex; i++) {
            const keyData = this.allKeys[i];
            if (keyData.note === keyMapping.note) {
                this.playNote(keyData.note, keyData.octave);
                this.highlightKey(keyData.note, keyData.octave);
                break;
            }
        }
    }
    
    handleKeyUp(e) {
        const keyMapping = this.keyboardMap[e.code];
        if (!keyMapping) return;
        
        // Find the first occurrence of the note in the current visible range
        const startIndex = this.currentStartKeyIndex;
        const endIndex = Math.min(this.currentStartKeyIndex + this.visibleKeys - 1, this.maxKeyIndex);
        
        for (let i = startIndex; i <= endIndex; i++) {
            const keyData = this.allKeys[i];
            if (keyData.note === keyMapping.note) {
                this.stopNote(keyData.note, keyData.octave);
                this.unhighlightKey(keyData.note, keyData.octave);
                break;
            }
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
        const baseOctave = 4; // Use C4 as base octave for chords
        
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
        if (this.currentStartKeyIndex > this.minKeyIndex) {
            const newStartIndex = Math.max(this.currentStartKeyIndex - this.scrollIncrement, this.minKeyIndex);
            this.currentStartKeyIndex = newStartIndex;
            this.updateScrollPosition();
            this.updateRangeDisplay();
            this.updateScrollButtons();
            console.log('Scrolled left to key:', this.currentStartKeyIndex, 'showing keys', this.currentStartKeyIndex, 'to', this.currentStartKeyIndex + this.visibleKeys - 1);
        }
    }
    
    scrollRight() {
        const maxStartKeyIndex = this.maxKeyIndex - this.visibleKeys + 1;
        if (this.currentStartKeyIndex < maxStartKeyIndex) {
            const newStartIndex = Math.min(this.currentStartKeyIndex + this.scrollIncrement, maxStartKeyIndex);
            this.currentStartKeyIndex = newStartIndex;
            this.updateScrollPosition();
            this.updateRangeDisplay();
            this.updateScrollButtons();
            console.log('Scrolled right to key:', this.currentStartKeyIndex, 'showing keys', this.currentStartKeyIndex, 'to', this.currentStartKeyIndex + this.visibleKeys - 1);
        }
    }
    
    updateScrollPosition() {
        const keyboardContainer = document.getElementById('keyboard-container');
        const pianoKeyboardContainer = document.querySelector('.piano-keyboard-container');
        console.log('updateScrollPosition called');
        console.log('- keyboardContainer found:', !!keyboardContainer);
        console.log('- pianoKeyboardContainer found:', !!pianoKeyboardContainer);
        console.log('- currentStartKeyIndex:', this.currentStartKeyIndex);
        
        if (keyboardContainer && pianoKeyboardContainer) {
            // Calculate the scroll position based on current key index
            // We want to position the viewport so that currentStartKeyIndex is at the left edge
            const keyboardTotalWidth = keyboardContainer.offsetWidth;
            const containerWidth = pianoKeyboardContainer.offsetWidth;
            const maxScrollLeft = keyboardTotalWidth - containerWidth;
            
            // Calculate scroll position: (currentStartKeyIndex / totalKeys) * totalWidth
            const scrollPosition = Math.round((this.currentStartKeyIndex / this.totalKeys) * keyboardTotalWidth);
            const clampedScrollPosition = Math.min(scrollPosition, maxScrollLeft);
            
            console.log('- totalScrollRange:', this.totalKeys - this.visibleKeys);
            console.log('- containerWidth:', containerWidth);
            console.log('- keyboardTotalWidth:', keyboardTotalWidth);
            console.log('- maxScrollLeft:', maxScrollLeft);
            console.log('- scrollPosition calculated:', scrollPosition);
            console.log('- clampedScrollPosition:', clampedScrollPosition);
            
            // Show what keys should be visible
            const endKeyIndex = Math.min(this.currentStartKeyIndex + this.visibleKeys - 1, this.maxKeyIndex);
            const startKey = this.allKeys[this.currentStartKeyIndex];
            const endKey = this.allKeys[endKeyIndex];
            console.log(`- Keys that SHOULD be visible: ${startKey.note}${startKey.octave} to ${endKey.note}${endKey.octave} (indices ${this.currentStartKeyIndex}-${endKeyIndex})`);
            
            // Apply scroll position to the container with overflow:auto
            pianoKeyboardContainer.scrollLeft = clampedScrollPosition;
            
            console.log('- scrollLeft applied to pianoKeyboardContainer:', clampedScrollPosition);
            console.log('- actual scrollLeft:', pianoKeyboardContainer.scrollLeft);
            console.log('- container scrollWidth:', pianoKeyboardContainer.scrollWidth);
            console.log('- container clientWidth:', pianoKeyboardContainer.clientWidth);
            
            // Double-check by applying again with a small delay
            setTimeout(() => {
                console.log('Re-applying scrollLeft after 100ms delay');
                pianoKeyboardContainer.scrollLeft = clampedScrollPosition;
                console.log('- delayed scrollLeft applied:', pianoKeyboardContainer.scrollLeft);
                
                // Check actual DOM state
                const firstVisibleKey = document.querySelector('.piano-key');
                if (firstVisibleKey) {
                    console.log('- First key in DOM:', firstVisibleKey.textContent, firstVisibleKey.dataset.keyIndex);
                }
            }, 100);
        } else {
            console.error('Required containers not found for scroll position update!');
            console.error('- keyboardContainer:', !!keyboardContainer);
            console.error('- pianoKeyboardContainer:', !!pianoKeyboardContainer);
        }
    }
    
    updateRangeDisplay() {
        if (this.currentRangeDisplay) {
            const endKeyIndex = Math.min(this.currentStartKeyIndex + this.visibleKeys - 1, this.maxKeyIndex);
            
            const startKeyData = this.allKeys[this.currentStartKeyIndex];
            const endKeyData = this.allKeys[endKeyIndex];
            
            const startNote = `${startKeyData.note}${startKeyData.octave}`;
            const endNote = `${endKeyData.note}${endKeyData.octave}`;
            
            this.currentRangeDisplay.textContent = `${startNote} - ${endNote}`;
        }
    }
    
    updateScrollButtons() {
        if (this.scrollLeftBtn) {
            this.scrollLeftBtn.disabled = this.currentStartKeyIndex <= this.minKeyIndex;
        }
        if (this.scrollRightBtn) {
            const maxStartKeyIndex = this.maxKeyIndex - this.visibleKeys + 1;
            this.scrollRightBtn.disabled = this.currentStartKeyIndex >= maxStartKeyIndex;
        }
    }
    
    // Generate mapping for all 88 piano keys from A0 to C8
    generateAllKeyMapping() {
        const keys = [];
        
        // Start with A0, A#0, B0 (first 3 keys)
        keys.push({ note: 'A', octave: 0, isBlack: false });
        keys.push({ note: 'A#', octave: 0, isBlack: true });
        keys.push({ note: 'B', octave: 0, isBlack: false });
        
        // Add full octaves from 1 to 7
        for (let octave = 1; octave <= 7; octave++) {
            const octaveNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
            octaveNotes.forEach(note => {
                keys.push({ 
                    note: note, 
                    octave: octave, 
                    isBlack: this.blackKeys.includes(note) 
                });
            });
        }
        
        // End with C8 (last key)
        keys.push({ note: 'C', octave: 8, isBlack: false });
        
        return keys;
    }
}

// Make VirtualPiano available globally
window.VirtualPiano = VirtualPiano;
console.log('Virtual piano script loaded');