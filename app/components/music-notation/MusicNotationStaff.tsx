"use client";

import { useState, useEffect } from 'react';
import { Clef } from './Clef';
import { NoteComponent } from './NoteComponent';
import { ChordSymbol } from './ChordSymbol';
import { RomanNumeral } from './RomanNumeral';
import { Note } from '../../lib/music-theory/Note';
import { TonalKey } from '../../lib/music-theory/TonalKey';
import { useThemeClasses } from '../../hooks/useThemeClasses';

interface MusicNotationStaffProps {
    bars: Array<Note[]>;
    tonalKey?: TonalKey;
    currentBar: number;
    onBarClick?: (barIndex: number) => void;
}

export function MusicNotationStaff({ bars, tonalKey, currentBar, onBarClick }: MusicNotationStaffProps) {
    const themeClasses = useThemeClasses();

    const staffStyle = {
        display: 'inline-block',
        position: 'relative' as const,
        backgroundColor: 'white',
        width: '700px',
        height: '115px',
        fontSize: 0,
        backgroundImage: `linear-gradient(180deg, #000 0, #000 1px, transparent 1px, transparent 8px, #000 8px, #000 9px, transparent 9px, transparent 16px, #000 16px, #000 17px, transparent 17px, transparent 24px, #000 24px, #000 25px, transparent 25px, transparent 32px, #000 32px, #000 33px, transparent 33px),
                         linear-gradient(180deg, #000 0, #000 1px, transparent 1px, transparent 8px, #000 8px, #000 9px, transparent 9px, transparent 16px, #000 16px, #000 17px, transparent 17px, transparent 24px, #000 24px, #000 25px, transparent 25px, transparent 32px, #000 32px, #000 33px, transparent 33px)`,
        backgroundSize: '100% 48px',
        backgroundPosition: 'right 10px top 16px, right 10px top 64px',
        backgroundRepeat: 'no-repeat',
        lineHeight: 0,
        verticalAlign: 'top' as const,
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        border: '1px solid rgba(0,0,0,0.1)'
    };

    const clefStyles = {
        treble: {
            position: 'absolute' as const,
            backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Ctext y=\'70\' x=\'20\' font-size=\'70\' font-family=\'serif\'%3E𝄞%3C/text%3E%3C/svg%3E")',
            backgroundRepeat: 'no-repeat',
            height: '60px',
            backgroundSize: 'contain',
            width: '40px',
            left: '5px',
            top: '4px',
        },
        bass: {
            position: 'absolute' as const,
            backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Ctext y=\'70\' x=\'20\' font-size=\'60\' font-family=\'serif\'%3E𝄢%3C/text%3E%3C/svg%3E")',
            backgroundRepeat: 'no-repeat',
            height: '60px',
            backgroundSize: 'contain',
            width: '40px',
            left: '5px',
            top: '52px',
        }
    };

    return (
        <div className="staff-container bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg p-4">
            {/* Chord Symbols */}
            <div className="chord-reel" style={{
                display: 'inline-block',
                width: '700px',
                height: '35px',
                backgroundColor: '#fbfdff',
                margin: '0px auto 0px',
                lineHeight: 0,
                fontSize: 0,
                borderBottom: '1px solid grey',
                verticalAlign: 'top' as const,
                borderRadius: '4px 4px 0 0',
                position: 'relative'
            }}>
                {bars.map((bar, index) => (
                    <ChordSymbol
                        key={index}
                        notes={bar}
                        bar={index}
                        tonalKey={tonalKey as TonalKey}
                    />
                ))}
            </div>

            {/* Staff */}
            <div className="staff" style={staffStyle}>
                {/* Treble Clef */}
                <div style={clefStyles.treble}>
                    {tonalKey && <Clef type="treble" tonalKey={tonalKey} />}
                </div>

                {/* Bass Clef */}
                <div style={clefStyles.bass}>
                    {tonalKey && <Clef type="bass" tonalKey={tonalKey} />}
                </div>

                {/* Bars and Notes */}
                {bars.map((bar, index) => (
                    <div
                        key={index}
                        className="bar-container cursor-pointer"
                        onClick={() => onBarClick?.(index)}
                        style={{
                            position: 'absolute',
                            width: '75px',
                            top: '-47px',
                            height: '207px',
                            left: (75 * index) + 45 + (tonalKey ? tonalKey.keySignatureOffset : 0),
                            transition: 'left 0.5s',
                            zIndex: 6,
                            backgroundColor: index === currentBar ? 'rgba(255, 255, 0, 0.1)' : 'transparent',
                            borderRadius: '4px'
                        }}
                    >
                        <div
                            className="bar"
                            style={{
                                position: 'absolute',
                                width: '75px',
                                height: '117px',
                                top: '47px',
                                transition: 'left 0.5s'
                            }}
                        >
                            {bar.map(note => (
                                <NoteComponent
                                    key={note.reactKey}
                                    bar={index}
                                    pitchClass={note.pitchClass}
                                    octave={note.octave}
                                    offset={note.offset}
                                    tonalKey={tonalKey as TonalKey}
                                    chromaticIndex={note.chromaticIndex}
                                    letterIndex={note.letterIndex}
                                    currentBar={currentBar}
                                    terminated={note.terminated}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Roman Numeral Analysis */}
            <div className="analysis-reel" style={{
                display: 'inline-block',
                width: '700px',
                height: '35px',
                backgroundColor: '#f8f9fa',
                margin: '0px auto 0px',
                lineHeight: 0,
                fontSize: 0,
                borderTop: '1px solid grey',
                verticalAlign: 'top' as const,
                borderRadius: '0 0 4px 4px',
                position: 'relative'
            }}>
                {bars.map((bar, index) => (
                    <RomanNumeral
                        key={index}
                        notes={bar}
                        bar={index}
                        tonalKey={tonalKey as TonalKey}
                        currentBar={currentBar}
                    />
                ))}
            </div>
        </div>
    );
} 