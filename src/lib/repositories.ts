/**
 * repositories.ts
 *
 * Repository interfaces — Abstraction Layer 1.
 *
 * Core services import ONLY these interfaces. They never import Prisma, Supabase,
 * or any concrete database client. This means:
 *
 *   - You can swap Supabase → PlanetScale → Neon by writing a new implementation
 *     file and changing one line in your DI container. Zero changes to business logic.
 *   - Unit testing core services requires only a MockRepo, not a live database.
 *   - The schema can evolve independently of the interface contract.
 *
 * Concrete implementations (e.g. PrismaUserRepo) live in /lib/db/repositories/
 * and are injected at startup via the service container in /lib/container.ts.
 */

import type {
  UserId, EventId, ScoreId, CohortId, SessionId,
  User, CreateUserInput, UpdateUserInput,
  ConnectedCalendar, CalendarSource, CalendarTag,
  CalendarEvent, UpsertCalendarEventInput,
  StressScore, SaveScoreInput, ScoreHistory,
  RecoverySession, CreateSessionInput,
  Cohort, CohortMember, WeeklyPrompt, PromptResponse,
  AlertRule, AlertEvent, AlertRuleType,
  Subscription,
  DateRange, PaginationParams, PaginatedResult,
} from './interfaces/types';

// ─────────────────────────────────────────────────────────────────────────────
// USER REPOSITORY
// ─────────────────────────────────────────────────────────────────────────────

export interface IUserRepository {
  /** Find a user by their internal ID. Returns null if not found. */
  findById(id: UserId): Promise<User | null>;

  /** Find a user by email address. Used during auth / sign-in. */
  findByEmail(email: string): Promise<User | null>;

  /** Create a new user record. Returns the created user. */
  create(input: CreateUserInput): Promise<User>;

  /** Partial update — only provided fields are changed. */
  update(id: UserId, input: UpdateUserInput): Promise<User>;

  /** Hard delete. Use only for GDPR erasure requests. */
  delete(id: UserId): Promise<void>;

  /** Check whether a user's trial period is still active. */
  isTrialActive(id: UserId): Promise<boolean>;
}

// ─────────────────────────────────────────────────────────────────────────────
// CALENDAR REPOSITORY
// ─────────────────────────────────────────────────────────────────────────────

export interface ICalendarRepository {
  /** Return all connected calendars for a user. */
  findCalendarsByUser(userId: UserId): Promise<ConnectedCalendar[]>;

  /** Find a single connected calendar by its ID. */
  findCalendarById(id: string): Promise<ConnectedCalendar | null>;

  /** Save a new calendar connection after OAuth. */
  saveCalendar(calendar: Omit<ConnectedCalendar, 'id' | 'createdAt'>): Promise<ConnectedCalendar>;

  /** Update tokens after a refresh cycle. */
  updateCalendarTokens(
    id: string,
    tokens: { accessToken: string; refreshToken: string; expiresAt: Date }
  ): Promise<void>;

  /** Update the Google/Outlook webhook watch handle. */
  updateWatchHandle(
    id: string,
    handle: { watchHandleId: string; watchExpiresAt: Date } | null
  ): Promise<void>;

  /** Update user-facing scoring preferences for a calendar. */
  updateScoringPreferences(
    id: string,
    prefs: Partial<Pick<ConnectedCalendar,
      'includeInScoring' | 'contextSwitchPenalties' | 'recoveryEventsReduce' | 'autoClassify'>>
  ): Promise<void>;

  /** Remove a connected calendar and all its synced events. */
  deleteCalendar(id: string): Promise<void>;
}

// ─────────────────────────────────────────────────────────────────────────────
// EVENT REPOSITORY
// ─────────────────────────────────────────────────────────────────────────────

export interface IEventRepository {
  /**
   * Upsert a batch of calendar events from a sync.
   * Matches on (userId, externalId). Returns the upserted events.
   */
  upsertEvents(events: UpsertCalendarEventInput[]): Promise<CalendarEvent[]>;

  /** Return all events for a user within a date range, ordered by startAt. */
  findByDateRange(userId: UserId, range: DateRange): Promise<CalendarEvent[]>;

  /** Return a single event by its internal ID. */
  findById(id: EventId): Promise<CalendarEvent | null>;

  /**
   * Override the computed stress values for a single event.
   * Used when the user adjusts the score from the Event Detail screen.
   */
  overrideEventScore(
    id: EventId,
    override: { totalStressPts: number; categoryOverriddenByUser: boolean }
  ): Promise<CalendarEvent>;

  /**
   * Disable stress scoring for an event.
   * scope: 'today' affects only this occurrence; 'always' affects all future
   * instances via the recurringGroupId.
   */
  disableScoring(
    id: EventId,
    scope: 'today' | 'always'
  ): Promise<void>;

  /**
   * Re-enable scoring for an event (undo a disable).
   */
  enableScoring(id: EventId): Promise<void>;

  /** Delete all synced events for a calendar. Used on calendar disconnect. */
  deleteByCalendar(calendarId: string): Promise<void>;
}

// ─────────────────────────────────────────────────────────────────────────────
// SCORE REPOSITORY
// ─────────────────────────────────────────────────────────────────────────────

export interface IScoreRepository {
  /**
   * Save or update a stress score for a given user and date.
   * One record per (userId, date). Upserts on conflict.
   */
  saveScore(input: SaveScoreInput): Promise<StressScore>;

  /** Return the stress score for a specific date. Returns null if none exists. */
  findByDate(userId: UserId, date: Date): Promise<StressScore | null>;

  /**
   * Return score records within a date range, ordered ascending.
   * Used to populate trend charts.
   */
  findByDateRange(userId: UserId, range: DateRange): Promise<StressScore[]>;

  /**
   * Return a computed score history summary for a range.
   * Includes rolling average, period average, peak day, lowest day.
   */
  getHistory(userId: UserId, range: DateRange): Promise<ScoreHistory>;

  /**
   * Return the most recent N scores for a user.
   * Used for rolling average computation and the home screen sparkline.
   */
  getRecent(userId: UserId, limit: number): Promise<StressScore[]>;

  /**
   * Update the rolling 7-day average field on a score record.
   * Called by the background job after each daily computation.
   */
  updateRollingAvg(id: ScoreId, rollingAvg7d: number): Promise<void>;
}

// ─────────────────────────────────────────────────────────────────────────────
// RECOVERY SESSION REPOSITORY
// ─────────────────────────────────────────────────────────────────────────────

export interface ISessionRepository {
  /** Save a completed recovery session. */
  create(input: CreateSessionInput): Promise<RecoverySession>;

  /** Return sessions for a user, most recent first. */
  findByUser(
    userId: UserId,
    pagination: PaginationParams
  ): Promise<PaginatedResult<RecoverySession>>;

  /** Return sessions within a date range — used for weekly target tracking. */
  findByDateRange(userId: UserId, range: DateRange): Promise<RecoverySession[]>;

  /** Count sessions in the current week. Used for recovery deficit alert. */
  countThisWeek(userId: UserId): Promise<number>;
}

// ─────────────────────────────────────────────────────────────────────────────
// COHORT REPOSITORY
// ─────────────────────────────────────────────────────────────────────────────

export interface ICohortRepository {
  /** Find the active cohort for a user in the current week. */
  findActiveForUser(userId: UserId): Promise<Cohort | null>;

  /** Return the leaderboard for a cohort — sorted by score ascending (lower = better). */
  getLeaderboard(cohortId: CohortId): Promise<CohortMember[]>;

  /** Return the current week's prompt for a cohort. */
  getCurrentPrompt(cohortId: CohortId): Promise<WeeklyPrompt | null>;

  /** Return all responses to a prompt. Caller enforces anonymisation. */
  getPromptResponses(promptId: string): Promise<PromptResponse[]>;

  /** Save a user's response to the weekly prompt. */
  saveResponse(
    input: Pick<PromptResponse, 'promptId' | 'cohortId' | 'userId' | 'responseText'>
  ): Promise<PromptResponse>;

  /** Check whether a user has already responded to a given prompt. */
  hasResponded(userId: UserId, promptId: string): Promise<boolean>;

  /** Update a cohort member's weekly stats (avg score, sessions, rank). */
  updateMemberStats(
    cohortId: CohortId,
    userId: UserId,
    stats: { weeklyAvgScore: number; sessionsThisWeek: number; rank: number }
  ): Promise<void>;
}

// ─────────────────────────────────────────────────────────────────────────────
// ALERT REPOSITORY
// ─────────────────────────────────────────────────────────────────────────────

export interface IAlertRepository {
  /** Return all configured alert rules for a user. */
  findRulesByUser(userId: UserId): Promise<AlertRule[]>;

  /** Return a specific rule by type for a user. */
  findRuleByType(userId: UserId, ruleType: AlertRuleType): Promise<AlertRule | null>;

  /** Create or update an alert rule. One record per (userId, ruleType). */
  upsertRule(
    userId: UserId,
    ruleType: AlertRuleType,
    config: Partial<Pick<AlertRule, 'enabled' | 'threshold' | 'consecutiveDays' | 'sessionsPerWeek'>>
  ): Promise<AlertRule>;

  /** Update the live status of a rule (firing / ok / off). */
  updateRuleStatus(
    id: string,
    status: AlertRule['status'],
    lastFiredAt?: Date
  ): Promise<void>;

  /** Log a fired alert event. */
  logAlertEvent(
    input: Pick<AlertEvent, 'userId' | 'ruleId' | 'ruleType' | 'firedAt' | 'triggerValue' | 'thresholdValue'>
  ): Promise<AlertEvent>;

  /** Mark an alert event as resolved. */
  resolveAlertEvent(id: string, resolvedAt: Date): Promise<void>;

  /** Return active (unresolved) alert events for a user. */
  getActiveAlerts(userId: UserId): Promise<AlertEvent[]>;
}

// ─────────────────────────────────────────────────────────────────────────────
// SUBSCRIPTION REPOSITORY
// ─────────────────────────────────────────────────────────────────────────────

export interface ISubscriptionRepository {
  /** Find the current subscription for a user. Returns null if none. */
  findByUser(userId: UserId): Promise<Subscription | null>;

  /** Find by the provider's subscription ID (needed for webhook handlers). */
  findByProviderId(providerSubId: string): Promise<Subscription | null>;

  /** Create a new subscription record after a checkout session completes. */
  create(
    input: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Subscription>;

  /** Update subscription status — called by billing webhook handlers. */
  update(
    id: string,
    input: Partial<Pick<Subscription,
      'status' | 'tier' | 'currentPeriodStart' | 'currentPeriodEnd' | 'cancelAtPeriodEnd' | 'cancelledAt'>>
  ): Promise<Subscription>;
}

// ─────────────────────────────────────────────────────────────────────────────
// REPOSITORY REGISTRY
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The complete set of repositories.
 * The DI container (lib/container.ts) satisfies this type at startup.
 * Core services receive this object via constructor injection.
 */
export interface IRepositories {
  users:         IUserRepository;
  calendars:     ICalendarRepository;
  events:        IEventRepository;
  scores:        IScoreRepository;
  sessions:      ISessionRepository;
  cohorts:       ICohortRepository;
  alerts:        IAlertRepository;
  subscriptions: ISubscriptionRepository;
}
