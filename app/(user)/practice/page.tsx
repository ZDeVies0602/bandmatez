'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import ThemeMenu from '../../components/ThemeMenu';
import styles from './page.module.css';

interface PracticeSession {
  id?: number;
  user_id: string;
  start_time: string;
  end_time?: string;
  duration_seconds: number;
  session_date: string;
  notes?: string;
  is_active: boolean;
}

export default function Practice() {
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [sessionNotes, setSessionNotes] = useState('');
  const [practiceHistory, setPracticeHistory] = useState<PracticeSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  // Initialize user and load existing session
  useEffect(() => {
    const initializeUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) {
          router.push('/Signin');
          return;
        }
        setUser(user);
        
        // Check for existing active session
        await checkForActiveSession(user.id);
        await loadPracticeHistory(user.id);
      } catch (error) {
        console.error('Error initializing user:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeUser();
  }, [supabase, router]);

  // Timer effect
  useEffect(() => {
    console.log('Timer effect triggered:', { isSessionActive, sessionStartTime, currentSessionId });
    
    if (isSessionActive && sessionStartTime) {
      console.log('Starting timer interval');
      intervalRef.current = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - sessionStartTime.getTime()) / 1000);
        console.log('Timer tick:', elapsed);
        setElapsedTime(elapsed);
        
        // Update session in database every 30 seconds
        if (elapsed % 30 === 0 && currentSessionId) {
          updateSessionDuration(currentSessionId, elapsed);
        }
      }, 1000);

      return () => {
        console.log('Cleaning up timer interval');
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    } else {
      console.log('Timer not started - missing requirements');
    }
  }, [isSessionActive, sessionStartTime, currentSessionId]);

  // Store session state in localStorage for persistence across pages
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (isSessionActive && sessionStartTime && currentSessionId) {
        localStorage.setItem('practiceSession', JSON.stringify({
          isActive: true,
          startTime: sessionStartTime.toISOString(),
          sessionId: currentSessionId,
          notes: sessionNotes
        }));
      } else {
        localStorage.removeItem('practiceSession');
      }
    }
  }, [isSessionActive, sessionStartTime, currentSessionId, sessionNotes]);

  // Check for existing active session
  const checkForActiveSession = async (userId: string) => {
    try {
      // Check localStorage first
      const savedSession = localStorage.getItem('practiceSession');
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        if (parsed.isActive) {
          setIsSessionActive(true);
          setSessionStartTime(new Date(parsed.startTime));
          setCurrentSessionId(parsed.sessionId);
          setSessionNotes(parsed.notes || '');
          
          // Calculate elapsed time
          const now = new Date();
          const elapsed = Math.floor((now.getTime() - new Date(parsed.startTime).getTime()) / 1000);
          setElapsedTime(elapsed);
          return;
        }
      }

      // Check database for active session
      const { data: activeSession, error } = await supabase
        .from('practice_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (!error && activeSession) {
        setIsSessionActive(true);
        setSessionStartTime(new Date(activeSession.start_time));
        setCurrentSessionId(activeSession.id);
        setSessionNotes(activeSession.notes || '');
        
        // Calculate elapsed time
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - new Date(activeSession.start_time).getTime()) / 1000);
        setElapsedTime(elapsed);
      }
    } catch (error) {
      console.error('Error checking for active session:', error);
    }
  };

  const loadPracticeHistory = async (userId: string) => {
    try {
      const { data: sessions, error } = await supabase
        .from('practice_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', false)
        .order('start_time', { ascending: false })
        .limit(10);

      if (!error && sessions) {
        setPracticeHistory(sessions);
      }
    } catch (error) {
      console.error('Error loading practice history:', error);
    }
  };

  const startPracticeSession = async () => {
    if (!user) return;

    console.log('Starting practice session...');
    
    try {
      const startTime = new Date();
      console.log('Start time:', startTime);
      
      const { data: session, error } = await supabase
        .from('practice_sessions')
        .insert({
          user_id: user.id,
          start_time: startTime.toISOString(),
          duration_seconds: 0,
          session_date: startTime.toISOString().split('T')[0],
          notes: sessionNotes,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      console.log('Session created:', session);

      // Set all the state immediately
      setIsSessionActive(true);
      setSessionStartTime(startTime);
      setCurrentSessionId(session.id);
      setElapsedTime(0);
      
      console.log('State updated - isSessionActive:', true, 'sessionStartTime:', startTime, 'sessionId:', session.id);
      
      // Force localStorage update immediately
      if (typeof window !== 'undefined') {
        localStorage.setItem('practiceSession', JSON.stringify({
          isActive: true,
          startTime: startTime.toISOString(),
          sessionId: session.id,
          notes: sessionNotes
        }));
        console.log('localStorage updated');
      }
      
      // Dispatch a custom event to notify the global tracker
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('practiceSessionStarted', {
          detail: {
            sessionId: session.id,
            startTime: startTime.toISOString(),
            notes: sessionNotes
          }
        }));
        console.log('Custom event dispatched');
      }
    } catch (error) {
      console.error('Error starting practice session:', error);
    }
  };

  const endPracticeSession = async () => {
    if (!currentSessionId || !sessionStartTime) return;

    try {
      const endTime = new Date();
      const finalDuration = Math.floor((endTime.getTime() - sessionStartTime.getTime()) / 1000);

      const { error } = await supabase
        .from('practice_sessions')
        .update({
          end_time: endTime.toISOString(),
          duration_seconds: finalDuration,
          notes: sessionNotes,
          is_active: false
        })
        .eq('id', currentSessionId);

      if (error) throw error;

      // Clear all state
      setIsSessionActive(false);
      setSessionStartTime(null);
      setCurrentSessionId(null);
      setElapsedTime(0);
      setSessionNotes('');
      
      // Clear localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('practiceSession');
      }
      
      // Dispatch event to notify global tracker
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('practiceSessionEnded'));
      }
      
      // Reload history
      await loadPracticeHistory(user.id);
    } catch (error) {
      console.error('Error ending practice session:', error);
    }
  };

  const updateSessionDuration = async (sessionId: number, duration: number) => {
    try {
      await supabase
        .from('practice_sessions')
        .update({
          duration_seconds: duration,
          notes: sessionNotes
        })
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

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className={styles.loadingWrapper}>
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
        <div className={styles.loadingContent}>
          <div className={styles.loadingText}>Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.practiceWrapper}>
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
      
      <main className={styles.mainContent}>
        <div className={styles.practiceContainer}>
          <div className={styles.practiceHeader}>
            <h1 className={styles.practiceTitle}>Practice Logger</h1>
            <p className={styles.practiceSubtitle}>
              Track your musical practice sessions and build consistency
            </p>
          </div>
          
          {/* Current Session */}
          <div className={styles.currentSession}>
            <div className={styles.sessionDisplay}>
              <div className={styles.timerDisplay}>
                <span className={styles.timerText}>{formatTime(elapsedTime)}</span>
                <span className={styles.timerLabel}>
                  {isSessionActive ? 'Session Active' : 'Ready to Practice'}
                </span>
              </div>
              
              <div className={styles.sessionControls}>
                {!isSessionActive ? (
                  <button
                    onClick={startPracticeSession}
                    className={styles.startButton}
                  >
                    🎵 Start Practice Session
                  </button>
                ) : (
                  <button
                    onClick={endPracticeSession}
                    className={styles.endButton}
                  >
                    ⏹️ End Session
                  </button>
                )}
              </div>
            </div>
            
            {/* Session Notes */}
            <div className={styles.notesSection}>
              <label htmlFor="sessionNotes" className={styles.notesLabel}>
                Session Notes
              </label>
              <textarea
                id="sessionNotes"
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="What are you working on today? Goals, exercises, pieces..."
                className={styles.notesTextarea}
                rows={3}
              />
            </div>
          </div>
          
          {/* Practice History */}
          <div className={styles.historySection}>
            <h2 className={styles.historyTitle}>Recent Practice Sessions</h2>
            
            {practiceHistory.length === 0 ? (
              <div className={styles.emptyHistory}>
                <p>No practice sessions yet. Start your first session above!</p>
              </div>
            ) : (
              <div className={styles.historyList}>
                {practiceHistory.map((session) => (
                  <div key={session.id} className={styles.historyItem}>
                    <div className={styles.historyHeader}>
                      <span className={styles.historyDate}>
                        {formatDate(session.start_time)}
                      </span>
                      <span className={styles.historyDuration}>
                        {formatTime(session.duration_seconds)}
                      </span>
                    </div>
                    {session.notes && (
                      <p className={styles.historyNotes}>{session.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Navigation */}
          <div className={styles.navigationSection}>
            <a href="/dashboard" className={styles.navLink}>
              ← Back to Dashboard
            </a>
            <a href="/account" className={styles.navLink}>
              Account Settings →
            </a>
          </div>
        </div>
      </main>
    </div>
  );
} 