"use client";

import { useState } from "react";
import { useThemeClasses } from "../hooks/useThemeClasses";
import VirtualPiano from "./VirtualPiano";

interface CollapsiblePianoProps {
  className?: string;
  sidebarCollapsed?: boolean;
}

export default function CollapsiblePiano({
  className = "",
  sidebarCollapsed = false,
}: CollapsiblePianoProps) {
  const themeClasses = useThemeClasses();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  const handleToggleCollapse = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    // Reset minimized state when expanding
    if (!newCollapsed) {
      setIsMinimized(false);
    }
  };

  const handleToggleMinimize = () => {
    const newMinimized = !isMinimized;
    setIsMinimized(newMinimized);
  };

  return (
    <div
      className={`
        w-full bg-white/10 backdrop-blur-xl border-t border-white/20 shadow-[0_-8px_32px_rgba(0,0,0,0.1)]
        ${className}
        ${isCollapsed ? 'h-16' : 'h-80'}
        ${isCollapsed ? 'flex flex-col justify-end' : 'flex flex-col-reverse'}
        overflow-hidden transition-all duration-300 ease-in-out
      `}
    >
      {/* Bottom Bar - Always visible and fixed at bottom */}
      <div className="h-16 flex items-center justify-between px-6 border-t border-white/10 flex-shrink-0 bg-white/5">
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

      {/* Expanded Content - Only rendered when not collapsed */}
      {!isCollapsed && (
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col bg-white/5">
          {/* Piano Content */}
          {!isMinimized && (
            <div className="flex-1 p-6 overflow-y-auto">
              <VirtualPiano />
            </div>
          )}

          {/* Minimized Piano Preview */}
          {isMinimized && (
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="text-center">
                <div className="flex gap-px mb-4 justify-center">
                  {/* White keys */}
                  {[...Array(21)].map((_, i) => (
                    <div
                      key={`white-${i}`}
                      className="w-8 h-16 bg-white/90 border border-gray-300/50 rounded-b-md cursor-pointer hover:bg-white transition-colors duration-150"
                    />
                  ))}
                </div>
                <div className="flex gap-px justify-center -mt-12 relative z-10">
                  {/* Black keys */}
                  {[1, 2, 4, 5, 6, 8, 9, 11, 12, 13, 15, 16, 18, 19, 20].map((i) => (
                    <div
                      key={`black-${i}`}
                      className="w-5 h-10 bg-gray-800 rounded-b-md cursor-pointer hover:bg-gray-700 transition-colors duration-150"
                      style={{
                        marginLeft: [3, 7, 10, 14, 17].includes(i) ? "16px" : "8px",
                        marginRight: [2, 6, 9, 13, 16, 20].includes(i) ? "16px" : "0",
                      }}
                    />
                  ))}
                </div>
                <p className="text-sm text-[var(--neutral-gray)] mt-4">
                  Click the expand button (⬆️) to access the full piano interface
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
