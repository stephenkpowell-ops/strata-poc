/**
 * adapters.ts
 *
 * Service adapter interfaces — Abstraction Layer 2.
 *
 * Core services import ONLY these interfaces. They never import the Stripe SDK,
 * Google APIs, Resend, or any vendor-specific client directly. This means:
 *
 *   - Stripe → Paddle? Write PaddleAdapter implements IBillingAdapter. One file.
 *   - Resend → Postmark? Write PostmarkAdapter implements IEmailAdapter. One file.
 *   - Google Calendar + Outlook both implement ICalendarAdapter — adding Outlook
 *     support is additive, with zero changes to CalendarService.
 *   - MockAdapters enable full local development and unit testing without
 *     any live API credentials or network calls.
 *
 * Concrete implementations live in /lib/adapters/ and are injected at startup
 * via the service container in /lib/container.ts.
 */

import type {
  UserId,
  CohortId,
  TierName,
  CalendarSource,
  CalendarEvent,
  UpsertCalendarEventInput,
} from './interfaces/types';

// ─────────────────────────────────────────────────────────────────────────────
// BILLING ADAPTER
// Currently: Stripe
// Swap to: Paddle, LemonSqueezy, Chargebee — no changes to billing logic
// ─────────────────────────────────────────────────────────────────────────────

export interface TrialConfig {
  tier: TierName;
  trialDays: number;            // 7 for all Strata tiers
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutSession {
  checkoutUrl: string;
  sessionId: string;            // provider's checkout session ID
}

export interface PortalSession {
  portalUrl: string;
}

export interface BillingWebhookEvent {
  type:
    | 'subscription.created'
    | 'subscription.updated'
    | 'subscription.cancelled'
    | 'subscription.past_due'
    | 'trial.ending'            // fires 24hrs before trial expires
    | 'payment.succeeded'
    | 'payment.failed';
  providerSubId: string;
  providerCustomerId: string;
  tier: TierName;
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  rawPayload: unknown;          // original provider payload for logging
}

export interface IBillingAdapter {
  /**
   * Create a checkout session that starts a trial.
   * Returns a URL to redirect the user to the provider's hosted checkout.
   */
  createTrialCheckout(userId: UserId, config: TrialConfig): Promise<CheckoutSession>;

  /**
   * Create a billing portal session so the user can manage their subscription,
   * update payment method, or cancel.
   */
  createPortalSession(userId: UserId, returnUrl: string): Promise<PortalSession>;

  /**
   * Cancel a subscription at the end of the current period.
   * Does NOT immediately terminate access.
   */
  cancelSubscription(providerSubId: string): Promise<void>;

  /**
   * Resume a subscription that was set to cancel at period end.
   */
  resumeSubscription(providerSubId: string): Promise<void>;

  /**
   * Change the tier (upgrade or downgrade) on an active subscription.
   */
  changeTier(providerSubId: string, newTier: TierName): Promise<void>;

  /**
   * Parse and validate an inbound webhook payload from the billing provider.
   * Verifies the signature using the webhook secret.
   * Throws if the signature is invalid.
   */
  parseWebhookEvent(rawBody: string | Buffer, signature: string): Promise<BillingWebhookEvent>;

  /**
   * Look up a customer by user ID. Returns null if no customer exists yet.
   */
  findCustomer(userId: UserId): Promise<{ customerId: string } | null>;
}

// ─────────────────────────────────────────────────────────────────────────────
// CALENDAR ADAPTER
// Currently: GoogleCalendarAdapter + OutlookCalendarAdapter
// Both implement this same interface — CalendarService never knows which one
// ─────────────────────────────────────────────────────────────────────────────

export interface OAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

export interface RawCalendarEvent {
  externalId: string;
  title: string | null;
  startAt: Date;
  endAt: Date;
  attendeeCount: number | null;
  isRecurring: boolean;
  recurringGroupId: string | null;
  isAllDay: boolean;
}

export interface WatchHandle {
  handleId: string;
  expiresAt: Date;
}

export interface CalendarWebhookPayload {
  calendarId: string;           // which connected calendar changed
  source: CalendarSource;
  rawPayload: unknown;
}

export interface ICalendarAdapter {
  /** The provider this adapter handles. Used for routing in CalendarService. */
  readonly source: CalendarSource;

  /**
   * Exchange an OAuth authorization code for access + refresh tokens.
   * Called once after the user completes the OAuth consent screen.
   */
  exchangeCodeForTokens(code: string, redirectUri: string): Promise<OAuthTokens>;

  /**
   * Refresh an expired access token using the stored refresh token.
   */
  refreshAccessToken(refreshToken: string): Promise<OAuthTokens>;

  /**
   * Pull all events from a calendar within a date range.
   * Returns raw events — classification and scoring happen in CalendarService.
   */
  getEvents(
    accessToken: string,
    calendarEmail: string,
    range: { from: Date; to: Date }
  ): Promise<RawCalendarEvent[]>;

  /**
   * Register a webhook to receive push notifications when calendar events change.
   * Returns a handle that must be stored and later used to stop the watch.
   */
  watchCalendar(
    accessToken: string,
    calendarEmail: string,
    webhookUrl: string
  ): Promise<WatchHandle>;

  /**
   * Stop receiving push notifications for a calendar.
   * Called on calendar disconnect or when renewing an expiring watch.
   */
  stopWatch(accessToken: string, handle: WatchHandle): Promise<void>;

  /**
   * Parse an inbound webhook notification from the provider.
   * Returns the affected calendar ID so the sync job can be triggered.
   * Throws if the notification is not valid for this provider.
   */
  parseWebhookNotification(
    headers: Record<string, string>,
    rawBody: string | Buffer
  ): Promise<CalendarWebhookPayload>;

  /**
   * Return the OAuth authorization URL to redirect the user to.
   */
  getAuthUrl(redirectUri: string, state: string): string;

  /**
   * Revoke OAuth tokens on calendar disconnect.
   */
  revokeAccess(accessToken: string): Promise<void>;
}

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL ADAPTER
// Currently: Resend
// Swap to: Postmark, SendGrid, AWS SES — no changes to notification logic
// ─────────────────────────────────────────────────────────────────────────────

export interface EmailRecipient {
  email: string;
  name: string;
}

export interface SendEmailResult {
  messageId: string;
}

export interface IEmailAdapter {
  /**
   * Send the trial-ending reminder (fires 24hrs before trial expires).
   * Copy: "Your trial ends tomorrow. You have 7 days of data worth keeping."
   */
  sendTrialEndingReminder(
    to: EmailRecipient,
    data: { trialEndsAt: Date; tier: TierName; continueUrl: string }
  ): Promise<SendEmailResult>;

  /**
   * Send a burnout alert notification email.
   * Used as a fallback when push notifications are unavailable.
   */
  sendBurnoutAlert(
    to: EmailRecipient,
    data: { currentAvg: number; threshold: number; consecutiveDays: number; appUrl: string }
  ): Promise<SendEmailResult>;

  /**
   * Send the monthly performance report as an email attachment.
   */
  sendMonthlyReport(
    to: EmailRecipient,
    data: { month: string; reportPdfBuffer: Buffer; appUrl: string }
  ): Promise<SendEmailResult>;

  /**
   * Send a cohort weekly prompt notification.
   */
  sendWeeklyPrompt(
    to: EmailRecipient,
    data: { promptText: string; closesAt: Date; respondUrl: string }
  ): Promise<SendEmailResult>;

  /**
   * Send a transactional email using a template ID.
   * Escape hatch for one-off emails not covered by typed methods above.
   */
  sendTemplate(
    to: EmailRecipient,
    templateId: string,
    variables: Record<string, unknown>
  ): Promise<SendEmailResult>;
}

// ─────────────────────────────────────────────────────────────────────────────
// PUSH NOTIFICATION ADAPTER
// Currently: web (no push on web MVP)
// Mobile: Expo Notifications / APNs / FCM — swap with zero logic changes
// ─────────────────────────────────────────────────────────────────────────────

export interface PushToken {
  token: string;
  platform: 'ios' | 'android' | 'web';
}

export interface PushNotification {
  title: string;
  body: string;
  data?: Record<string, string>;   // deep-link data, e.g. { screen: 'burnout_alert' }
}

export interface IPushNotificationAdapter {
  /**
   * Register a push token for a user.
   * Called when the app receives a new device token.
   */
  registerToken(userId: UserId, token: PushToken): Promise<void>;

  /**
   * Remove a push token. Called on logout or token rotation.
   */
  removeToken(userId: UserId, tokenValue: string): Promise<void>;

  /**
   * Send a push notification to all registered devices for a user.
   */
  send(userId: UserId, notification: PushNotification): Promise<void>;

  /**
   * Send to multiple users at once. Used for cohort prompt reminders.
   */
  sendBulk(userIds: UserId[], notification: PushNotification): Promise<void>;
}

// ─────────────────────────────────────────────────────────────────────────────
// BACKGROUND JOB ADAPTER
// Currently: Trigger.dev or Inngest
// Swap to: BullMQ, Quirrel, custom queue — no changes to job definitions
// ─────────────────────────────────────────────────────────────────────────────

export type JobName =
  | 'calendar.sync'             // pull & score events for a user
  | 'scores.computeDaily'       // nightly rolling avg + alert evaluation
  | 'cohort.updateLeaderboard'  // recompute ranks after score updates
  | 'calendar.renewWatch'       // refresh expiring webhook registrations
  | 'report.generateMonthly'    // first of month report generation
  | 'trial.sendReminder';       // 24hr before trial expires

export interface JobPayload {
  'calendar.sync':             { userId: UserId; calendarId: string };
  'scores.computeDaily':       { userId: UserId; date: string };        // ISO date string
  'cohort.updateLeaderboard':  { cohortId: CohortId };
  'calendar.renewWatch':       { calendarId: string };
  'report.generateMonthly':    { userId: UserId; month: string };       // "2025-03"
  'trial.sendReminder':        { userId: UserId };
}

export interface IJobAdapter {
  /**
   * Enqueue a job for immediate execution.
   */
  enqueue<T extends JobName>(name: T, payload: JobPayload[T]): Promise<void>;

  /**
   * Schedule a job to run at a specific time.
   */
  scheduleAt<T extends JobName>(name: T, payload: JobPayload[T], runAt: Date): Promise<void>;

  /**
   * Schedule a recurring job on a cron expression.
   * e.g. nightly score computation: '0 1 * * *'
   */
  scheduleCron<T extends JobName>(name: T, payload: JobPayload[T], cron: string): Promise<void>;

  /**
   * Cancel a previously scheduled job by its ID.
   */
  cancel(jobId: string): Promise<void>;
}

// ─────────────────────────────────────────────────────────────────────────────
// STORAGE ADAPTER
// Currently: Supabase Storage
// Swap to: S3, Cloudflare R2, Vercel Blob — no changes to report generation
// ─────────────────────────────────────────────────────────────────────────────

export interface IStorageAdapter {
  /**
   * Upload a file and return its public or signed URL.
   */
  upload(
    bucket: string,
    key: string,
    data: Buffer,
    options?: { contentType?: string; expiresIn?: number }
  ): Promise<{ url: string; key: string }>;

  /**
   * Generate a time-limited signed URL for a private file.
   */
  getSignedUrl(bucket: string, key: string, expiresInSeconds: number): Promise<string>;

  /**
   * Delete a file.
   */
  delete(bucket: string, key: string): Promise<void>;
}

// ─────────────────────────────────────────────────────────────────────────────
// ADAPTER REGISTRY
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The complete set of adapters.
 * The DI container (lib/container.ts) satisfies this type at startup.
 *
 * Note: calendarAdapters is a Map keyed by CalendarSource so CalendarService
 * can route to the correct adapter (Google vs Outlook) without a switch statement.
 */
export interface IAdapters {
  billing:           IBillingAdapter;
  calendarAdapters:  Map<CalendarSource, ICalendarAdapter>;
  email:             IEmailAdapter;
  push:              IPushNotificationAdapter;
  jobs:              IJobAdapter;
  storage:           IStorageAdapter;
}
