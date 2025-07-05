// Email utility functions for the Music Tools Suite

import { getBaseUrl } from '@/utils/getBaseUrl';

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export class EmailService {
  private static async sendEmail(emailData: EmailData): Promise<{ success: boolean; error?: string; messageId?: string }> {
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });

      const result = await response.json();
      
      if (!response.ok) {
        return { success: false, error: result.error || 'Failed to send email' };
      }

      return { 
        success: true, 
        messageId: result.messageId,
        error: undefined 
      };
    } catch (error) {
      console.error('Email sending error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  // Welcome email for new users
  static async sendWelcomeEmail(userEmail: string, userName?: string): Promise<{ success: boolean; error?: string }> {
    const html = this.getWelcomeEmailTemplate(userName || 'Music Enthusiast');
    
    return this.sendEmail({
      to: userEmail,
      subject: '🎵 Welcome to Music Tools Suite!',
      html,
    });
  }

  // Practice session reminder
  static async sendPracticeReminder(userEmail: string, userName?: string, streakDays?: number): Promise<{ success: boolean; error?: string }> {
    const html = this.getPracticeReminderTemplate(userName || 'Musician', streakDays);
    
    return this.sendEmail({
      to: userEmail,
      subject: '🎹 Time to Practice - Keep Your Musical Journey Going!',
      html,
    });
  }

  // Practice milestone achievement
  static async sendMilestoneEmail(userEmail: string, userName: string, milestone: string, totalHours: number): Promise<{ success: boolean; error?: string }> {
    const html = this.getMilestoneEmailTemplate(userName, milestone, totalHours);
    
    return this.sendEmail({
      to: userEmail,
      subject: `🏆 Congratulations! You've reached ${milestone}`,
      html,
    });
  }

  // Weekly practice summary
  static async sendWeeklyPracticeSummary(userEmail: string, userName: string, weeklyData: {
    totalHours: number;
    sessionsCompleted: number;
    favoriteInstrument?: string;
    improvementNotes?: string;
  }): Promise<{ success: boolean; error?: string }> {
    const html = this.getWeeklySummaryTemplate(userName, weeklyData);
    
    return this.sendEmail({
      to: userEmail,
      subject: '📊 Your Weekly Practice Summary',
      html,
    });
  }

  // Email Templates
  private static getWelcomeEmailTemplate(userName: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Music Tools Suite</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #002C60, #506B8B); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
          .feature { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .cta { background: #002C60; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎵 Welcome to Music Tools Suite!</h1>
            <p>Your complete toolkit for musical excellence</p>
          </div>
          
          <div class="content">
            <p>Hello ${userName},</p>
            
            <p>Welcome to Music Tools Suite! We're thrilled to have you join our community of passionate musicians. Your musical journey just got a powerful upgrade!</p>
            
            <div class="feature">
              <h3>🎹 Virtual Piano</h3>
              <p>Practice scales, chords, and melodies with our interactive virtual piano featuring multiple sound profiles.</p>
            </div>
            
            <div class="feature">
              <h3>🥁 Professional Metronome</h3>
              <p>Keep perfect time with customizable beats, time signatures, and beautiful visual feedback.</p>
            </div>
            
            <div class="feature">
              <h3>🎼 Precision Tuner</h3>
              <p>Tune your instruments with professional-grade accuracy and real-time visual feedback.</p>
            </div>
            
            <div class="feature">
              <h3>📊 Practice Tracking</h3>
              <p>Log your practice sessions, track progress, and build consistent practice habits.</p>
            </div>
            
            <p>Ready to start your musical journey? Click below to access your tools:</p>
            
            <a href="${getBaseUrl()}/dashboard" class="cta">
              Start Making Music 🎵
            </a>
            
            <p>Happy practicing!</p>
            <p>The Music Tools Suite Team</p>
          </div>
          
          <div class="footer">
            <p>Music Tools Suite - Your Complete Musical Toolkit</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private static getPracticeReminderTemplate(userName: string, streakDays?: number): string {
    const streakMessage = streakDays && streakDays > 0 
      ? `<p style="background: #10B981; color: white; padding: 15px; border-radius: 8px; text-align: center;">
           🔥 <strong>${streakDays} day practice streak!</strong> Don't break it now!
         </p>`
      : '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Practice Reminder</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #002C60, #506B8B); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
          .cta { background: #002C60; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
          .tip { background: #EFF6FF; border-left: 4px solid #002C60; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎹 Time to Practice!</h1>
            <p>Your musical skills are waiting for you</p>
          </div>
          
          <div class="content">
            <p>Hello ${userName},</p>
            
            ${streakMessage}
            
            <p>It's time for your practice session! Even just 15 minutes of focused practice can make a significant difference in your musical development.</p>
            
            <div class="tip">
              <h4>💡 Today's Practice Tip:</h4>
              <p>Start with scales to warm up your fingers, then focus on one challenging piece. Remember, slow and accurate practice is more valuable than fast and sloppy!</p>
            </div>
            
            <p>Ready to make beautiful music?</p>
            
            <a href="${getBaseUrl()}/dashboard" class="cta">
              Start Practicing 🎵
            </a>
            
            <p>Keep up the great work!</p>
            <p>The Music Tools Suite Team</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private static getMilestoneEmailTemplate(userName: string, milestone: string, totalHours: number): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Milestone Achievement</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #F59E0B, #EAB308); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
          .achievement { background: #FEF3C7; border: 2px solid #F59E0B; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0; }
          .cta { background: #F59E0B; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏆 Congratulations!</h1>
            <p>You've reached an amazing milestone!</p>
          </div>
          
          <div class="content">
            <p>Dear ${userName},</p>
            
            <div class="achievement">
              <h2>🎉 ${milestone} Achieved!</h2>
              <p><strong>${totalHours} hours</strong> of dedicated practice</p>
              <p>Your commitment to musical excellence is truly inspiring!</p>
            </div>
            
            <p>This achievement represents countless hours of dedication, practice, and musical growth. You should be incredibly proud of how far you've come!</p>
            
            <p>Here's what makes this milestone special:</p>
            <ul>
              <li>🎯 Consistent practice habits developed</li>
              <li>🎵 Musical skills significantly improved</li>
              <li>🧠 Muscle memory and technique enhanced</li>
              <li>🎼 Musical understanding deepened</li>
            </ul>
            
            <p>Keep up the fantastic work and continue your musical journey!</p>
            
            <a href="${getBaseUrl()}/practice" class="cta">
              Continue Your Journey 🎵
            </a>
            
            <p>Celebrating your success,</p>
            <p>The Music Tools Suite Team</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private static getWeeklySummaryTemplate(userName: string, weeklyData: {
    totalHours: number;
    sessionsCompleted: number;
    favoriteInstrument?: string;
    improvementNotes?: string;
  }): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Weekly Practice Summary</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10B981, #059669); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
          .stat { background: white; padding: 20px; margin: 10px 0; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .stat-number { font-size: 2em; font-weight: bold; color: #10B981; }
          .cta { background: #10B981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 Your Weekly Summary</h1>
            <p>Great work this week, ${userName}!</p>
          </div>
          
          <div class="content">
            <p>Here's a summary of your musical progress this week:</p>
            
            <div class="stat">
              <div class="stat-number">${weeklyData.totalHours.toFixed(1)}</div>
              <div>Hours Practiced</div>
            </div>
            
            <div class="stat">
              <div class="stat-number">${weeklyData.sessionsCompleted}</div>
              <div>Practice Sessions</div>
            </div>
            
            ${weeklyData.favoriteInstrument ? `
              <div class="stat">
                <div style="font-size: 1.5em;">🎵</div>
                <div>Most Used: ${weeklyData.favoriteInstrument}</div>
              </div>
            ` : ''}
            
            ${weeklyData.improvementNotes ? `
              <div style="background: #EFF6FF; border-left: 4px solid #002C60; padding: 15px; margin: 20px 0;">
                <h4>📈 This Week's Progress:</h4>
                <p>${weeklyData.improvementNotes}</p>
              </div>
            ` : ''}
            
            <p>Keep up the excellent work! Consistency is the key to musical mastery.</p>
            
            <a href="${getBaseUrl()}/practice" class="cta">
              Plan Next Week 🎵
            </a>
            
            <p>Keep making beautiful music!</p>
            <p>The Music Tools Suite Team</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
} 