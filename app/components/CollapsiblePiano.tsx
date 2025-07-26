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

  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div
      className={`
        w-full bg-white/10 backdrop-blur-xl border-t border-white/20 shadow-[0_-8px_32px_rgba(0,0,0,0.1)]
        ${className}
        ${isCollapsed ? 'h-16' : 'h-96'}
        ${isCollapsed ? 'flex flex-col justify-end' : 'flex flex-col'}
        overflow-hidden transition-all duration-300 ease-in-out
      `}
    >
      {/* Expanded Content - Only rendered when not collapsed */}
      {!isCollapsed && (
        <>
          {/* Control Bar - Now a thin arrow tab */}
          <div className="h-6 flex items-center justify-center border-b border-white/10 flex-shrink-0 bg-white/5">
            <button
              onClick={handleToggleCollapse}
              className="px-4 py-1 rounded-full bg-white/10 hover:bg-white/20 text-[var(--text-dark)] transition-all duration-200 hover:scale-110 flex items-center gap-1"
              title="Collapse Piano"
            >
              <span className="text-xs">▼</span>
            </button>
          </div>

          {/* Piano Content Container */}
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col bg-white/5">
            {/* Piano Content */}
            <div className="flex-1 min-h-0 overflow-visible">
              <VirtualPiano />
            </div>
          </div>
        </>
      )}

      {/* Collapsed Bottom Bar - Only visible when collapsed */}
      {isCollapsed && (
        <div className="h-16 flex items-center justify-between border-t border-white/10 flex-shrink-0 bg-white/5">
          <div className="flex items-center gap-4 pl-2">
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
            <div className="flex gap-px">
              {[...Array(7)].map((_, i) => (
                <div
                  key={i}
                  className="w-3 h-8 bg-white/80 border border-gray-300/50 rounded-b-sm"
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 pr-2">
            <button
              onClick={handleToggleCollapse}
              className="px-6 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105 active:scale-95 bg-[var(--accent-red)] hover:bg-[var(--accent-red)]/80 text-white"
            >
              Open Piano
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
