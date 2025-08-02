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

interface DashboardLayoutProps {
  children?: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const themeClasses = useThemeClasses();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // Temporarily commented out for clean dashboard
  // const [activeTab, setActiveTab] = useState("practice");

  // Handle sidebar state changes
  const handleSidebarToggle = (collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
  };

  // Tab functions - kept for later restoration
  // const handleTabChange = (tab: string) => {
  //   setActiveTab(tab);
  // };

  // Render content based on active tab - kept intact for later use
  const renderTabContent = () => {
    // switch (activeTab) {
    //   case "metronome":
    //     return (
    //       <div className="w-full max-w-4xl">
    //         <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
    //           <div className="text-center">
    //             <div className="text-6xl mb-4">🎼</div>
    //             <h1 className="text-2xl font-bold text-[var(--text-dark)] mb-4">
    //               Metronome Moved to Header!
    //             </h1>
    //             <p className="text-lg text-[var(--neutral-gray)] mb-6">
    //               The metronome and speed trainer have been consolidated into a convenient dropdown menu in the header.
    //             </p>
    //             <div className="flex justify-center items-center gap-4 p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-2xl border border-purple-500/20">
    //               <div className="text-3xl">👆</div>
    //               <div className="text-left">
    //                 <div className="font-semibold text-[var(--text-dark)]">Look for the metronome dropdown in the header above</div>
    //                 <div className="text-sm text-[var(--neutral-gray)]">Click the ⚙️ button to expand all controls</div>
    //                 <div className="text-sm text-[var(--neutral-gray)]">Use the 🚀 button to toggle speed trainer mode</div>
    //               </div>
    //             </div>
    //             <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
    //               <div className="p-4 bg-white/5 rounded-xl">
    //                 <div className="font-semibold text-[var(--text-dark)] mb-2">🎼 Regular Mode</div>
    //                 <ul className="text-[var(--neutral-gray)] space-y-1 text-left">
    //                   <li>• Tempo control & sliders</li>
    //                   <li>• Time signatures</li>
    //                   <li>• Volume control</li>
    //                   <li>• Tap tempo</li>
    //                   <li>• Mini pendulum animation</li>
    //                 </ul>
    //               </div>
    //               <div className="p-4 bg-white/5 rounded-xl">
    //                 <div className="font-semibold text-[var(--text-dark)] mb-2">🚀 Speed Trainer Mode</div>
    //                 <ul className="text-[var(--neutral-gray)] space-y-1 text-left">
    //                   <li>• BPM range training</li>
    //                   <li>• Configurable step increments</li>
    //                   <li>• Time or bar-based intervals</li>
    //                   <li>• Real-time progress tracking</li>
    //                   <li>• Auto-progression through steps</li>
    //                 </ul>
    //               </div>
    //             </div>
    //           </div>
    //         </div>
    //       </div>
    //     );
    //   case "practice":
    //     return (
    //       <div className="w-full max-w-4xl">
    //         <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
    //           <div className="text-center mb-4">
    //             <h1 className="text-2xl font-bold text-[var(--text-dark)] mb-2">
    //               📊 Practice Dashboard
    //             </h1>
    //             <p className="text-sm text-[var(--neutral-gray)]">
    //               Track your progress and practice sessions
    //             </p>
    //           </div>
    //           <div className="text-center text-[var(--neutral-gray)] py-8">
    //             <p>Practice features coming soon...</p>
    //           </div>
    //         </div>
    //       </div>
    //     );
    //   case "notation":
    //     return <MusicNotationDictation />;
    //   default:
    //     return null;
    // }
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
                {/* Tab Navigation - Temporarily Hidden */}
                {/* <TabNavigation 
                  activeTab={activeTab} 
                  onTabChange={handleTabChange} 
                /> */}

                {/* Main Dashboard Content */}
                <div className="flex items-center justify-center min-h-0">
                  <div className="w-full max-w-4xl">
                    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
                      <div className="text-center">
                        <div className="text-6xl mb-4">🎵</div>
                        <h1 className="text-3xl font-bold text-[var(--text-dark)] mb-4">
                          Welcome to BandMateZ
                        </h1>
                        <p className="text-lg text-[var(--neutral-gray)] mb-8">
                          Your complete music practice companion
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                          <div className="p-6 bg-white/5 rounded-xl border border-white/10">
                            <div className="text-3xl mb-3">🎼</div>
                            <h3 className="font-semibold text-[var(--text-dark)] mb-2">Metronome</h3>
                            <p className="text-sm text-[var(--neutral-gray)]">
                              Advanced metronome with speed trainer in the header dropdown. Perfect for tempo practice and building consistency.
                            </p>
                          </div>
                          
                          <div className="p-6 bg-white/5 rounded-xl border border-white/10">
                            <div className="text-3xl mb-3">🎹</div>
                            <h3 className="font-semibold text-[var(--text-dark)] mb-2">Piano</h3>
                            <p className="text-sm text-[var(--neutral-gray)]">
                              Interactive piano keyboard at the bottom of the screen. Play along with your practice sessions.
                            </p>
                          </div>
                          
                          <div className="p-6 bg-white/5 rounded-xl border border-white/10">
                            <div className="text-3xl mb-3">🎚️</div>
                            <h3 className="font-semibold text-[var(--text-dark)] mb-2">Tuner</h3>
                            <p className="text-sm text-[var(--neutral-gray)]">
                              Precision pitch tuner available on the right side. Keep your instruments perfectly in tune.
                            </p>
                          </div>
                        </div>

                        <div className="mt-8 p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-2xl border border-purple-500/20">
                          <p className="text-sm text-[var(--neutral-gray)]">
                            <strong className="text-[var(--text-dark)]">Quick Start:</strong> Use the metronome dropdown in the header, play the piano at the bottom, and access the tuner on the right side.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
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
