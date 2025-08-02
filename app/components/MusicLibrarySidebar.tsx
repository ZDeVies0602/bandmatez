"use client";

import { useState, useEffect, useRef } from "react";
import { useThemeClasses } from "../hooks/useThemeClasses";
import { createClient } from "@/utils/supabase/client";

interface MusicLibrarySidebarProps {
  className?: string;
  onToggle?: (collapsed: boolean) => void;
}

interface PracticeSession {
  id?: number;
  user_id: string;
  start_time: string;
  end_time?: string | null;
  duration_seconds: number;
  session_date: string;
  notes?: string;
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
  const [activeTab, setActiveTab] = useState<'library' | 'practice'>('practice'); // Changed default to practice
  
  // Practice Session State
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<any>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [sessionNotes, setSessionNotes] = useState("");
  const [practiceHistory, setPracticeHistory] = useState<PracticeSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const toggleCollapse = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    onToggle?.(newCollapsed);
  };

  // Initialize user and load practice data
  useEffect(() => {
    const initializeUser = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();
        if (error || !user) return;
        
        setUser(user);
        await checkForActiveSession(user.id);
        await loadPracticeHistory(user.id);
      } catch (error) {
        console.error("Error initializing user:", error);
      }
    };

    initializeUser();
  }, [supabase]);

  // Timer effect for active sessions
  useEffect(() => {
    if (isSessionActive && sessionStartTime) {
      intervalRef.current = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor(
          (now.getTime() - sessionStartTime.getTime()) / 1000
        );
        setElapsedTime(elapsed);

        // Update session in database every 30 seconds
        if (elapsed % 30 === 0 && currentSessionId) {
          updateSessionDuration(currentSessionId, elapsed);
        }
      }, 1000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [isSessionActive, sessionStartTime, currentSessionId]);

  const checkForActiveSession = async (userId: string) => {
    try {
      // Check localStorage first
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("practiceSession");
        if (stored) {
          const sessionData = JSON.parse(stored);
          if (sessionData.isActive) {
            setIsSessionActive(true);
            setSessionStartTime(new Date(sessionData.startTime));
            setCurrentSessionId(sessionData.sessionId);
            setSessionNotes(sessionData.notes || "");
            return;
          }
        }
      }

      // Check database for active session
      const { data, error } = await supabase
        .from("practice_sessions")
        .select("*")
        .eq("user_id", userId)
        .is("end_time", null)
        .single();

      if (data && !error) {
        setIsSessionActive(true);
        setSessionStartTime(new Date(data.start_time));
        setCurrentSessionId(data.id);
        setSessionNotes(data.notes || "");
      }
    } catch (error) {
      console.error("Error checking for active session:", error);
    }
  };

  const loadPracticeHistory = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("practice_sessions")
        .select("*")
        .eq("user_id", userId)
        .not("end_time", "is", null)
        .order("start_time", { ascending: false })
        .limit(10);

      if (data && !error) {
        setPracticeHistory(data);
      }
    } catch (error) {
      console.error("Error loading practice history:", error);
    }
  };

  const updateSessionDuration = async (sessionId: number, duration: number) => {
    try {
      await supabase
        .from("practice_sessions")
        .update({ duration_seconds: duration })
        .eq("id", sessionId);
    } catch (error) {
      console.error("Error updating session duration:", error);
    }
  };

  const startPracticeSession = async () => {
    if (!user) return;

    try {
      const now = new Date();
      const { data, error } = await supabase
        .from("practice_sessions")
        .insert({
          user_id: user.id,
          start_time: now.toISOString(),
          session_date: now.toISOString().split("T")[0],
          duration_seconds: 0,
          notes: sessionNotes,
        })
        .select()
        .single();

      if (data && !error) {
        setIsSessionActive(true);
        setSessionStartTime(now);
        setCurrentSessionId(data.id);
        setElapsedTime(0);

        // Store in localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem(
            "practiceSession",
            JSON.stringify({
              isActive: true,
              startTime: now.toISOString(),
              sessionId: data.id,
              notes: sessionNotes,
            })
          );
        }
      }
    } catch (error) {
      console.error("Error starting practice session:", error);
    }
  };

  const endPracticeSession = async () => {
    if (!currentSessionId) return;

    try {
      const now = new Date();
      await supabase
        .from("practice_sessions")
        .update({
          end_time: now.toISOString(),
          duration_seconds: elapsedTime,
          notes: sessionNotes,
        })
        .eq("id", currentSessionId);

      setIsSessionActive(false);
      setSessionStartTime(null);
      setCurrentSessionId(null);
      setElapsedTime(0);
      setSessionNotes("");

      if (typeof window !== "undefined") {
        localStorage.removeItem("practiceSession");
      }

      // Reload practice history
      if (user) {
        await loadPracticeHistory(user.id);
      }
    } catch (error) {
      console.error("Error ending practice session:", error);
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
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
              Practice Log
            </h2>
          )}
          <button
            onClick={toggleCollapse}
            className={`
              p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200
              text-[var(--text-dark)] hover:scale-105
              ${isCollapsed ? "mx-auto" : ""}
            `}
            title={isCollapsed ? "Expand Practice" : "Collapse Practice"}
          >
            {isCollapsed ? "→" : "←"}
          </button>
        </div>

        {/* Tab Navigation - Library tab temporarily hidden */}
        {!isCollapsed && (
          <div className="flex border-b border-white/10">
            {/* <button
              onClick={() => setActiveTab('library')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 ${
                activeTab === 'library'
                  ? 'bg-white/10 text-[var(--text-dark)] border-b-2 border-[var(--accent-red)]'
                  : 'text-[var(--neutral-gray)] hover:text-[var(--text-dark)]'
              }`}
            >
              📚 Library
            </button> */}
            <button
              onClick={() => setActiveTab('practice')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 ${
                activeTab === 'practice'
                  ? 'bg-white/10 text-[var(--text-dark)] border-b-2 border-[var(--accent-red)]'
                  : 'text-[var(--neutral-gray)] hover:text-[var(--text-dark)]'
              }`}
            >
              ⏱️ Practice
            </button>
          </div>
        )}

        {/* Library Tab Content - Temporarily hidden */}
        {/* {!isCollapsed && activeTab === 'library' && (
          // Library content would go here
        )} */}

        {/* Practice Tab Content */}
        {!isCollapsed && activeTab === 'practice' && (
          <>
            {/* Current Session Status */}
            <div className="p-4 border-b border-white/10">
              <div className="text-center mb-4">
                <div className="text-2xl font-mono font-bold text-[var(--text-dark)] mb-1">
                  {formatTime(elapsedTime)}
                </div>
                <div className="text-sm text-[var(--neutral-gray)]">
                  {isSessionActive ? "Session Active" : "Ready to Practice"}
                </div>
              </div>
              
              {!isSessionActive ? (
                <button
                  onClick={startPracticeSession}
                  className="w-full px-4 py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  🎵 Start Session
                </button>
              ) : (
                <button
                  onClick={endPracticeSession}
                  className="w-full px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  ⏹️ End Session
                </button>
              )}
            </div>

            {/* Session Notes */}
            <div className="p-4 border-b border-white/10">
              <label className="block text-sm font-medium text-[var(--text-dark)] mb-2">
                Session Notes
              </label>
              <textarea
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="What are you working on?"
                className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-[var(--text-dark)] placeholder-[var(--neutral-gray)] focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/30 transition-all duration-200 resize-none"
                rows={3}
              />
            </div>

            {/* Practice History */}
            <div className="flex-1 overflow-y-auto p-4">
              <h3 className="text-sm font-medium text-[var(--text-dark)] mb-3">Recent Sessions</h3>
              
              {practiceHistory.length === 0 ? (
                <div className="text-center py-8 text-[var(--neutral-gray)] text-sm">
                  No practice sessions yet. Start your first session above!
                </div>
              ) : (
                <div className="space-y-3">
                  {practiceHistory.map((session) => (
                    <div
                      key={session.id}
                      className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-3 hover:bg-white/15 transition-all duration-200"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs text-[var(--neutral-gray)]">
                          {formatDate(session.start_time)}
                        </span>
                        <span className="text-sm font-mono font-bold text-[var(--text-dark)]">
                          {formatTime(session.duration_seconds)}
                        </span>
                      </div>
                      {session.notes && (
                        <p className="text-xs text-[var(--neutral-gray)] truncate">
                          {session.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Collapsed State - Show Icons Only, Library temporarily hidden */}
        {isCollapsed && (
          <div className="p-4 space-y-6">
            {/* <button
              onClick={() => setActiveTab('library')}
              className={`w-full text-center transition-all duration-200 ${
                activeTab === 'library' ? 'text-[var(--accent-red)]' : 'text-[var(--neutral-gray)]'
              }`}
            >
              <div className="text-2xl mb-1">📚</div>
              <div className="text-xs">Library</div>
            </button> */}
            
            <button
              onClick={() => setActiveTab('practice')}
              className={`w-full text-center transition-all duration-200 ${
                activeTab === 'practice' ? 'text-[var(--accent-red)]' : 'text-[var(--neutral-gray)]'
              }`}
            >
              <div className="text-2xl mb-1">⏱️</div>
              <div className="text-xs">Practice</div>
              {isSessionActive && (
                <div className="text-xs font-mono font-bold text-[var(--accent-red)] mt-1">
                  {formatTime(elapsedTime)}
                </div>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
