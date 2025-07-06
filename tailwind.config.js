/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      keyframes: {
        // Metronome animations
        "pendulum-swing": {
          "0%": { transform: "translateX(-50%) rotate(-15deg)" },
          "50%": { transform: "translateX(-50%) rotate(15deg)" },
          "100%": { transform: "translateX(-50%) rotate(-15deg)" },
        },
        "metronome-tick": {
          "0%": { transform: "scale(1)" },
          "10%": { transform: "scale(1.1)" },
          "20%": { transform: "scale(1)" },
          "100%": { transform: "scale(1)" },
        },

        // General animations
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
        "float-reverse": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(20px)" },
        },
        "slide-in-left": {
          "0%": { transform: "translateX(-100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "slide-in-top": {
          "0%": { transform: "translateY(-100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "slide-in-bottom": {
          "0%": { transform: "translateY(100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },

        // Pattern movement
        "pattern-shift": {
          "0%": { backgroundPosition: "0 0, 25px 25px, 0 0, 50px 50px" },
          "100%": {
            backgroundPosition:
              "50px 50px, 75px 75px, 100px 100px, 150px 150px",
          },
        },

        // Pulse variations
        "pulse-slow": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        "pulse-fast": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },

        // Glow effects
        glow: {
          "0%, 100%": { boxShadow: "0 0 10px rgba(255, 255, 255, 0.3)" },
          "50%": { boxShadow: "0 0 20px rgba(255, 255, 255, 0.6)" },
        },

        // Shimmer effect
        shimmer: {
          "0%": { left: "-100%" },
          "100%": { left: "100%" },
        },

        // Bounce variations
        "bounce-subtle": {
          "0%, 20%, 50%, 80%, 100%": { transform: "translateY(0)" },
          "40%": { transform: "translateY(-5px)" },
          "60%": { transform: "translateY(-3px)" },
        },

        // Rotate continuous
        "rotate-continuous": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },

        // Scale pulse
        "scale-pulse": {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.05)" },
          "100%": { transform: "scale(1)" },
        },

        // Fade in/out
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-out": {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
      },
      animation: {
        // Metronome animations
        "pendulum-swing": "pendulum-swing 1s ease-in-out infinite",
        "metronome-tick": "metronome-tick 0.2s ease-out",

        // General animations
        float: "float 6s ease-in-out infinite",
        "float-reverse": "float-reverse 6s ease-in-out infinite",
        "slide-in-left": "slide-in-left 0.5s ease-out",
        "slide-in-right": "slide-in-right 0.5s ease-out",
        "slide-in-top": "slide-in-top 0.5s ease-out",
        "slide-in-bottom": "slide-in-bottom 0.5s ease-out",

        // Pattern movement
        "pattern-shift": "pattern-shift 60s linear infinite",

        // Pulse variations
        "pulse-slow": "pulse-slow 3s ease-in-out infinite",
        "pulse-fast": "pulse-fast 1s ease-in-out infinite",

        // Glow effects
        glow: "glow 2s ease-in-out infinite",

        // Shimmer effect
        shimmer: "shimmer 2s ease-in-out infinite",

        // Bounce variations
        "bounce-subtle": "bounce-subtle 2s infinite",

        // Rotate continuous
        "rotate-continuous": "rotate-continuous 2s linear infinite",

        // Scale pulse
        "scale-pulse": "scale-pulse 2s ease-in-out infinite",

        // Fade in/out
        "fade-in": "fade-in 0.3s ease-out",
        "fade-out": "fade-out 0.3s ease-out",
      },

      // Custom backdrop blur values
      backdropBlur: {
        xs: "2px",
        "4xl": "72px",
      },

      // Custom box shadow values
      boxShadow: {
        glass:
          "0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
        "glass-lg":
          "0 20px 50px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
        neon: "0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor",
        "neon-lg":
          "0 0 15px currentColor, 0 0 30px currentColor, 0 0 45px currentColor",
      },

      // Custom border radius values
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },

      // Custom font sizes
      fontSize: {
        "10xl": "10rem",
        "11xl": "12rem",
        "12xl": "14rem",
      },

      // Custom spacing values
      spacing: {
        18: "4.5rem",
        88: "22rem",
        128: "32rem",
      },

      // Custom z-index values
      zIndex: {
        60: "60",
        70: "70",
        80: "80",
        90: "90",
        100: "100",
      },
    },
  },
  plugins: [],
};
