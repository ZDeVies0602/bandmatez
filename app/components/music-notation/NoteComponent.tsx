"use client";

import { pitchClasses, pitchClassSequence } from '../../lib/music-theory/globals';
import { TonalKey } from '../../lib/music-theory/TonalKey';

interface NoteComponentProps {
    bar: number;
    pitchClass: string;
    octave: number;
    offset: number;
    chromaticIndex: number;
    tonalKey: TonalKey;
    letterIndex: number;
    currentBar: number;
    terminated: boolean;
}

export function NoteComponent({
    bar,
    pitchClass,
    octave,
    offset,
    chromaticIndex,
    tonalKey,
    letterIndex,
    currentBar,
    terminated
}: NoteComponentProps) {
    let topOffset = pitchClasses.indexOf(pitchClass) * 4 + 34 + (7 * 4 * octave);
    let leftOffset = 10 + (offset * 12);

    let keyAlteration = tonalKey.chromaticAlterations[pitchClass];
    let accidentalText = "";
    let chromaticAlteration = chromaticIndex - (pitchClassSequence[letterIndex] + keyAlteration);

    switch (chromaticAlteration) {
        case 1:
            if (tonalKey.sharps == true) {
                keyAlteration == 1 ? accidentalText = "x" : accidentalText = "♯";
            } else {
                keyAlteration == -1 ? accidentalText = "♮" : accidentalText = "♯";
            }
            break;

        case 2:
            if (tonalKey.sharps == true) {
                accidentalText = "x";
            } else {
                keyAlteration == -1 ? accidentalText = "♯" : accidentalText = "x";
            }
            break;

        case -1:
            if (tonalKey.sharps == true) {
                keyAlteration == 1 ? accidentalText = "♮" : accidentalText = "♭";
            } else {
                keyAlteration == -1 ? accidentalText = "♭♭" : accidentalText = "♭";
            }
            break;

        case -2:
            if (tonalKey.sharps == true) {
                keyAlteration == 1 ? accidentalText = "♭" : accidentalText = "♭♭";
            } else {
                keyAlteration == -1 ? accidentalText = "♭♭♭" : accidentalText = "♭♭";
            }
    }

    if (offset > 0) {
        leftOffset += (10 * accidentalText.length);
    }

    let accidentalOffset = 0;
    if (accidentalText.includes("♭")) {
        accidentalOffset = -5;
    }

    return (
        <div 
            className={`note-head ${terminated ? 'note-terminated' : ''}`}
            style={{
                position: 'absolute',
                top: `${-topOffset}px`,
                left: `${leftOffset}px`,
                transition: terminated ? 'opacity 0.2s ease-out' : 'none',
                opacity: terminated ? 0 : 1
            }}
        >
            {/* Note head */}
            <div className="note-symbol">♩</div>
            
            {/* Accidental */}
            {accidentalText && (
                <div 
                    className="accidental"
                    style={{
                        position: 'absolute',
                        left: `${accidentalOffset}px`,
                        top: '0px'
                    }}
                >
                    {accidentalText}
                </div>
            )}
        </div>
    );
} 