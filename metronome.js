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
        
        // DOM Elements
        this.tempoDisplay = document.getElementById('bpm-number');
        this.slider = document.getElementById('tempo-slider');
        this.startStopButton = document.getElementById('start-stop');
        this.tapTempoButton = document.getElementById('tap-tempo');
        this.visualIndicator = document.getElementById('visual-indicator');
        
        // Initialize
        this.init();
    }
    
    init() {
        // Set up event listeners
        this.slider.addEventListener('input', () => this.updateTempo(this.slider.value));
        this.startStopButton.addEventListener('click', () => this.togglePlay());
        this.tapTempoButton.addEventListener('click', () => this.handleTapTempo());
        
        // Initialize audio context on first user interaction
        document.addEventListener('click', () => {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
        }, { once: true });
    }
    
    updateTempo(newTempo) {
        this.tempo = Number(newTempo);
        this.tempoDisplay.textContent = this.tempo;
        
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
        
        oscillator.frequency.value = 1000;
        gainNode.gain.value = 1;
        
        oscillator.start(this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.05);
        oscillator.stop(this.audioContext.currentTime + 0.05);
        
        // Visual feedback
        this.visualIndicator.classList.add('active');
        setTimeout(() => this.visualIndicator.classList.remove('active'), 50);
    }
    
    play() {
        if (!this.isPlaying) {
            this.isPlaying = true;
            this.startStopButton.textContent = 'Stop';
            this.startStopButton.classList.add('playing');
            
            const interval = (60 / this.tempo) * 1000;
            this.intervalId = setInterval(() => this.playClick(), interval);
        }
    }
    
    stop() {
        if (this.isPlaying) {
            this.isPlaying = false;
            this.startStopButton.textContent = 'Start';
            this.startStopButton.classList.remove('playing');
            clearInterval(this.intervalId);
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
            // Reset if more than 2 seconds have passed
            this.tapTimes = [];
        }
        
        this.tapTimes.push(currentTime);
        this.lastTapTime = currentTime;
        
        // Keep only the last 4 taps
        if (this.tapTimes.length > 4) {
            this.tapTimes.shift();
        }
        
        if (this.tapTimes.length > 1) {
            // Calculate average interval between taps
            let averageInterval = 0;
            for (let i = 1; i < this.tapTimes.length; i++) {
                averageInterval += this.tapTimes[i] - this.tapTimes[i-1];
            }
            averageInterval /= (this.tapTimes.length - 1);
            
            // Convert to BPM and clamp between 15 and 500
            const newTempo = Math.round(60000 / averageInterval);
            const clampedTempo = Math.min(Math.max(newTempo, 15), 500);
            
            // Update the UI
            this.slider.value = clampedTempo;
            this.updateTempo(clampedTempo);
        }
    }
}

// Create metronome instance when the page loads
window.addEventListener('load', () => {
    new Metronome();
}); 