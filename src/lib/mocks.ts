/**
 * mocks.ts
 *
 * Mock implementations of all repository and adapter interfaces.
 *
 * Use these in:
 *   1. Unit tests — inject mocks instead of real implementations
 *   2. Local development — no live DB or API credentials needed
 *   3. Storybook / UI development against realistic fixture data
 *
 * Usage in tests:
 *
 *   import { createMockRepos, createMockAdapters } from '@/lib/mocks';
 *   import { resetContainer } from '@/lib/container';
 *
 *   beforeEach(() => {
 *     resetContainer({
 *       repos:    createMockRepos(),
 *       adapters: createMockAdapters(),
 *     });
 *   });
 *
 * Usage for local dev (set NEXT_PUBLIC_USE_MOCKS=true in .env.local):
 *
 *   In container.ts, check the env flag and return mock implementations.
 */

import type { IRepositories } from './interfaces/repositories';
import type { IAdapters }     from './interfaces/adapters';
import type {
  User, ConnectedCalendar, CalendarEvent, StressScore, ScoreHistory,
  RecoverySession, Cohort, CohortMember, WeeklyPrompt, PromptResponse,
  AlertRule, AlertEvent, Subscription, PaginatedResult,
  UserId, CalendarSource,
} from './interfaces/types';

// ─────────────────────────────────────────────────────────────────────────────
// FIXTURE DATA
// ─────────────────────────────────────────────────────────────────────────────

const FIXTURE_USER: User = {
  id: 'user_mock_001',
  email: 'alex@techcorp.com',
  name: 'Alex Chen',
  role: 'VP of Product',
  companySize: '51–250',
  industry: 'Technology',
  ageRange: '35–44',
  persona: 'managing_load',
  tier: 'signal',
  trialEndsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
  trialStartedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  createdAt: new Date(),
  updatedAt: new Date(),
};

const FIXTURE_SCORES: StressScore[] = Array.from({ length: 14 }, (_, i) => ({
  id: `score_${i}`,
  userId: FIXTURE_USER.id,
  date: new Date(Date.now() - (13 - i) * 24 * 60 * 60 * 1000),
  checkInValue: 50 + Math.floor(Math.random() * 30),
  calendarPts: 10 + Math.floor(Math.random() * 30),
  totalScore: 60 + Math.floor(Math.random() * 20),
  rollingAvg7d: 68,
  createdAt: new Date(),
  updatedAt: new Date(),
}));

const FIXTURE_EVENTS: CalendarEvent[] = [
  {
    id: 'evt_001', userId: FIXTURE_USER.id, calendarId: 'cal_work',
    externalId: 'google_001', source: 'google', tag: 'work', category: 'work',
    title: null, startAt: new Date('2025-03-25T09:30:00'), endAt: new Date('2025-03-25T10:30:00'),
    durationMinutes: 60, attendeeCount: 12, isRecurring: true, recurringGroupId: 'rec_001',
    baseStressPts: 8, contextSwitchPts: 6, totalStressPts: 18,
    scoringDisabled: false, scoringDisabledScope: null, categoryOverriddenByUser: false,
    createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'evt_002', userId: FIXTURE_USER.id, calendarId: 'cal_work',
    externalId: 'google_002', source: 'google', tag: 'work', category: 'work',
    title: null, startAt: new Date('2025-03-25T10:30:00'), endAt: new Date('2025-03-25T11:30:00'),
    durationMinutes: 60, attendeeCount: 6, isRecurring: false, recurringGroupId: null,
    baseStressPts: 8, contextSwitchPts: 6, totalStressPts: 14,
    scoringDisabled: false, scoringDisabledScope: null, categoryOverriddenByUser: false,
    createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'evt_003', userId: FIXTURE_USER.id, calendarId: 'cal_personal',
    externalId: 'google_003', source: 'google', tag: 'personal', category: 'active_personal',
    title: null, startAt: new Date('2025-03-25T12:00:00'), endAt: new Date('2025-03-25T13:00:00'),
    durationMinutes: 60, attendeeCount: null, isRecurring: false, recurringGroupId: null,
    baseStressPts: 4, contextSwitchPts: 6, totalStressPts: 10,
    scoringDisabled: false, scoringDisabledScope: null, categoryOverriddenByUser: false,
    createdAt: new Date(), updatedAt: new Date(),
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MOCK REPOSITORIES
// ─────────────────────────────────────────────────────────────────────────────

export function createMockRepos(): IRepositories {
  // In-memory stores
  const users    = new Map<string, User>([[FIXTURE_USER.id, FIXTURE_USER]]);
  const scores   = new Map<string, StressScore>(FIXTURE_SCORES.map(s => [s.id, s]));
  const events   = new Map<string, CalendarEvent>(FIXTURE_EVENTS.map(e => [e.id, e]));
  const sessions = new Map<string, RecoverySession>();
  const alerts   = new Map<string, AlertRule>();

  return {
    users: {
      findById: async (id) => users.get(id) ?? null,
      findByEmail: async (email) => [...users.values()].find(u => u.email === email) ?? null,
      create: async (input) => {
        const user: User = { ...input, id: `user_${Date.now()}`, trialEndsAt: null, trialStartedAt: null, createdAt: new Date(), updatedAt: new Date() };
        users.set(user.id, user);
        return user;
      },
      update: async (id, input) => {
        const user = users.get(id);
        if (!user) throw new Error(`User ${id} not found`);
        const updated = { ...user, ...input, updatedAt: new Date() };
        users.set(id, updated);
        return updated;
      },
      delete: async (id) => { users.delete(id); },
      isTrialActive: async (id) => {
        const user = users.get(id);
        if (!user?.trialEndsAt) return false;
        return user.trialEndsAt > new Date();
      },
    },

    calendars: {
      findCalendarsByUser: async () => [],
      findCalendarById: async () => null,
      saveCalendar: async (cal) => ({ ...cal, id: `cal_${Date.now()}`, createdAt: new Date() }),
      updateCalendarTokens: async () => {},
      updateWatchHandle: async () => {},
      updateScoringPreferences: async () => {},
      deleteCalendar: async () => {},
    },

    events: {
      upsertEvents: async (inputs) => inputs.map((e, i) => ({ ...FIXTURE_EVENTS[0], ...e, id: `evt_new_${i}`, baseStressPts: 8, contextSwitchPts: 0, totalStressPts: 8, scoringDisabled: false, scoringDisabledScope: null, categoryOverriddenByUser: false, createdAt: new Date(), updatedAt: new Date() })),
      findByDateRange: async () => [...events.values()],
      findById: async (id) => events.get(id) ?? null,
      overrideEventScore: async (id, override) => {
        const event = events.get(id);
        if (!event) throw new Error(`Event ${id} not found`);
        const updated = { ...event, ...override, updatedAt: new Date() };
        events.set(id, updated);
        return updated;
      },
      disableScoring: async (id, scope) => {
        const event = events.get(id);
        if (event) events.set(id, { ...event, scoringDisabled: true, scoringDisabledScope: scope });
      },
      enableScoring: async (id) => {
        const event = events.get(id);
        if (event) events.set(id, { ...event, scoringDisabled: false, scoringDisabledScope: null });
      },
      deleteByCalendar: async () => {},
    },

    scores: {
      saveScore: async (input) => {
        const score: StressScore = {
          id: `score_${Date.now()}`, ...input,
          totalScore: Math.min(100, input.checkInValue + input.calendarPts),
          rollingAvg7d: 68, createdAt: new Date(), updatedAt: new Date(),
        };
        scores.set(score.id, score);
        return score;
      },
      findByDate: async (userId, date) =>
        [...scores.values()].find(s => s.userId === userId && s.date.toDateString() === date.toDateString()) ?? null,
      findByDateRange: async (userId, range) =>
        [...scores.values()].filter(s => s.userId === userId && s.date >= range.from && s.date <= range.to),
      getHistory: async (userId, range) => {
        const periodScores = [...scores.values()].filter(s => s.userId === userId);
        return {
          scores: periodScores,
          rollingAvg: 68,
          periodAvg: 65,
          peakDay: periodScores.at(-1) ?? null,
          lowestDay: periodScores.at(0) ?? null,
        };
      },
      getRecent: async (userId, limit) =>
        [...scores.values()].filter(s => s.userId === userId).slice(-limit),
      updateRollingAvg: async (id, avg) => {
        const score = scores.get(id);
        if (score) scores.set(id, { ...score, rollingAvg7d: avg });
      },
    },

    sessions: {
      create: async (input) => {
        const session: RecoverySession = { id: `session_${Date.now()}`, ...input, completedAt: new Date(), createdAt: new Date() };
        sessions.set(session.id, session);
        return session;
      },
      findByUser: async (userId, { limit, offset }) => {
        const items = [...sessions.values()].filter(s => s.userId === userId).slice(offset, offset + limit);
        return { items, total: sessions.size, limit, offset };
      },
      findByDateRange: async (userId, range) =>
        [...sessions.values()].filter(s => s.userId === userId && s.completedAt >= range.from && s.completedAt <= range.to),
      countThisWeek: async () => Math.floor(Math.random() * 4),
    },

    cohorts: {
      findActiveForUser: async () => null,
      getLeaderboard: async () => [],
      getCurrentPrompt: async () => null,
      getPromptResponses: async () => [],
      saveResponse: async (input) => ({ ...input, id: `resp_${Date.now()}`, createdAt: new Date() }),
      hasResponded: async () => false,
      updateMemberStats: async () => {},
    },

    alerts: {
      findRulesByUser: async () => [...alerts.values()],
      findRuleByType: async (userId, ruleType) =>
        [...alerts.values()].find(a => a.userId === userId && a.ruleType === ruleType) ?? null,
      upsertRule: async (userId, ruleType, config) => {
        const existing = [...alerts.values()].find(a => a.userId === userId && a.ruleType === ruleType);
        const rule: AlertRule = { id: existing?.id ?? `alert_${Date.now()}`, userId, ruleType,
          enabled: true, threshold: 65, consecutiveDays: null, sessionsPerWeek: null,
          status: 'ok', lastFiredAt: null, createdAt: new Date(), updatedAt: new Date(), ...config };
        alerts.set(rule.id, rule);
        return rule;
      },
      updateRuleStatus: async (id, status, lastFiredAt) => {
        const rule = alerts.get(id);
        if (rule) alerts.set(id, { ...rule, status, lastFiredAt: lastFiredAt ?? rule.lastFiredAt });
      },
      logAlertEvent: async (input) => ({ ...input, id: `alertevt_${Date.now()}`, resolvedAt: null }),
      resolveAlertEvent: async () => {},
      getActiveAlerts: async () => [],
    },

    subscriptions: {
      findByUser: async () => null,
      findByProviderId: async () => null,
      create: async (input) => ({ ...input, id: `sub_${Date.now()}`, createdAt: new Date(), updatedAt: new Date() }),
      update: async (id, input) => { throw new Error('Mock: subscription not found'); },
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// MOCK ADAPTERS
// ─────────────────────────────────────────────────────────────────────────────

export function createMockAdapters(): IAdapters {
  const googleAdapter = {
    source: 'google' as CalendarSource,
    exchangeCodeForTokens: async () => ({ accessToken: 'mock_access', refreshToken: 'mock_refresh', expiresAt: new Date(Date.now() + 3600_000) }),
    refreshAccessToken: async () => ({ accessToken: 'mock_access_new', refreshToken: 'mock_refresh', expiresAt: new Date(Date.now() + 3600_000) }),
    getEvents: async () => FIXTURE_EVENTS.map(e => ({
      externalId: e.externalId, title: null,
      startAt: e.startAt, endAt: e.endAt,
      attendeeCount: e.attendeeCount, isRecurring: e.isRecurring,
      recurringGroupId: e.recurringGroupId, isAllDay: false,
    })),
    watchCalendar: async () => ({ handleId: 'mock_handle', expiresAt: new Date(Date.now() + 7 * 24 * 3600_000) }),
    stopWatch: async () => {},
    parseWebhookNotification: async () => ({ calendarId: 'cal_work', source: 'google' as CalendarSource, rawPayload: {} }),
    getAuthUrl: () => 'https://accounts.google.com/mock-oauth',
    revokeAccess: async () => {},
  };

  return {
    billing: {
      createTrialCheckout: async (userId, config) => ({ checkoutUrl: 'https://billing.mock/checkout', sessionId: 'mock_session' }),
      createPortalSession: async () => ({ portalUrl: 'https://billing.mock/portal' }),
      cancelSubscription: async () => {},
      resumeSubscription: async () => {},
      changeTier: async () => {},
      parseWebhookEvent: async () => { throw new Error('Mock: no webhook events'); },
      findCustomer: async () => null,
    },

    calendarAdapters: new Map([
      ['google', googleAdapter],
    ]) as Map<CalendarSource, typeof googleAdapter>,

    email: {
      sendTrialEndingReminder: async (to, data) => { console.log(`[MockEmail] Trial ending reminder → ${to.email}`); return { messageId: 'mock_msg' }; },
      sendBurnoutAlert: async (to) => { console.log(`[MockEmail] Burnout alert → ${to.email}`); return { messageId: 'mock_msg' }; },
      sendMonthlyReport: async (to) => { console.log(`[MockEmail] Monthly report → ${to.email}`); return { messageId: 'mock_msg' }; },
      sendWeeklyPrompt: async (to) => { console.log(`[MockEmail] Weekly prompt → ${to.email}`); return { messageId: 'mock_msg' }; },
      sendTemplate: async (to) => { console.log(`[MockEmail] Template → ${to.email}`); return { messageId: 'mock_msg' }; },
    },

    push: {
      registerToken: async (userId, token) => { console.log(`[MockPush] Registered token for ${userId}`); },
      removeToken: async () => {},
      send: async (userId, notif) => { console.log(`[MockPush] → ${userId}: ${notif.title}`); },
      sendBulk: async (userIds, notif) => { console.log(`[MockPush] Bulk → ${userIds.length} users: ${notif.title}`); },
    },

    jobs: {
      enqueue: async (name, payload) => { console.log(`[MockJobs] Enqueue: ${name}`, payload); },
      scheduleAt: async (name, payload, runAt) => { console.log(`[MockJobs] Schedule: ${name} at ${runAt.toISOString()}`); },
      scheduleCron: async (name, payload, cron) => { console.log(`[MockJobs] Cron: ${name} @ ${cron}`); },
      cancel: async (jobId) => { console.log(`[MockJobs] Cancel: ${jobId}`); },
    },

    storage: {
      upload: async (bucket, key) => ({ url: `https://storage.mock/${bucket}/${key}`, key }),
      getSignedUrl: async (bucket, key) => `https://storage.mock/${bucket}/${key}?signed=true`,
      delete: async () => {},
    },
  };
}
