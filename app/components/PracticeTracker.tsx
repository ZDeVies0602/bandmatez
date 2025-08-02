"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";

interface PracticeSession {
  sessionId: number;
  startTime: string;
  notes: string;
  isActive: boolean;
}

export default function PracticeTracker() {
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<any>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [showTracker, setShowTracker] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize user and check for active session
  useEffect(() => {
    const initializeUser = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();
        if (error || !user) return;

        setUser(user);
        await checkForActiveSession();
      } catch (error) {
        console.error("Error initializing practice tracker:", error);
      }
    };

    initializeUser();

    // Listen for practice session events
    const handleSessionStarted = () => {
      checkForActiveSession();
    };

    const handleSessionEnded = () => {
      setIsSessionActive(false);
      setSessionStartTime(null);
      setCurrentSessionId(null);
      setElapsedTime(0);
      setShowTracker(false);
      if (typeof window !== "undefined") {
        localStorage.removeItem("practiceSession");
      }
    };

    // Listen for localStorage changes (for cross-tab sync)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "practiceSession") {
        checkForActiveSession();
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("practiceSessionStarted", handleSessionStarted);
      window.addEventListener("practiceSessionEnded", handleSessionEnded);
      window.addEventListener("storage", handleStorageChange);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener(
          "practiceSessionStarted",
          handleSessionStarted
        );
        window.removeEventListener("practiceSessionEnded", handleSessionEnded);
        window.removeEventListener("storage", handleStorageChange);
      }
    };
  }, []);

  // Timer effect
  useEffect(() => {
    if (isSessionActive && sessionStartTime) {
      intervalRef.current = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor(
          (now.getTime() - sessionStartTime.getTime()) / 1000
        );
        setElapsedTime(elapsed);

        // Update session in database every minute
        if (elapsed > 0 && elapsed % 60 === 0 && currentSessionId) {
          updateSessionDuration(currentSessionId, elapsed);
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isSessionActive, sessionStartTime, currentSessionId]);

  // Check localStorage for active session
  const checkForActiveSession = async () => {
    try {
      if (typeof window === "undefined") return;

      const savedSession = localStorage.getItem("practiceSession");
      if (savedSession) {
        const parsed: PracticeSession = JSON.parse(savedSession);
        if (parsed.isActive) {
          setIsSessionActive(true);
          setSessionStartTime(new Date(parsed.startTime));
          setCurrentSessionId(parsed.sessionId);
          setShowTracker(true);

          // Calculate elapsed time
          const now = new Date();
          const elapsed = Math.floor(
            (now.getTime() - new Date(parsed.startTime).getTime()) / 1000
          );
          setElapsedTime(elapsed);
        }
      }
    } catch (error) {
      console.error("Error checking for active session:", error);
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

  const navigateToPractice = () => {
    window.location.href = "/";
  };

  // Don't show tracker if no active session
  if (!showTracker || !isSessionActive || typeof window === "undefined") {
    return null;
  }

  // No need to hide tracker on practice page since it no longer exists

  return (
    <div
      className={`
        fixed bottom-5 left-5 z-100 cursor-pointer
        transition-all duration-300 ease-out
        animate-slide-in-left
        hover:scale-105 hover:-translate-y-1
      `}
      onClick={navigateToPractice}
    >
      <div
        className={`
        flex items-center gap-3 px-5 py-3 rounded-full
        bg-green-500/95 backdrop-blur-lg
        border-2 border-green-500/80
        shadow-glass-lg
        relative overflow-hidden
        group
      `}
      >
        {/* Shimmer Effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500 ease-out"></div>
        </div>

        {/* Tracker Icon */}
        <div className="text-2xl animate-bounce-subtle relative z-10">🎵</div>

        {/* Tracker Info */}
        <div className="flex flex-col gap-0.5 relative z-10">
          <div
            className={`
            text-xs font-semibold text-white uppercase tracking-wider
            drop-shadow-sm opacity-90
          `}
          >
            Practice Session
          </div>
          <div
            className={`
            font-mono text-lg font-bold text-white tracking-wide
            drop-shadow-lg
          `}
          >
            {formatTime(elapsedTime)}
          </div>
        </div>

        {/* Pulse Indicator */}
        <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-white/90 animate-pulse-fast shadow-lg">
          <div className="absolute inset-0 rounded-full bg-white/90 animate-ping"></div>
        </div>
      </div>
    </div>
  );
}
