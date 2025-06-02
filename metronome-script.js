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
        
        // Accent pattern settings
        this.accentPattern = [1]; // Default: accent only on beat 1
        this.customAccentPattern = [1]; // For custom patterns
        
        // Pendulum state for continuous swing
        this.pendulumDirection = 1; // 1 for right, -1 for left
        
        // JavaScript-controlled animation state
        this.pendulumAnimation = {
            isAnimating: false,
            startTime: 0,
            duration: 0,
            startAngle: 0,
            endAngle: 0,
            animationId: null,
            centerCrossingCallback: null,
            centerCrossingTime: 0,
            centerCrossingFired: false,
            previousAngle: 0
        };
        
        // Timing state
        this.quarterNoteTime = 60.0 / this.tempo;
        this.scheduleQueue = [];
        
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
        
        // Accent pattern elements
        this.accentPatternSelect = document.getElementById('accent-pattern');
        this.customAccentsDiv = document.getElementById('custom-accents');
        this.accentCheckboxesDiv = document.getElementById('accent-checkboxes');
        
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

        // Accent pattern selector
        this.accentPatternSelect.addEventListener('change', (e) => {
            this.setAccentPattern(e.target.value);
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
        
        // Update custom accent checkboxes if custom pattern is selected
        if (this.accentPatternSelect.value === 'custom') {
            this.updateCustomAccentCheckboxes();
        }
        
        // Reset accent pattern to default if current pattern is invalid for new time signature
        const maxBeat = Math.max(...this.accentPattern);
        if (maxBeat > beats) {
            this.accentPattern = [1]; // Reset to beat 1 only
            this.accentPatternSelect.value = '1';
            this.customAccentsDiv.style.display = 'none';
        }
    }

    setSubdivision(subdivision) {
        this.subdivision = subdivision;
        this.currentSubdivision = 1;
        this.updateSubdivisionIndicator();
    }

    setAccentPattern(pattern) {
        console.log('Setting accent pattern:', pattern);
        
        if (pattern === 'custom') {
            // Show custom accent checkboxes
            this.customAccentsDiv.style.display = 'block';
            this.updateCustomAccentCheckboxes();
            this.accentPattern = [...this.customAccentPattern];
        } else {
            // Hide custom accent checkboxes
            this.customAccentsDiv.style.display = 'none';
            
            // Parse the pattern string (e.g., "1,3" -> [1, 3])
            this.accentPattern = pattern.split(',').map(num => parseInt(num.trim()));
        }
        
        console.log('Accent pattern set to:', this.accentPattern);
    }

    updateCustomAccentCheckboxes() {
        this.accentCheckboxesDiv.innerHTML = '';
        
        for (let beat = 1; beat <= this.timeSignature.beats; beat++) {
            const checkboxDiv = document.createElement('div');
            checkboxDiv.className = 'accent-checkbox';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `accent-beat-${beat}`;
            checkbox.checked = this.customAccentPattern.includes(beat);
            
            const label = document.createElement('label');
            label.htmlFor = `accent-beat-${beat}`;
            label.textContent = `Beat ${beat}`;
            
            checkbox.addEventListener('change', () => {
                this.updateCustomAccentPattern();
            });
            
            checkboxDiv.appendChild(checkbox);
            checkboxDiv.appendChild(label);
            this.accentCheckboxesDiv.appendChild(checkboxDiv);
        }
    }

    updateCustomAccentPattern() {
        this.customAccentPattern = [];
        
        for (let beat = 1; beat <= this.timeSignature.beats; beat++) {
            const checkbox = document.getElementById(`accent-beat-${beat}`);
            if (checkbox && checkbox.checked) {
                this.customAccentPattern.push(beat);
            }
        }
        
        // Ensure beat 1 is always included
        if (!this.customAccentPattern.includes(1)) {
            this.customAccentPattern.unshift(1);
            const beat1Checkbox = document.getElementById('accent-beat-1');
            if (beat1Checkbox) {
                beat1Checkbox.checked = true;
            }
        }
        
        this.accentPattern = [...this.customAccentPattern];
        console.log('Custom accent pattern updated:', this.accentPattern);
    }

    isAccentedBeat(beat) {
        return this.accentPattern.includes(beat);
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
        
        // Reset pendulum to center and prepare for JavaScript animation
        this.pendulumDirection = 1; // Start swinging right
        if (this.pendulum) {
            this.pendulum.style.transition = 'none'; // Remove any CSS transitions
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
        
        // Stop JavaScript-controlled pendulum animation
        this.stopPendulumAnimation();
        
        this.scheduleQueue = [];
        this.startStopButton.textContent = 'Start';
        this.startStopButton.classList.remove('playing');
        
        // Reset pendulum to center
        if (this.pendulum) {
            this.pendulum.style.transition = 'transform 0.3s ease-out';
            this.pendulum.style.transform = 'translateX(-50%) rotate(0deg)';
            // Remove transition after reset to avoid interfering with JS animation
            setTimeout(() => {
                if (this.pendulum) {
                    this.pendulum.style.transition = 'none';
                }
            }, 300);
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
            // Capture the current beat values BEFORE they get incremented
            const currentBeat = this.currentBeat;
            const currentSubdivision = this.currentSubdivision;
            this.scheduleNote(this.nextNoteTime, currentBeat, currentSubdivision);
            this.nextNote();
        }
    }

    async scheduleNote(time, currentBeat, currentSubdivision) {
        const isAccent = currentSubdivision === 1 && this.isAccentedBeat(currentBeat);
        
        // Calculate timing using consistent time reference
        const currentAudioTime = this.audioManager ? this.audioManager.getCurrentTime() : (performance.now() / 1000);
        const beatDuration = (60 / this.tempo); // Beat duration in seconds
        const timeUntilNote = time - currentAudioTime; // How long until this note plays (in seconds)
        const delayMs = Math.max(0, timeUntilNote * 1000); // Convert to milliseconds
        
        // Calculate the EXACT target time when sound should play (in performance.now() time)
        const targetSoundTime = performance.now() + delayMs;
        
        console.log(`Scheduling: Beat ${currentBeat}, Sub ${currentSubdivision}, AudioTime: ${time.toFixed(3)}s, Current: ${currentAudioTime.toFixed(3)}s, Delay: ${delayMs.toFixed(1)}ms, Target: ${targetSoundTime.toFixed(1)}ms`);
        
        // Add to schedule queue for visual updates
        this.scheduleQueue.push({
            time: time,
            beat: currentBeat,
            subdivision: currentSubdivision,
            isAccent: isAccent
        });
        
        // Schedule sound to play at exact target time
        setTimeout(() => {
            console.log(`🔊 Sound: Beat ${currentBeat}, Sub ${currentSubdivision}, Accent: ${isAccent} - PLAYING NOW at ${performance.now().toFixed(1)}ms`);
            if (this.sounds) {
                const soundType = this.sounds.getCurrentSoundType();
                const volume = isAccent ? 0.8 : (currentSubdivision === 1 ? 0.7 : 0.5);
                this.sounds.createSound(soundType, isAccent, volume);
            } else {
                this.createBasicSound(isAccent);
            }
        }, delayMs);
        
        // Handle pendulum animation for main beats only - sync perfectly with sound
        if (currentSubdivision === 1) {
            const beatDurationMs = beatDuration * 1000;
            
            // The pendulum should cross center when the sound plays
            // Since the pendulum starts at an extreme position, we need to calculate
            // when to start the swing so it crosses center at the target time
            
            // For the first beat, the pendulum is already at an extreme and needs to swing to center
            // For subsequent beats, it alternates between extremes
            
            // Calculate when to start pendulum so it crosses center at target time
            // The pendulum crosses center at halfway through its animation duration
            const pendulumStartTime = targetSoundTime - (beatDurationMs / 2);
            const pendulumStartDelay = Math.max(0, pendulumStartTime - performance.now());
            
            // Alternate direction for continuous swing
            this.pendulumDirection *= -1;
            const maxAngle = 35;
            const targetAngle = (isAccent ? maxAngle : maxAngle * 0.9) * this.pendulumDirection;
            
            console.log(`Pendulum: Beat duration: ${beatDurationMs}ms, Start delay: ${pendulumStartDelay.toFixed(1)}ms, will cross center at: ${targetSoundTime.toFixed(1)}ms`);
            console.log(`Pendulum: Current angle: ${this.getCurrentPendulumAngle()}°, Target angle: ${targetAngle}°`);
            
            // Schedule the pendulum animation to start at the calculated time
            setTimeout(() => {
                // Pass the exact target time for center crossing synchronization
                this.startPendulumAnimation(beatDurationMs, targetAngle, isAccent, targetSoundTime);
            }, pendulumStartDelay);
        }
        
        // Schedule visual updates at the exact scheduled time
        setTimeout(() => {
            this.updateBeatVisuals(currentBeat, currentSubdivision, isAccent);
        }, delayMs);
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

    // Custom easing function that looks smooth but gives us predictable center crossing
    customEaseInOut(t) {
        // Simple ease-in-out that ensures center crossing at exactly t=0.5
        // This creates a smooth S-curve that passes through the midpoint at t=0.5
        return t * t * (3 - 2 * t); // Smoothstep function
    }

    // JavaScript-controlled pendulum animation using requestAnimationFrame
    startPendulumAnimation(duration, targetAngle, isAccent, targetSoundTime = null) {
        const currentTime = performance.now();
        
        // Stop any existing animation
        this.stopPendulumAnimation();
        
        // Calculate center crossing time - use provided target time or default to halfway through animation
        const centerCrossingTime = targetSoundTime || (currentTime + (duration / 2));
        
        // Set up animation state
        this.pendulumAnimation = {
            isAnimating: true,
            startTime: currentTime,
            duration: duration,
            startAngle: this.getCurrentPendulumAngle(),
            endAngle: targetAngle,
            animationId: null,
            centerCrossingCallback: null,
            centerCrossingTime: centerCrossingTime, // Use the exact target time
            centerCrossingFired: false,
            previousAngle: this.getCurrentPendulumAngle()
        };
        
        console.log(`Starting pendulum animation: ${this.pendulumAnimation.startAngle}° → ${targetAngle}°, duration: ${duration}ms`);
        console.log(`Center crossing scheduled for: ${centerCrossingTime.toFixed(1)}ms (current: ${currentTime.toFixed(1)}ms)`);
        
        // Start the animation loop
        this.animatePendulumFrame();
    }

    animatePendulumFrame() {
        if (!this.pendulumAnimation.isAnimating) return;
        
        const currentTime = performance.now();
        const elapsed = currentTime - this.pendulumAnimation.startTime;
        const progress = Math.min(elapsed / this.pendulumAnimation.duration, 1);
        
        // Calculate current angle using custom easing
        const easedProgress = this.customEaseInOut(progress);
        const currentAngle = this.pendulumAnimation.startAngle + 
            (this.pendulumAnimation.endAngle - this.pendulumAnimation.startAngle) * easedProgress;
        
        // Apply the rotation
        if (this.pendulum) {
            this.pendulum.style.transform = `translateX(-50%) rotate(${currentAngle}deg)`;
        }
        
        // Check for center crossing - detect when angle passes through 0 and when time matches
        const previousAngle = this.pendulumAnimation.previousAngle || this.pendulumAnimation.startAngle;
        const crossedZero = (previousAngle > 0 && currentAngle <= 0) || (previousAngle < 0 && currentAngle >= 0);
        
        if (!this.pendulumAnimation.centerCrossingFired && crossedZero) {
            console.log(`🎯 PENDULUM CENTER CROSSING by angle at ${currentTime.toFixed(1)}ms (scheduled: ${this.pendulumAnimation.centerCrossingTime.toFixed(1)}ms, progress: ${progress.toFixed(3)}, angle: ${currentAngle.toFixed(1)}°)`);
            this.pendulumAnimation.centerCrossingFired = true;
        } else if (!this.pendulumAnimation.centerCrossingFired && 
                   currentTime >= this.pendulumAnimation.centerCrossingTime - 5) {
            console.log(`🎯 PENDULUM CENTER CROSSING by time at ${currentTime.toFixed(1)}ms (scheduled: ${this.pendulumAnimation.centerCrossingTime.toFixed(1)}ms, progress: ${progress.toFixed(3)}, angle: ${currentAngle.toFixed(1)}°)`);
            this.pendulumAnimation.centerCrossingFired = true;
        }
        
        // Store angle for next frame comparison
        this.pendulumAnimation.previousAngle = currentAngle;
        
        // Continue animation or finish
        if (progress < 1) {
            this.pendulumAnimation.animationId = requestAnimationFrame(() => this.animatePendulumFrame());
        } else {
            this.pendulumAnimation.isAnimating = false;
            console.log('Pendulum animation completed');
        }
    }

    stopPendulumAnimation() {
        if (this.pendulumAnimation.animationId) {
            cancelAnimationFrame(this.pendulumAnimation.animationId);
        }
        this.pendulumAnimation.isAnimating = false;
    }

    getCurrentPendulumAngle() {
        if (!this.pendulum) return 0;
        
        const transform = this.pendulum.style.transform;
        const match = transform.match(/rotate\(([^)]+)deg\)/);
        return match ? parseFloat(match[1]) : 0;
    }
}

// Make Metronome available globally
window.Metronome = Metronome;

// Remove auto-initialization - will be handled by AppController
console.log('Metronome script loaded');