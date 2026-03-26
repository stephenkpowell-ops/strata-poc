/**
 * types.ts
 *
 * Shared domain types used across all Strata interfaces.
 * These are plain data shapes — no framework, no ORM, no vendor.
 * Both repository interfaces and service adapters import from here.
 */

// ─────────────────────────────────────────────────────────────────────────────
// CORE PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────

export type UserId   = string;
export type EventId  = string;
export type ScoreId  = string;
export type CohortId = string;
export type SessionId = string;

export type TierName = 'signal' | 'perform' | 'edge';

export type CalendarSource = 'google' | 'outlook';

export type CalendarTag = 'work' | 'personal';

export type RecoveryProtocol = 'breathing_reset' | 'cognitive_offload' | 'tension_release';

export type AlertRuleType =
  | 'seven_day_rolling_avg'
  | 'consecutive_high_days'
  | 'single_day_spike'
  | 'recovery_deficit';

export type AlertStatus = 'firing' | 'ok' | 'off';

export type PersonaType =
  | 'managing_load'
  | 'recovering_burnout'
  | 'preventing_crash'
  | 'rethinking_direction';

export type EventCategory =
  | 'logistical'       // +1 pt base
  | 'recurring_admin'  // +2 pts base
  | 'active_personal'  // +4 pts base
  | 'high_stakes'      // +7 pts base
  | 'recovery'         // 0 / -2 pts
  | 'work';            // scored by meeting density model

// ─────────────────────────────────────────────────────────────────────────────
// USER & AUTH
// ─────────────────────────────────────────────────────────────────────────────

export interface User {
  id: UserId;
  email: string;
  name: string;
  role: string;
  companySize: string;
  industry: string;
  ageRange: string;
  persona: PersonaType;
  tier: TierName;
  trialEndsAt: Date | null;
  trialStartedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  email: string;
  name: string;
  role: string;
  companySize: string;
  industry: string;
  ageRange: string;
  persona: PersonaType;
  tier: TierName;
}

export interface UpdateUserInput {
  name?: string;
  role?: string;
  industry?: string;
  ageRange?: string;
  persona?: PersonaType;
  tier?: TierName;
  trialEndsAt?: Date | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// CALENDAR & EVENTS
// ─────────────────────────────────────────────────────────────────────────────

export interface ConnectedCalendar {
  id: string;
  userId: UserId;
  source: CalendarSource;
  email: string;
  tag: CalendarTag;
  accessToken: string;        // encrypted at rest
  refreshToken: string;       // encrypted at rest
  expiresAt: Date;
  watchHandleId: string | null;
  watchExpiresAt: Date | null;
  includeInScoring: boolean;
  contextSwitchPenalties: boolean;
  recoveryEventsReduce: boolean;
  autoClassify: boolean;
  createdAt: Date;
}

export interface CalendarEvent {
  id: EventId;
  userId: UserId;
  calendarId: string;
  externalId: string;          // provider's own event ID
  source: CalendarSource;
  tag: CalendarTag;
  category: EventCategory;
  title: string | null;        // stored only if user opts in; null by default
  startAt: Date;
  endAt: Date;
  durationMinutes: number;
  attendeeCount: number | null;
  isRecurring: boolean;
  recurringGroupId: string | null;
  baseStressPts: number;
  contextSwitchPts: number;
  totalStressPts: number;
  scoringDisabled: boolean;
  scoringDisabledScope: 'today' | 'always' | null;
  categoryOverriddenByUser: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpsertCalendarEventInput {
  userId: UserId;
  calendarId: string;
  externalId: string;
  source: CalendarSource;
  tag: CalendarTag;
  startAt: Date;
  endAt: Date;
  attendeeCount: number | null;
  isRecurring: boolean;
  recurringGroupId: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// STRESS SCORES
// ─────────────────────────────────────────────────────────────────────────────

export interface StressScore {
  id: ScoreId;
  userId: UserId;
  date: Date;                  // date-only (midnight UTC)
  checkInValue: number;        // user's self-reported 0–100
  calendarPts: number;         // computed from events
  totalScore: number;          // checkInValue + calendarPts, capped at 100
  rollingAvg7d: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SaveScoreInput {
  userId: UserId;
  date: Date;
  checkInValue: number;
  calendarPts: number;
}

export interface ScoreHistory {
  scores: StressScore[];
  rollingAvg: number;
  periodAvg: number;
  peakDay: StressScore | null;
  lowestDay: StressScore | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// RECOVERY SESSIONS
// ─────────────────────────────────────────────────────────────────────────────

export interface RecoverySession {
  id: SessionId;
  userId: UserId;
  protocol: RecoveryProtocol;
  durationSeconds: number;
  estimatedPtsReduction: number;
  triggeredBy: 'burnout_alert' | 'manual' | 'calendar_gap' | 'dashboard_cta';
  completedAt: Date;
  createdAt: Date;
}

export interface CreateSessionInput {
  userId: UserId;
  protocol: RecoveryProtocol;
  durationSeconds: number;
  estimatedPtsReduction: number;
  triggeredBy: RecoverySession['triggeredBy'];
}

// ─────────────────────────────────────────────────────────────────────────────
// COHORTS
// ─────────────────────────────────────────────────────────────────────────────

export interface Cohort {
  id: CohortId;
  weekNumber: number;
  weekStartDate: Date;
  memberIds: UserId[];
  createdAt: Date;
}

export interface CohortMember {
  userId: UserId;
  cohortId: CohortId;
  anonymousLabel: string;      // "Peer 1", "Peer 2", etc.
  weeklyAvgScore: number;
  sessionsThisWeek: number;
  rank: number;
  joinedAt: Date;
}

export interface WeeklyPrompt {
  id: string;
  cohortId: CohortId;
  weekNumber: number;
  promptText: string;
  opensAt: Date;
  closesAt: Date;
  createdAt: Date;
}

export interface PromptResponse {
  id: string;
  promptId: string;
  cohortId: CohortId;
  userId: UserId;
  responseText: string;
  createdAt: Date;
}

// ─────────────────────────────────────────────────────────────────────────────
// ALERT RULES
// ─────────────────────────────────────────────────────────────────────────────

export interface AlertRule {
  id: string;
  userId: UserId;
  ruleType: AlertRuleType;
  enabled: boolean;
  threshold: number;           // meaning varies by rule type
  consecutiveDays: number | null;
  sessionsPerWeek: number | null;
  status: AlertStatus;
  lastFiredAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AlertEvent {
  id: string;
  userId: UserId;
  ruleId: string;
  ruleType: AlertRuleType;
  firedAt: Date;
  resolvedAt: Date | null;
  triggerValue: number;
  thresholdValue: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// BILLING
// ─────────────────────────────────────────────────────────────────────────────

export interface Subscription {
  id: string;
  userId: UserId;
  tier: TierName;
  status: 'trialing' | 'active' | 'cancelled' | 'past_due' | 'paused';
  providerSubId: string;        // Stripe subscription ID (or equivalent)
  providerCustomerId: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGINATION & COMMON QUERY PATTERNS
// ─────────────────────────────────────────────────────────────────────────────

export interface DateRange {
  from: Date;
  to: Date;
}

export interface PaginationParams {
  limit: number;
  offset: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}
