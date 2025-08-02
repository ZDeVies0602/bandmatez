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
        <div className="h-16 flex items-center justify-center border-t border-white/10 flex-shrink-0 bg-white/5">
          <button
            onClick={handleToggleCollapse}
            className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-[var(--text-dark)] transition-all duration-200 hover:scale-110 flex items-center justify-center"
            title="Open Piano"
          >
            <span className="text-xl">↑</span>
          </button>
        </div>
      )}
    </div>
  );
}
