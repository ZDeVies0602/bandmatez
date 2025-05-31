class Metronome {
    constructor() {
        // Initialize audio context immediately
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            console.warn('Web Audio API not supported:', error);
            this.audioContext = null;
        }
        
        // Metronome settings
        this.tempo = 120;
        this.isPlaying = false;
        this.currentBeat = 1;
        this.beatsPerMeasure = 4;
        this.timeSignature = '4/4';
        this.subdivision = 1;
        this.subdivisionCount = 0;
        this.pendulumDirection = 1;
        this.pendulumAnimating = false;
        this.pendulumTimeout = null;
        this.intervalId = null;
        this.soundType = 'digital';
        
        // Tap tempo
        this.tapTimes = [];
        this.lastTapTime = 0;
        
        // Theme management
        this.currentTheme = 'default';
        
        // Tempo markings
        this.tempoMarkings = {
            'Largo': [30, 60],
            'Adagio': [60, 76],
            'Andante': [76, 108],
            'Moderato': [108, 120],
            'Allegretto': [120, 168],
            'Allegro': [168, 200],
            'Presto': [200, 300]
        };
        
        // DOM Elements
        this.tempoDisplay = document.getElementById('bpm-number');
        this.slider = document.getElementById('tempo-slider');
        this.tempoInput = document.getElementById('tempo-input');
        this.startStopButton = document.getElementById('start-stop');
        this.tapTempoButton = document.getElementById('tap-tempo');
        this.timeSignatureSelect = document.getElementById('time-signature');
        this.subdivisionSelect = document.getElementById('subdivision');
        this.currentBeatDisplay = document.getElementById('current-beat');
        this.totalBeatsDisplay = document.getElementById('total-beats');
        this.subdivisionIndicator = document.getElementById('subdivision-indicator');
        this.tempoMarkingDisplay = document.getElementById('tempo-marking');
        this.pendulum = document.getElementById('pendulum');
        
        // Theme menu elements
        this.themeMenu = document.getElementById('theme-menu');
        this.themeToggle = document.getElementById('theme-toggle');
        this.themeOptions = document.getElementById('theme-options');
        this.themeButtons = document.querySelectorAll('.theme-option');
        
        // Sound menu elements
        this.soundMenu = document.getElementById('sound-menu');
        this.soundToggle = document.getElementById('sound-toggle');
        this.soundOptions = document.getElementById('sound-options');
        this.soundButtons = document.querySelectorAll('.sound-option');
        
        // Initialize
        this.init();
    }
    
    init() {
        // Get DOM elements
        this.slider = document.getElementById('tempo-slider');
        this.tempoInput = document.getElementById('tempo-input');
        this.tempoDisplay = document.getElementById('bpm-number');
        this.tempoMarkingDisplay = document.getElementById('tempo-marking');
        this.startStopButton = document.getElementById('start-stop');
        this.tapTempoButton = document.getElementById('tap-tempo');
        this.timeSignatureSelect = document.getElementById('time-signature');
        this.subdivisionSelect = document.getElementById('subdivision');
        this.currentBeatDisplay = document.getElementById('current-beat');
        this.totalBeatsDisplay = document.getElementById('total-beats');
        this.subdivisionIndicator = document.getElementById('subdivision-indicator');
        this.pendulum = document.getElementById('pendulum');
        
        // Theme and sound menu elements
        this.themeToggle = document.getElementById('theme-toggle');
        this.themeMenu = document.getElementById('theme-menu');
        this.themeOptions = document.getElementById('theme-options');
        this.soundToggle = document.getElementById('sound-toggle');
        this.soundMenu = document.getElementById('sound-menu');
        this.soundOptions = document.getElementById('sound-options');
        
        // Add event listeners
        this.slider.addEventListener('input', (e) => this.updateTempo(e.target.value));
        this.tempoInput.addEventListener('input', (e) => this.updateTempoFromInput(e.target.value));
        this.tempoInput.addEventListener('blur', (e) => this.validateTempoInput(e.target.value));
        this.startStopButton.addEventListener('click', () => this.togglePlay());
        this.tapTempoButton.addEventListener('click', () => this.handleTapTempo());
        this.timeSignatureSelect.addEventListener('change', () => this.updateTimeSignature());
        this.subdivisionSelect.addEventListener('change', () => this.updateSubdivision());
        
        // Theme menu listeners
        this.themeToggle.addEventListener('click', () => this.toggleThemeMenu());
        document.addEventListener('click', (e) => {
            if (!this.themeMenu.contains(e.target)) {
                this.closeThemeMenu();
            }
        });
        
        // Sound menu listeners  
        this.soundToggle.addEventListener('click', () => this.toggleSoundMenu());
        document.addEventListener('click', (e) => {
            if (!this.soundMenu.contains(e.target)) {
                this.closeSoundMenu();
            }
        });
        
        // Theme option listeners
        this.themeOptions.addEventListener('click', (e) => {
            if (e.target.classList.contains('theme-option') || e.target.closest('.theme-option')) {
                const themeButton = e.target.closest('.theme-option');
                const themeName = themeButton.dataset.theme;
                this.changeTheme(themeName);
            }
        });
        
        // Sound option listeners
        this.soundOptions.addEventListener('click', (e) => {
            if (e.target.classList.contains('sound-option') || e.target.closest('.sound-option')) {
                const soundButton = e.target.closest('.sound-option');
                const soundType = soundButton.dataset.sound;
                this.changeSound(soundType);
            }
            
            // Handle preview button clicks
            if (e.target.classList.contains('sound-preview')) {
                e.stopPropagation();
                const soundButton = e.target.closest('.sound-option');
                const soundType = soundButton.dataset.sound;
                this.previewSound(soundType);
            }
        });
        
        // Initialize settings
        this.updateTimeSignature();
        this.updateSubdivision();
        this.createSubdivisionIndicator();
        this.updateTempoMarking();
        this.loadSavedTheme();
        this.loadSavedSound();
    }
    
    // Theme Menu Methods
    toggleThemeMenu() {
        this.themeMenu.classList.toggle('open');
        this.closeSoundMenu();
    }
    
    closeThemeMenu() {
        this.themeMenu.classList.remove('open');
    }
    
    changeTheme(themeName) {
        document.body.className = document.body.className.replace(/theme-\w+/g, '');
        
        if (themeName !== 'default') {
            document.body.classList.add(`theme-${themeName}`);
        }
        
        this.themeButtons.forEach(btn => btn.classList.remove('active'));
        const activeButton = document.querySelector(`[data-theme="${themeName}"]`);
        if (activeButton) {
            activeButton.classList.add('active');
        }
        
        this.currentTheme = themeName;
        this.saveTheme();
        this.closeThemeMenu();
    }
    
    saveTheme() {
        localStorage.setItem('metronome-theme', this.currentTheme);
    }
    
    loadSavedTheme() {
        const savedTheme = localStorage.getItem('metronome-theme');
        if (savedTheme) {
            this.changeTheme(savedTheme);
        } else {
            const defaultButton = document.querySelector('[data-theme="default"]');
            if (defaultButton) {
                defaultButton.classList.add('active');
            }
        }
    }
    
    // Sound Menu Methods
    toggleSoundMenu() {
        this.soundMenu.classList.toggle('open');
        this.closeThemeMenu();
    }
    
    closeSoundMenu() {
        this.soundMenu.classList.remove('open');
    }
    
    changeSound(soundType) {
        this.soundType = soundType;
        
        this.soundButtons.forEach(btn => btn.classList.remove('active'));
        const activeButton = document.querySelector(`[data-sound="${soundType}"]`);
        if (activeButton) {
            activeButton.classList.add('active');
        }
        
        this.saveSound();
        this.closeSoundMenu();
    }
    
    saveSound() {
        localStorage.setItem('metronome-sound', this.soundType);
    }
    
    loadSavedSound() {
        const savedSound = localStorage.getItem('metronome-sound');
        if (savedSound) {
            this.changeSound(savedSound);
        } else {
            const defaultButton = document.querySelector('[data-sound="digital"]');
            if (defaultButton) {
                defaultButton.classList.add('active');
            }
        }
    }
    
    previewSound(soundType) {
        if (!this.audioContext) return;
        this.createSound(soundType, true, 1.0);
    }
    
    // Add method to ensure audio context is resumed
    async ensureAudioContext() {
        if (!this.audioContext) {
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            } catch (error) {
                console.warn('Could not create audio context:', error);
                return false;
            }
        }
        
        if (this.audioContext.state === 'suspended') {
            try {
                await this.audioContext.resume();
            } catch (error) {
                console.warn('Could not resume audio context:', error);
            }
        }
        
        return this.audioContext.state === 'running';
    }
    
    // Enhanced Sound Generation with error handling
    async createSound(soundType, isAccent, volume) {
        const audioReady = await this.ensureAudioContext();
        if (!audioReady) {
            console.warn('Audio context not available');
            return;
        }
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            const filter = this.audioContext.createBiquadFilter();
            
            oscillator.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            const baseVolume = volume * (isAccent ? 1.5 : 1.0);
            const currentTime = this.audioContext.currentTime;
            
            switch (soundType) {
                case 'digital':
                    oscillator.frequency.value = isAccent ? 1400 : 1000;
                    oscillator.type = 'square';
                    gainNode.gain.value = baseVolume * 0.3;
                    break;
                    
                case 'wood':
                    oscillator.frequency.value = isAccent ? 800 : 600;
                    oscillator.type = 'sawtooth';
                    filter.type = 'lowpass';
                    filter.frequency.value = 2000;
                    gainNode.gain.value = baseVolume * 0.4;
                    break;
                    
                case 'mechanical':
                    oscillator.frequency.value = isAccent ? 1200 : 900;
                    oscillator.type = 'square';
                    filter.type = 'bandpass';
                    filter.frequency.value = 1500;
                    gainNode.gain.value = baseVolume * 0.35;
                    break;
                    
                case 'cowbell':
                    oscillator.frequency.value = isAccent ? 800 : 560;
                    oscillator.type = 'square';
                    filter.type = 'highpass';
                    filter.frequency.value = 400;
                    gainNode.gain.value = baseVolume * 0.45;
                    break;
                    
                case 'rimshot':
                    oscillator.frequency.value = isAccent ? 2000 : 1500;
                    oscillator.type = 'sawtooth';
                    filter.type = 'highpass';
                    filter.frequency.value = 1000;
                    gainNode.gain.value = baseVolume * 0.25;
                    oscillator.frequency.exponentialRampToValueAtTime(
                        oscillator.frequency.value * 0.5, 
                        currentTime + 0.01
                    );
                    break;
                    
                case 'sine':
                    oscillator.frequency.value = isAccent ? 1200 : 880;
                    oscillator.type = 'sine';
                    gainNode.gain.value = baseVolume * 0.4;
                    break;
                    
                case 'triangle':
                    oscillator.frequency.value = isAccent ? 1100 : 850;
                    oscillator.type = 'triangle';
                    gainNode.gain.value = baseVolume * 0.35;
                    break;
                    
                case 'tick':
                    oscillator.frequency.value = isAccent ? 1500 : 1200;
                    oscillator.type = 'square';
                    filter.type = 'bandpass';
                    filter.frequency.value = 2000;
                    filter.Q.value = 5;
                    gainNode.gain.value = baseVolume * 0.3;
                    break;
                    
                default:
                    oscillator.frequency.value = isAccent ? 1400 : 1000;
                    oscillator.type = 'square';
                    gainNode.gain.value = baseVolume * 0.3;
            }
            
            const duration = isAccent ? 0.12 : 0.08;
            
            oscillator.start(currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);
            oscillator.stop(currentTime + duration);
        } catch (error) {
            console.warn('Error creating sound:', error);
        }
    }
    
    // FIXED: Pendulum-driven timing with center-crossing sound
    startPendulumWithSound() {
        if (!this.pendulum || this.pendulumAnimating) return;
        
        this.pendulumAnimating = true;
        
        // Calculate intervals based on subdivision
        const baseInterval = (60 / this.tempo) * 1000; // Quarter note interval
        const subdivisionInterval = this.subdivision === 3 ? 
            baseInterval / 3 : 
            baseInterval / this.subdivision;
        
        if (this.subdivision === 1) {
            // Quarter notes only - pendulum drives everything
            this.startPendulumDrivenTiming(baseInterval);
        } else {
            // Subdivisions - single timer drives both audio and pendulum
            this.startSynchronizedTiming(subdivisionInterval, baseInterval);
        }
    }
    
    // NEW: Single timer drives both audio and pendulum animation
    startSynchronizedTiming(subdivisionInterval, beatInterval) {
        // Reset counters
        this.subdivisionCount = 0;
        
        // Set up pendulum initial position
        this.pendulum.style.transform = 'translateX(-50%) rotate(-20deg)';
        this.pendulumDirection = 1;
        this.pendulumSwingDuration = beatInterval; // How long each swing takes
        
        // Single timer handles everything
        this.intervalId = setInterval(() => {
            this.handleSynchronizedBeat();
        }, subdivisionInterval);
    }
    
    // Handle both audio and pendulum from single timer
    handleSynchronizedBeat() {
        const isMainBeat = this.subdivisionCount === 0;
        const isAccent = this.isAccentBeat();
        
        if (isMainBeat) {
            // MAIN BEAT: Play audio AND trigger pendulum swing
            this.createSound(this.soundType, isAccent, 1.2);
            this.updateMainBeatVisual(isAccent);
            this.updateBeatDisplay();
            this.currentBeat = (this.currentBeat % this.beatsPerMeasure) + 1;
            
            // Trigger pendulum swing to opposite side
            this.triggerPendulumSwing();
            
        } else {
            // SUBDIVISION: Only play audio (no pendulum movement)
            this.createSound(this.soundType, false, 0.6);
            this.updateSubdivisionVisual();
        }
        
        this.subdivisionCount = (this.subdivisionCount + 1) % this.subdivision;
    }
    
    // Trigger pendulum swing synchronized with main beats
    triggerPendulumSwing() {
        if (!this.pendulum) return;
        
        const targetRotation = this.pendulumDirection === 1 ? 20 : -20;
        
        // Start smooth animation to target
        this.pendulum.style.transition = `transform ${this.pendulumSwingDuration}ms ease-in-out`;
        this.pendulum.style.transform = `translateX(-50%) rotate(${targetRotation}deg)`;
        
        // Switch direction for next swing
        this.pendulumDirection *= -1;
    }
    
    stopPendulumWithSound() {
        this.pendulumAnimating = false;
        
        if (this.pendulumTimeout) {
            clearTimeout(this.pendulumTimeout);
            this.pendulumTimeout = null;
        }
        
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        
        if (this.pendulum) {
            this.pendulum.style.transition = 'transform 0.3s ease-out';
            this.pendulum.style.transform = 'translateX(-50%) rotate(0deg)';
        }
    }
    
    updateMainBeatVisual(isAccent) {
        const dots = this.subdivisionIndicator.querySelectorAll('.subdivision-dot');
        dots.forEach(dot => dot.classList.remove('active', 'accent'));
        
        if (dots[0]) { // First dot for main beat
            if (isAccent) {
                dots[0].classList.add('accent');
            } else {
                dots[0].classList.add('active');
            }
        }
        
        setTimeout(() => {
            dots.forEach(dot => dot.classList.remove('active', 'accent'));
        }, 150);
    }
    
    updateSubdivisionVisual() {
        const dots = this.subdivisionIndicator.querySelectorAll('.subdivision-dot');
        dots.forEach(dot => dot.classList.remove('active', 'accent'));
        
        if (dots[this.subdivisionCount]) {
            dots[this.subdivisionCount].classList.add('active');
        }
        
        setTimeout(() => {
            dots.forEach(dot => dot.classList.remove('active', 'accent'));
        }, 100);
    }
    
    // Metronome Control Methods
    updateSubdivision() {
        this.subdivision = Number(this.subdivisionSelect.value);
        this.subdivisionCount = 0;
        this.createSubdivisionIndicator();
        
        if (this.isPlaying) {
            this.stop();
            this.play();
        }
    }
    
    createSubdivisionIndicator() {
        this.subdivisionIndicator.innerHTML = '';
        for (let i = 0; i < this.subdivision; i++) {
            const dot = document.createElement('div');
            dot.className = 'subdivision-dot';
            dot.id = `sub-dot-${i}`;
            this.subdivisionIndicator.appendChild(dot);
        }
    }
    
    updateTimeSignature() {
        this.timeSignature = this.timeSignatureSelect.value;
        
        const [numerator, denominator] = this.timeSignature.split('/').map(Number);
        this.beatsPerMeasure = numerator;
        
        this.currentBeat = 1;
        this.subdivisionCount = 0;
        this.updateBeatDisplay();
        this.totalBeatsDisplay.textContent = this.beatsPerMeasure;
    }
    
    updateBeatDisplay() {
        this.currentBeatDisplay.textContent = this.currentBeat;
    }
    
    getTempoMarking() {
        for (const [marking, [min, max]] of Object.entries(this.tempoMarkings)) {
            if (this.tempo >= min && this.tempo < max) {
                return marking;
            }
        }
        return '';
    }
    
    updateTempoMarking() {
        const marking = this.getTempoMarking();
        this.tempoDisplay.textContent = this.tempo;
        if (this.tempoMarkingDisplay) {
            this.tempoMarkingDisplay.textContent = marking;
        }
    }
    
    getAccentPattern() {
        const patterns = {
            '4/4': [true, false, false, false],
            '3/4': [true, false, false],
            '2/4': [true, false],
            '6/8': [true, false, false, true, false, false],
            '5/4': [true, false, false, false, false],
            '7/8': [true, false, false, true, false, true, false]
        };
        
        return patterns[this.timeSignature] || [true];
    }
    
    isAccentBeat() {
        const pattern = this.getAccentPattern();
        return pattern[(this.currentBeat - 1) % pattern.length];
    }
    
    updateTempo(newTempo) {
        this.tempo = Number(newTempo);
        this.tempoInput.value = this.tempo;
        this.updateTempoMarking();
        
        if (this.isPlaying) {
            this.stop();
            this.play();
        }
    }
    
    // New method to handle tempo input
    updateTempoFromInput(newTempo) {
        const tempo = parseInt(newTempo);
        if (!isNaN(tempo) && tempo >= 30 && tempo <= 300) {
            this.tempo = tempo;
            this.slider.value = tempo;
            this.updateTempoMarking();
            
            if (this.isPlaying) {
                this.stop();
                this.play();
            }
        }
    }
    
    // New method to validate tempo input
    validateTempoInput(newTempo) {
        let tempo = parseInt(newTempo);
        
        if (isNaN(tempo) || tempo < 30) {
            tempo = 30;
        } else if (tempo > 300) {
            tempo = 300;
        }
        
        this.tempoInput.value = tempo;
        this.updateTempoFromInput(tempo);
    }
    
    // Main play/stop methods
    async play() {
        if (!this.isPlaying) {
            // Ensure audio context is ready
            await this.ensureAudioContext();
            
            this.isPlaying = true;
            this.startStopButton.textContent = 'Stop';
            this.startStopButton.classList.add('playing');
            
            // Start pendulum-driven timing
            this.startPendulumWithSound();
        }
    }
    
    stop() {
        if (this.isPlaying) {
            this.isPlaying = false;
            this.startStopButton.textContent = 'Start';
            this.startStopButton.classList.remove('playing');
            
            // Stop all timing
            this.stopPendulumWithSound();
            
            // Reset counters
            this.currentBeat = 1;
            this.subdivisionCount = 0;
            this.updateBeatDisplay();
        }
    }
    
    togglePlay() {
        if (this.isPlaying) {
            this.stop();
        } else {
            this.play();
        }
    }
    
    handleTapTempo() {
        const currentTime = Date.now();
        
        if (currentTime - this.lastTapTime > 2000) {
            this.tapTimes = [];
        }
        
        this.tapTimes.push(currentTime);
        this.lastTapTime = currentTime;
        
        if (this.tapTimes.length > 4) {
            this.tapTimes.shift();
        }
        
        if (this.tapTimes.length > 1) {
            let averageInterval = 0;
            for (let i = 1; i < this.tapTimes.length; i++) {
                averageInterval += this.tapTimes[i] - this.tapTimes[i-1];
            }
            averageInterval /= (this.tapTimes.length - 1);
            
            const newTempo = Math.round(60000 / averageInterval);
            const clampedTempo = Math.min(Math.max(newTempo, 30), 300);
            
            this.slider.value = clampedTempo;
            this.tempoInput.value = clampedTempo;
            this.updateTempo(clampedTempo);
        }
    }
}

window.addEventListener('load', () => {
    new Metronome();
});