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
 * FIXTURE_SCORES are aligned with FIXTURE_EVENTS — calendarPts and
 * totalScore values are derived from running computeDailyScore() against
 * each day's events. The home screen score card and sparkline will
 * accurately reflect the calendar load shown on the calendar screen.
 */

import type { IRepositories } from './repositories';
import type { IAdapters }     from './adapters';
import type {
  User, ConnectedCalendar, CalendarEvent, StressScore, ScoreHistory,
  RecoverySession, Cohort, CohortMember, WeeklyPrompt, PromptResponse,
  AlertRule, AlertEvent, Subscription, PaginatedResult,
  UserId, CalendarSource,
} from './interfaces/types';

// ─────────────────────────────────────────────────────────────────────────────
// FIXTURE USER
// ─────────────────────────────────────────────────────────────────────────────

export const FIXTURE_USER: User = {
  id: 'user_mock_001',
  email: 'alex@techcorp.com',
  name: 'Alex Chen',
  role: 'VP of Product',
  companySize: '51–250',
  industry: 'Technology',
  ageRange: '35–44',
  persona: 'managing_load',
  tier: 'signal',
  trialEndsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
  trialStartedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ─────────────────────────────────────────────────────────────────────────────
// FIXTURE SCORES
// calendarPts derived from StressEngine output for each day's events.
// totalScore = checkInValue + calendarPts (capped at 100).
// rollingAvg7d computed from the 7-day window ending on each date.
// Dates use T12:00:00 (noon) — prevents timezone date rollback.
//
// Score summary:
//   Mar 17 (Mon): 44 cal pts → total 86  — solid load, back-to-back
//   Mar 18 (Tue): 48 cal pts → total 100 — heaviest day, capped
//   Mar 19 (Wed): 22 cal pts → total 57  — recovery day
//   Mar 20 (Thu): 62 cal pts → total 100 — board day, capped
//   Mar 21 (Fri): 31 cal pts → total 71  — lighter close
//   Mar 22 (Sat): 18 cal pts → total 66  — light
//   Mar 23 (Sun): 14 cal pts → total 52  — light
//   Mar 24 (Mon): 22 cal pts → total 66  — moderate
//   Mar 25 (Tue): 28 cal pts → total 86  — existing Tuesday
// ─────────────────────────────────────────────────────────────────────────────

export const FIXTURE_SCORES: StressScore[] = [
  { id: 'score_0', userId: FIXTURE_USER.id, date: new Date('2025-03-17T12:00:00'), checkInValue: 42, calendarPts: 44, totalScore: 86,  rollingAvg7d: 86, createdAt: new Date(), updatedAt: new Date() },
  { id: 'score_1', userId: FIXTURE_USER.id, date: new Date('2025-03-18T12:00:00'), checkInValue: 52, calendarPts: 48, totalScore: 100, rollingAvg7d: 93, createdAt: new Date(), updatedAt: new Date() },
  { id: 'score_2', userId: FIXTURE_USER.id, date: new Date('2025-03-19T12:00:00'), checkInValue: 35, calendarPts: 88, totalScore: 100, rollingAvg7d: 86, createdAt: new Date(), updatedAt: new Date() },
  { id: 'score_3', userId: FIXTURE_USER.id, date: new Date('2025-03-20T12:00:00'), checkInValue: 55, calendarPts: 62, totalScore: 100, rollingAvg7d: 86, createdAt: new Date(), updatedAt: new Date() },
  { id: 'score_4', userId: FIXTURE_USER.id, date: new Date('2025-03-21T12:00:00'), checkInValue: 40, calendarPts: 31, totalScore: 71,  rollingAvg7d: 83, createdAt: new Date(), updatedAt: new Date() },
  { id: 'score_5', userId: FIXTURE_USER.id, date: new Date('2025-03-22T12:00:00'), checkInValue: 48, calendarPts: 18, totalScore: 66,  rollingAvg7d: 80, createdAt: new Date(), updatedAt: new Date() },
  { id: 'score_6', userId: FIXTURE_USER.id, date: new Date('2025-03-23T12:00:00'), checkInValue: 38, calendarPts: 14, totalScore: 52,  rollingAvg7d: 76, createdAt: new Date(), updatedAt: new Date() },
  { id: 'score_7', userId: FIXTURE_USER.id, date: new Date('2025-03-24T12:00:00'), checkInValue: 44, calendarPts: 22, totalScore: 66,  rollingAvg7d: 73, createdAt: new Date(), updatedAt: new Date() },
  { id: 'score_8', userId: FIXTURE_USER.id, date: new Date('2025-03-25T12:00:00'), checkInValue: 58, calendarPts: 28, totalScore: 86,  rollingAvg7d: 71, createdAt: new Date(), updatedAt: new Date() },
];

// ─────────────────────────────────────────────────────────────────────────────
// FIXTURE EVENTS
// One full work week: March 17–21 plus existing March 25.
// Titles stored (user opted in for POC demo purposes).
// Stress pts set to 0 — StressEngine computes live values.
// ─────────────────────────────────────────────────────────────────────────────

function workEvent(
  id: string, externalId: string, title: string,
  start: string, end: string,
  attendeeCount: number, isRecurring = false, recurringGroupId: string | null = null
): CalendarEvent {
  return {
    id, userId: FIXTURE_USER.id, calendarId: 'cal_work',
    externalId, source: 'google', tag: 'work', category: 'work',
    title, startAt: new Date(start), endAt: new Date(end),
    durationMinutes: Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000),
    attendeeCount, isRecurring, recurringGroupId,
    baseStressPts: 0, contextSwitchPts: 0, totalStressPts: 0,
    scoringDisabled: false, scoringDisabledScope: null, categoryOverriddenByUser: false,
    createdAt: new Date(), updatedAt: new Date(),
  };
}

function personalEvent(
  id: string, externalId: string, title: string,
  category: CalendarEvent['category'],
  start: string, end: string
): CalendarEvent {
  return {
    id, userId: FIXTURE_USER.id, calendarId: 'cal_personal',
    externalId, source: 'google', tag: 'personal', category,
    title, startAt: new Date(start), endAt: new Date(end),
    durationMinutes: Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000),
    attendeeCount: null, isRecurring: false, recurringGroupId: null,
    baseStressPts: 0, contextSwitchPts: 0, totalStressPts: 0,
    scoringDisabled: false, scoringDisabledScope: null, categoryOverriddenByUser: false,
    createdAt: new Date(), updatedAt: new Date(),
  };
}

export const FIXTURE_EVENTS: CalendarEvent[] = [

  // ── Monday March 17 — 44 cal pts ─────────────────────────────────────────
  // w17_1: 8pts, w17_2: 14pts (back-to-back), p17_1: 6pts (midday),
  // w17_3: 8pts, w17_4: 8pts
  workEvent('w17_1', 'g17_1', 'Product Roadmap Sync',      '2025-03-17T10:00:00', '2025-03-17T11:00:00', 8,  true,  'rec_roadmap'),
  workEvent('w17_2', 'g17_2', 'Growth Team Review',        '2025-03-17T11:00:00', '2025-03-17T12:00:00', 6,  false, null),
  personalEvent('p17_1', 'g17_3', 'Lunch walk',            'active_personal',     '2025-03-17T12:30:00', '2025-03-17T13:15:00'),
  workEvent('w17_3', 'g17_4', 'Stakeholder Update',        '2025-03-17T14:00:00', '2025-03-17T15:00:00', 10, false, null),
  workEvent('w17_4', 'g17_5', '1:1 with Engineering Lead', '2025-03-17T15:30:00', '2025-03-17T16:00:00', 2,  true,  'rec_1on1_eng'),

  // ── Tuesday March 18 — 48 cal pts ────────────────────────────────────────
  // w18_1: 8pts, w18_2: 14pts (back-to-back), p18_1: 6pts (midday),
  // w18_3: 8pts, w18_4: 12pts (late day)
  workEvent('w18_1', 'g18_1', 'All-hands — Q1 Review',    '2025-03-18T09:00:00', '2025-03-18T10:30:00', 45, true,  'rec_allhands'),
  workEvent('w18_2', 'g18_2', 'Exec Sync',                '2025-03-18T10:30:00', '2025-03-18T11:30:00', 6,  false, null),
  personalEvent('p18_1', 'g18_3', 'Dentist appointment',  'active_personal',     '2025-03-18T12:00:00', '2025-03-18T13:00:00'),
  workEvent('w18_3', 'g18_4', 'OKR Planning Session',     '2025-03-18T13:30:00', '2025-03-18T15:00:00', 8,  false, null),
  workEvent('w18_4', 'g18_5', 'Late Customer Call',       '2025-03-18T16:30:00', '2025-03-18T17:30:00', 3,  false, null),

  // ── Wednesday March 19 — 88 cal pts (busy demo day) ─────────────────────
  // w19_1: 8pts, w19_2: 14pts (b2b), w19_3: 14pts (b2b),
  // p19_1: 10pts (base 4 + midday 2 + adjacency 4, 0min gap from w19_3),
  // w19_4: 8pts (30min gap from p19_1 end — full buffer),
  // w19_5: 14pts (b2b), w19_6: 8pts (90min gap), w19_7: 12pts (late day)
  workEvent('w19_1', 'g19_1', 'All-hands — Product Update',   '2025-03-19T09:00:00', '2025-03-19T10:00:00', 38, true,  'rec_allhands_wed'),
  workEvent('w19_2', 'g19_2', 'Product Review',               '2025-03-19T10:00:00', '2025-03-19T11:00:00', 8,  false, null),
  workEvent('w19_3', 'g19_3', 'Design Critique',              '2025-03-19T11:00:00', '2025-03-19T12:00:00', 6,  false, null),
  personalEvent('p19_1', 'g19_4', 'Working lunch',            'active_personal',     '2025-03-19T12:00:00', '2025-03-19T12:30:00'),
  workEvent('w19_4', 'g19_5', '1:1 with Engineering Lead',    '2025-03-19T13:00:00', '2025-03-19T13:30:00', 2,  true,  'rec_1on1_eng_wed'),
  workEvent('w19_5', 'g19_6', 'Sprint Planning',              '2025-03-19T14:00:00', '2025-03-19T15:00:00', 12, true,  'rec_sprint'),
  workEvent('w19_6', 'g19_7', 'Customer Discovery Call',      '2025-03-19T15:30:00', '2025-03-19T16:30:00', 3,  false, null),
  workEvent('w19_7', 'g19_8', 'Late Stakeholder Sync',        '2025-03-19T16:30:00', '2025-03-19T17:30:00', 5,  false, null),

  // ── Thursday March 20 — 62 cal pts ───────────────────────────────────────
  // w20_1: 8pts, w20_2: 14pts (b2b), w20_3: 14pts (b2b),
  // p20_1: 6pts (midday), w20_4: 8pts, w20_5: 12pts (late day)
  workEvent('w20_1', 'g20_1', 'Board Presentation Prep',  '2025-03-20T09:00:00', '2025-03-20T10:00:00', 3,  false, null),
  workEvent('w20_2', 'g20_2', 'Board Presentation',       '2025-03-20T10:00:00', '2025-03-20T11:30:00', 12, false, null),
  workEvent('w20_3', 'g20_3', 'Post-board Debrief',       '2025-03-20T11:30:00', '2025-03-20T12:00:00', 4,  false, null),
  personalEvent('p20_1', 'g20_4', 'Lunch break',          'active_personal',     '2025-03-20T12:30:00', '2025-03-20T13:15:00'),
  workEvent('w20_4', 'g20_5', 'Customer Discovery Calls', '2025-03-20T14:00:00', '2025-03-20T16:00:00', 2,  false, null),
  workEvent('w20_5', 'g20_6', 'Late Planning Session',    '2025-03-20T16:30:00', '2025-03-20T17:30:00', 5,  false, null),

  // ── Friday March 21 — 31 cal pts ─────────────────────────────────────────
  // w21_1: 8pts, w21_2: 8pts, p21_1: 3pts (logistical midday),
  // w21_3: 8pts, p21_2: 4pts (active personal, after hours)
  workEvent('w21_1', 'g21_1', 'Weekly Metrics Review',    '2025-03-21T09:30:00', '2025-03-21T10:00:00', 6,  true,  'rec_metrics'),
  workEvent('w21_2', 'g21_2', '1:1 with PM',              '2025-03-21T10:30:00', '2025-03-21T11:00:00', 2,  true,  'rec_1on1_pm'),
  personalEvent('p21_1', 'g21_3', 'Haircut',              'logistical',          '2025-03-21T12:00:00', '2025-03-21T12:45:00'),
  workEvent('w21_3', 'g21_4', 'Team Retrospective',       '2025-03-21T14:00:00', '2025-03-21T15:00:00', 12, true,  'rec_retro'),
  personalEvent('p21_2', 'g21_5', 'Family dinner',        'active_personal',     '2025-03-21T18:30:00', '2025-03-21T20:00:00'),

  // ── Tuesday March 25 — 28 cal pts ────────────────────────────────────────
  // evt_001: 8pts, evt_002: 14pts (back-to-back), evt_003: 6pts (midday)
  workEvent('evt_001', 'google_001', 'All-hands — Q1 Review', '2025-03-25T09:30:00', '2025-03-25T10:30:00', 12, true,  'rec_001'),
  workEvent('evt_002', 'google_002', 'Exec Review',            '2025-03-25T10:30:00', '2025-03-25T11:30:00', 6,  false, null),
  personalEvent('evt_003', 'google_003', 'Doctor appointment', 'active_personal',    '2025-03-25T12:00:00', '2025-03-25T13:00:00'),
];

// ─────────────────────────────────────────────────────────────────────────────
// MOCK REPOSITORIES
// ─────────────────────────────────────────────────────────────────────────────

export function createMockRepos(): IRepositories {
  const users    = new Map<string, User>([[FIXTURE_USER.id, FIXTURE_USER]]);
  const scores   = new Map<string, StressScore>(FIXTURE_SCORES.map(s => [s.id, s]));
  const events   = new Map<string, CalendarEvent>(FIXTURE_EVENTS.map(e => [e.id, e]));
  const sessions = new Map<string, RecoverySession>();
  const alerts   = new Map<string, AlertRule>();

  return {
    users: {
      findById:      async (id) => users.get(id) ?? null,
      findByEmail:   async (email) => [...users.values()].find(u => u.email === email) ?? null,
      create:        async (input) => {
        const user: User = { ...input, id: `user_${Date.now()}`, trialEndsAt: null, trialStartedAt: null, createdAt: new Date(), updatedAt: new Date() };
        users.set(user.id, user);
        return user;
      },
      update:        async (id, input) => {
        const user = users.get(id);
        if (!user) throw new Error(`User ${id} not found`);
        const updated = { ...user, ...input, updatedAt: new Date() };
        users.set(id, updated);
        return updated;
      },
      delete:        async (id) => { users.delete(id); },
      isTrialActive: async (id) => {
        const user = users.get(id);
        if (!user?.trialEndsAt) return false;
        return user.trialEndsAt > new Date();
      },
    },

    calendars: {
      findCalendarsByUser:      async () => [],
      findCalendarById:         async () => null,
      saveCalendar:             async (cal) => ({ ...cal, id: `cal_${Date.now()}`, createdAt: new Date() }),
      updateCalendarTokens:     async () => {},
      updateWatchHandle:        async () => {},
      updateScoringPreferences: async () => {},
      deleteCalendar:           async () => {},
    },

    events: {
      upsertEvents:       async (inputs) => inputs.map((e, i) => ({
        ...FIXTURE_EVENTS[0], ...e, id: `evt_new_${i}`,
        baseStressPts: 0, contextSwitchPts: 0, totalStressPts: 0,
        scoringDisabled: false, scoringDisabledScope: null,
        categoryOverriddenByUser: false, createdAt: new Date(), updatedAt: new Date(),
      })),
      findByDateRange:    async () => [...events.values()],
      findById:           async (id) => events.get(id) ?? null,
      overrideEventScore: async (id, override) => {
        const event = events.get(id);
        if (!event) throw new Error(`Event ${id} not found`);
        const updated = { ...event, ...override, updatedAt: new Date() };
        events.set(id, updated);
        return updated;
      },
      disableScoring:   async (id, scope) => {
        const event = events.get(id);
        if (event) events.set(id, { ...event, scoringDisabled: true, scoringDisabledScope: scope });
      },
      enableScoring:    async (id) => {
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
          rollingAvg7d: 71, createdAt: new Date(), updatedAt: new Date(),
        };
        scores.set(score.id, score);
        return score;
      },
      findByDate:       async (userId, date) =>
        [...scores.values()].find(s => s.userId === userId && s.date.toDateString() === date.toDateString()) ?? null,
      findByDateRange:  async (userId, range) =>
        [...scores.values()].filter(s => s.userId === userId && s.date >= range.from && s.date <= range.to),
      getHistory:       async (userId) => {
        const periodScores = [...scores.values()].filter(s => s.userId === userId);
        return {
          scores: periodScores, rollingAvg: 71, periodAvg: 75,
          peakDay: periodScores[3] ?? null, lowestDay: periodScores[2] ?? null,
        };
      },
      getRecent:        async (userId, limit) =>
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
      countThisWeek: async () => 0,
    },

    cohorts: {
      findActiveForUser:  async () => null,
      getLeaderboard:     async () => [],
      getCurrentPrompt:   async () => null,
      getPromptResponses: async () => [],
      saveResponse:       async (input) => ({ ...input, id: `resp_${Date.now()}`, createdAt: new Date() }),
      hasResponded:       async () => false,
      updateMemberStats:  async () => {},
    },

    alerts: {
      findRulesByUser:   async () => [...alerts.values()],
      findRuleByType:    async (userId, ruleType) =>
        [...alerts.values()].find(a => a.userId === userId && a.ruleType === ruleType) ?? null,
      upsertRule:        async (userId, ruleType, config) => {
        const existing = [...alerts.values()].find(a => a.userId === userId && a.ruleType === ruleType);
        const rule: AlertRule = {
          id: existing?.id ?? `alert_${Date.now()}`, userId, ruleType,
          enabled: true, threshold: 70, consecutiveDays: null, sessionsPerWeek: null,
          status: 'ok', lastFiredAt: null, createdAt: new Date(), updatedAt: new Date(), ...config,
        };
        alerts.set(rule.id, rule);
        return rule;
      },
      updateRuleStatus:  async (id, status, lastFiredAt) => {
        const rule = alerts.get(id);
        if (rule) alerts.set(id, { ...rule, status, lastFiredAt: lastFiredAt ?? rule.lastFiredAt });
      },
      logAlertEvent:     async (input) => ({ ...input, id: `alertevt_${Date.now()}`, resolvedAt: null }),
      resolveAlertEvent: async () => {},
      getActiveAlerts:   async () => [],
    },

    subscriptions: {
      findByUser:       async () => null,
      findByProviderId: async () => null,
      create:           async (input) => ({ ...input, id: `sub_${Date.now()}`, createdAt: new Date(), updatedAt: new Date() }),
      update:           async () => { throw new Error('Mock: subscription not found'); },
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
    refreshAccessToken:    async () => ({ accessToken: 'mock_access_new', refreshToken: 'mock_refresh', expiresAt: new Date(Date.now() + 3600_000) }),
    getEvents:             async () => FIXTURE_EVENTS.map(e => ({
      externalId: e.externalId, title: e.title,
      startAt: e.startAt, endAt: e.endAt,
      attendeeCount: e.attendeeCount, isRecurring: e.isRecurring,
      recurringGroupId: e.recurringGroupId, isAllDay: false,
    })),
    watchCalendar:            async () => ({ handleId: 'mock_handle', expiresAt: new Date(Date.now() + 7 * 24 * 3600_000) }),
    stopWatch:                async () => {},
    parseWebhookNotification: async () => ({ calendarId: 'cal_work', source: 'google' as CalendarSource, rawPayload: {} }),
    getAuthUrl:               () => 'https://accounts.google.com/mock-oauth',
    revokeAccess:             async () => {},
  };

  return {
    billing: {
      createTrialCheckout: async () => ({ checkoutUrl: 'https://billing.mock/checkout', sessionId: 'mock_session' }),
      createPortalSession: async () => ({ portalUrl: 'https://billing.mock/portal' }),
      cancelSubscription:  async () => {},
      resumeSubscription:  async () => {},
      changeTier:          async () => {},
      parseWebhookEvent:   async () => { throw new Error('Mock: no webhook events'); },
      findCustomer:        async () => null,
    },

    calendarAdapters: new Map([
      ['google', googleAdapter],
    ]) as Map<CalendarSource, typeof googleAdapter>,

    email: {
      sendTrialEndingReminder: async (to) => { console.log(`[MockEmail] Trial ending → ${to.email}`); return { messageId: 'mock_msg' }; },
      sendBurnoutAlert:        async (to) => { console.log(`[MockEmail] Burnout alert → ${to.email}`); return { messageId: 'mock_msg' }; },
      sendMonthlyReport:       async (to) => { console.log(`[MockEmail] Monthly report → ${to.email}`); return { messageId: 'mock_msg' }; },
      sendWeeklyPrompt:        async (to) => { console.log(`[MockEmail] Weekly prompt → ${to.email}`); return { messageId: 'mock_msg' }; },
      sendTemplate:            async (to) => { console.log(`[MockEmail] Template → ${to.email}`); return { messageId: 'mock_msg' }; },
    },

    push: {
      registerToken: async (userId) => { console.log(`[MockPush] Registered token for ${userId}`); },
      removeToken:   async () => {},
      send:          async (userId, notif) => { console.log(`[MockPush] → ${userId}: ${notif.title}`); },
      sendBulk:      async (userIds, notif) => { console.log(`[MockPush] Bulk → ${userIds.length} users: ${notif.title}`); },
    },

    jobs: {
      enqueue:      async (name, payload) => { console.log(`[MockJobs] Enqueue: ${name}`, payload); },
      scheduleAt:   async (name, payload, runAt) => { console.log(`[MockJobs] Schedule: ${name} at ${runAt.toISOString()}`); },
      scheduleCron: async (name, payload, cron) => { console.log(`[MockJobs] Cron: ${name} @ ${cron}`); },
      cancel:       async (jobId) => { console.log(`[MockJobs] Cancel: ${jobId}`); },
    },

    storage: {
      upload:       async (bucket, key) => ({ url: `https://storage.mock/${bucket}/${key}`, key }),
      getSignedUrl: async (bucket, key) => `https://storage.mock/${bucket}/${key}?signed=true`,
      delete:       async () => {},
    },
  };
}
