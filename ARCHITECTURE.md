# Music Tools - Modular Architecture

This document describes the new modular architecture that replaces the previous monolithic structure.

## Architecture Overview

The application is now split into focused, single-responsibility modules that work together through well-defined interfaces.

## Core Modules (Shared Infrastructure)

Located in `/core/` directory - these provide shared functionality across all components:

### AudioManager.js
- **Purpose**: Centralized Web Audio API management
- **Responsibilities**:
  - Audio context creation and lifecycle management
  - Audio node factory methods (oscillators, gain nodes, filters)
  - Master volume control
  - Context state management (suspended/running)
- **Usage**: `window.AudioManager.initialize()` then access methods
- **Benefits**: Single audio context shared across all tools, automatic context resumption

### FrequencyUtils.js
- **Purpose**: Note and frequency calculations
- **Responsibilities**:
  - Note-to-frequency conversion using equal temperament
  - Frequency-to-note conversion with cents calculation
  - Chord generation
  - Analysis parameter calculations
  - A4 reference frequency management
- **Usage**: `window.FrequencyUtils.noteToFrequency('A', 4)` returns 440Hz
- **Benefits**: Consistent tuning across all tools, centralized music theory calculations

### ThemeManager.js
- **Purpose**: Visual theme management
- **Responsibilities**:
  - Theme switching and persistence
  - Menu interactions
  - CSS class management
  - Theme-specific color coordination
- **Usage**: `window.ThemeManager.setTheme('ocean-depths')`
- **Benefits**: Consistent theming, saved preferences, coordinated menus

## Component Modules

### MetronomeSounds.js
- **Purpose**: Metronome-specific sound generation
- **Responsibilities**:
  - Different sound type implementations (digital, wood, mechanical, etc.)
  - Sound preview functionality
  - Sound menu management
  - Audio node configuration for each sound type
- **Usage**: `window.MetronomeSounds.createSound('cowbell', true, 0.8)`
- **Benefits**: Modular sound system, easy to add new sound types

## Main Controllers

### AppController.js
- **Purpose**: Application orchestration and lifecycle management
- **Responsibilities**:
  - Initialize core modules in correct order
  - Manage tab system and navigation
  - Component lifecycle management (create/destroy on tab switch)
  - Coordinate inter-component communication
- **Usage**: Automatically initializes on DOM load
- **Benefits**: Clean separation of concerns, lazy loading, proper cleanup

## Updated Legacy Components

The existing components have been refactored to work with the new architecture:

### Metronome (metronome-script.js)
- **Changes**: 
  - Now uses AudioManager instead of direct Web Audio API
  - Uses MetronomeSounds for sound generation
  - Simplified audio context management
  - Removed theme/sound menu handling (moved to dedicated managers)
- **Benefits**: Smaller, more focused, reusable audio system

### Tuner & Piano
- **Status**: Currently using legacy architecture but ready for refactoring
- **Next Steps**: Will be split into Core/UI/Controller modules

## File Structure

```
/
├── core/
│   ├── AudioManager.js          # Shared audio management
│   ├── FrequencyUtils.js        # Music calculations
│   └── ThemeManager.js          # Theme management
├── components/
│   └── metronome/
│       └── MetronomeSounds.js   # Metronome sounds
├── metronome-script.js          # Metronome logic (refactored)
├── tuner-script.js              # Tuner logic (legacy)
├── piano-script.js              # Piano logic (legacy)
├── AppController.js             # Main app controller
├── metronome-app.html           # Updated HTML with proper script loading
└── metronome-styles.css         # Styles (unchanged)
```

## Benefits of New Architecture

### 1. **Separation of Concerns**
- Each module has a single, clear responsibility
- Easy to understand and maintain individual components
- Clear interfaces between modules

### 2. **Reduced Code Duplication**
- Shared functionality (audio, frequency calculations) centralized
- Common patterns abstracted into reusable utilities

### 3. **Better Testing**
- Each module can be tested independently
- Clear dependencies make mocking easier
- Isolated functionality easier to validate

### 4. **Easier Extension**
- Adding new sound types: just extend MetronomeSounds
- Adding new themes: just update ThemeManager
- Adding new tools: follow the established patterns

### 5. **Performance Improvements**
- Single audio context shared across all tools
- Lazy loading of components (only load when tab is active)
- Proper cleanup prevents memory leaks

### 6. **Maintainability**
- Smaller files are easier to navigate and understand
- Clear module boundaries
- Consistent patterns across components

## Migration Path

The architecture supports incremental migration:

1. ✅ **Phase 1**: Core modules and metronome refactored
2. 🔄 **Phase 2**: Tuner component refactoring
3. 🔄 **Phase 3**: Piano component refactoring
4. 🔄 **Phase 4**: Additional shared utilities as needed

## Usage Examples

### Adding a New Sound Type
```javascript
// In MetronomeSounds.js, add to availableSounds array:
this.availableSounds.push('new-sound');

// Add case in configureSoundType method:
case 'new-sound':
    oscillator.frequency.value = isAccent ? 1600 : 1200;
    oscillator.type = 'sawtooth';
    // ... configure other properties
    break;
```

### Using Shared Audio System
```javascript
// Any component can use the shared audio manager:
const audioManager = window.AudioManager;
await audioManager.initialize();
const oscillator = audioManager.createOscillator();
const gainNode = audioManager.createGain();
// ... use nodes
```

### Adding Component Cleanup
```javascript
// In any component, add destroy method:
async destroy() {
    // Stop audio
    this.stopAllSounds();
    // Clean up DOM listeners
    this.removeEventListeners();
    // Clear timers
    if (this.intervalId) clearInterval(this.intervalId);
}
```

This architecture provides a solid foundation for continued development while maintaining all existing functionality. 