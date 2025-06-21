'use client';

import { createClient } from '@/utils/supabase/client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import ThemeMenu from '../../components/ThemeMenu';
import styles from './page.module.css';

export default function Account() {
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<User | null>(null);
  const [userRecord, setUserRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      try {
        // Get the authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          router.push('/Signin');
          return;
        }

        setUser(user);

        // Get the user record from our database
        const { data: userRecord, error: dbError } = await supabase
          .from('users')
          .select('*')
          .eq('email', user.email)
          .single();

        if (!dbError && userRecord) {
          setUserRecord(userRecord);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, [supabase, router]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setLoggingOut(false);
    }
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
    <div className={styles.accountWrapper}>
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
        <div className={styles.accountContainer}>
          <div className={styles.accountHeader}>
            <h1 className={styles.accountTitle}>Account Settings</h1>
            <p className={styles.accountSubtitle}>
              Manage your profile and authentication settings
            </p>
          </div>
          
          {/* User Information */}
          <div className={styles.infoSection}>
            <h2 className={styles.sectionTitle}>Authentication Info</h2>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <label>Email</label>
                <span>{user?.email}</span>
              </div>
              <div className={styles.infoItem}>
                <label>User ID</label>
                <span className={styles.userId}>{user?.id}</span>
              </div>
              <div className={styles.infoItem}>
                <label>Last Sign In</label>
                <span>{user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'N/A'}</span>
              </div>
              <div className={styles.infoItem}>
                <label>Email Confirmed</label>
                <span className={user?.email_confirmed_at ? styles.confirmed : styles.unconfirmed}>
                  {user?.email_confirmed_at ? '✅ Confirmed' : '❌ Unconfirmed'}
                </span>
              </div>
            </div>
          </div>

          {/* Database Record */}
          {userRecord && (
            <div className={styles.infoSection}>
              <h2 className={styles.sectionTitle}>Database Record</h2>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <label>Database ID</label>
                  <span>{userRecord.id}</span>
                </div>
                <div className={styles.infoItem}>
                  <label>Full Name</label>
                  <span>{userRecord.full_name || 'Not set'}</span>
                </div>
                <div className={styles.infoItem}>
                  <label>Created At</label>
                  <span>{new Date(userRecord.created_at).toLocaleString()}</span>
                </div>
                <div className={styles.infoItem}>
                  <label>Updated At</label>
                  <span>{new Date(userRecord.updated_at).toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className={styles.actionsSection}>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className={styles.logoutButton}
            >
              {loggingOut ? 'Signing out...' : 'Sign Out'}
            </button>
            
            <a href="/dashboard" className={styles.dashboardLink}>
              ← Back to Dashboard
            </a>
          </div>
        </div>
      </main>
    </div>
  );
} 