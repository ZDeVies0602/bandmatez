"use client";

import { useState, useEffect } from "react";
import { useThemeClasses } from "../hooks/useThemeClasses";
import { SoundProvider } from "../contexts/SoundContext";
import MusicLibrarySidebar from "./MusicLibrarySidebar";
import FloatingMetronome from "./FloatingMetronome";
import CollapsiblePiano from "./CollapsiblePiano";
import AccountCircle from "./AccountCircle";
import ThemeMenu from "./ThemeMenu";
import TabNavigation from "./TabNavigation";
import PitchTuner from "./PitchTuner";
import PracticeTracker from "./PracticeTracker";
import MusicNotationDictation from "./MusicNotationDictation";
import Metronome from "./Metronome";

interface DashboardLayoutProps {
  children?: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const themeClasses = useThemeClasses();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("metronome");

  // Handle sidebar state changes
  const handleSidebarToggle = (collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
  };

  // Handle tab changes
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  // Render content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case "metronome":
        return <Metronome />;
      case "practice":
        return (
          <div className="w-full max-w-4xl">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
              <div className="text-center mb-4">
                <h1 className="text-2xl font-bold text-[var(--text-dark)] mb-2">
                  📊 Practice Dashboard
                </h1>
                <p className="text-sm text-[var(--neutral-gray)]">
                  Track your progress and practice sessions
                </p>
              </div>
              <div className="text-center text-[var(--neutral-gray)] py-8">
                <p>Practice features coming soon...</p>
              </div>
            </div>
          </div>
        );
      // case "library":
      //   return (
      //     <div className="w-full max-w-4xl">
      //       <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
      //         <div className="text-center mb-4">
      //           <h1 className="text-2xl font-bold text-[var(--text-dark)] mb-2">
      //             📚 Music Library
      //           </h1>
      //           <p className="text-sm text-[var(--neutral-gray)]">
      //             Manage your music collection and playlists
      //           </p>
      //         </div>
      //         <div className="text-center text-[var(--neutral-gray)] py-8">
      //           <p>Music library features coming soon...</p>
      //         </div>
      //       </div>
      //     </div>
      //   ); // Temporarily hidden
      case "notation":
        return <MusicNotationDictation />;
      default:
        return null;
    }
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
        <div className="flex flex-col overflow-hidden min-h-0 relative">
          <div className="flex overflow-hidden min-h-0 flex-1">
            {/* Sidebar space */}
            <div
              className={`flex-shrink-0 transition-all duration-300 ${
                sidebarCollapsed ? "w-16" : "w-80"
              }`}
            ></div>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
              <div className="p-6">
                {/* Tab Navigation */}
                <TabNavigation 
                  activeTab={activeTab} 
                  onTabChange={handleTabChange} 
                />

                {/* Tab Content */}
                <div className="flex items-center justify-center min-h-0">
                  {renderTabContent()}
                </div>

                {/* Additional content if any */}
                {children}
              </div>
            </main>
          </div>

          {/* Always visible collapsible tuner */}
          <PitchTuner />

          {/* Bottom Collapsible Piano - Always show now */}
          <div className="fixed bottom-0 left-0 right-0 z-50">
            <CollapsiblePiano sidebarCollapsed={sidebarCollapsed} />
          </div>
        </div>
      </div>
    </SoundProvider>
  );
}
