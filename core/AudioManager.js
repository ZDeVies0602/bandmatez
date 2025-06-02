/**
 * AudioManager - Centralized Web Audio API management
 * Handles audio context creation, management, and cleanup
 */
class AudioManager {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.isInitialized = false;
        this.hasUserGesture = false;
        this.pendingInitialization = null;
    }

    /**
     * Initialize audio context (creates suspended, waits for user gesture to resume)
     * @returns {Promise<boolean>} Success status
     */
    async initialize() {
        console.log('AudioManager.initialize() called');
        
        // Return existing initialization promise if already in progress
        if (this.pendingInitialization) {
            return this.pendingInitialization;
        }

        // If already running, return success
        if (this.isInitialized && this.audioContext && this.audioContext.state === 'running') {
            console.log('AudioManager already initialized and running');
            return true;
        }

        // Start initialization
        this.pendingInitialization = this._doInitialize();
        const result = await this.pendingInitialization;
        this.pendingInitialization = null;
        return result;
    }

    async _doInitialize() {
        try {
            // Create audio context if needed (this will be suspended by default)
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                console.log('Created new audio context, state:', this.audioContext.state);
            }

            // Create master gain if needed
            if (!this.masterGain) {
                this.masterGain = this.audioContext.createGain();
                this.masterGain.connect(this.audioContext.destination);
                this.masterGain.gain.value = 0.5; // Default volume
                console.log('Created master gain node');
            }

            // Mark as initialized even if suspended
            this.isInitialized = true;
            
            // If context is suspended, don't try to resume it yet - wait for user gesture
            if (this.audioContext.state === 'suspended') {
                console.log('Audio context created in suspended state (Chrome autoplay policy)');
                console.log('Audio will start when user interacts with the page');
                this.setupUserGestureHandlers();
                return true; // Return success - we're ready but suspended
            }

            console.log('AudioManager initialization complete. State:', this.audioContext.state);
            return true;

        } catch (error) {
            console.error('Error initializing audio context:', error);
            this.isInitialized = false;
            return false;
        }
    }

    /**
     * Setup user gesture handlers to resume audio context
     */
    setupUserGestureHandlers() {
        if (this.hasUserGesture) return; // Already handled

        const resumeAudio = async () => {
            if (this.audioContext && this.audioContext.state === 'suspended') {
                try {
                    console.log('User gesture detected, resuming audio context...');
                    await this.audioContext.resume();
                    console.log('Audio context resumed, state:', this.audioContext.state);
                    this.hasUserGesture = true;
                    
                    // Remove event listeners after first successful resume
                    document.removeEventListener('click', resumeAudio);
                    document.removeEventListener('keydown', resumeAudio);
                    document.removeEventListener('touchstart', resumeAudio);
                } catch (error) {
                    console.error('Error resuming audio context:', error);
                }
            }
        };

        // Listen for various user interactions
        document.addEventListener('click', resumeAudio);
        document.addEventListener('keydown', resumeAudio);
        document.addEventListener('touchstart', resumeAudio);
        
        console.log('User gesture handlers setup for audio context resume');
    }

    /**
     * Get the audio context (initializes if needed)
     * @returns {Promise<AudioContext|null>}
     */
    async getContext() {
        const success = await this.initialize();
        return success ? this.audioContext : null;
    }

    /**
     * Force resume audio context (use after a user gesture)
     * @returns {Promise<boolean>} Success status
     */
    async resumeContext() {
        if (!this.audioContext) {
            await this.initialize();
        }
        
        if (this.audioContext && this.audioContext.state === 'suspended') {
            try {
                console.log('Manually resuming audio context...');
                await this.audioContext.resume();
                console.log('Audio context resumed, state:', this.audioContext.state);
                this.hasUserGesture = true;
                return true;
            } catch (error) {
                console.error('Error resuming audio context:', error);
                return false;
            }
        }
        
        return this.audioContext && this.audioContext.state === 'running';
    }

    /**
     * Check if audio is ready to play
     * @returns {boolean}
     */
    isReady() {
        return this.isInitialized && 
               this.audioContext && 
               this.audioContext.state === 'running';
    }

    /**
     * Get the master gain node
     * @returns {GainNode|null}
     */
    getMasterGain() {
        return this.masterGain;
    }

    /**
     * Set master volume
     * @param {number} volume - Volume level (0-1)
     */
    setMasterVolume(volume) {
        if (this.masterGain) {
            this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
        }
    }

    /**
     * Create an oscillator node
     * @returns {OscillatorNode|null}
     */
    createOscillator() {
        return this.audioContext ? this.audioContext.createOscillator() : null;
    }

    /**
     * Create a gain node
     * @returns {GainNode|null}
     */
    createGain() {
        return this.audioContext ? this.audioContext.createGain() : null;
    }

    /**
     * Create a filter node
     * @returns {BiquadFilterNode|null}
     */
    createFilter() {
        return this.audioContext ? this.audioContext.createBiquadFilter() : null;
    }

    /**
     * Create an analyser node
     * @returns {AnalyserNode|null}
     */
    createAnalyser() {
        return this.audioContext ? this.audioContext.createAnalyser() : null;
    }

    /**
     * Create a media stream source
     * @param {MediaStream} stream
     * @returns {MediaStreamAudioSourceNode|null}
     */
    createMediaStreamSource(stream) {
        return this.audioContext ? this.audioContext.createMediaStreamSource(stream) : null;
    }

    /**
     * Get current audio time
     * @returns {number}
     */
    getCurrentTime() {
        return this.audioContext ? this.audioContext.currentTime : 0;
    }

    /**
     * Get sample rate
     * @returns {number}
     */
    getSampleRate() {
        return this.audioContext ? this.audioContext.sampleRate : 44100;
    }

    /**
     * Cleanup audio context
     */
    async destroy() {
        console.log('Destroying audio manager...');
        
        if (this.masterGain) {
            this.masterGain.disconnect();
            this.masterGain = null;
        }

        if (this.audioContext && this.audioContext.state !== 'closed') {
            await this.audioContext.close();
            this.audioContext = null;
        }

        this.isInitialized = false;
        this.hasUserGesture = false;
    }
}

// Export singleton instance
window.AudioManager = new AudioManager(); 