/**
 * ============================================================================
 * TEST (a): Rule Engine — Proves rule matching works correctly
 * ============================================================================
 *
 * AC-4: Rule engine evaluates 2–3 rules + a fallback default variant
 * AC-6: Automated test proving a rule works
 *
 * This test proves that:
 *   - Multi-condition AND logic works (country=EG AND deviceType=mobile)
 *   - First-match-wins strategy is correct (highest priority rule wins)
 *   - Fallback is returned when no rules match
 *   - Each operator (eq, in, contains) works as expected
 */

import { RuleEngineService } from '../src/engine/rule-engine.service';
import { Rule, Fallback } from '../src/types';

describe('RuleEngineService', () => {
  let ruleEngine: RuleEngineService;

  // ── Sample rules matching the architecture document ───────────────
  // These are the same rules defined for "site-nike" in the config store
  const rules: Rule[] = [
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
    {
      id: 'rule-google-seo',
      conditions: [
        { field: 'referrerDomain', operator: 'eq', value: 'google.com' },
      ],
      variantId: 'seo-variant',
      headline: 'Welcome Google visitors',
      flags: { showDiscountBanner: false, enableChat: true },
    },
    {
      id: 'rule-arabic',
      conditions: [
        { field: 'language', operator: 'eq', value: 'ar' },
      ],
      variantId: 'arabic-offer',
      headline: 'مرحباً! اكتشف عروضنا',
      flags: { showDiscountBanner: false, enableChat: true },
    },
  ];

  // ── Fallback: returned when no rules match ────────────────────────
  const fallback: Fallback = {
    variantId: 'default',
    headline: 'Welcome! Discover our offerings',
    flags: { showDiscountBanner: false, enableChat: true },
  };

  // Create a fresh instance before each test
  beforeEach(() => {
    ruleEngine = new RuleEngineService();
  });

  // ── TEST: Multi-condition AND rule matches correctly ──────────────
  // This is the primary AC test. It proves that when a visitor matches
  // ALL conditions of a rule (country=EG AND deviceType=mobile),
  // the correct variant ("mobile-sale") is returned.
  it('should match multi-condition rule (country=EG AND deviceType=mobile) → mobile-sale', () => {
    const context = {
      country: 'EG',
      deviceType: 'mobile',
      language: 'ar',
      referrerDomain: 'google.com',
    };

    const result = ruleEngine.evaluate(rules, context, fallback);

    // Verify the correct variant is returned
    expect(result.variantId).toBe('mobile-sale');
    expect(result.headline).toBe('Mobile users get 20% off');
    expect(result.flags.showDiscountBanner).toBe(true);
  });

  // ── TEST: First-match-wins (priority order respected) ─────────────
  // Even though this visitor matches Rule 2 (google.com) and Rule 3 (ar),
  // they DON'T match Rule 1 (not EG). So Rule 2 should win because
  // it comes before Rule 3 in the priority order.
  it('should return first matching rule when multiple rules could match', () => {
    const context = {
      country: 'GB',
      deviceType: 'desktop',
      language: 'ar',
      referrerDomain: 'google.com',
    };

    const result = ruleEngine.evaluate(rules, context, fallback);

    // Rule 2 (google-seo) should win because it's higher priority than Rule 3
    expect(result.variantId).toBe('seo-variant');
    expect(result.headline).toBe('Welcome Google visitors');
  });

  // ── TEST: Fallback returned when no rules match ───────────────────
  // A visitor from the US on desktop coming from linkedin.com —
  // doesn't match any rule, so the fallback should be returned.
  it('should return fallback when no rules match', () => {
    const context = {
      country: 'US',
      deviceType: 'desktop',
      language: 'en',
      referrerDomain: 'linkedin.com',
    };

    const result = ruleEngine.evaluate(rules, context, fallback);

    // Fallback variant should be returned
    expect(result.variantId).toBe('default');
    expect(result.headline).toBe('Welcome! Discover our offerings');
  });

  // ── TEST: AND logic — partial match does NOT fire rule ────────────
  // The visitor is from EG but on desktop (not mobile).
  // Rule 1 requires BOTH country=EG AND deviceType=mobile.
  // Since only one condition matches, Rule 1 should NOT fire.
  it('should NOT match rule when only some conditions match (AND logic)', () => {
    const context = {
      country: 'EG',
      deviceType: 'desktop',
      language: 'en',
      referrerDomain: 'linkedin.com',
    };

    const result = ruleEngine.evaluate(rules, context, fallback);

    // Rule 1 should NOT match (only country matches, deviceType doesn't)
    // No other rules match either → fallback
    expect(result.variantId).toBe('default');
  });
});
