"use client";

import { useState, useEffect } from "react";
import { useThemeClasses } from "../hooks/useThemeClasses";
import { SoundProvider } from "../contexts/SoundContext";
import MusicLibrarySidebar from "./MusicLibrarySidebar";
import FloatingMetronome from "./FloatingMetronome";
import VirtualPiano from "./VirtualPiano";
import AccountCircle from "./AccountCircle";
import ThemeMenu from "./ThemeMenu";
import PitchTuner from "./PitchTuner";
import PracticeTracker from "./PracticeTracker";

interface DashboardLayoutProps {
  children?: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const themeClasses = useThemeClasses();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Handle sidebar state changes
  const handleSidebarToggle = (collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
  };

  return (
    <SoundProvider>
      <div className="h-screen bg-transparent overflow-hidden grid grid-rows-[auto_1fr]">
        {/* Background Shapes */}
        <div className="dashboard-background fixed inset-0 -z-10">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
          <div className="shape shape-4"></div>
          <div className="shape shape-5"></div>
          <div className="shape shape-6"></div>
          <div className="shape shape-7"></div>
          <div className="shape shape-8"></div>
          <div className="shape shape-9"></div>
          <div className="shape shape-10"></div>
        </div>

        {/* Sidebar - Full height, positioned absolutely */}
        <div className="absolute left-0 top-0 h-full z-50">
          <MusicLibrarySidebar onToggle={handleSidebarToggle} />
        </div>

        {/* Header */}
        <header className="bg-transparent z-40">
          <div className="flex items-center justify-between p-4">
            {/* Left: Sidebar space */}
            <div
              className={`transition-all duration-300 ${
                sidebarCollapsed ? "w-16" : "w-80"
              }`}
            ></div>

            {/* Center: Floating Metronome */}
            <div className="flex-1 flex justify-center">
              <FloatingMetronome />
            </div>

            {/* Right: User controls */}
            <div className="flex items-center gap-3">
              <AccountCircle />
              <ThemeMenu />
            </div>
          </div>
        </header>

        {/* Body - Main Content */}
        <div className="flex overflow-hidden min-h-0">
          {/* Sidebar space */}
          <div
            className={`flex-shrink-0 transition-all duration-300 ${
              sidebarCollapsed ? "w-16" : "w-80"
            }`}
          ></div>

          {/* Main Content - Simple scrollable container */}
          <main className="flex-1 p-6 overflow-y-auto">
            <div className="w-full max-w-6xl mx-auto space-y-6">
              {/* Pitch Tuner and Piano in Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Compact Pitch Tuner Module */}
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
                  <div className="text-center mb-4">
                    <h1 className="text-2xl font-bold text-[var(--text-dark)] mb-2">
                      🎤 Pitch Tuner
                    </h1>
                    <p className="text-sm text-[var(--neutral-gray)]">
                      Professional-grade tuning with real-time pitch detection
                    </p>
                  </div>
                  <PitchTuner />
                </div>

                {/* Virtual Piano Module */}
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
                  <div className="text-center mb-4">
                    <h1 className="text-2xl font-bold text-[var(--text-dark)] mb-2">
                      🎹 Virtual Piano
                    </h1>
                    <p className="text-sm text-[var(--neutral-gray)]">
                      Play with your mouse or keyboard
                    </p>
                  </div>
                  <VirtualPiano />
                </div>
              </div>

              {children}
            </div>
          </main>
        </div>
      </div>
    </SoundProvider>
  );
}
