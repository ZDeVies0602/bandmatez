/**
 * MetronomeSounds - Metronome sound generation
 * Handles different sound types and preview functionality
 */
class MetronomeSounds {
    constructor() {
        this.currentSoundType = 'digital';
        this.availableSounds = [
            'digital',
            'wood',
            'mechanical',
            'cowbell',
            'rimshot',
            'sine',
            'triangle',
            'tick'
        ];
        this.soundMenu = null;
        this.soundToggle = null;
        this.soundOptions = null;
        this.initialized = false;
    }

    /**
     * Initialize sound manager
     */
    initialize() {
        if (this.initialized) return;

        this.soundMenu = document.getElementById('sound-menu');
        this.soundToggle = document.getElementById('sound-toggle');
        this.soundOptions = document.getElementById('sound-options');

        if (!this.soundMenu || !this.soundToggle || !this.soundOptions) {
            console.warn('Sound menu elements not found');
            return;
        }

        this.setupEventListeners();
        this.loadSavedSound();
        this.initialized = true;
        console.log('MetronomeSounds initialized');
    }

    /**
     * Set up event listeners for sound menu
     */
    setupEventListeners() {
        // Sound toggle button
        this.soundToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleMenu();
        });

        // Sound options
        this.soundOptions.addEventListener('click', async (e) => {
            if (e.target.classList.contains('sound-option') || e.target.closest('.sound-option')) {
                const soundButton = e.target.closest('.sound-option');
                const soundType = soundButton.dataset.sound;
                this.setSoundType(soundType);
            }

            // Handle preview button clicks
            if (e.target.classList.contains('sound-preview')) {
                e.stopPropagation();
                const soundButton = e.target.closest('.sound-option');
                const soundType = soundButton.dataset.sound;
                await this.previewSound(soundType);
            }
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (this.soundMenu && !this.soundMenu.contains(e.target)) {
                this.closeMenu();
            }
        });
    }

    /**
     * Toggle sound menu visibility
     */
    toggleMenu() {
        if (!this.soundMenu) return;
        
        this.soundMenu.classList.toggle('open');
        
        // Close theme menu if open
        if (window.ThemeManager) {
            window.ThemeManager.closeMenu();
        }
    }

    /**
     * Close sound menu
     */
    closeMenu() {
        if (this.soundMenu) {
            this.soundMenu.classList.remove('open');
        }
    }

    /**
     * Set current sound type
     * @param {string} soundType - Sound type name
     */
    setSoundType(soundType) {
        if (!this.availableSounds.includes(soundType)) {
            console.warn('Invalid sound type:', soundType);
            return;
        }

        this.currentSoundType = soundType;
        this.updateActiveButton(soundType);
        this.saveSound();
        this.closeMenu();
        
        console.log('Sound type changed to:', soundType);
    }

    /**
     * Update active sound button
     * @param {string} soundType - Active sound type
     */
    updateActiveButton(soundType) {
        const soundButtons = document.querySelectorAll('.sound-option');
        soundButtons.forEach(btn => btn.classList.remove('active'));
        
        const activeButton = document.querySelector(`[data-sound="${soundType}"]`);
        if (activeButton) {
            activeButton.classList.add('active');
        }
    }

    /**
     * Get current sound type
     * @returns {string} Current sound type
     */
    getCurrentSoundType() {
        return this.currentSoundType;
    }

    /**
     * Preview a sound type
     * @param {string} soundType - Sound type to preview
     */
    async previewSound(soundType) {
        console.log('Previewing sound:', soundType);
        
        const audioManager = window.AudioManager;
        if (!audioManager) {
            console.warn('AudioManager not available');
            return;
        }

        const audioReady = await audioManager.initialize();
        if (!audioReady) {
            console.warn('Audio context not available for preview');
            return;
        }

        // Play preview sound with accent for better demonstration
        await this.createSound(soundType, true, 1.0);
    }

    /**
     * Create and play a metronome sound
     * @param {string} soundType - Type of sound to create
     * @param {boolean} isAccent - Whether this is an accented beat
     * @param {number} volume - Volume level (0-1)
     */
    async createSound(soundType, isAccent = false, volume = 1.0) {
        const audioManager = window.AudioManager;
        if (!audioManager) {
            console.warn('AudioManager not available');
            return;
        }

        const audioReady = await audioManager.initialize();
        if (!audioReady) {
            console.warn('Audio context not available');
            return;
        }

        try {
            const oscillator = audioManager.createOscillator();
            const gainNode = audioManager.createGain();
            const filter = audioManager.createFilter();

            if (!oscillator || !gainNode || !filter) {
                console.warn('Could not create audio nodes');
                return;
            }

            oscillator.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(audioManager.getMasterGain());

            const baseVolume = volume * (isAccent ? 1.5 : 1.0);
            const currentTime = audioManager.getCurrentTime();

            // Configure sound based on type
            this.configureSoundType(oscillator, filter, gainNode, soundType, isAccent, baseVolume, currentTime);

            const duration = isAccent ? 0.12 : 0.08;

            oscillator.start(currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);
            oscillator.stop(currentTime + duration);

        } catch (error) {
            console.error('Error creating sound:', error);
        }
    }

    /**
     * Configure oscillator and filter for specific sound type
     * @param {OscillatorNode} oscillator - Oscillator node
     * @param {BiquadFilterNode} filter - Filter node
     * @param {GainNode} gainNode - Gain node
     * @param {string} soundType - Sound type
     * @param {boolean} isAccent - Whether accented
     * @param {number} baseVolume - Base volume
     * @param {number} currentTime - Current audio time
     */
    configureSoundType(oscillator, filter, gainNode, soundType, isAccent, baseVolume, currentTime) {
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
                console.log('Using default digital sound');
                oscillator.frequency.value = isAccent ? 1400 : 1000;
                oscillator.type = 'square';
                gainNode.gain.value = baseVolume * 0.3;
        }
    }

    /**
     * Save current sound type to localStorage
     */
    saveSound() {
        try {
            localStorage.setItem('music-tools-sound', this.currentSoundType);
        } catch (error) {
            console.warn('Could not save sound to localStorage:', error);
        }
    }

    /**
     * Load saved sound type from localStorage
     */
    loadSavedSound() {
        try {
            const savedSound = localStorage.getItem('music-tools-sound');
            if (savedSound && this.availableSounds.includes(savedSound)) {
                this.setSoundType(savedSound);
            } else {
                // Set default sound active button
                this.updateActiveButton('digital');
            }
        } catch (error) {
            console.warn('Could not load sound from localStorage:', error);
            this.updateActiveButton('digital');
        }
    }

    /**
     * Get available sound types
     * @returns {Array} Array of sound type names
     */
    getAvailableSounds() {
        return [...this.availableSounds];
    }
}

// Export singleton instance
window.MetronomeSounds = new MetronomeSounds(); 