/**
 * ============================================================================
 * CONFIG SERVICE — In-memory ruleset storage
 * ============================================================================
 *
 * This service acts as the "database" for site configurations.
 * In a production system, this would connect to a real data store
 * (PostgreSQL, Redis, DynamoDB, etc.). For this implementation,
 * we use an in-memory Map pre-loaded with seed data.
 *
 * RESPONSIBILITY:
 *   - Store and retrieve site configurations (rules + fallback)
 *   - Provide the configVersion for ETag-based caching
 */

import { Injectable } from '@nestjs/common';
import { SiteConfig } from '../types';

@Injectable()
export class ConfigService {
  /**
   * In-memory store of site configurations.
   * Key: siteId (e.g., "site-nike")
   * Value: The complete SiteConfig with rules, fallback, and version
   */
  private readonly configs: Map<string, SiteConfig> = new Map();

  constructor() {
    // ── SEED DATA ──────────────────────────────────────────────────
    // Pre-load a sample configuration for "site-nike" with 3 rules
    // and a fallback. This simulates what would come from a database.
    this.configs.set('site-nike', {
      siteId: 'site-nike',
      configVersion: 'v3',
      rules: [
        // ── RULE 1: Egyptian mobile visitors ──────────────────────
        // Priority: HIGHEST (evaluated first)
        // Conditions: country must be "EG" AND device must be "mobile"
        // Both conditions use AND logic — both must match
        {
          id: 'rule-eg-mobile',
          conditions: [
            { field: 'country', operator: 'eq', value: 'EG' },
            { field: 'deviceType', operator: 'eq', value: 'mobile' },
          ],
          variantId: 'mobile-sale',
          headline: 'Mobile users get 20% off',
          flags: { showDiscountBanner: true, enableChat: false },
        },

        // ── RULE 2: Google search traffic ─────────────────────────
        // Priority: MEDIUM
        // Single condition: referrer must be google.com
        {
          id: 'rule-google-seo',
          conditions: [
            { field: 'referrerDomain', operator: 'eq', value: 'google.com' },
          ],
          variantId: 'seo-variant',
          headline: 'Welcome Google visitors',
          flags: { showDiscountBanner: false, enableChat: true },
        },

        // ── RULE 3: Arabic-speaking visitors ──────────────────────
        // Priority: LOWEST (of the 3 rules)
        // Single condition: language must be "ar"
        {
          id: 'rule-arabic',
          conditions: [
            { field: 'language', operator: 'eq', value: 'ar' },
          ],
          variantId: 'arabic-offer',
          headline: 'مرحباً! اكتشف عروضنا',
          flags: { showDiscountBanner: false, enableChat: true },
        },
      ],

      // ── FALLBACK: Default experience ────────────────────────────
      // Returned when no rules match the visitor's context.
      // Guarantees that every request gets a valid response.
      fallback: {
        variantId: 'default',
        headline: 'Welcome! Discover our offerings',
        flags: { showDiscountBanner: false, enableChat: true },
      },
    });
  }

  /**
   * Retrieve the configuration for a specific site.
   *
   * @param siteId - The site identifier to look up
   * @returns The site configuration, or undefined if not found
   */
  getConfigBySiteId(siteId: string): SiteConfig | undefined {
    return this.configs.get(siteId);
  }
}
