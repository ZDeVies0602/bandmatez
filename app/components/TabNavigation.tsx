"use client";

import { useState } from "react";
import { useThemeClasses } from "../hooks/useThemeClasses";

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function TabNavigation({
  activeTab,
  onTabChange,
}: TabNavigationProps) {
  const themeClasses = useThemeClasses();

  const tabs = [
    { id: "metronome", label: "🥁 Metronome", icon: "🥁" },
    { id: "practice", label: "📊 Practice", icon: "📊" },
    // { id: "library", label: "📚 Music Library", icon: "📚" }, // Temporarily hidden
    { id: "notation", label: "🎼 Music Theory", icon: "🎼" },
  ];

  return (
    <nav className="flex justify-center mb-8">
      <div className="flex gap-2 p-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              group flex items-center gap-2 px-6 py-3 rounded-xl font-semibold 
              transition-all duration-200 relative overflow-hidden
              ${
                activeTab === tab.id
                  ? "bg-[var(--accent-red)] text-white shadow-lg scale-105"
                  : "text-[var(--text-dark)] hover:bg-white/10 hover:scale-105"
              }
            `}
            aria-selected={activeTab === tab.id}
          >
            {/* Tab Icon */}
            <span
              className={`
              text-lg transition-all duration-300
              ${activeTab === tab.id ? "scale-110" : "group-hover:scale-105"}
            `}
            >
              {tab.icon}
            </span>

            {/* Tab Label */}
            <span className="whitespace-nowrap">{tab.label}</span>

            {/* Shimmer Effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500 ease-out"></div>
            </div>

            {/* Active Indicator */}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-current animate-fade-in"></div>
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}
