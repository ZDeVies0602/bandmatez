'use client';

import { createClient } from '../../utils/supabase/client';
import { getAuthCallbackUrl } from '../../utils/getBaseUrl';
import { useState } from 'react';

export default function SignIn() {
  const [supabase] = useState(() => createClient());
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: getAuthCallbackUrl('/dashboard')
        }
      });

      if (error) throw error;

      setMessage('Check your email for a magic link to sign in!');
      setMessageType('success');
      setEmail(''); // Clear the email field
    } catch (error: any) {
      setMessage(error.message);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signin-page">
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
        <div className="signin-container">
          <div className="signin-header">
            <h1 className="signin-title">Welcome Back</h1>
            <p className="signin-subtitle">
              Enter your email and we'll send you a magic link to access your music tools
            </p>
          </div>
          
          <form className="signin-form" onSubmit={handleMagicLink}>
            <div className="input-group">
              <label htmlFor="email" className="input-label">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="email-input"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {message && (
              <div className={`message ${messageType === 'error' ? 'message-error' : 'message-success'}`}>
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="magic-link-button"
            >
              {loading ? 'Sending magic link...' : 'Send Magic Link'}
            </button>
          </form>

          <div className="back-link">
            <a href="/" className="back-home">
              ← Back to home
            </a>
          </div>
        </div>
      </main>

      <style jsx>{`
        /* Color Palette */
        .signin-page {
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
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
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
          opacity: 0.7;
        }
        .shape2 {
          width: 28vmax;
          height: 28vmax;
          background: var(--accent-red);
          bottom: -18vmax;
          right: -12vmax;
          border-radius: 50%;
          opacity: 0.8;
        }
        .shape3 {
          width: 50vw;
          height: 2px;
          background: var(--neutral-gray);
          top: 35%;
          right: -15vw;
          transform: rotate(-45deg);
          opacity: 0.6;
        }
        .shape4 {
          width: 20vw;
          height: 20vw;
          background: var(--text-dark);
          top: 60%;
          left: 10%;
          clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
          opacity: 0.5;
        }

        .shape5 {
          width: 25rem;
          height: 25rem;
          background: var(--neutral-gray);
          position: absolute;
          top: -10rem;
          right: -10rem;
          border-bottom-left-radius: 25rem;
          opacity: 0.4;
        }

        .shape6 {
          width: 12rem;
          height: 12rem;
          border-radius: 50%;
          border: 2.5rem solid var(--bg-muted);
          position: absolute;
          bottom: 10%;
          left: 20%;
          opacity: 0.6;
        }

        .shape7 {
          width: 1rem;
          height: 15rem;
          background: var(--accent-red);
          position: absolute;
          bottom: 5%;
          right: 5%;
          box-shadow: -2.5rem 0 0 var(--accent-red), -5rem 0 0 var(--accent-red);
          opacity: 0.5;
        }

        .main-content {
          max-width: 500px;
          width: 100%;
          padding: 2rem;
          z-index: 2;
        }

        .signin-container {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border: 2px solid var(--text-dark);
          padding: 3rem;
          box-shadow: 0 20px 40px rgba(49, 8, 31, 0.1);
          transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
        }

        .signin-container:hover {
          transform: translateY(-5px);
          box-shadow: 0 30px 60px rgba(49, 8, 31, 0.15);
        }

        .signin-header {
          text-align: center;
          margin-bottom: 2.5rem;
        }

        .signin-title {
          font-family: var(--font-bebas-neue), sans-serif;
          font-size: clamp(2.5rem, 6vw, 3.5rem);
          font-weight: 400;
          color: var(--text-dark);
          letter-spacing: 2px;
          margin: 0 0 1rem 0;
          line-height: 1.1;
        }

        .signin-subtitle {
          font-size: 1.1rem;
          color: var(--neutral-gray);
          line-height: 1.6;
          margin: 0;
        }

        .signin-form {
          margin-bottom: 2rem;
        }

        .input-group {
          margin-bottom: 1.5rem;
        }

        .input-label {
          display: block;
          font-weight: 600;
          color: var(--text-dark);
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .email-input {
          width: 100%;
          padding: 1rem 1.25rem;
          border: 2px solid var(--neutral-gray);
          background: var(--bg-light);
          color: var(--text-dark);
          font-size: 1rem;
          transition: all 0.3s ease;
          box-sizing: border-box;
        }

        .email-input:focus {
          outline: none;
          border-color: var(--accent-red);
          background: white;
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(107, 15, 26, 0.1);
        }

        .email-input::placeholder {
          color: var(--neutral-gray);
          opacity: 0.7;
        }

        .message {
          padding: 1rem 1.25rem;
          margin-bottom: 1.5rem;
          border: 2px solid;
          font-weight: 500;
          font-size: 0.9rem;
        }

        .message-success {
          background: rgba(34, 197, 94, 0.1);
          border-color: #22c55e;
          color: #15803d;
        }

        .message-error {
          background: rgba(239, 68, 68, 0.1);
          border-color: #ef4444;
          color: #dc2626;
        }

        .magic-link-button {
          width: 100%;
          background: var(--accent-red);
          color: var(--bg-light);
          padding: 1.2rem 2rem;
          border: 2px solid var(--accent-red);
          font-weight: 700;
          font-size: 1.1rem;
          text-transform: uppercase;
          letter-spacing: 1px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }

        .magic-link-button:hover:not(:disabled) {
          background: var(--text-dark);
          border-color: var(--text-dark);
          transform: translateY(-3px);
          box-shadow: 0 15px 25px rgba(49, 8, 31, 0.2);
        }

        .magic-link-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .back-link {
          text-align: center;
        }

        .back-home {
          color: var(--neutral-gray);
          text-decoration: none;
          font-weight: 500;
          transition: all 0.3s ease;
          font-size: 0.95rem;
        }

        .back-home:hover {
          color: var(--accent-red);
          transform: translateX(-3px);
        }

        @media (max-width: 768px) {
          .main-content {
            padding: 1rem;
          }
          
          .signin-container {
            padding: 2rem;
          }
          
          .signin-title {
            font-size: 2.5rem;
          }
          
          .signin-subtitle {
            font-size: 1rem;
          }
        }
      `}</style>
    </div>
  );
}
