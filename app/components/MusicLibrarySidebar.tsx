"use client";

import { useState } from "react";
import { useThemeClasses } from "../hooks/useThemeClasses";

interface MusicLibrarySidebarProps {
  className?: string;
  onToggle?: (collapsed: boolean) => void;
}

// Sample music pieces data
const musicPieces = [
  {
    id: 1,
    name: "Für Elise",
    artist: "Beethoven",
    key: "A minor",
    tempo: "120 BPM",
    duration: "3:14",
    lastPlayed: new Date("2024-01-14"),
  },
  {
    id: 2,
    name: "Moonlight Sonata",
    artist: "Beethoven",
    key: "C# minor",
    tempo: "60 BPM",
    duration: "5:18",
    lastPlayed: new Date("2024-01-09"),
  },
  {
    id: 3,
    name: "Claire de Lune",
    artist: "Debussy",
    key: "Db major",
    tempo: "72 BPM",
    duration: "4:32",
    lastPlayed: new Date("2024-01-08"),
  },
  {
    id: 4,
    name: "Prelude in C",
    artist: "Bach",
    key: "C major",
    tempo: "84 BPM",
    duration: "2:15",
    lastPlayed: new Date("2024-01-07"),
  },
];

export default function MusicLibrarySidebar({
  className = "",
  onToggle,
}: MusicLibrarySidebarProps) {
  const themeClasses = useThemeClasses();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCollapse = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    onToggle?.(newCollapsed);
  };

  return (
    <div
      className={`
        h-full transition-all duration-300 ease-in-out
        ${isCollapsed ? "w-16" : "w-80"}
        ${className}
      `}
    >
      {/* Sidebar Content */}
      <div className="h-full bg-white/10 backdrop-blur-xl border-r border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.1)] relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          {!isCollapsed && (
            <h2 className="text-xl font-semibold text-[var(--text-dark)] tracking-wide">
              Music Library
            </h2>
          )}
          <button
            onClick={toggleCollapse}
            className={`
              p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200
              text-[var(--text-dark)] hover:scale-105
              ${isCollapsed ? "mx-auto" : ""}
            `}
            title={isCollapsed ? "Expand Library" : "Collapse Library"}
          >
            {isCollapsed ? "→" : "←"}
          </button>
        </div>

        {/* Search Bar */}
        {!isCollapsed && (
          <div className="p-4 border-b border-white/10">
            <input
              type="text"
              placeholder="Search music pieces..."
              className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-[var(--text-dark)] placeholder-[var(--neutral-gray)] focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/30 transition-all duration-200"
            />
          </div>
        )}

        {/* Music Pieces List */}
        {!isCollapsed && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {musicPieces.map((piece) => (
              <div
                key={piece.id}
                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 hover:bg-white/15 transition-all duration-200 cursor-pointer group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-[var(--text-dark)] group-hover:text-[var(--accent-red)] transition-colors">
                      {piece.name}
                    </h3>
                    <p className="text-sm text-[var(--neutral-gray)] mb-2">
                      {piece.artist}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-[var(--neutral-gray)]">
                      <span>Key: {piece.key}</span>
                      <span>{piece.tempo}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-[var(--neutral-gray)]">
                      {piece.duration}
                    </div>
                    <div className="text-xs text-[var(--neutral-gray)] mt-1">
                      Last: {piece.lastPlayed?.toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add New Piece Button */}
        {!isCollapsed && (
          <div className="p-4 border-t border-white/10">
            <button className="w-full px-4 py-3 bg-[var(--accent-red)] hover:bg-[var(--accent-red)]/80 text-white font-medium rounded-lg transition-all duration-200 hover:scale-105 active:scale-95">
              + Add New Piece
            </button>
          </div>
        )}

        {/* Collapsed State - Show Icons Only */}
        {isCollapsed && (
          <div className="p-4 space-y-4">
            <div className="text-center text-[var(--text-dark)] text-2xl">
              📚
            </div>
            <div className="text-center text-[var(--neutral-gray)] text-xs">
              Library
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
