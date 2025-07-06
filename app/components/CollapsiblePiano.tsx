"use client";

import { useState } from "react";
import { useThemeClasses } from "../hooks/useThemeClasses";
import VirtualPiano from "./VirtualPiano";

interface CollapsiblePianoProps {
  className?: string;
  onToggle?: (expanded: boolean) => void;
  sidebarCollapsed?: boolean;
}

export default function CollapsiblePiano({
  className = "",
  onToggle,
  sidebarCollapsed = false,
}: CollapsiblePianoProps) {
  const themeClasses = useThemeClasses();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  const handleToggleCollapse = () => {
    console.log("Toggle collapse clicked, current state:", isCollapsed);
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    // Reset minimized state when expanding
    if (!newCollapsed) {
      setIsMinimized(false);
    }
    onToggle?.(!newCollapsed);
  };

  const handleToggleMinimize = () => {
    console.log("Toggle minimize clicked, current state:", isMinimized);
    const newMinimized = !isMinimized;
    setIsMinimized(newMinimized);
  };

  return (
    <div
      className={`
        w-full h-full bg-white/10 backdrop-blur-xl border-t border-white/20 shadow-[0_-8px_32px_rgba(0,0,0,0.1)]
        ${className}
        flex flex-col
      `}
    >
      {/* Expanded Content - Takes up available space */}
      {!isCollapsed && (
        <div className="flex-1 overflow-hidden">
          {/* Piano Content */}
          {!isMinimized && (
            <div className="p-6 h-full overflow-y-auto">
              <VirtualPiano />
            </div>
          )}

          {/* Minimized Piano Preview */}
          {isMinimized && (
            <div className="px-6 py-4 flex items-center justify-center h-full">
              <div className="text-center">
                <div className="flex gap-px mb-2 justify-center">
                  {/* White keys */}
                  {[...Array(14)].map((_, i) => (
                    <div
                      key={`white-${i}`}
                      className="w-6 h-12 bg-white/90 border border-gray-300/50 rounded-b-md cursor-pointer hover:bg-white transition-colors duration-150"
                      onClick={() => console.log(`White key ${i} clicked`)}
                    />
                  ))}
                </div>
                <div className="flex gap-px justify-center -mt-8 relative z-10">
                  {/* Black keys */}
                  {[1, 2, 4, 5, 6, 8, 9, 11, 12, 13].map((i) => (
                    <div
                      key={`black-${i}`}
                      className={`w-4 h-8 bg-gray-800 rounded-b-md cursor-pointer hover:bg-gray-700 transition-colors duration-150 ${
                        i === 3 || i === 7 || i === 10 ? "mr-6" : ""
                      }`}
                      style={{
                        marginLeft:
                          i === 1
                            ? "12px"
                            : i === 4 || i === 8 || i === 11
                            ? "12px"
                            : "0",
                        marginRight:
                          i === 2 || i === 6 || i === 9 || i === 13
                            ? "12px"
                            : "0",
                      }}
                      onClick={() => console.log(`Black key ${i} clicked`)}
                    />
                  ))}
                </div>
                <p className="text-sm text-[var(--neutral-gray)] mt-2">
                  Click expand button to access full piano
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bottom Bar - Always visible at bottom */}
      <div className="h-16 flex items-center justify-between px-6 border-t border-white/10 flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[var(--accent-red)]/20 rounded-full flex items-center justify-center">
              <span className="text-[var(--text-dark)] font-bold text-lg">
                🎹
              </span>
            </div>
            <span className="text-[var(--text-dark)] font-semibold">
              Virtual Piano
            </span>
          </div>

          {/* Mini Piano Keys Preview - only show when collapsed */}
          {isCollapsed && (
            <div className="flex gap-px">
              {[...Array(7)].map((_, i) => (
                <div
                  key={i}
                  className="w-3 h-8 bg-white/80 border border-gray-300/50 rounded-b-sm"
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!isCollapsed && (
            <button
              onClick={handleToggleMinimize}
              className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-[var(--text-dark)] transition-all duration-200 hover:scale-105"
              title={isMinimized ? "Expand Piano" : "Minimize Piano"}
            >
              {isMinimized ? "⬆️" : "⬇️"}
            </button>
          )}

          <button
            onClick={handleToggleCollapse}
            className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105 active:scale-95 ${
              isCollapsed
                ? "bg-[var(--accent-red)] hover:bg-[var(--accent-red)]/80 text-white"
                : "bg-white/10 hover:bg-white/20 text-[var(--text-dark)]"
            }`}
          >
            {isCollapsed ? "Open Piano" : "✕"}
          </button>
        </div>
      </div>
    </div>
  );
}
