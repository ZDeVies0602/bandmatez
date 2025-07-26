import { TonalKey } from './TonalKey';
import { Note } from './Note';
import { pitchClasses, pitchClassSequence } from './globals';

export interface AnalyzedChord {        
    root: Note;
    fundamental: Note;
    function: string;
    alteration: string;
    thirdQuality: string;
    nature: string | undefined;
    intervals: {[key: string]: string};
    seventhQuality: string | undefined;
    forerunner: string | undefined;
}

export function chromaticIntervalAdd(a: number, b: number) {
    if(a + b < 0) {
        return 12 - Math.abs(a + b);
    } else {
        return (a + b) % 12;
    }
}

export function diatonicIntervalAdd(a: number, b: number) {
    if(a + b < 0) {
        return 7 - Math.abs(a + b);
    } else {
        return (a + b) % 7;
    }
}

export function chromaticIntervalSubtract(a: number, b: number) {
    if(a > b) {
        return a - b;
    } else {
        return 12 + (a - b);
    }
}

export function diatonicIntervalSubtract(a: number, b: number) {
    if(a > b) {
        return a - b;
    } else {
        return 7 + (a - b);
    }
}

interface Numerals {[key: string]: string[]}
export const numerals: Numerals = {
    "major": ["I", "ii", "iii", "IV", "V", "vi", "vii"],
    "minor": ["i", "ii", "III", "iv", "v", "VI", "VII"]
};

interface Inversions { [key: string]: {[key: string]: {[key: string]: string}}};
export const inversions: Inversions = {
    "root": {
        "triad":  {
            "upper": "",
            "lower": ""
        },
        "seventh": {
            "upper": "7",
            "lower": ""
        }
    },
    "first": {
        "triad":  {
            "upper": "6",
            "lower": ""
        },
        "seventh": {
            "upper": "6",
            "lower": "5"
        }
    },
    "second": {
        "triad":  {
            "upper": "6",
            "lower": "4"
        },
        "seventh": {
            "upper": "4",
            "lower": "3"
        }
    },
    "third": {
        "seventh": {
            "upper": "4",
            "lower": "2"
        }
    }
};

export function analyzeChord(notes: Note[], tonalKey: TonalKey): AnalyzedChord {

    //  Generate the roman numeral functions (e.g. V) for the given key
    function createFunctions(tonalKey: TonalKey) {
        let functions: {[note: string]: string} = {};
        let tonicIndex = pitchClasses.indexOf(tonalKey.tonic);

        let numeralIndex = 0;
        for(let i = tonicIndex; i < tonicIndex + 7; i++) {
            functions[pitchClasses[i % 7]] = numerals[tonalKey.mode][numeralIndex];
            numeralIndex++;
        }

        return functions;
    }

    //  Generate the parallel key's roman numeral functions, for use in case of borrowed chords
    function createParallelFunctions(tonalKey: TonalKey) {
        let functions: {[note: string]: string} = {};
        let tonicIndex = pitchClasses.indexOf(tonalKey.tonic);

        let numeralIndex = 0;
        for(let i = tonicIndex; i < tonicIndex + 7; i++) {
            functions[pitchClasses[i % 7]] = numerals[tonalKey.parallelMode][numeralIndex];
            numeralIndex++;
        }

        return functions;
    }

    //  Determine the main quality of the chord as determined by the third and its relation to the 5th and 7th
    function determineThirdQuality(root: Note, notes: Note[], chordFunction: string){
        let thirds   = notes.filter(note => note.pitchClass == pitchClasses[(root.index + 2) % 7]);
        let fifths   = notes.filter(note => note.pitchClass == pitchClasses[(root.index + 4) % 7]);

        let thirdQuality = chordFunction == chordFunction.toUpperCase() ? "major" : "minor";
        for(let third of thirds){
            if(chromaticIntervalSubtract(third.chromaticIndex, root.chromaticIndex) == 3) {
                thirdQuality = "minor";
            }
            if(chromaticIntervalSubtract(third.chromaticIndex, root.chromaticIndex) == 4) {
                thirdQuality = "major";
            }
        }

        for(let fifth of fifths) {
            if(chromaticIntervalSubtract(fifth.chromaticIndex, root.chromaticIndex) == 6) {
                return "diminished";
            }
            if(chromaticIntervalSubtract(fifth.chromaticIndex, root.chromaticIndex) == 8) {
                return "augmented";
            }
        }        

        return thirdQuality;
    }

    //  Determine the quality of the 7th in the chord, if it exists
    function determineSeventhQuality(root: Note, notes: Note[]) {
        let seventhQuality = undefined;
        let sevenths = notes.filter(note => note.pitchClass == pitchClasses[(root.index + 6) % 7]);

        for(let seventh of sevenths){
            if(chromaticIntervalSubtract(seventh.chromaticIndex, root.chromaticIndex) == 9) {
                seventhQuality = "diminished";
            }
            if(chromaticIntervalSubtract(seventh.chromaticIndex, root.chromaticIndex) == 10) {
                seventhQuality = "minor";
            }
            if(chromaticIntervalSubtract(seventh.chromaticIndex, root.chromaticIndex) == 11) {
                seventhQuality = "major";
            }
        }

        return seventhQuality;
    }

    //  Determine the inversion of the chord by comparing the bass to the fundamental
    function determineInversion(root: Note, notes: Note[]){
        let fundamental = notes[0];

        let sevenths = notes.filter(note => note.pitchClass == pitchClasses[(root.index + 6) % 7]);
        let structure = sevenths.length > 0 ? "seventh" : "triad";

        let intervalFromBass = diatonicIntervalSubtract(root.letterIndex, fundamental.letterIndex) + 1

        let inversion = "root";
        switch(intervalFromBass){
            case 6:
                inversion = "first";
                break;
            case 4: 
                inversion = "second";
                break;
            case 2:
                inversion = "third";
                break;
        }

        return {    
            "upper": inversions[inversion][structure].upper, 
            "lower": inversions[inversion][structure].lower     
        };
    }

    //  Determine the prefix of the chord, whether it's flat, sharp, or empty
    function determineAlteration(root: Note, tonalKey: TonalKey) {
        let keyAlteration = tonalKey.chromaticAlterations[root.pitchClass];
        let chromaticAlteration = root.chromaticIndex - (pitchClassSequence[root.letterIndex] + keyAlteration)

        let alteration = "";
        if(chromaticAlteration == 1) {
            return "♯";
        } 
        if(chromaticAlteration == -1){
            return "♭";
        }

        return alteration;
    }

    //  Determine higher functions of the chord that are unique enough to require specific processing later on
    function determineNature(root: Note, notes: Note[], thirdQuality: string, seventhQuality: string | undefined){

        if(thirdQuality == "major" && seventhQuality == "minor"){
            return "dominant";
        }

        if(thirdQuality == "diminished" && seventhQuality == "diminished") {
            return "fullyDiminished";
        }

        if(thirdQuality == "diminished" && seventhQuality == undefined) {
            return "diminished";
        }

        let sixths = notes.filter(note => note.pitchClass == pitchClasses[(root.index + 5) % 7]);
        for(let sixth of sixths) {
            if(chromaticIntervalSubtract(sixth.chromaticIndex, root.chromaticIndex) == 10) {
            //  Augmented 6th detected
                let fifths = notes.filter(note => note.pitchClass == pitchClasses[(root.index + 4) % 7]);
                for(let fifth of fifths) {
                    if(chromaticIntervalSubtract(fifth.chromaticIndex, root.chromaticIndex) == 7) {
                        return "germanSixth";
                    }
                }
                let fourths = notes.filter(note => note.pitchClass == pitchClasses[(root.index + 3) % 7]);
                for(let fourth of fourths) {
                    if(chromaticIntervalSubtract(fourth.chromaticIndex, root.chromaticIndex) == 6) {
                        return "frenchSixth";
                    }
                }
                return "italianSixth"
            }
        }
        
        return undefined;
    }

    //  Determine if the chord is functioning as another key's chord, and what that key is
    function determineForerunner(root: Note, tonalKey: TonalKey, nature: string | undefined, functions: {[note: string]: string}, parallelFunctions: {[note: string]: string}) {
        let forerunnerIndex = 0;
        let forerunnerNote  = 0;
        switch(nature){
            case "dominant":
                forerunnerIndex = -7;
                forerunnerNote  = -4;
                break;

            case "diminished"     : 
            case "fullyDiminished":
                forerunnerIndex = 1;
                forerunnerNote  = 1;
                break;

            case "germanSixth" :
            case "frenchSixth" :
            case "italianSixth":
                forerunnerIndex = -8;
                forerunnerNote  = -5
        }

        if(forerunnerIndex != 0){
            forerunnerIndex = chromaticIntervalAdd(root.chromaticIndex, forerunnerIndex);
            forerunnerNote  = diatonicIntervalAdd(root.letterIndex, forerunnerNote);
            
            let keyAlteration = tonalKey.chromaticAlterations[pitchClasses[forerunnerNote]];
            let chromaticAlteration = forerunnerIndex - (pitchClassSequence[forerunnerNote] + keyAlteration)
    
            let chordFunction = functions[pitchClasses[forerunnerNote]];
            let alteration = "";
            if(chromaticAlteration != 0) {
                if(chromaticAlteration == 1) {
                    alteration = "♯";
                } 
                if(chromaticAlteration == -1){
                    alteration = "♭";
                }

                chordFunction = parallelFunctions[pitchClasses[forerunnerNote]];
            }

            if(chordFunction.toUpperCase() != "I"){
                return alteration + chordFunction;
            }
        }

        return undefined;
    }

    //  Determine the functional root of the chord
    interface AnalyzedNote {pitchClass: string, score: number, note: Note}
    function determineRoot(notes: Note[]) {
        let analyzedNotes: AnalyzedNote[] = [];
        let pitchesFound = new Set();

        for(let note of notes) {
            let pitchClass = note.pitchClass;
            pitchesFound.add(pitchClass);

            let score = 0;
            let scoreMultiplier = 7
            for(let i = note.letterIndex; i < note.letterIndex + 14; i += 2){
                let pitchChecked = pitchClasses[i % 7];
                let notesFound = notes.filter(function(noteFound){
                    return pitchChecked == noteFound.pitchClass;
                });
                
                if(notesFound.length > 0){
                    switch(i) {
                        case note.letterIndex + 2:
                            for(let noteFound of notesFound){
                                if(chromaticIntervalSubtract(noteFound.chromaticIndex, note.chromaticIndex) == 3
                                || chromaticIntervalSubtract(noteFound.chromaticIndex, note.chromaticIndex) == 4){
                                    score += (scoreMultiplier)
                                    break;
                                }
                            }
                            break;

                        case note.letterIndex + 4: 
                            for(let noteFound of notesFound){
                                if (chromaticIntervalSubtract(noteFound.chromaticIndex, note.chromaticIndex) >=6
                                &&  chromaticIntervalSubtract(noteFound.chromaticIndex, note.chromaticIndex) <=8){
                                    score += (scoreMultiplier)
                                    break;
                                }
                            }
                            break;

                        case note.letterIndex + 6: 
                            for(let noteFound of notesFound){
                                if(chromaticIntervalSubtract(noteFound.chromaticIndex, note.chromaticIndex) == 10
                                || chromaticIntervalSubtract(noteFound.chromaticIndex, note.chromaticIndex) == 11){
                                    score += (scoreMultiplier)
                                    break;
                                }
                            }
                            break;
                            
                        default:
                            score += (scoreMultiplier)
                    }
                } 

                scoreMultiplier--;
            }

            if(note.pitchClass == notes[0].pitchClass && pitchesFound.size > 3) {
                score += 5
            }

            analyzedNotes.push({pitchClass, score, note});
        }

        let root = analyzedNotes.reduce(function(prev, current) { return (prev.score > current.score) ? prev : current; });

        return root.note;
    }

    let functions         = createFunctions(tonalKey);
    let parallelFunctions = createParallelFunctions(tonalKey);

    let chordRoot = determineRoot(notes);
    let rootClass = chordRoot.pitchClass

    let chordFunction   = functions[rootClass];
    let chordIntervals  = determineInversion (chordRoot, notes);
    let chordAlteration = determineAlteration(chordRoot, tonalKey);

    let thirdQuality   = determineThirdQuality  (chordRoot, notes, chordFunction);
    let seventhQuality = determineSeventhQuality(chordRoot, notes);
    
    if(thirdQuality == "minor" || thirdQuality == "diminished") {
        chordFunction = chordFunction.toLowerCase();
    } else {
        chordFunction = chordFunction.toUpperCase();
    }
    
    let chordNature = determineNature(chordRoot, notes, thirdQuality, seventhQuality);

    let chordForerunner = determineForerunner(chordRoot, tonalKey, chordNature, functions, parallelFunctions);

    //  If the chord is functioning from another key, override its roman numeral to said function
    if(chordForerunner != undefined) {
        if(chordNature == "dominant"){
            chordFunction = "V";
        }
        if(chordNature == "diminished" || chordNature == "fullyDiminished"){
            chordFunction = "vii"
        }
    }

    //  If the chord is acting as a V suspension, use Cadential 6/4 notation
    if(chordFunction.toUpperCase() == "I" && chordIntervals.upper == "6" && chordIntervals.lower == "4") {
        if(chordFunction == "I") {
            chordFunction = "C";
        } else {
            chordFunction = "c";
        }
    }

    return {
        root: chordRoot,
        fundamental: notes[0],
        function: chordFunction,
        alteration: chordAlteration,
        nature: chordNature,
        thirdQuality: thirdQuality,
        seventhQuality: seventhQuality,
        intervals: chordIntervals,
        forerunner: chordForerunner
    };
} 