import { pitchClassSequence, modes, pitchClasses } from './globals';

export interface ChromaticAlterations {[letter: string]: number}

export class TonalKey {
    chromaticAlterations: ChromaticAlterations;
    parallelMode: string;
    keySignatureOffset: number;
    sharps: boolean;
    index: number;

    constructor(
        public tonic: string,
        public tonicChromaticIndex: number, 
        public mode: string, 
    ) {
        let chromaticAlterations: ChromaticAlterations = {};
        let intervalSequence = modes[mode];
        let tonicIndex = pitchClasses.indexOf(tonic);
        let keySignatureOffset = 0;
        let sharpsCompatible = true;

        let sequenceIndex = 0;
        for(let i = tonicIndex; i < 7 + tonicIndex; i++){
            let letterIndex    = i % 7;                               // 0 -  6 index of note letter, e.g. 1 = D
            let chromaticIndex = this.tonicChromaticIndex + intervalSequence[sequenceIndex] % 12;      // 0 - 12 index of note value , e.g. 1 = C# or Db or B## or Ebbb
            let currentLetter  = pitchClasses[letterIndex];           // Pitch class of current Note
            let naturalIndex = pitchClassSequence[letterIndex];

        //  Get distance between chromaticIndex and naturalIndex using wraparound methodology, e.g.
        //  11 and 0 results in an alteration of -1 as in [8 9 10 11 0 1 etc.] 11 is one index behind
            let chromaticAlteration = chromaticIndex - naturalIndex;
            if(chromaticAlteration > 6) {
                chromaticAlteration -= 12;
            } else if (chromaticAlteration < -6) {
                chromaticAlteration += 12;
            }

            chromaticAlterations[currentLetter] = chromaticAlteration;

            if(chromaticAlteration != 0){
              keySignatureOffset += 11;
            }
            
            if(chromaticAlteration < 0) {
              sharpsCompatible = false;
            }
          
            sequenceIndex++;
        }

        this.chromaticAlterations = chromaticAlterations;
        this.parallelMode = (this.mode == "major" ? "minor" : "major");
        this.keySignatureOffset = keySignatureOffset;
        this.sharps = sharpsCompatible;
        this.index = tonicChromaticIndex;
    }
} 