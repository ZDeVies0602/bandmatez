"use client";

import { TonalKey } from '../../lib/music-theory/TonalKey';
import { Note } from '../../lib/music-theory/Note';
import { analyzeChord, AnalyzedChord } from '../../lib/music-theory/ChordAnalyzer';

interface RomanNumeralProps {
    notes: Note[];
    tonalKey: TonalKey;
    bar: number;
    currentBar: number;
}

type AugmentedSixths = { [key: string]: string }
const augmentedSixths: AugmentedSixths = {
    "germanSixth": "Ger",
    "frenchSixth": "Fr",
    "italianSixth": "It"
};

export function RomanNumeral({ notes, tonalKey, bar, currentBar }: RomanNumeralProps) {
    let leftOffset = 75 * bar + 33 + (tonalKey ? tonalKey.keySignatureOffset : 0);
    let lineHeight = 3;
    let fontSize = 19;

    if (notes.length == 0) {
        if (currentBar != bar) {
            return null;
        }
        return (
            <div 
                className={`analysis${bar == currentBar ? " current-bar" : ""}`} 
                style={{ 
                    position: 'absolute',
                    left: leftOffset,
                    fontSize: fontSize,
                    lineHeight: lineHeight,
                    color: 'var(--text-dark)'
                }}
            >
                ...
            </div>
        );
    }

    let analyzedChord: AnalyzedChord = analyzeChord(notes, tonalKey);

    if (analyzedChord.nature != undefined) {
        let augmentedSixth = augmentedSixths[analyzedChord.nature];
        if (augmentedSixth != undefined) {
            //  Augmented Sixth chords call for specific notation, possibly including a forerunner
            let forerunner = "";
            if (analyzedChord.forerunner != undefined) {
                forerunner = " / " + analyzedChord.forerunner;
            }

            let lengthString = augmentedSixth + "+" + forerunner;

            fontSize = lengthString.length >= 10 ? 15 : 19;
            lineHeight = lengthString.length >= 10 ? 4 : 3;

            return (
                <div 
                    className="analysis" 
                    style={{ 
                        position: 'absolute',
                        left: leftOffset + 5, 
                        fontSize: fontSize, 
                        lineHeight: lineHeight,
                        color: 'var(--text-dark)'
                    }}
                >
                    {augmentedSixth}<sup>+6</sup>
                    {forerunner}
                </div>
            );
        }
    }

    let extendedQuality = undefined;
    let extendedQualityString = "";
    switch (analyzedChord.thirdQuality) {
        case "minor":
            if (analyzedChord.seventhQuality == "halfDiminished") {
                extendedQuality = <sup><span style={{ fontSize: 11, marginLeft: 1 }}>ø</span></sup>;
                extendedQualityString = "ø";
            }
            break;

        case "major":
            break;

        case "diminished":
            analyzedChord["function"] = analyzedChord["function"] + "°";
            extendedQualityString = "°";
            break;

        case "halfDiminished":
            extendedQuality = <sup><span style={{ fontSize: 11, marginLeft: 1 }}>ø</span></sup>;
            extendedQualityString = "ø";
            break;

        case "augmented":
            extendedQuality = <sup>+</sup>;
            extendedQualityString = "+";
    }

    let intervals = analyzedChord.intervals;
    let intervalsElement = (
        <div className="interval-container" style={{ display: 'inline-block', verticalAlign: 'super' }}>
            <span className="upper-interval" style={{ fontSize: '12px', display: 'block', lineHeight: '0.8' }}>
                {intervals.upper}
            </span>
            <span className="lower-interval" style={{ fontSize: '12px', display: 'block', lineHeight: '0.8' }}>
                {intervals.lower}
            </span>
        </div>
    );

    let forerunner = "";
    if (analyzedChord.forerunner != undefined) {
        forerunner = " / " + analyzedChord.forerunner;
    }

    let lengthString = analyzedChord.alteration + analyzedChord.function + extendedQualityString + intervals.upper + intervals.lower + forerunner;

    fontSize = lengthString.length >= 11 ? 15 : 19;
    lineHeight = lengthString.length >= 11 ? 4 : 3;

    return (
        <div 
            className={`analysis${bar == currentBar ? " current-bar" : ""}`} 
            style={{ 
                position: 'absolute',
                left: leftOffset, 
                fontSize: fontSize, 
                lineHeight: lineHeight,
                color: 'var(--text-dark)',
                fontWeight: bar == currentBar ? 'bold' : 'normal'
            }}
        >
            {analyzedChord.alteration}{analyzedChord.function}
            {extendedQuality}
            {intervalsElement}
            {forerunner}
        </div>
    );
} 