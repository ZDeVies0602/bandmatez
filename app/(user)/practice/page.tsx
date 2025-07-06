"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import ThemeMenu from "../../components/ThemeMenu";

interface PracticeSession {
  id?: number;
  user_id: string;
  start_time: string;
  end_time?: string | null;
  duration_seconds: number;
  session_date: string;
  notes?: string;
  is_active?: boolean; // Keep for backward compatibility
}

export default function Practice() {
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [sessionNotes, setSessionNotes] = useState("");
  const [practiceHistory, setPracticeHistory] = useState<PracticeSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  // Initialize user and load existing session
  useEffect(() => {
    const initializeUser = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();
        if (error || !user) {
          router.push("/Signin");
          return;
        }
        setUser(user);

        // Check for existing active session
        await checkForActiveSession(user.id);
        await loadPracticeHistory(user.id);
      } catch (error) {
        console.error("Error initializing user:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeUser();
  }, [supabase, router]);

  // Timer effect
  useEffect(() => {
    console.log("Timer effect triggered:", {
      isSessionActive,
      sessionStartTime,
      currentSessionId,
    });

    if (isSessionActive && sessionStartTime) {
      console.log("Starting timer interval");
      intervalRef.current = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor(
          (now.getTime() - sessionStartTime.getTime()) / 1000
        );
        console.log("Timer tick:", elapsed);
        setElapsedTime(elapsed);

        // Update session in database every 30 seconds
        if (elapsed % 30 === 0 && currentSessionId) {
          updateSessionDuration(currentSessionId, elapsed);
        }
      }, 1000);

      return () => {
        console.log("Cleaning up timer interval");
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    } else {
      console.log("Timer not started - missing requirements");
    }
  }, [isSessionActive, sessionStartTime, currentSessionId]);

  // Store session state in localStorage for persistence across pages
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (isSessionActive && sessionStartTime && currentSessionId) {
        localStorage.setItem(
          "practiceSession",
          JSON.stringify({
            isActive: true,
            startTime: sessionStartTime.toISOString(),
            sessionId: currentSessionId,
            notes: sessionNotes,
          })
        );
      } else {
        localStorage.removeItem("practiceSession");
      }
    }
  }, [isSessionActive, sessionStartTime, currentSessionId, sessionNotes]);

  // Check for existing active session using start_time/end_time approach
  const checkForActiveSession = async (userId: string) => {
    try {
      // Check localStorage first
      const savedSession = localStorage.getItem("practiceSession");
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        if (parsed.isActive) {
          // Verify the session is still reasonable (not stale - less than 4 hours)
          const hoursRunning =
            (new Date().getTime() - new Date(parsed.startTime).getTime()) /
            (1000 * 60 * 60);
          if (hoursRunning < 4) {
            setIsSessionActive(true);
            setSessionStartTime(new Date(parsed.startTime));
            setCurrentSessionId(parsed.sessionId);
            setSessionNotes(parsed.notes || "");

            const now = new Date();
            const elapsed = Math.floor(
              (now.getTime() - new Date(parsed.startTime).getTime()) / 1000
            );
            setElapsedTime(elapsed);
            return;
          } else {
            // Session is stale, remove from localStorage
            localStorage.removeItem("practiceSession");
          }
        }
      }

      // Check database for active session (end_time is null and started within last 4 hours)
      const fourHoursAgo = new Date(
        Date.now() - 4 * 60 * 60 * 1000
      ).toISOString();
      const { data: activeSessions, error } = await supabase
        .from("practice_sessions")
        .select("*")
        .eq("user_id", userId)
        .is("end_time", null)
        .gte("start_time", fourHoursAgo)
        .order("start_time", { ascending: false });

      if (!error && activeSessions && activeSessions.length > 0) {
        const activeSession = activeSessions[0];

        setIsSessionActive(true);
        setSessionStartTime(new Date(activeSession.start_time));
        setCurrentSessionId(activeSession.id);
        setSessionNotes(activeSession.notes || "");

        // Calculate elapsed time
        const now = new Date();
        const elapsed = Math.floor(
          (now.getTime() - new Date(activeSession.start_time).getTime()) / 1000
        );
        setElapsedTime(elapsed);
      }
    } catch (error) {
      console.error("Error checking for active session:", error);
    }
  };

  const loadPracticeHistory = async (userId: string) => {
    try {
      const { data: sessions, error } = await supabase
        .from("practice_sessions")
        .select("*")
        .eq("user_id", userId)
        .not("end_time", "is", null) // Only get completed sessions
        .order("start_time", { ascending: false })
        .limit(10);

      if (!error && sessions) {
        setPracticeHistory(sessions);
      }
    } catch (error) {
      console.error("Error loading practice history:", error);
    }
  };

  const startPracticeSession = async () => {
    if (!user) return;

    console.log("Starting practice session...");

    try {
      // End any stale sessions (running for more than 4 hours without end_time)
      const fourHoursAgo = new Date(
        Date.now() - 4 * 60 * 60 * 1000
      ).toISOString();
      await supabase
        .from("practice_sessions")
        .update({
          end_time: new Date().toISOString(),
          is_active: false,
        })
        .eq("user_id", user.id)
        .is("end_time", null)
        .lt("start_time", fourHoursAgo);

      const startTime = new Date();
      console.log("Start time:", startTime);

      const { data: session, error } = await supabase
        .from("practice_sessions")
        .insert({
          user_id: user.id,
          start_time: startTime.toISOString(),
          session_date: startTime.toISOString().split("T")[0],
          duration_seconds: 0,
          notes: sessionNotes,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      if (!session) throw new Error("Session not returned from insert");

      console.log("Session created:", session);

      setIsSessionActive(true);
      setSessionStartTime(startTime);
      setCurrentSessionId(session.id);
      setElapsedTime(0);

      // Dispatch event to notify global tracker
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("practiceSessionStarted", {
            detail: { sessionId: session.id },
          })
        );
      }
    } catch (error) {
      console.error("Error starting practice session:", error);
    }
  };

  const endPracticeSession = async () => {
    if (!currentSessionId) return;

    try {
      const endTime = new Date();

      // Update session in database
      const { error } = await supabase
        .from("practice_sessions")
        .update({
          end_time: endTime.toISOString(),
          duration_seconds: elapsedTime,
          notes: sessionNotes,
          is_active: false,
        })
        .eq("id", currentSessionId);

      if (error) throw error;

      // Clear all state
      setIsSessionActive(false);
      setSessionStartTime(null);
      setCurrentSessionId(null);
      setElapsedTime(0);
      setSessionNotes("");

      // Clear localStorage
      if (typeof window !== "undefined") {
        localStorage.removeItem("practiceSession");
      }

      // Dispatch event to notify global tracker
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("practiceSessionEnded"));
      }

      // Reload history
      await loadPracticeHistory(user.id);
    } catch (error) {
      console.error("Error ending practice session:", error);
    }
  };

  const updateSessionDuration = async (sessionId: number, duration: number) => {
    try {
      await supabase
        .from("practice_sessions")
        .update({
          duration_seconds: duration,
          notes: sessionNotes,
        })
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

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="relative min-h-screen z-10 flex items-center justify-center">
        <div className="dashboard-background">
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
        <div className="relative z-20 bg-white/10 border-2 border-white/20 rounded-3xl p-12 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
          <div className="text-2xl font-semibold text-white text-center drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
            Loading...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen z-10 py-8">
      <div className="dashboard-background">
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

      <ThemeMenu />

      <main className="max-w-5xl mx-auto px-8 z-20 relative">
        <div className="bg-white/8 border-2 border-white/15 rounded-3xl p-12 backdrop-blur-3xl relative z-20 shadow-[0_12px_48px_rgba(0,0,0,0.15)] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] transition-all duration-300">
          <div className="text-center mb-12">
            <h1 className="font-['Bangers'] text-[clamp(2.5rem,6vw,4.5rem)] font-normal text-white tracking-[3px] m-0 mb-4 leading-tight drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)] uppercase">
              Practice Logger
            </h1>
            <p className="text-xl text-white/80 leading-relaxed m-0 drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)]">
              Track your musical practice sessions and build consistency
            </p>
          </div>

          {/* Current Session */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-10 mb-12 transition-all duration-300 hover:bg-white/8 hover:border-white/20 hover:-translate-y-1">
            <div className="flex justify-between items-center mb-8 gap-8 max-lg:flex-col max-lg:gap-6">
              <div className="text-center flex-1">
                <span className="block font-mono text-[clamp(2.5rem,8vw,4rem)] font-bold text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)] mb-2 tracking-[2px] max-md:text-[2.5rem]">
                  {formatTime(elapsedTime)}
                </span>
                <span className="text-lg text-white/70 uppercase tracking-wider font-medium drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)]">
                  {isSessionActive ? "Session Active" : "Ready to Practice"}
                </span>
              </div>

              <div className="flex justify-center flex-1">
                {!isSessionActive ? (
                  <button
                    onClick={startPracticeSession}
                    className="px-12 py-6 border-none rounded-2xl text-xl font-bold uppercase tracking-wider cursor-pointer transition-all duration-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] backdrop-blur-[10px] border-2 border-transparent shadow-[0_8px_25px_rgba(0,0,0,0.2)] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] bg-gradient-to-br from-green-500/90 to-green-600/90 text-white border-green-500/80 hover:bg-gradient-to-br hover:from-green-600/95 hover:to-teal-600/95 hover:border-green-600/90 hover:-translate-y-1 hover:shadow-[0_15px_35px_rgba(34,197,94,0.4)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] max-md:px-8 max-md:py-4 max-md:text-lg"
                  >
                    🎵 Start Practice Session
                  </button>
                ) : (
                  <button
                    onClick={endPracticeSession}
                    className="px-12 py-6 border-none rounded-2xl text-xl font-bold uppercase tracking-wider cursor-pointer transition-all duration-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] backdrop-blur-[10px] border-2 border-transparent shadow-[0_8px_25px_rgba(0,0,0,0.2)] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] bg-gradient-to-br from-red-500/90 to-red-600/90 text-white border-red-500/80 hover:bg-gradient-to-br hover:from-red-600/95 hover:to-red-700/95 hover:border-red-600/90 hover:-translate-y-1 hover:shadow-[0_15px_35px_rgba(239,68,68,0.4)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] max-md:px-8 max-md:py-4 max-md:text-lg"
                  >
                    ⏹️ End Session
                  </button>
                )}
              </div>
            </div>

            {/* Session Notes */}
            <div className="mt-8">
              <label
                htmlFor="sessionNotes"
                className="block text-lg font-semibold text-white mb-4 uppercase tracking-[1px] drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)]"
              >
                Session Notes
              </label>
              <textarea
                id="sessionNotes"
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="What are you working on today? Goals, exercises, pieces..."
                className="w-full p-6 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/50 text-base leading-relaxed resize-none transition-all duration-300 focus:outline-none focus:bg-white/8 focus:border-white/25 focus:shadow-[0_0_0_3px_rgba(255,255,255,0.1)] backdrop-blur-[10px] drop-shadow-[0_1px_3px_rgba(0,0,0,0.2)] max-md:p-4 max-md:text-sm"
                rows={3}
              />
            </div>
          </div>

          {/* Practice History */}
          <div className="mb-12">
            <h2 className="text-[2rem] font-semibold text-white mb-8 uppercase tracking-[1.5px] drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)] max-md:text-[1.6rem]">
              Recent Practice Sessions
            </h2>

            {practiceHistory.length === 0 ? (
              <div className="text-center py-12 bg-white/5 border border-white/10 rounded-xl">
                <p className="text-white/70 text-lg leading-relaxed drop-shadow-[0_1px_3px_rgba(0,0,0,0.2)]">
                  No practice sessions yet. Start your first session above!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {practiceHistory.map((session) => (
                  <div
                    key={session.id}
                    className="bg-white/5 border border-white/10 rounded-xl p-6 transition-all duration-300 hover:bg-white/8 hover:border-white/20 hover:-translate-y-1 max-md:p-4"
                  >
                    <div className="flex justify-between items-start mb-3 gap-4 max-md:flex-col max-md:gap-2">
                      <span className="text-white/80 font-medium text-lg drop-shadow-[0_1px_3px_rgba(0,0,0,0.2)] max-md:text-base">
                        {formatDate(session.start_time)}
                      </span>
                      <span className="font-mono text-xl font-bold text-white bg-white/10 px-4 py-2 rounded-lg border border-white/20 drop-shadow-[0_2px_6px_rgba(0,0,0,0.3)] max-md:text-lg max-md:px-3 max-md:py-1.5">
                        {formatTime(session.duration_seconds)}
                      </span>
                    </div>
                    {session.notes && (
                      <p className="text-white/70 text-base leading-relaxed drop-shadow-[0_1px_3px_rgba(0,0,0,0.2)] max-md:text-sm">
                        {session.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center gap-4 pt-8 border-t border-white/10 max-md:flex-col max-md:gap-4">
            <a
              href="/dashboard"
              className="text-white/80 no-underline font-medium transition-all duration-300 text-base drop-shadow-[0_1px_3px_rgba(0,0,0,0.3)] px-6 py-3 rounded-lg bg-white/5 border border-white/10 hover:text-white hover:bg-white/10 hover:border-white/20 hover:-translate-x-1 hover:drop-shadow-[0_2px_6px_rgba(0,0,0,0.4)]"
            >
              ← Back to Dashboard
            </a>
            <a
              href="/account"
              className="text-white/80 no-underline font-medium transition-all duration-300 text-base drop-shadow-[0_1px_3px_rgba(0,0,0,0.3)] px-6 py-3 rounded-lg bg-white/5 border border-white/10 hover:text-white hover:bg-white/10 hover:border-white/20 hover:translate-x-1 hover:drop-shadow-[0_2px_6px_rgba(0,0,0,0.4)]"
            >
              Account Settings →
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
