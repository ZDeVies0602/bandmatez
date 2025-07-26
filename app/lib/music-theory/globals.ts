export const chromaticScale = [
    {"sharpPitchClass": "C",  "flatPitchClass": "C",  "type": "white"},
    {"sharpPitchClass": "C♯", "flatPitchClass": "D♭", "type": "black"},
    {"sharpPitchClass": "D",  "flatPitchClass": "D", "type": "white"},
    {"sharpPitchClass": "D♯", "flatPitchClass": "E♭", "type": "black"},
    {"sharpPitchClass": "E",  "flatPitchClass": "E",  "type": "white"},
    {"sharpPitchClass": "F",  "flatPitchClass": "F",  "type": "white"},
    {"sharpPitchClass": "F♯", "flatPitchClass": "G♭", "type": "black"},
    {"sharpPitchClass": "G",  "flatPitchClass": "G",  "type": "white"},
    {"sharpPitchClass": "G♯", "flatPitchClass": "A♭", "type": "black"},
    {"sharpPitchClass": "A",  "flatPitchClass": "A",  "type": "white"},
    {"sharpPitchClass": "A♯", "flatPitchClass": "B♭", "type": "black"},
    {"sharpPitchClass": "B",  "flatPitchClass": "B",  "type": "white"}
];

export const pitchClasses = ["C", "D", "E", "F", "G", "A", "B"];
export const pitchClassSequence = [0, 2, 4, 5, 7, 9, 11];

type Modes = { [mode: string]: number[]; }
export const modes: Modes = {
    "minor": [0, 2, 3, 5, 7, 8, 10],
    "major": [0, 2, 4, 5, 7, 9, 11]
};

export const sharpsSignatureMap = {
    "C": {"top": 27, "left": 40},
    "D": {"top": 23, "left": 60},
    "E": {"top": 19, "left": 80},
    "F": {"top": 15, "left": 30},
    "G": {"top": 10, "left": 50},
    "A": {"top": 35, "left": 70},
    "B": {"top": 31, "left": 90}
};

export const flatsSignatureMap = {
    "C": {"top": 22, "left": 80},
    "D": {"top": 18, "left": 60},
    "E": {"top": 14, "left": 40},
    "F": {"top": 38, "left": 90},
    "G": {"top": 34, "left": 70},
    "A": {"top": 30, "left": 50},
    "B": {"top": 26, "left": 30}
}; 