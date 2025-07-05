'use client';

import { useState, useCallback } from 'react';
import { EmailService } from '../lib/email';

interface EmailNotificationSettings {
  welcomeEmails: boolean;
  practiceReminders: boolean;
  milestoneNotifications: boolean;
  weeklySummaries: boolean;
}

interface PracticeData {
  totalHours: number;
  sessionsCompleted: number;
  favoriteInstrument?: string;
  improvementNotes?: string;
  streakDays?: number;
}

export function useEmailNotifications() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastEmailSent, setLastEmailSent] = useState<string | null>(null);

  // Send welcome email to new users
  const sendWelcomeEmail = useCallback(async (userEmail: string, userName?: string) => {
    setIsLoading(true);
    try {
      const result = await EmailService.sendWelcomeEmail(userEmail, userName);
      if (result.success) {
        setLastEmailSent('welcome');
        return { success: true };
      }
      return { success: false, error: result.error };
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      return { success: false, error: 'Failed to send welcome email' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Send practice reminder
  const sendPracticeReminder = useCallback(async (
    userEmail: string, 
    userName?: string, 
    streakDays?: number
  ) => {
    setIsLoading(true);
    try {
      const result = await EmailService.sendPracticeReminder(userEmail, userName, streakDays);
      if (result.success) {
        setLastEmailSent('practice-reminder');
        return { success: true };
      }
      return { success: false, error: result.error };
    } catch (error) {
      console.error('Failed to send practice reminder:', error);
      return { success: false, error: 'Failed to send practice reminder' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Send milestone achievement email
  const sendMilestoneEmail = useCallback(async (
    userEmail: string,
    userName: string,
    milestone: string,
    totalHours: number
  ) => {
    setIsLoading(true);
    try {
      const result = await EmailService.sendMilestoneEmail(userEmail, userName, milestone, totalHours);
      if (result.success) {
        setLastEmailSent('milestone');
        return { success: true };
      }
      return { success: false, error: result.error };
    } catch (error) {
      console.error('Failed to send milestone email:', error);
      return { success: false, error: 'Failed to send milestone email' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Send weekly practice summary
  const sendWeeklySummary = useCallback(async (
    userEmail: string,
    userName: string,
    practiceData: PracticeData
  ) => {
    setIsLoading(true);
    try {
      const result = await EmailService.sendWeeklyPracticeSummary(userEmail, userName, practiceData);
      if (result.success) {
        setLastEmailSent('weekly-summary');
        return { success: true };
      }
      return { success: false, error: result.error };
    } catch (error) {
      console.error('Failed to send weekly summary:', error);
      return { success: false, error: 'Failed to send weekly summary' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check if milestone should trigger email
  const checkMilestoneAndNotify = useCallback(async (
    userEmail: string,
    userName: string,
    currentHours: number,
    previousHours: number
  ) => {
    const milestones = [
      { hours: 1, name: '1 Hour Milestone' },
      { hours: 5, name: '5 Hours Milestone' },
      { hours: 10, name: '10 Hours Milestone' },
      { hours: 25, name: '25 Hours Milestone' },
      { hours: 50, name: '50 Hours Milestone' },
      { hours: 100, name: '100 Hours Milestone' },
      { hours: 250, name: '250 Hours Milestone' },
      { hours: 500, name: '500 Hours Milestone' },
      { hours: 1000, name: '1000 Hours Milestone' },
    ];

    for (const milestone of milestones) {
      if (currentHours >= milestone.hours && previousHours < milestone.hours) {
        // User just crossed this milestone
        await sendMilestoneEmail(userEmail, userName, milestone.name, currentHours);
        break; // Only send one milestone email at a time
      }
    }
  }, [sendMilestoneEmail]);

  // Auto-send practice reminder based on last session
  const checkAndSendPracticeReminder = useCallback(async (
    userEmail: string,
    userName: string,
    lastPracticeDate: Date,
    streakDays: number,
    settings: EmailNotificationSettings
  ) => {
    if (!settings.practiceReminders) return;

    const now = new Date();
    const daysSinceLastPractice = Math.floor(
      (now.getTime() - lastPracticeDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Send reminder if it's been more than 2 days since last practice
    if (daysSinceLastPractice >= 2) {
      await sendPracticeReminder(userEmail, userName, streakDays);
    }
  }, [sendPracticeReminder]);

  return {
    isLoading,
    lastEmailSent,
    sendWelcomeEmail,
    sendPracticeReminder,
    sendMilestoneEmail,
    sendWeeklySummary,
    checkMilestoneAndNotify,
    checkAndSendPracticeReminder,
  };
} 