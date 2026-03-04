/**
 * ============================================================================
 * CONSENT FILTER SERVICE — Privacy boundary enforcement
 * ============================================================================
 *
 * This service implements the consent boundary — the core privacy mechanism
 * of the Decisioning API. It ensures that when a visitor has NOT consented
 * to marketing tracking (marketing=false), only anonymous, non-identifying
 * signals are passed to the rule engine.
 *
 * CONSENT-SAFE FIELDS (allowed when marketing=false):
 *   - country        → Geographic region, does not identify a person
 *   - language        → Browser preference, does not identify a person
 *   - deviceType      → Device category (desktop/mobile/tablet), not identifying
 *   - referrerDomain  → Traffic source domain, not personal
 *
 * BLOCKED FIELDS (dropped when marketing=false):
 *   - visitorId       → Personally identifies a specific visitor
 *   - traits          → Behavioural data tied to an individual
 *   - Any other field → Could potentially be a personal identifier
 */

import { Injectable } from '@nestjs/common';
import { Visitor, Consent, ConsentSafeContext } from '../types';

@Injectable()
export class ConsentFilterService {
  /**
   * The exhaustive whitelist of fields allowed when marketing consent
   * is NOT granted. Adding a field here means it will be visible to
   * the rule engine even without marketing consent.
   */
  private readonly CONSENT_SAFE_FIELDS: ReadonlyArray<string> = [
    'country',
    'language',
    'deviceType',
    'referrerDomain',
  ];

  /**
   * Apply the consent boundary to the visitor context.
   *
   * @param visitor - The full visitor context from the frontend
   * @param consent - The visitor's consent preferences
   * @returns A filtered context that the rule engine is allowed to evaluate
   *
   * When marketing=true:
   *   → Returns ALL visitor fields (full personalisation is allowed)
   *
   * When marketing=false:
   *   → Returns ONLY the 4 consent-safe fields
   *   → visitorId, traits, and all other fields are DROPPED
   */
  applyConsentBoundary(
    visitor: Visitor,
    consent: Consent,
  ): ConsentSafeContext {
    // ── CASE 1: Marketing consent granted ────────────────────────────
    // The visitor has opted in to marketing tracking, so we can use
    // ALL available data for personalisation (including visitorId, traits).
    if (consent.marketing) {
      const fullContext: ConsentSafeContext = {};

      // Copy all top-level visitor fields into the context
      for (const [key, value] of Object.entries(visitor)) {
        // Skip the traits object itself — we flatten its children below
        if (key === 'traits') continue;
        fullContext[key] = value;
      }

      // Flatten traits into the context so rules can reference them
      // directly (e.g., field: "plan" instead of field: "traits.plan")
      if (visitor.traits) {
        for (const [traitKey, traitValue] of Object.entries(visitor.traits)) {
          fullContext[traitKey] = traitValue;
        }
      }

      return fullContext;
    }

    // ── CASE 2: Marketing consent NOT granted ────────────────────────
    // The visitor has declined marketing tracking. We MUST strip all
    // personal identifiers and return ONLY the consent-safe fields.
    // This ensures visitorId, traits, and any custom fields are never
    // seen by the rule engine.
    const safeContext: ConsentSafeContext = {};

    for (const field of this.CONSENT_SAFE_FIELDS) {
      // Only include the field if it actually exists on the visitor object
      const value = (visitor as Record<string, unknown>)[field];
      if (value !== undefined) {
        safeContext[field] = value;
      }
    }

    return safeContext;
  }
}
