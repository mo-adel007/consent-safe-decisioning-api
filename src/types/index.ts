/**
 * ============================================================================
 * TYPES — All TypeScript interfaces and types for the Decisioning API
 * ============================================================================
 *
 * This file defines the data contracts used throughout the application.
 * Every interface is documented with its purpose and field descriptions.
 */

// ─── Rule Engine Types ──────────────────────────────────────────────────────

/**
 * A single condition within a rule.
 * Conditions are the atomic building blocks of rules — each one checks
 * a single field against an expected value using an operator.
 */
export interface Condition {
  /** The visitor context field to check (e.g., "country", "deviceType") */
  field: string;

  /** The comparison operator to apply */
  operator: 'eq' | 'in' | 'contains';

  /**
   * The expected value(s):
   * - For "eq" and "contains": a single string
   * - For "in": an array of strings (match if field value is any of them)
   */
  value: string | string[];
}

/**
 * A decision rule: one or more conditions that map to a variant.
 * All conditions use AND logic — every condition must match for the rule
 * to fire. Rules are evaluated in priority order (array index = priority).
 */
export interface Rule {
  /** Unique identifier for this rule (e.g., "rule-eg-mobile") */
  id: string;

  /** All conditions must match (AND logic) for this rule to fire */
  conditions: Condition[];

  /** The variant ID to return when this rule matches */
  variantId: string;

  /** The headline text associated with this variant */
  headline: string;

  /** Feature flags that control frontend UI behaviour */
  flags: Record<string, boolean>;
}

// ─── Config Types ───────────────────────────────────────────────────────────

/**
 * The fallback variant — returned when no rules match.
 * Every site config must have a fallback to guarantee a response.
 */
export interface Fallback {
  variantId: string;
  headline: string;
  flags: Record<string, boolean>;
}

/**
 * The complete configuration for a single site.
 * Contains the ordered rules list, fallback, and a version identifier
 * used for ETag-based HTTP caching.
 */
export interface SiteConfig {
  /** Unique site identifier (e.g., "site-nike") */
  siteId: string;

  /** Version string used as ETag for cache validation (e.g., "v3") */
  configVersion: string;

  /** Ordered list of rules — evaluated top-to-bottom, first match wins */
  rules: Rule[];

  /** Default variant when no rules match */
  fallback: Fallback;
}

// ─── Visitor & Consent Types ────────────────────────────────────────────────

/**
 * The full visitor context sent by the frontend.
 * Some of these fields are personal identifiers (visitorId, traits)
 * and will be STRIPPED when marketing consent is not granted.
 */
export interface Visitor {
  /** Unique visitor identifier — BLOCKED when marketing=false */
  visitorId?: string;

  /** ISO 3166-1 alpha-2 country code (e.g., "EG") — CONSENT-SAFE */
  country?: string;

  /** ISO 639-1 language code (e.g., "ar") — CONSENT-SAFE */
  language?: string;

  /** Device category — CONSENT-SAFE */
  deviceType?: 'desktop' | 'mobile' | 'tablet';

  /** Top-level referrer domain (e.g., "google.com") — CONSENT-SAFE */
  referrerDomain?: string;

  /** Custom behavioural traits — BLOCKED when marketing=false */
  traits?: Record<string, unknown>;
}

/**
 * Consent signals from the visitor's cookie preferences.
 * The `marketing` flag is the critical one — it controls the consent boundary.
 */
export interface Consent {
  /** Whether the visitor consented to marketing tracking */
  marketing: boolean;

  /** Whether the visitor consented to analytics (not used for filtering) */
  analytics?: boolean;
}

// ─── Consent-Safe Context ───────────────────────────────────────────────────

/**
 * The filtered context that the rule engine is allowed to see.
 * When marketing=false, this contains ONLY the four consent-safe fields.
 * When marketing=true, this contains all visitor fields as key-value pairs.
 */
export interface ConsentSafeContext {
  [key: string]: unknown;
}

// ─── Request / Response DTOs ────────────────────────────────────────────────

/**
 * The request body for POST /decide.
 * Contains everything needed to make a personalisation decision.
 */
export interface DecideRequest {
  /** Which site's rules to evaluate */
  siteId: string;

  /** The page URL the visitor is currently on */
  url: string;

  /** The visitor's context (some fields may be stripped by consent filter) */
  visitor: Visitor;

  /** The visitor's consent preferences */
  consent: Consent;
}

/**
 * The response body for POST /decide.
 * Contains the chosen variant and the config version used.
 */
export interface DecideResponse {
  /** The ID of the selected variant */
  variantId: string;

  /** The headline text for this variant */
  headline: string;

  /** Feature flags for frontend UI behaviour */
  flags: Record<string, boolean>;

  /** The config version used to make this decision (for debugging/tracing) */
  configVersion: string;
}
