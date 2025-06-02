/**
 * FrequencyUtils - Note and frequency calculation utilities
 * Shared across metronome, tuner, and piano components
 */
class FrequencyUtils {
    constructor() {
        this.A4_FREQUENCY = 440; // Default A4 reference frequency
        this.NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        this.WHITE_KEYS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
        this.BLACK_KEYS = ['C#', 'D#', 'F#', 'G#', 'A#'];
    }

    /**
     * Set the A4 reference frequency
     * @param {number} frequency - A4 frequency in Hz
     */
    setA4Frequency(frequency) {
        if (frequency >= 420 && frequency <= 460) {
            this.A4_FREQUENCY = frequency;
        }
    }

    /**
     * Get the A4 reference frequency
     * @returns {number} A4 frequency in Hz
     */
    getA4Frequency() {
        return this.A4_FREQUENCY;
    }

    /**
     * Convert note and octave to frequency
     * @param {string} note - Note name (e.g., 'A', 'C#')
     * @param {number} octave - Octave number
     * @returns {number} Frequency in Hz
     */
    noteToFrequency(note, octave) {
        // Note names starting from A (to match A4 = 440Hz reference)
        const noteNamesFromA = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];
        
        const noteIndex = noteNamesFromA.indexOf(note);
        if (noteIndex === -1) {
            console.error('Invalid note name:', note);
            return this.A4_FREQUENCY; // Return A4 as fallback
        }
        
        // Calculate semitones from A4
        const semitones = (octave - 4) * 12 + noteIndex;
        
        // Calculate frequency using equal temperament formula
        return this.A4_FREQUENCY * Math.pow(2, semitones / 12);
    }

    /**
     * Convert frequency to note information
     * @param {number} frequency - Frequency in Hz
     * @returns {Object} Note information {note, cents, frequency}
     */
    frequencyToNote(frequency) {
        // Calculate semitones from A4
        const semitones = 12 * Math.log2(frequency / this.A4_FREQUENCY);
        
        // Find the nearest note
        const nearestSemitone = Math.round(semitones);
        
        // Note names starting from A
        const noteNamesFromA = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];
        
        // Get the note index (handle negative values properly)
        let noteIndex = nearestSemitone % 12;
        if (noteIndex < 0) noteIndex += 12;
        
        // Calculate octave - A4 is octave 4
        let octave = 4 + Math.floor(nearestSemitone / 12);
        
        // Special handling for notes below A4 that wrapped around
        if (noteIndex >= 2 && nearestSemitone < 0) { // B, C notes
            octave -= 1;
        }
        
        // Calculate cents deviation from perfect pitch
        const cents = Math.round((semitones - nearestSemitone) * 100);
        
        return {
            note: noteNamesFromA[noteIndex] + octave,
            cents: cents,
            frequency: frequency
        };
    }

    /**
     * Get note index in chromatic scale
     * @param {string} note - Note name
     * @returns {number} Index (0-11)
     */
    getNoteIndex(note) {
        return this.NOTE_NAMES.indexOf(note);
    }

    /**
     * Check if note is a white key
     * @param {string} note - Note name
     * @returns {boolean}
     */
    isWhiteKey(note) {
        return this.WHITE_KEYS.includes(note);
    }

    /**
     * Check if note is a black key
     * @param {string} note - Note name
     * @returns {boolean}
     */
    isBlackKey(note) {
        return this.BLACK_KEYS.includes(note);
    }

    /**
     * Get all notes in an octave
     * @param {number} octave - Octave number
     * @returns {Array} Array of note objects {note, frequency}
     */
    getOctaveNotes(octave) {
        return this.NOTE_NAMES.map(note => ({
            note: note + octave,
            frequency: this.noteToFrequency(note, octave)
        }));
    }

    /**
     * Generate frequency range for analysis
     * @param {number} minFreq - Minimum frequency
     * @param {number} maxFreq - Maximum frequency
     * @param {number} sampleRate - Audio sample rate
     * @returns {Object} Analysis parameters
     */
    getAnalysisParams(minFreq = 80, maxFreq = 1200, sampleRate = 44100) {
        return {
            minPeriod: Math.floor(sampleRate / maxFreq),
            maxPeriod: Math.floor(sampleRate / minFreq),
            minFreq,
            maxFreq,
            sampleRate
        };
    }

    /**
     * Calculate cents difference between two frequencies
     * @param {number} freq1 - First frequency
     * @param {number} freq2 - Second frequency
     * @returns {number} Cents difference
     */
    getCentsDifference(freq1, freq2) {
        return Math.round(1200 * Math.log2(freq1 / freq2));
    }

    /**
     * Get chord notes
     * @param {string} root - Root note
     * @param {string} type - Chord type ('major', 'minor')
     * @returns {Array} Array of note names
     */
    getChordNotes(root, type) {
        const rootIndex = this.NOTE_NAMES.indexOf(root);
        if (rootIndex === -1) return [];

        const intervals = {
            'major': [0, 4, 7],  // Root, Major 3rd, Perfect 5th
            'minor': [0, 3, 7]   // Root, Minor 3rd, Perfect 5th
        };

        const chordIntervals = intervals[type] || intervals['major'];
        
        return chordIntervals.map(interval => {
            const noteIndex = (rootIndex + interval) % 12;
            return this.NOTE_NAMES[noteIndex];
        });
    }
}

// Export singleton instance
window.FrequencyUtils = new FrequencyUtils(); 