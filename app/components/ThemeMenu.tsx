"use client";

import { useState, useEffect } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { useThemeClasses } from "../hooks/useThemeClasses";
import { ThemeType } from "../types";

export default function ThemeMenu({ className }: { className?: string }) {
  const { theme: currentTheme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const themeClasses = useThemeClasses();

  const getThemePreviewClass = (themeKey: string) => {
    const previewClasses: { [key: string]: string } = {
      default: "bg-[#DCE0D9] border border-[#595959]",
      "desert-clay":
        "bg-gradient-to-br from-[#262322] via-[#E07A5F] to-[#81A4B1]",
      "crimson-night":
        "bg-gradient-to-br from-[#e55039] via-[#4a0000] to-[#B22222]",
      "navy-geometric":
        "bg-gradient-to-br from-[#002C60] via-[#506B8B] to-[#1A1F23]",
      "green-palette":
        "bg-gradient-to-br from-[#002005] via-[#164F29] to-[#3B7639]",
      "university-gold":
        "bg-gradient-to-br from-[#00274C] via-[#FFCB05] to-[#CFC096]",
      "steel-crimson":
        "bg-gradient-to-br from-[#1B4F72] via-[#990000] to-[#7BA8C5]",
    };
    return previewClasses[themeKey] || previewClasses["default"];
  };

  const themes: { value: ThemeType; name: string }[] = [
    { value: "default", name: "Geometric Dusk" },
    { value: "desert-clay", name: "Desert Clay" },
    { value: "crimson-night", name: "Crimson Night" },
    { value: "navy-geometric", name: "Navy Geometric" },
    { value: "green-palette", name: "Nature's Palette" },
    { value: "university-gold", name: "University Gold" },
    { value: "steel-crimson", name: "Steel Crimson" },
  ];

  return (
    <div
      className={`
      relative transition-all duration-300 ease-out
      ${isOpen ? "transform-none" : ""}
      ${className}
    `}
    >
      {/* Theme Toggle Button */}
      <div
        className={`
          w-12 h-12 rounded-full cursor-pointer flex items-center justify-center
          ${themeClasses.glassButton}
          hover:scale-110 hover:shadow-lg transition-all duration-300
          relative overflow-hidden
        `}
        onClick={() => setIsOpen(!isOpen)}
      >
        {/* Palette Icon */}
        <div className="relative w-6 h-6">
          <div className="absolute w-3 h-3 rounded-full bg-red-500 top-0 left-0 opacity-80"></div>
          <div className="absolute w-3 h-3 rounded-full bg-blue-500 top-0 right-0 opacity-80"></div>
          <div className="absolute w-3 h-3 rounded-full bg-green-500 bottom-0 left-0 opacity-80"></div>
          <div className="absolute w-3 h-3 rounded-full bg-yellow-500 bottom-0 right-0 opacity-80"></div>
          <div className="absolute w-1 h-1 rounded-full bg-white top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
        </div>

        {/* Shimmer Effect */}
        <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer"></div>
        </div>
      </div>

      {/* Theme Options Menu */}
      {isOpen && (
        <div
          className={`
          absolute top-16 right-0 w-80 p-6 rounded-2xl
          ${themeClasses.card}
          shadow-glass-lg transform transition-all duration-300
          animate-slide-in-top opacity-100 z-50
        `}
        >
          <h3
            className={`
            ${themeClasses.textDark} text-xl font-bold mb-6
            text-center tracking-wide
          `}
          >
            Choose Your Vibe
          </h3>

          <div className="grid grid-cols-2 gap-3">
            {themes.map((theme) => (
              <button
                key={theme.value}
                className={`
                  group p-4 rounded-xl transition-all duration-300 ease-out
                  ${themeClasses.cardSmall}
                  hover:scale-105 hover:shadow-lg hover:-translate-y-1
                  ${
                    currentTheme === theme.value
                      ? `ring-2 ${themeClasses.accentRedBorder} shadow-neon`
                      : "hover:ring-1 hover:ring-white/30"
                  }
                  relative overflow-hidden
                `}
                onClick={() => {
                  console.log('ThemeMenu: Setting theme to:', theme.value);
                  setTheme(theme.value);
                  setIsOpen(false);
                }}
              >
                {/* Theme Preview */}
                <div
                  className={`
                  w-full h-10 rounded-lg mb-3 transition-all duration-300
                  ${getThemePreviewClass(theme.value)}
                  ${currentTheme === theme.value ? "ring-2 ring-white/50" : ""}
                  group-hover:scale-105
                `}
                />

                {/* Theme Name */}
                <span
                  className={`
                  ${themeClasses.textDark} text-sm font-medium
                  transition-all duration-300
                  group-hover:font-semibold
                `}
                >
                  {theme.name}
                </span>

                {/* Active Indicator */}
                {currentTheme === theme.value && (
                  <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-green-400 animate-pulse-fast">
                    <div className="absolute inset-0 rounded-full bg-green-400 animate-ping"></div>
                  </div>
                )}

                {/* Hover Shimmer */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
