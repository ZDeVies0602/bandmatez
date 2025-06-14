# 🎵 Music Tools Suite

A comprehensive Next.js application featuring professional music tools: **Virtual Piano**, **Metronome**, and **Pitch Tuner**.

## ✨ Features

### 🎹 Virtual Piano
- **88-key piano** (A0 to C8) with smooth scrolling
- **Ultra-optimized edge key visibility** with instant response
- **44-key viewport** with 22-key scroll increments
- **Multiple waveforms**: sine, square, sawtooth, triangle
- **ADSR envelope** with adjustable volume and sustain
- **Chord support** with major/minor presets
- **Keyboard mapping** for QWERTY keyboard play
- **Real-time frequency display**

### 🎵 Metronome
- **BPM range**: 30-300 with precision control
- **Tap tempo** for natural rhythm setting
- **Time signatures**: 2/4, 3/4, 4/4, 5/4, 6/8, 7/8, 9/8, 12/8
- **Subdivisions**: quarter notes, eighth notes, triplets, sixteenth notes
- **Visual pendulum** with smooth animation
- **Beat indicators** with accent patterns
- **Audio synthesis** for crisp metronome sounds

### 🎤 Pitch Tuner
- **Real-time pitch detection** using autocorrelation
- **Cents display** with ±50 cent range
- **Visual tuning meter** with color-coded accuracy
- **Note detection** with octave display
- **Input level monitoring**
- **Microphone access** with noise filtering

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone/Download** the project files
2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run development server**:
   ```bash
   npm run dev
   ```

4. **Open browser** to `http://localhost:3000`

### Production Build
```bash
npm run build
npm start
```

## 📁 Project Structure

```
music-tools-suite/
├── app/
│   ├── components/
│   │   ├── VirtualPiano.tsx      # Piano component
│   │   ├── Metronome.tsx         # Metronome component
│   │   ├── PitchTuner.tsx        # Tuner component
│   │   └── TabNavigation.tsx     # Tab navigation
│   ├── hooks/
│   │   ├── useAudioManager.ts    # Audio context management
│   │   ├── useTheme.ts           # Theme switching
│   │   └── useMetronomeSounds.ts # Metronome audio
│   ├── styles/
│   │   ├── globals.css           # Global styles & themes
│   │   ├── components.module.css # Component styles
│   │   └── piano.module.css      # Piano-specific styles
│   ├── types/
│   │   └── index.ts              # TypeScript definitions
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Main page component
├── package.json
├── tsconfig.json
├── next.config.js
└── README.md
```

## 🎨 Themes

5 beautiful themes included:
- 🌙 **Dark** - Professional dark theme
- ☀️ **Light** - Clean light theme  
- 🌊 **Ocean Blue** - Oceanic blue palette
- 🌲 **Forest Green** - Natural green theme
- 👑 **Royal Purple** - Elegant purple theme

## 🎯 Technical Highlights

### Performance Optimizations
- **Pre-calculated scroll positions** for instant piano navigation
- **Cached DOM elements** to avoid repeated queries
- **RequestAnimationFrame polling** for 60fps updates
- **Minimal re-renders** with optimized React state management

### Audio Features  
- **Web Audio API** for low-latency audio synthesis
- **ADSR envelope synthesis** for realistic piano sounds
- **Autocorrelation pitch detection** for accurate tuning
- **Master gain control** with proper audio routing

### Responsive Design
- **Mobile-optimized** piano keyboard
- **Touch-friendly** controls
- **Adaptive layouts** for all screen sizes
- **Accessible** keyboard navigation

## 🎮 Controls

### Piano Controls
- **Mouse**: Click keys to play
- **Keyboard**: ZSXDCVGBHNJM (lower octave), QWERTYUIOP (upper octave)
- **Navigation**: ◀▶ buttons or ←→ arrow keys
- **Scrolling**: Touchpad/mouse wheel supported

### Metronome Controls
- **Start/Stop**: Space bar or click button
- **Tap Tempo**: Click tap button to set BPM
- **BPM**: Slider, input field, or mouse wheel
- **Time Signature**: Dropdown selection

### Tuner Controls
- **Start Tuning**: Click microphone button
- **Microphone**: Requires browser permission
- **Visual Feedback**: Color-coded tuning accuracy

## 🔧 Browser Requirements

- **Chrome/Edge**: Full support
- **Firefox**: Full support  
- **Safari**: Full support (iOS 13.4+)
- **Microphone access** required for tuner
- **Audio context** enabled (user interaction required)

## 📱 Mobile Support

- Responsive design for phones and tablets
- Touch-optimized piano keys
- Swipe gesture support
- Mobile-friendly controls

## 🔊 Audio Permissions

The tuner requires microphone access. Grant permission when prompted for pitch detection functionality.

## 🎼 Usage Tips

### Piano
- Use keyboard shortcuts for faster playing
- Adjust sustain for different playing styles
- Try different waveforms for unique sounds
- Use chord presets for quick harmonic exploration

### Metronome  
- Use tap tempo for setting natural rhythms
- Try different subdivisions for complex patterns
- Visual pendulum helps maintain steady tempo
- Practice with different time signatures

### Tuner
- Play single notes for best accuracy
- Ensure quiet environment for precise readings
- Watch the cents meter for fine-tuning
- Green = in tune, Red = flat, Orange = sharp

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm i -g vercel
vercel
```

### Netlify
```bash
npm run build
# Upload dist folder to Netlify
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## 📄 License

MIT License - feel free to use for personal or commercial projects.

## 🙏 Acknowledgments

- Web Audio API for audio synthesis
- Next.js for the application framework
- React for component architecture
- TypeScript for type safety

---

**Enjoy making music! 🎵**
