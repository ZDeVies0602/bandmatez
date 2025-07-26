import { TonalKey } from './TonalKey';
import { pitchClassSequence, pitchClasses } from './globals';

export class Note {
    letterIndex: number;
    naturalIndex: number;
    index: number;
    chromaticAlteration: number;
    terminated: boolean;
    reactKey: string;

    constructor(
        public pitchClass: string,
        public octave: number, 
        public offset: number, 
        public chromaticIndex: number, 
        public tonalKey: TonalKey,
        public audio: HTMLAudioElement
    ) {
        this.letterIndex = pitchClasses.indexOf(this.pitchClass);
        this.naturalIndex = pitchClassSequence[this.letterIndex];
        this.index = pitchClasses.indexOf(this.pitchClass) + (this.octave * 7);
        this.chromaticAlteration = this.getChromaticAlteration();
        this.terminated = false;
        this.reactKey = this.pitchClass + this.chromaticIndex + this.octave;
    }

    getChromaticAlteration() {
        //  Get distance between chromaticIndex and naturalIndex using wraparound methodology, e.g.
        //  11 and 0 results in an alteration of -1 as in [8 9 10 11 0 1 etc.] 11 is one index behind
        let chromaticAlteration = this.chromaticIndex - this.naturalIndex;
        if(chromaticAlteration > 6) {
            chromaticAlteration -= 12;
        } else if (chromaticAlteration < -6) {
            chromaticAlteration += 12;
        }

        return chromaticAlteration;
    }

    getKeyAlteration() {
        //  Determines how many steps the pitchClass is away from the target chromaticIndex, taking into account the key signature
        return this.chromaticIndex - (pitchClassSequence[this.letterIndex] + this.tonalKey.chromaticAlterations[this.pitchClass]);
    }
} 