'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import styles from './PracticeTracker.module.css';

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
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) return;
        
        setUser(user);
        await checkForActiveSession();
      } catch (error) {
        console.error('Error initializing practice tracker:', error);
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
      if (typeof window !== 'undefined') {
        localStorage.removeItem('practiceSession');
      }
    };
    
    // Listen for localStorage changes (for cross-tab sync)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'practiceSession') {
        checkForActiveSession();
      }
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('practiceSessionStarted', handleSessionStarted);
      window.addEventListener('practiceSessionEnded', handleSessionEnded);
      window.addEventListener('storage', handleStorageChange);
      
      return () => {
        window.removeEventListener('practiceSessionStarted', handleSessionStarted);
        window.removeEventListener('practiceSessionEnded', handleSessionEnded);
        window.removeEventListener('storage', handleStorageChange);
      };
    }
  }, [supabase]);

  // Timer effect
  useEffect(() => {
    if (isSessionActive && sessionStartTime) {
      intervalRef.current = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - sessionStartTime.getTime()) / 1000);
        setElapsedTime(elapsed);
        
        // Update session in database every 60 seconds
        if (elapsed % 60 === 0 && currentSessionId) {
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

  // Check localStorage for active session
  const checkForActiveSession = async () => {
    try {
      if (typeof window === 'undefined') return;
      
      const savedSession = localStorage.getItem('practiceSession');
      if (savedSession) {
        const parsed: PracticeSession = JSON.parse(savedSession);
        if (parsed.isActive) {
          setIsSessionActive(true);
          setSessionStartTime(new Date(parsed.startTime));
          setCurrentSessionId(parsed.sessionId);
          setShowTracker(true);
          
          // Calculate elapsed time
          const now = new Date();
          const elapsed = Math.floor((now.getTime() - new Date(parsed.startTime).getTime()) / 1000);
          setElapsedTime(elapsed);
        }
      }
    } catch (error) {
      console.error('Error checking for active session:', error);
    }
  };

  const updateSessionDuration = async (sessionId: number, duration: number) => {
    try {
      await supabase
        .from('practice_sessions')
        .update({ duration_seconds: duration })
        .eq('id', sessionId);
    } catch (error) {
      console.error('Error updating session duration:', error);
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const navigateToPractice = () => {
    window.location.href = '/practice';
  };

  // Don't show tracker if no active session or if we're on the practice page
  if (!showTracker || !isSessionActive || typeof window === 'undefined') {
    return null;
  }

  // Hide tracker on practice page
  if (window.location.pathname === '/practice') {
    return null;
  }

  return (
    <div className={styles.practiceTracker} onClick={navigateToPractice}>
      <div className={styles.trackerContent}>
        <div className={styles.trackerIcon}>🎵</div>
        <div className={styles.trackerInfo}>
          <div className={styles.trackerLabel}>Practice Session</div>
          <div className={styles.trackerTime}>{formatTime(elapsedTime)}</div>
        </div>
        <div className={styles.trackerPulse}></div>
      </div>
    </div>
  );
} 