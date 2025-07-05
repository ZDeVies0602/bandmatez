'use client';

import { useState } from 'react';
import { useEmailNotifications } from '../hooks/useEmailNotifications';

export default function EmailTestComponent() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

  const {
    isLoading,
    sendWelcomeEmail,
    sendPracticeReminder,
    sendMilestoneEmail,
    sendWeeklySummary,
  } = useEmailNotifications();

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

  const handleSendWelcome = async () => {
    if (!email) {
      showMessage('Please enter an email address', 'error');
      return;
    }

    const result = await sendWelcomeEmail(email, name || undefined);
    if (result.success) {
      showMessage('Welcome email sent successfully!', 'success');
    } else {
      showMessage(`Error: ${result.error}`, 'error');
    }
  };

  const handleSendReminder = async () => {
    if (!email) {
      showMessage('Please enter an email address', 'error');
      return;
    }

    const result = await sendPracticeReminder(email, name || undefined, 5);
    if (result.success) {
      showMessage('Practice reminder sent successfully!', 'success');
    } else {
      showMessage(`Error: ${result.error}`, 'error');
    }
  };

  const handleSendMilestone = async () => {
    if (!email || !name) {
      showMessage('Please enter both email and name', 'error');
      return;
    }

    const result = await sendMilestoneEmail(email, name, '10 Hours Milestone', 10.5);
    if (result.success) {
      showMessage('Milestone email sent successfully!', 'success');
    } else {
      showMessage(`Error: ${result.error}`, 'error');
    }
  };

  const handleSendWeeklySummary = async () => {
    if (!email || !name) {
      showMessage('Please enter both email and name', 'error');
      return;
    }

    const result = await sendWeeklySummary(email, name, {
      totalHours: 8.5,
      sessionsCompleted: 12,
      favoriteInstrument: 'Piano',
      improvementNotes: 'Great progress on scales and chord progressions this week!'
    });
    
    if (result.success) {
      showMessage('Weekly summary sent successfully!', 'success');
    } else {
      showMessage(`Error: ${result.error}`, 'error');
    }
  };

  return (
    <div style={{
      maxWidth: '600px',
      margin: '2rem auto',
      padding: '2rem',
      background: 'rgba(255, 255, 255, 0.1)',
      borderRadius: '15px',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.2)'
    }}>
      <h2 style={{ 
        color: 'var(--text-dark)', 
        textAlign: 'center', 
        marginBottom: '2rem',
        fontWeight: 'bold'
      }}>
        📧 Email Testing Component
      </h2>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '0.5rem', 
          color: 'var(--text-dark)',
          fontWeight: '600'
        }}>
          Email Address *
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="test@example.com"
          style={{
            width: '100%',
            padding: '0.75rem',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            background: 'rgba(255, 255, 255, 0.1)',
            color: 'var(--text-dark)',
            fontSize: '1rem'
          }}
        />
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '0.5rem', 
          color: 'var(--text-dark)',
          fontWeight: '600'
        }}>
          Name (optional)
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="John Doe"
          style={{
            width: '100%',
            padding: '0.75rem',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            background: 'rgba(255, 255, 255, 0.1)',
            color: 'var(--text-dark)',
            fontSize: '1rem'
          }}
        />
      </div>

      {message && (
        <div style={{
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1rem',
          background: messageType === 'success' 
            ? 'rgba(34, 197, 94, 0.2)' 
            : 'rgba(239, 68, 68, 0.2)',
          color: messageType === 'success' ? '#22C55E' : '#EF4444',
          border: `1px solid ${messageType === 'success' ? '#22C55E' : '#EF4444'}`,
          fontWeight: '600'
        }}>
          {message}
        </div>
      )}

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '1rem' 
      }}>
        <button
          onClick={handleSendWelcome}
          disabled={isLoading}
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            border: 'none',
            background: 'var(--accent-red)',
            color: 'white',
            fontWeight: '600',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.6 : 1,
            transition: 'all 0.3s ease'
          }}
        >
          {isLoading ? '...' : '🎵 Welcome Email'}
        </button>

        <button
          onClick={handleSendReminder}
          disabled={isLoading}
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            border: 'none',
            background: '#7C3AED',
            color: 'white',
            fontWeight: '600',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.6 : 1,
            transition: 'all 0.3s ease'
          }}
        >
          {isLoading ? '...' : '🎹 Practice Reminder'}
        </button>

        <button
          onClick={handleSendMilestone}
          disabled={isLoading}
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            border: 'none',
            background: '#F59E0B',
            color: 'white',
            fontWeight: '600',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.6 : 1,
            transition: 'all 0.3s ease'
          }}
        >
          {isLoading ? '...' : '🏆 Milestone'}
        </button>

        <button
          onClick={handleSendWeeklySummary}
          disabled={isLoading}
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            border: 'none',
            background: '#10B981',
            color: 'white',
            fontWeight: '600',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.6 : 1,
            transition: 'all 0.3s ease'
          }}
        >
          {isLoading ? '...' : '📊 Weekly Summary'}
        </button>
      </div>

      <div style={{
        marginTop: '2rem',
        padding: '1rem',
        background: 'rgba(59, 130, 246, 0.1)',
        borderRadius: '8px',
        border: '1px solid rgba(59, 130, 246, 0.3)'
      }}>
        <h4 style={{ color: 'var(--text-dark)', marginBottom: '0.5rem' }}>
          💡 Setup Instructions:
        </h4>
        <ol style={{ color: 'var(--text-dark)', fontSize: '0.9rem', lineHeight: '1.6' }}>
          <li>Install Resend: <code>npm install resend</code></li>
          <li>Get your API key from <a href="https://resend.com/api-keys" target="_blank" style={{ color: 'var(--accent-red)' }}>resend.com/api-keys</a></li>
          <li>Add to your <code>.env.local</code>: <code>RESEND_API_KEY=your_key_here</code></li>
          <li>Update the <code>from</code> address in the API route to your verified domain</li>
        </ol>
      </div>
    </div>
  );
} 