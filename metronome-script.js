class Metronome {
    constructor() {
        console.log('Metronome constructor called');
        
        // Timer and playback state
        this.isPlaying = false;
        this.intervalId = null;
        this.nextNoteTime = 0.0;
        this.lookahead = 25.0; // How frequently to call scheduling function (in milliseconds)
        this.scheduleAheadTime = 0.1; // How far ahead to schedule notes (in seconds)
        
        // Get references to audio and sound managers
        this.audioManager = window.AudioManager;
        this.sounds = window.MetronomeSounds;
        
        // Metronome settings
        this.tempo = 120; // BPM
        this.timeSignature = { beats: 4, noteValue: 4 }; // Default 4/4
        this.subdivision = 1; // How many sounds per beat
        this.currentBeat = 1;
        this.currentSubdivision = 1;
        
        // Pendulum state for continuous swing
        this.pendulumDirection = 1; // 1 for right, -1 for left
        
        // Timing state
        this.quarterNoteTime = 60.0 / this.tempo;
        this.scheduleQueue = []; // Notes that have been scheduled but not yet played
        
        // Tap tempo
        this.tapTimes = [];
        this.maxTapInterval = 2000; // Maximum time between taps (ms)
        
        // Tempo markings
        this.tempoMarkings = {
            30: 'Larghissimo',
            40: 'Grave',
            60: 'Largo',
            66: 'Larghetto',
            76: 'Adagio',
            108: 'Andante',
            120: 'Moderato',
            144: 'Allegro',
            168: 'Vivace',
            200: 'Presto',
            300: 'Prestissimo'
        };

        this.init();
    }

    init() {
        console.log('Initializing metronome...');
        
        // Get DOM elements
        this.bpmNumber = document.getElementById('bpm-number');
        this.tempoMarking = document.getElementById('tempo-marking');
        this.tempoInput = document.getElementById('tempo-input');
        this.tempoSlider = document.getElementById('tempo-slider');
        this.startStopButton = document.getElementById('start-stop');
        this.tapTempoButton = document.getElementById('tap-tempo');
        this.timeSignatureSelect = document.getElementById('time-signature');
        this.subdivisionSelect = document.getElementById('subdivision');
        this.currentBeatSpan = document.getElementById('current-beat');
        this.totalBeatsSpan = document.getElementById('total-beats');
        this.subdivisionIndicator = document.getElementById('subdivision-indicator');
        this.pendulum = document.getElementById('pendulum');
        
        console.log('Pendulum element found during init:', !!this.pendulum, this.pendulum);
        
        if (!this.bpmNumber || !this.startStopButton) {
            console.error('Required metronome elements not found');
            return;
        }

        // Check if audio manager is available
        if (!this.audioManager) {
            console.warn('AudioManager not available, using fallback audio');
        }

        // Check if sounds manager is available
        if (!this.sounds) {
            console.warn('MetronomeSounds not available, using basic sounds');
        }

        this.addEventListeners();
        this.updateDisplay();
        this.updateTempoMarking();
        this.updateSubdivisionIndicator();
        
        console.log('Metronome initialized successfully');
    }

    addEventListeners() {
        // Tempo input
        this.tempoInput.addEventListener('input', (e) => {
            this.setTempo(parseInt(e.target.value));
        });

        // Tempo slider
        this.tempoSlider.addEventListener('input', (e) => {
            this.setTempo(parseInt(e.target.value));
        });

        // Start/Stop button
        this.startStopButton.addEventListener('click', () => {
            console.log('METRONOME START/STOP BUTTON CLICKED');
            this.togglePlayback();
        });

        // Tap tempo button
        this.tapTempoButton.addEventListener('click', () => {
            this.processTapTempo();
        });

        // Time signature selector
        this.timeSignatureSelect.addEventListener('change', (e) => {
            this.setTimeSignature(e.target.value);
        });

        // Subdivision selector
        this.subdivisionSelect.addEventListener('change', (e) => {
            this.setSubdivision(parseInt(e.target.value));
        });

        // Initialize audio context on first user interaction
        document.addEventListener('click', async () => {
            if (this.audioManager) {
                await this.audioManager.initialize();
            }
        }, { once: true });
    }

    setTempo(bpm) {
        bpm = Math.max(30, Math.min(300, bpm));
        this.tempo = bpm;
        this.quarterNoteTime = 60.0 / this.tempo;
        
        this.tempoInput.value = bpm;
        this.tempoSlider.value = bpm;
        this.bpmNumber.textContent = bpm;
        
        this.updateTempoMarking();
    }

    updateTempoMarking() {
        let marking = 'Moderato';
        const sortedMarkings = Object.keys(this.tempoMarkings)
            .map(Number)
            .sort((a, b) => a - b);
        
        for (let i = 0; i < sortedMarkings.length; i++) {
            if (this.tempo >= sortedMarkings[i]) {
                marking = this.tempoMarkings[sortedMarkings[i]];
            }
        }
        
        this.tempoMarking.textContent = marking;
    }

    setTimeSignature(signature) {
        const [beats, noteValue] = signature.split('/').map(Number);
        this.timeSignature = { beats, noteValue };
        this.currentBeat = 1;
        this.totalBeatsSpan.textContent = beats;
        this.updateDisplay();
        this.updateSubdivisionIndicator();
    }

    setSubdivision(subdivision) {
        this.subdivision = subdivision;
        this.currentSubdivision = 1;
        this.updateSubdivisionIndicator();
    }

    updateSubdivisionIndicator() {
        this.subdivisionIndicator.innerHTML = '';
        const totalDots = this.subdivision;
        
        for (let i = 0; i < totalDots; i++) {
            const dot = document.createElement('div');
            dot.className = 'subdivision-dot';
            this.subdivisionIndicator.appendChild(dot);
        }
    }

    async togglePlayback() {
        console.log('togglePlayback called, current state:', this.isPlaying);
        if (this.isPlaying) {
            console.log('Calling stop()...');
            await this.stop();
        } else {
            console.log('Calling start()...');
            await this.start();
        }
    }

    async start() {
        console.log('Starting metronome...');
        
        // Initialize and resume audio if available (this is a user gesture)
        if (this.audioManager) {
            const audioReady = await this.audioManager.initialize();
            if (audioReady) {
                // Try to resume the audio context since this is a user gesture
                const resumed = await this.audioManager.resumeContext();
                console.log('Audio context resumed:', resumed);
                if (!resumed) {
                    console.warn('Audio context could not be resumed');
                }
            } else {
                console.warn('Audio context not available');
            }
        }

        this.isPlaying = true;
        this.currentBeat = 1;
        this.currentSubdivision = 1;
        
        // Reset pendulum to center and direction for consistent start
        this.pendulumDirection = 1; // Start swinging right
        if (this.pendulum) {
            this.pendulum.style.transition = 'none';
            this.pendulum.style.transform = 'translateX(-50%) rotate(0deg)';
        }
        
        if (this.audioManager) {
            this.nextNoteTime = this.audioManager.getCurrentTime();
        } else {
            this.nextNoteTime = performance.now() / 1000;
        }
        
        this.scheduleQueue = [];
        this.startStopButton.textContent = 'Stop';
        this.startStopButton.classList.add('playing');
        
        // Start the scheduling loop
        this.intervalId = setInterval(() => this.scheduler(), this.lookahead);
        
        console.log('Metronome started');
    }

    async stop() {
        console.log('Stopping metronome...');
        
        this.isPlaying = false;
        
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        
        this.scheduleQueue = [];
        this.startStopButton.textContent = 'Start';
        this.startStopButton.classList.remove('playing');
        
        // Reset pendulum
        if (this.pendulum) {
            this.pendulum.style.transform = 'translateX(-50%) rotate(0deg)';
        }
        
        console.log('Metronome stopped');
    }

    scheduler() {
        let currentTime;
        
        if (this.audioManager) {
            currentTime = this.audioManager.getCurrentTime();
        } else {
            currentTime = performance.now() / 1000;
        }
        
        while (this.nextNoteTime < currentTime + this.scheduleAheadTime) {
            this.scheduleNote(this.nextNoteTime);
            this.nextNote();
        }
    }

    async scheduleNote(time) {
        const isAccent = this.currentSubdivision === 1 && this.currentBeat === 1;
        const noteTime = time * 1000; // Convert to milliseconds for setTimeout
        
        // Calculate timing for pendulum animation
        const beatDuration = (60 / this.tempo) * 1000; // Full beat duration in ms
        const pendulumStartTime = noteTime - (beatDuration / 2); // Start swing half-beat early
        const centerCrossingTime = noteTime; // When pendulum crosses center = when main beat should play
        
        // Add to schedule queue for visual updates
        this.scheduleQueue.push({
            time: noteTime,
            beat: this.currentBeat,
            subdivision: this.currentSubdivision,
            isAccent: isAccent
        });
        
        // Schedule pendulum animation only on main beats (subdivision 1) - this keeps the smooth swing
        if (this.currentSubdivision === 1) {
            setTimeout(() => {
                this.animatePendulumVisualOnly(this.currentBeat, this.currentSubdivision, isAccent);
                
                // Schedule main beat sound to play when pendulum crosses center (50% through swing)
                setTimeout(() => {
                    console.log(`Main beat sound: Beat ${this.currentBeat}, Accent: ${isAccent} - Pendulum crossing center`);
                    if (this.sounds) {
                        const soundType = this.sounds.getCurrentSoundType();
                        const volume = isAccent ? 0.8 : 0.7;
                        this.sounds.createSound(soundType, isAccent, volume);
                    } else {
                        this.createBasicSound(isAccent);
                    }
                }, beatDuration / 2); // Play at center crossing
                
            }, Math.max(0, pendulumStartTime - performance.now()));
        } else {
            // For subdivisions, play sound at the scheduled time (no pendulum animation)
            setTimeout(() => {
                console.log(`Subdivision sound: Beat ${this.currentBeat}, Sub ${this.currentSubdivision}`);
                if (this.sounds) {
                    const soundType = this.sounds.getCurrentSoundType();
                    this.sounds.createSound(soundType, false, 0.5);
                } else {
                    this.createBasicSound(false);
                }
            }, Math.max(0, noteTime - performance.now()));
        }
        
        // Schedule visual updates (beat counter, subdivision dots) at beat time
        setTimeout(() => {
            this.updateBeatVisuals(this.currentBeat, this.currentSubdivision, isAccent);
        }, Math.max(0, noteTime - performance.now()));
    }

    async createBasicSound(isAccent) {
        if (!this.audioManager) {
            console.log('Basic beep (no audio available)');
            return;
        }

        try {
            const oscillator = this.audioManager.createOscillator();
            const gainNode = this.audioManager.createGain();
            
            if (!oscillator || !gainNode) {
                console.warn('Could not create audio nodes');
                return;
            }

            oscillator.connect(gainNode);
            gainNode.connect(this.audioManager.getMasterGain());

            oscillator.frequency.value = isAccent ? 1400 : 1000;
            oscillator.type = 'square';
            
            const currentTime = this.audioManager.getCurrentTime();
            gainNode.gain.value = 0.3;
            gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.1);
            
            oscillator.start(currentTime);
            oscillator.stop(currentTime + 0.1);
        } catch (error) {
            console.error('Error creating basic sound:', error);
        }
    }

    nextNote() {
        const subdividedNoteTime = this.quarterNoteTime / this.subdivision;
        this.nextNoteTime += subdividedNoteTime;
        
        this.currentSubdivision++;
        if (this.currentSubdivision > this.subdivision) {
            this.currentSubdivision = 1;
            this.currentBeat++;
            if (this.currentBeat > this.timeSignature.beats) {
                this.currentBeat = 1;
            }
        }
    }

    updateBeatVisuals(beat, subdivision, isAccent) {
        // Update beat counter
        this.currentBeatSpan.textContent = beat;
        
        // Update subdivision indicator
        const dots = this.subdivisionIndicator.querySelectorAll('.subdivision-dot');
        dots.forEach((dot, index) => {
            dot.classList.remove('active', 'accent');
            if (index + 1 === subdivision) {
                dot.classList.add('active');
                if (isAccent) {
                    dot.classList.add('accent');
                }
            }
        });
    }

    animatePendulumVisualOnly(beat, subdivision, isAccent) {
        console.log('animatePendulumVisualOnly called:', { beat, subdivision, isAccent, pendulum: !!this.pendulum });
        
        if (!this.pendulum) {
            console.error('Pendulum element not found!');
            return;
        }
        
        // Only animate on main beats (subdivision 1) for smoother continuous motion
        if (subdivision !== 1) {
            return;
        }
        
        // Calculate swing timing based on tempo for continuous motion
        const beatDuration = (60 / this.tempo) * 1000; // Convert to milliseconds
        const swingDuration = beatDuration; // Use full beat duration for continuous motion
        
        // Alternate direction for continuous swing
        this.pendulumDirection *= -1;
        
        // More dramatic angle but still realistic
        const maxAngle = 35; // Increased for more drama
        const angle = isAccent ? maxAngle : maxAngle * 0.9; // Slight emphasis on accent
        
        // Restore smooth animation with ease-in-out
        this.pendulum.style.transition = `transform ${swingDuration}ms ease-in-out, background 0.5s ease, box-shadow 0.5s ease`;
        
        console.log('Setting pendulum transform:', `translateX(-50%) rotate(${angle * this.pendulumDirection}deg)`);
        this.pendulum.style.transform = `translateX(-50%) rotate(${angle * this.pendulumDirection}deg)`;
    }

    processTapTempo() {
        const now = performance.now();
        
        // Clear old taps
        this.tapTimes = this.tapTimes.filter(time => now - time < this.maxTapInterval);
        
        // Add current tap
        this.tapTimes.push(now);
        
        // Need at least 2 taps to calculate tempo
        if (this.tapTimes.length >= 2) {
            const intervals = [];
            for (let i = 1; i < this.tapTimes.length; i++) {
                intervals.push(this.tapTimes[i] - this.tapTimes[i - 1]);
            }
            
            // Calculate average interval
            const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
            
            // Convert to BPM
            const bpm = Math.round(60000 / avgInterval);
            
            // Set tempo if reasonable
            if (bpm >= 30 && bpm <= 300) {
                this.setTempo(bpm);
            }
        }
        
        // Visual feedback
        this.tapTempoButton.style.transform = 'scale(0.95)';
        setTimeout(() => {
            this.tapTempoButton.style.transform = 'scale(1)';
        }, 100);
    }

    updateDisplay() {
        this.currentBeatSpan.textContent = this.currentBeat;
        this.totalBeatsSpan.textContent = this.timeSignature.beats;
    }

    // Cleanup method
    async destroy() {
        console.log('Destroying metronome...');
        await this.stop();
    }
}

// Make Metronome available globally
window.Metronome = Metronome;

// Remove auto-initialization - will be handled by AppController
console.log('Metronome script loaded');