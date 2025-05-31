class Metronome {
    constructor() {
        this.tempo = 120;
        this.isPlaying = false;
        this.intervalId = null;
        this.pendulumTimeout = null;
        
        // Audio Context
        this.audioContext = null;
        
        // Sound settings
        this.soundType = 'digital';
        
        // Tap Tempo variables
        this.tapTimes = [];
        this.lastTapTime = 0;
        
        // Time Signature & Beat Tracking
        this.timeSignature = '4/4';
        this.currentBeat = 1;
        this.beatsPerMeasure = 4;
        
        // Subdivision
        this.subdivision = 1;
        this.subdivisionCount = 0;
        
        // Pendulum animation state
        this.pendulumDirection = 1; // 1 for right, -1 for left
        this.pendulumAnimating = false;
        
        // Theme management
        this.currentTheme = 'default';
        
        // Tempo Markings
        this.tempoMarkings = {
            'Grave': [40, 60],
            'Largo': [60, 66],
            'Adagio': [66, 76],
            'Andante': [76, 108],
            'Moderato': [108, 120],
            'Allegro': [120, 168],
            'Presto': [168, 200],
            'Prestissimo': [200, 500]
        };
        
        // DOM Elements
        this.tempoDisplay = document.getElementById('bpm-number');
        this.slider = document.getElementById('tempo-slider');
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
        // Set up event listeners
        this.slider.addEventListener('input', () => this.updateTempo(this.slider.value));
        this.startStopButton.addEventListener('click', () => this.togglePlay());
        this.tapTempoButton.addEventListener('click', () => this.handleTapTempo());
        this.timeSignatureSelect.addEventListener('change', () => this.updateTimeSignature());
        this.subdivisionSelect.addEventListener('change', () => this.updateSubdivision());
        
        // Theme menu listeners
        this.themeToggle.addEventListener('click', () => this.toggleThemeMenu());
        this.themeButtons.forEach(button => {
            button.addEventListener('click', (e) => this.changeTheme(e.target.closest('.theme-option').dataset.theme));
        });
        
        // Sound menu listeners
        this.soundToggle.addEventListener('click', () => this.toggleSoundMenu());
        this.soundButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const soundOption = e.target.closest('.sound-option');
                this.changeSound(soundOption.dataset.sound);
            });
            
            // Preview sound on play button
            const previewBtn = button.querySelector('.sound-preview');
            previewBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.previewSound(button.dataset.sound);
            });
        });
        
        // Close menus when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.themeMenu.contains(e.target)) {
                this.closeThemeMenu();
            }
            if (!this.soundMenu.contains(e.target)) {
                this.closeSoundMenu();
            }
        });
        
        // Initialize audio context on first user interaction
        document.addEventListener('click', () => {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
        }, { once: true });
        
        // Initialize settings
        this.updateTimeSignature();
        this.updateSubdivision();
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
    
    // Enhanced Sound Generation
    createSound(soundType, isAccent, volume) {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        const baseVolume = volume * (isAccent ? 2.0 : 1.0);
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
            // Subdivisions - hybrid approach
            this.startHybridTiming(baseInterval, subdivisionInterval);
        }
    }
    
    startPendulumDrivenTiming(beatInterval) {
        // Each swing should take the full beat interval, not half
        const swingDuration = beatInterval; // Full beat interval for one swing
        
        // Set starting position
        this.pendulum.style.transform = 'translateX(-50%) rotate(-20deg)';
        this.pendulumDirection = 1;
        
        // Start the cycle
        this.pendulumBeatCycle(swingDuration);
    }
    
    pendulumBeatCycle(swingDuration) {
        if (!this.isPlaying || !this.pendulum) {
            this.stopPendulumWithSound();
            return;
        }
        
        const targetRotation = this.pendulumDirection === 1 ? 20 : -20;
        
        // Start smooth animation to target
        this.pendulum.style.transition = `transform ${swingDuration}ms ease-in-out`;
        this.pendulum.style.transform = `translateX(-50%) rotate(${targetRotation}deg)`;
        
        // Sound plays at center crossing (halfway through the swing)
        setTimeout(() => {
            if (this.isPlaying) {
                this.handleMainBeat();
            }
        }, swingDuration / 2);
        
        // Switch direction for next swing
        this.pendulumDirection *= -1;
        
        // Schedule next swing after the full swing duration
        this.pendulumTimeout = setTimeout(() => {
            this.pendulumBeatCycle(swingDuration);
        }, swingDuration);
    }
    
    startHybridTiming(beatInterval, subdivisionInterval) {
        // Start visual pendulum at quarter note speed
        this.startVisualPendulum(beatInterval);
        
        // Start subdivision timer
        this.intervalId = setInterval(() => {
            this.handleSubdivisionBeat();
        }, subdivisionInterval);
    }
    
    startVisualPendulum(beatInterval) {
        // Same fix for visual pendulum in subdivision mode
        const swingDuration = beatInterval; // Full beat interval
        this.pendulum.style.transform = 'translateX(-50%) rotate(-20deg)';
        this.pendulumDirection = 1;
        this.visualPendulumCycle(swingDuration);
    }
    
    visualPendulumCycle(swingDuration) {
        if (!this.isPlaying || !this.pendulum) {
            return;
        }
        
        const targetRotation = this.pendulumDirection === 1 ? 20 : -20;
        
        this.pendulum.style.transition = `transform ${swingDuration}ms ease-in-out`;
        this.pendulum.style.transform = `translateX(-50%) rotate(${targetRotation}deg)`;
        
        this.pendulumDirection *= -1;
        
        this.pendulumTimeout = setTimeout(() => {
            this.visualPendulumCycle(swingDuration);
        }, swingDuration);
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
    
    // Handle main beats (driven by pendulum center crossing)
    handleMainBeat() {
        const isAccent = this.isAccentBeat();
        
        // Play main beat sound
        this.createSound(this.soundType, isAccent, 1.2);
        
        // Update visual feedback for main beat
        this.updateMainBeatVisual(isAccent);
        
        // Update beat counters
        this.updateBeatDisplay();
        this.currentBeat = (this.currentBeat % this.beatsPerMeasure) + 1;
    }
    
    // Handle subdivision beats (between main beats)
    handleSubdivisionBeat() {
        // Skip the downbeat (first subdivision) since it's handled by pendulum
        if (this.subdivisionCount === 0) {
            this.subdivisionCount = 1; // Move to next subdivision
            return; // Don't play sound - pendulum handles this
        }
        
        // This is a subdivision between main beats - play quieter
        this.createSound(this.soundType, false, 0.6);
        this.updateSubdivisionVisual();
        
        this.subdivisionCount = (this.subdivisionCount + 1) % this.subdivision;
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
        this.updateTempoMarking();
        
        if (this.isPlaying) {
            this.stop();
            this.play();
        }
    }
    
    // Main play/stop methods
    play() {
        if (!this.isPlaying) {
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
            const clampedTempo = Math.min(Math.max(newTempo, 15), 500);
            
            this.slider.value = clampedTempo;
            this.updateTempo(clampedTempo);
        }
    }
}

window.addEventListener('load', () => {
    new Metronome();
});