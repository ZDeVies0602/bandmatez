"use client";

import { useTheme } from "../contexts/ThemeContext";
import { ThemeType } from "../types";

export function useThemeClasses() {
  const { theme } = useTheme();

  // Base classes that work with CSS custom properties
  const baseClasses = {
    // Backgrounds
    backgroundGradient:
      "bg-gradient-to-br from-[var(--bg-light)] via-[var(--bg-muted)] to-[var(--bg-light)]",
    backgroundLight: "bg-[var(--bg-light)]",
    backgroundMuted: "bg-[var(--bg-muted)]",

    // Text colors
    textDark: "text-[var(--text-dark)]",
    textNeutral: "text-[var(--neutral-gray)]",

    // Accent colors
    accentRed: "bg-[var(--accent-red)]",
    accentRedText: "text-[var(--accent-red)]",
    accentRedBorder: "border-[var(--accent-red)]",

    // Shape colors (for geometric elements)
    shapeColor1: "bg-[var(--shape-color-1)]",
    shapeColor2: "bg-[var(--shape-color-2)]",
    shapeColor3: "bg-[var(--shape-color-3)]",
    shapeColor4: "bg-[var(--shape-color-4)]",
    shapeColor5: "bg-[var(--shape-color-5)]",

    // Common component patterns
    card: "bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl",
    cardSmall: "bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg",
    glassButton:
      "bg-white/20 backdrop-blur-lg border border-white/30 hover:bg-white/30 transition-all duration-300",
    input:
      "bg-white/10 backdrop-blur-lg border border-white/20 text-[var(--text-dark)] placeholder-[var(--neutral-gray)]",

    // Metronome specific
    metronomeBody:
      "bg-gradient-to-b from-[var(--shape-color-1)] via-[var(--shape-color-2)] to-[var(--shape-color-1)]",
    metronomePendulum: "bg-[var(--shape-color-3)]",
    metronomeWeight:
      "bg-gradient-to-b from-[var(--shape-color-4)] to-[var(--shape-color-2)]",
  };

  // Theme-specific overrides for special cases
  const themeOverrides: Record<ThemeType, Partial<typeof baseClasses>> = {
    default: {},
    "desert-clay": {
      metronomeBody:
        "bg-gradient-to-b from-[#262322] via-[#E07A5F] to-[#262322]",
    },
    "crimson-night": {
      metronomeBody:
        "bg-gradient-to-b from-[#540101] via-[#8B0000] to-[#540101]",
    },
    "navy-geometric": {
      metronomeBody:
        "bg-gradient-to-b from-[#002C60] via-[#506B8B] to-[#002C60]",
    },
    "green-palette": {
      metronomeBody:
        "bg-gradient-to-b from-[#002005] via-[#164F29] to-[#002005]",
    },
    "university-gold": {
      metronomeBody:
        "bg-gradient-to-b from-[#00274C] via-[#FFCB05] to-[#00274C]",
    },
    "steel-crimson": {
      metronomeBody:
        "bg-gradient-to-b from-[#1B4F72] via-[#990000] to-[#1B4F72]",
    },
  };

  // Merge base classes with theme overrides
  const finalClasses = {
    ...baseClasses,
    ...themeOverrides[theme],
  };

  return finalClasses;
}

// Helper function to get theme-specific classes for complex components
export function getThemeSpecificClasses(theme: ThemeType) {
  const themeClasses = {
    default: {
      primary: "#31081F",
      secondary: "#6B0F1A",
      accent: "#595959",
      muted: "#808F85",
      light: "#DCE0D9",
    },
    "desert-clay": {
      primary: "#262322",
      secondary: "#E07A5F",
      accent: "#81A4B1",
      muted: "#F4DDB5",
      light: "#FFF8F0",
    },
    "crimson-night": {
      primary: "#540101",
      secondary: "#8B0000",
      accent: "#B22222",
      muted: "#8B0000",
      light: "#FAFAFA",
    },
    "navy-geometric": {
      primary: "#FFFFFF",
      secondary: "#FFFFFF",
      accent: "#FFFFFF",
      muted: "#506B8B",
      light: "#D4E6F9",
    },
    "green-palette": {
      primary: "#002005",
      secondary: "#164F29",
      accent: "#3B7639",
      muted: "#164F29",
      light: "#B5C5B4",
    },
    "university-gold": {
      primary: "#00274C",
      secondary: "#FFCB05",
      accent: "#CFC096",
      muted: "#989C97",
      light: "#E4E1DF",
    },
    "steel-crimson": {
      primary: "#1A2332",
      secondary: "#990000",
      accent: "#7BA8C5",
      muted: "#888888",
      light: "#F1F0EE",
    },
  };

  return themeClasses[theme];
}
