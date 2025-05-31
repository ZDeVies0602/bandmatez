class Metronome {
    constructor() {
        this.tempo = 120;
        this.isPlaying = false;
        this.intervalId = null;
        
        // Audio Context
        this.audioContext = null;
        
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
        
        // Pendulum animation
        this.pendulumDirection = 1; // 1 for right, -1 for left
        
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
    }
    
    animatePendulum() {
        if (!this.pendulum) return;
        
        // Animate pendulum swing
        this.pendulum.classList.remove('swing-left', 'swing-right');
        
        if (this.pendulumDirection === 1) {
            this.pendulum.classList.add('swing-right');
        } else {
            this.pendulum.classList.add('swing-left');
        }
        
        this.pendulumDirection *= -1; // Switch direction
    }
    
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
        return pattern[(this.currentBeat - 1) % pattern.length] && this.subdivisionCount === 0;
    }
    
    updateTempo(newTempo) {
        this.tempo = Number(newTempo);
        this.updateTempoMarking();
        
        if (this.isPlaying) {
            this.stop();
            this.play();
        }
    }
    
    playClick() {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        const isAccent = this.isAccentBeat();
        const isDownbeat = this.subdivisionCount === 0;
        
        // Much more distinct audio differences
        if (isAccent) {
            oscillator.frequency.value = 1400; // Higher pitch for accents
            gainNode.gain.value = 2.0; // Much louder
        } else if (isDownbeat) {
            oscillator.frequency.value = 1000; // Medium pitch for downbeats
            gainNode.gain.value = 1.2; // Medium volume
        } else {
            oscillator.frequency.value = 600; // Lower pitch for subdivisions
            gainNode.gain.value = 0.4; // Much quieter
        }
        
        const duration = isAccent ? 0.12 : 0.08;
        
        oscillator.start(this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
        oscillator.stop(this.audioContext.currentTime + duration);
        
        // Animate pendulum on main beats
        if (isDownbeat) {
            this.animatePendulum();
        }
        
        // Update subdivision indicator
        const dots = this.subdivisionIndicator.querySelectorAll('.subdivision-dot');
        dots.forEach(dot => dot.classList.remove('active', 'accent'));
        
        if (dots[this.subdivisionCount]) {
            if (isAccent) {
                dots[this.subdivisionCount].classList.add('accent');
            } else {
                dots[this.subdivisionCount].classList.add('active');
            }
        }
        
        setTimeout(() => {
            dots.forEach(dot => dot.classList.remove('active', 'accent'));
        }, 150);
        
        // Update counters
        this.subdivisionCount = (this.subdivisionCount + 1) % this.subdivision;
        
        if (this.subdivisionCount === 0) {
            this.updateBeatDisplay();
            this.currentBeat = (this.currentBeat % this.beatsPerMeasure) + 1;
        }
    }
    
    play() {
        if (!this.isPlaying) {
            this.isPlaying = true;
            this.startStopButton.textContent = 'Stop';
            this.startStopButton.classList.add('playing');
            
            const baseInterval = (60 / this.tempo) * 1000;
            const subdivisionInterval = this.subdivision === 3 ? 
                baseInterval / 3 : 
                baseInterval / this.subdivision;
            
            this.intervalId = setInterval(() => this.playClick(), subdivisionInterval);
        }
    }
    
    stop() {
        if (this.isPlaying) {
            this.isPlaying = false;
            this.startStopButton.textContent = 'Start';
            this.startStopButton.classList.remove('playing');
            clearInterval(this.intervalId);
            
            this.currentBeat = 1;
            this.subdivisionCount = 0;
            this.updateBeatDisplay();
            
            // Reset pendulum
            if (this.pendulum) {
                this.pendulum.classList.remove('swing-left', 'swing-right');
            }
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

// Create metronome instance when the page loads
window.addEventListener('load', () => {
    new Metronome();
}); 