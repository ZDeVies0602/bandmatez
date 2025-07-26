"use client";

import { TonalKey } from '../../lib/music-theory/TonalKey';
import { Note } from '../../lib/music-theory/Note';
import { pitchClassSequence } from '../../lib/music-theory/globals';
import { analyzeChord, AnalyzedChord } from '../../lib/music-theory/ChordAnalyzer';

interface ChordSymbolProps {
    notes: Note[];
    tonalKey: TonalKey;
    bar: number;
}

export function ChordSymbol({ notes, tonalKey, bar }: ChordSymbolProps) {
    if (notes.length == 0) {
        return null;
    }

    let analyzedChord: AnalyzedChord = analyzeChord(notes, tonalKey);

    let symbol = analyzedChord.root.pitchClass;

    let naturalIndex = pitchClassSequence[analyzedChord.root.letterIndex];

    //  Get distance between chromaticIndex and naturalIndex using wraparound methodology, e.g.
    //  11 and 0 results in an alteration of -1 as in [8 9 10 11 0 1 etc.] 11 is one index behind
    let chromaticAlteration = analyzedChord.root.chromaticIndex - naturalIndex;
    if (chromaticAlteration > 6) {
        chromaticAlteration -= 12;
    } else if (chromaticAlteration < -6) {
        chromaticAlteration += 12;
    }

    let alterationText = "";
    switch (chromaticAlteration) {
        case 1:
            alterationText = "♯";
            break;

        case 2:
            alterationText = "x";
            break;

        case -1:
            alterationText = "♭";
            break;

        case -2:
            alterationText = "♭♭";
    }

    let quality = "";
    switch (analyzedChord.thirdQuality) {
        case "minor":
            symbol = symbol.toLowerCase();
            break;

        case "diminished":
            quality = "dim";
            symbol = symbol.toLowerCase();
            if (analyzedChord.seventhQuality == "halfDiminished") {
                quality = "m7♭5";
            }
            break;

        case "major":
            if (analyzedChord.seventhQuality == "minor") {
                quality = "7";
            }
            if (analyzedChord.seventhQuality == "major") {
                quality = "maj7"
            }
            break;

        case "augmented":
            quality = "aug";
    }

    if (analyzedChord.nature == "italianSixth" || analyzedChord.nature == "frenchSixth" || analyzedChord.nature == "germanSixth") {
        quality = "7"
    }

    let leftOffset = 75 * bar + 33 + tonalKey?.keySignatureOffset;

    let inversion = "";
    if (analyzedChord.root.pitchClass != analyzedChord.fundamental.pitchClass) {
        let naturalFundamentalIndex = pitchClassSequence[analyzedChord.fundamental.letterIndex];
        let chromaticAlteration = analyzedChord.fundamental.chromaticIndex - naturalFundamentalIndex;
        if (chromaticAlteration > 6) {
            chromaticAlteration -= 12;
        } else if (chromaticAlteration < -6) {
            chromaticAlteration += 12;
        }

        let fundamentalAlterationText = "";
        switch (chromaticAlteration) {
            case 1:
                fundamentalAlterationText = "♯";
                break;

            case 2:
                fundamentalAlterationText = "x";
                break;

            case -1:
                fundamentalAlterationText = "♭";
                break;

            case -2:
                fundamentalAlterationText = "♭♭";
        }

        inversion = " / " + analyzedChord.fundamental.pitchClass + fundamentalAlterationText;
    }

    return (
        <div 
            className="chord-symbol" 
            style={{ 
                position: 'absolute',
                left: leftOffset + 5,
                fontSize: '18px',
                fontWeight: '300',
                color: 'var(--text-dark)',
                top: '-5px',
                height: '40px',
                width: '80px',
                textAlign: 'center',
                lineHeight: '3',
                transition: 'left 0.5s'
            }}
        >
            {symbol}
            {alterationText}
            <span style={{ fontSize: 16 }}>{quality}</span>
            {inversion}
        </div>
    );
} 