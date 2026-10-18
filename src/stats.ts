/**
 * Statistics tracking for dice rolls
 */

import type { HistoryEntry, ModeId } from './types';

export interface Stats {
  totalRolls: number;
  rollsByMode: Record<ModeId, number>;
  lastRollTime: number | null;
  streaks: {
    currentStreak: number; // consecutive days with rolls
    longestStreak: number;
    lastRollDate: string | null; // YYYY-MM-DD
  };
}

export const emptyStats = (): Stats => ({
  totalRolls: 0,
  rollsByMode: {
    catan: 0,
    monopoly: 0,
    yahtzee: 0,
    dnd: 0,
    warhammer: 0,
    risk: 0,
    custom: 0,
  },
  lastRollTime: null,
  streaks: {
    currentStreak: 0,
    longestStreak: 0,
    lastRollDate: null,
  },
});

const getDateString = (ts: number): string => {
  const d = new Date(ts);
  return d.toISOString().split('T')[0];
};

const daysBetween = (date1: string, date2: string): number => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

export const updateStatsFromHistory = (history: readonly HistoryEntry[], prevStats: Stats): Stats => {
  const stats: Stats = { ...prevStats };
  
  // Count rolls by mode
  stats.totalRolls = history.length;
  stats.rollsByMode = { ...emptyStats().rollsByMode };
  
  for (const entry of history) {
    stats.rollsByMode[entry.mode]++;
  }
  
  // Update last roll time
  if (history.length > 0) {
    stats.lastRollTime = history[0].ts;
    
    // Update streaks
    const todayStr = getDateString(Date.now());
    const lastRollStr = getDateString(history[0].ts);
    
    if (lastRollStr === todayStr) {
      // Rolled today
      if (stats.streaks.lastRollDate) {
        const daysSince = daysBetween(stats.streaks.lastRollDate, todayStr);
        if (daysSince === 1) {
          // Consecutive day
          stats.streaks.currentStreak++;
        } else if (daysSince > 1) {
          // Streak broken
          stats.streaks.currentStreak = 1;
        }
        // If daysSince === 0, same day, keep current streak
      } else {
        stats.streaks.currentStreak = 1;
      }
      
      stats.streaks.lastRollDate = todayStr;
      stats.streaks.longestStreak = Math.max(stats.streaks.longestStreak, stats.streaks.currentStreak);
    } else {
      // Haven't rolled today
      const daysSince = stats.streaks.lastRollDate ? daysBetween(stats.streaks.lastRollDate, todayStr) : 0;
      if (daysSince > 1) {
        // Streak broken
        stats.streaks.currentStreak = 0;
      }
    }
  }
  
  return stats;
};

export const getTopModes = (stats: Stats): Array<{ mode: ModeId; count: number }> => {
  return Object.entries(stats.rollsByMode)
    .map(([mode, count]) => ({ mode: mode as ModeId, count }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
};

export const formatLastRoll = (ts: number | null): string => {
  if (!ts) return 'Nigdy';
  
  const now = Date.now();
  const diff = now - ts;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Przed chwilą';
  if (minutes < 60) return `${minutes} min temu`;
  if (hours < 24) return `${hours} godz. temu`;
  if (days === 1) return 'Wczoraj';
  if (days < 7) return `${days} dni temu`;
  
  const date = new Date(ts);
  return date.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' });
};
