'use client';

import { createClient } from '@/utils/supabase/client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="account-page">
      <div className="background-shapes">
        <div className="shape shape1"></div>
        <div className="shape shape2"></div>
        <div className="shape shape3"></div>
        <div className="shape shape4"></div>
        <div className="shape shape5"></div>
        <div className="shape shape6"></div>
        <div className="shape shape7"></div>
      </div>
      
      <main className="main-content">
        <div className="account-container">
          <div className="account-header">
            <h1 className="account-title">Account Settings</h1>
            <p className="account-subtitle">
              Manage your profile and authentication settings
            </p>
          </div>
          
          {/* User Information */}
          <div className="info-section">
            <h2 className="section-title">Authentication Info</h2>
            <div className="info-grid">
              <div className="info-item">
                <label>Email</label>
                <span>{user?.email}</span>
              </div>
              <div className="info-item">
                <label>User ID</label>
                <span className="user-id">{user?.id}</span>
              </div>
              <div className="info-item">
                <label>Last Sign In</label>
                <span>{user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'N/A'}</span>
              </div>
              <div className="info-item">
                <label>Email Confirmed</label>
                <span className={user?.email_confirmed_at ? 'confirmed' : 'unconfirmed'}>
                  {user?.email_confirmed_at ? '✅ Confirmed' : '❌ Unconfirmed'}
                </span>
              </div>
            </div>
          </div>

          {/* Database Record */}
          {userRecord && (
            <div className="info-section">
              <h2 className="section-title">Database Record</h2>
              <div className="info-grid">
                <div className="info-item">
                  <label>Database ID</label>
                  <span>{userRecord.id}</span>
                </div>
                <div className="info-item">
                  <label>Full Name</label>
                  <span>{userRecord.full_name || 'Not set'}</span>
                </div>
                <div className="info-item">
                  <label>Created At</label>
                  <span>{new Date(userRecord.created_at).toLocaleString()}</span>
                </div>
                <div className="info-item">
                  <label>Updated At</label>
                  <span>{new Date(userRecord.updated_at).toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="actions-section">
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="logout-button"
            >
              {loggingOut ? 'Signing out...' : 'Sign Out'}
            </button>
            
            <a href="/dashboard" className="dashboard-link">
              ← Back to Dashboard
            </a>
          </div>
        </div>
      </main>

      <style jsx>{`
        /* Color Palette */
        .account-page {
          --bg-light: #DCE0D9;
          --text-dark: #31081F;
          --accent-red: #6B0F1A;
          --neutral-gray: #595959;
          --bg-muted: #808F85;
          background-color: var(--bg-light);
          color: var(--text-dark);
          min-height: 100vh;
          font-family: var(--font-inter), sans-serif;
          position: relative;
          overflow-x: hidden;
          padding: 2rem 0;
        }

        /* Abstract Geometric Background */
        .background-shapes .shape {
          position: absolute;
          transition: transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1);
          will-change: transform;
        }
        
        .shape1 {
          width: 35vw;
          height: 35vw;
          background: var(--bg-muted);
          top: -10vw;
          left: -8vw;
          clip-path: polygon(0 0, 100% 0, 50% 100%);
          transform: rotate(-25deg);
          opacity: 0.3;
        }
        .shape2 {
          width: 28vmax;
          height: 28vmax;
          background: var(--accent-red);
          bottom: -18vmax;
          right: -12vmax;
          border-radius: 50%;
          opacity: 0.4;
        }
        .shape3 {
          width: 50vw;
          height: 2px;
          background: var(--neutral-gray);
          top: 35%;
          right: -15vw;
          transform: rotate(-45deg);
          opacity: 0.3;
        }
        .shape4 {
          width: 20vw;
          height: 20vw;
          background: var(--text-dark);
          top: 60%;
          left: 10%;
          clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
          opacity: 0.2;
        }

        .shape5 {
          width: 25rem;
          height: 25rem;
          background: var(--neutral-gray);
          position: absolute;
          top: -10rem;
          right: -10rem;
          border-bottom-left-radius: 25rem;
          opacity: 0.2;
        }

        .shape6 {
          width: 12rem;
          height: 12rem;
          border-radius: 50%;
          border: 2.5rem solid var(--bg-muted);
          position: absolute;
          bottom: 10%;
          left: 20%;
          opacity: 0.3;
        }

        .shape7 {
          width: 1rem;
          height: 15rem;
          background: var(--accent-red);
          position: absolute;
          bottom: 5%;
          right: 5%;
          box-shadow: -2.5rem 0 0 var(--accent-red), -5rem 0 0 var(--accent-red);
          opacity: 0.3;
        }

        .main-content {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
          z-index: 2;
          position: relative;
        }

        .account-container {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border: 2px solid var(--text-dark);
          padding: 3rem;
          box-shadow: 0 20px 40px rgba(49, 8, 31, 0.1);
          transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
        }

        .account-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .account-title {
          font-family: var(--font-bebas-neue), sans-serif;
          font-size: clamp(2.5rem, 6vw, 3.5rem);
          font-weight: 400;
          color: var(--text-dark);
          letter-spacing: 2px;
          margin: 0 0 1rem 0;
          line-height: 1.1;
        }

        .account-subtitle {
          font-size: 1.1rem;
          color: var(--neutral-gray);
          line-height: 1.6;
          margin: 0;
        }

        .info-section {
          margin-bottom: 2.5rem;
          padding-bottom: 2rem;
          border-bottom: 1px solid rgba(49, 8, 31, 0.1);
        }

        .info-section:last-of-type {
          border-bottom: none;
        }

        .section-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--text-dark);
          margin-bottom: 1.5rem;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .info-item {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .info-item label {
          font-weight: 600;
          color: var(--neutral-gray);
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .info-item span {
          color: var(--text-dark);
          font-size: 1rem;
          word-break: break-all;
        }

        .user-id {
          font-family: monospace;
          font-size: 0.85rem;
          background: var(--bg-light);
          padding: 0.5rem;
          border: 1px solid var(--neutral-gray);
        }

        .confirmed {
          color: #15803d;
          font-weight: 600;
        }

        .unconfirmed {
          color: #dc2626;
          font-weight: 600;
        }

        .actions-section {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          align-items: center;
          margin-top: 2rem;
        }

        .logout-button {
          background: var(--accent-red);
          color: var(--bg-light);
          padding: 1.2rem 3rem;
          border: 2px solid var(--accent-red);
          font-weight: 700;
          font-size: 1.1rem;
          text-transform: uppercase;
          letter-spacing: 1px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }

        .logout-button:hover:not(:disabled) {
          background: var(--text-dark);
          border-color: var(--text-dark);
          transform: translateY(-3px);
          box-shadow: 0 15px 25px rgba(49, 8, 31, 0.2);
        }

        .logout-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .dashboard-link {
          color: var(--neutral-gray);
          text-decoration: none;
          font-weight: 500;
          transition: all 0.3s ease;
          font-size: 0.95rem;
        }

        .dashboard-link:hover {
          color: var(--accent-red);
          transform: translateX(-3px);
        }

        @media (max-width: 768px) {
          .main-content {
            padding: 1rem;
          }
          
          .account-container {
            padding: 2rem;
          }
          
          .account-title {
            font-size: 2.5rem;
          }
          
          .info-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
} 