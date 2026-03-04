/**
 * ============================================================================
 * TEST (b): Consent Boundary — Proves marketing=false ignores visitorId
 * ============================================================================
 *
 * AC-5: When consent.marketing=false, only { country, language, deviceType,
 *        referrerDomain } may affect decisions; visitorId must NOT
 *        influence the outcome.
 * AC-6: Automated test proving marketing=false filtering works.
 *
 * This test proves that:
 *   - When marketing=false, two visitors with DIFFERENT visitorIds and traits
 *     but the SAME consent-safe fields receive the EXACT SAME variant
 *   - visitorId is stripped from the context when marketing=false
 *   - traits are stripped from the context when marketing=false
 *   - When marketing=true, visitorId and traits ARE visible in the context
 */

import { ConsentFilterService } from '../src/engine/consent-filter.service';
import { RuleEngineService } from '../src/engine/rule-engine.service';
import { Rule, Fallback, Visitor, Consent } from '../src/types';

describe('Consent Boundary', () => {
  let consentFilter: ConsentFilterService;
  let ruleEngine: RuleEngineService;

  // ── Same rules as the config store ────────────────────────────────
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
  ];

  const fallback: Fallback = {
    variantId: 'default',
    headline: 'Welcome! Discover our offerings',
    flags: { showDiscountBanner: false, enableChat: true },
  };

  beforeEach(() => {
    consentFilter = new ConsentFilterService();
    ruleEngine = new RuleEngineService();
  });

  // ── THE CORE CONSENT TEST ─────────────────────────────────────────
  // Two visitors with DIFFERENT visitorIds and traits, but IDENTICAL
  // consent-safe fields (country, language, deviceType, referrerDomain).
  // When marketing=false, both MUST receive the EXACT SAME variant.
  // This proves that personal data does NOT influence the decision.
  it('should return the SAME variant for different visitorIds when marketing=false', () => {
    // ── Visitor A: visitorId "v1", no traits ─────────────────────
    const visitorA: Visitor = {
      visitorId: 'v1',
      country: 'EG',
      language: 'ar',
      deviceType: 'mobile',
      referrerDomain: 'google.com',
    };

    // ── Visitor B: DIFFERENT visitorId "v999", HAS traits ────────
    // This visitor has additional personal data (plan: "premium")
    // that should be completely ignored when marketing=false
    const visitorB: Visitor = {
      visitorId: 'v999',
      country: 'EG',
      language: 'ar',
      deviceType: 'mobile',
      referrerDomain: 'google.com',
      traits: { plan: 'premium', loginCount: 42 },
    };

    // Marketing consent is NOT granted
    const consent: Consent = { marketing: false };

    // Apply consent filter to both visitors
    const contextA = consentFilter.applyConsentBoundary(visitorA, consent);
    const contextB = consentFilter.applyConsentBoundary(visitorB, consent);

    // Evaluate rules for both filtered contexts
    const resultA = ruleEngine.evaluate(rules, contextA, fallback);
    const resultB = ruleEngine.evaluate(rules, contextB, fallback);

    // ── ASSERTION: Both visitors get the EXACT SAME variant ─────
    // This is the proof that visitorId and traits do not affect
    // the decision when marketing consent is not granted.
    expect(resultA.variantId).toBe(resultB.variantId);
    expect(resultA.headline).toBe(resultB.headline);
    expect(resultA.variantId).toBe('mobile-sale');
  });

  // ── TEST: Consent filter strips visitorId when marketing=false ────
  // Verify that the filtered context does NOT contain visitorId
  it('should strip visitorId from context when marketing=false', () => {
    const visitor: Visitor = {
      visitorId: 'should-be-stripped',
      country: 'EG',
      language: 'ar',
      deviceType: 'mobile',
      referrerDomain: 'google.com',
    };

    const consent: Consent = { marketing: false };
    const context = consentFilter.applyConsentBoundary(visitor, consent);

    // visitorId must NOT be present in the filtered context
    expect(context['visitorId']).toBeUndefined();

    // But consent-safe fields MUST still be present
    expect(context['country']).toBe('EG');
    expect(context['language']).toBe('ar');
    expect(context['deviceType']).toBe('mobile');
    expect(context['referrerDomain']).toBe('google.com');
  });

  // ── TEST: Consent filter strips traits when marketing=false ───────
  // Verify that traits (behavioural data) are not in the context
  it('should strip traits from context when marketing=false', () => {
    const visitor: Visitor = {
      visitorId: 'v1',
      country: 'EG',
      language: 'ar',
      deviceType: 'mobile',
      referrerDomain: 'google.com',
      traits: { plan: 'premium', loginCount: 42 },
    };

    const consent: Consent = { marketing: false };
    const context = consentFilter.applyConsentBoundary(visitor, consent);

    // Traits should NOT be present in filtered context
    expect(context['plan']).toBeUndefined();
    expect(context['loginCount']).toBeUndefined();
    expect(context['traits']).toBeUndefined();
  });

  // ── TEST: Full context passed when marketing=true ─────────────────
  // When marketing consent IS granted, all fields should be visible
  it('should include visitorId and traits when marketing=true', () => {
    const visitor: Visitor = {
      visitorId: 'v1',
      country: 'EG',
      language: 'ar',
      deviceType: 'mobile',
      referrerDomain: 'google.com',
      traits: { plan: 'premium' },
    };

    const consent: Consent = { marketing: true };
    const context = consentFilter.applyConsentBoundary(visitor, consent);

    // visitorId SHOULD be present when marketing=true
    expect(context['visitorId']).toBe('v1');

    // Flattened traits SHOULD be present
    expect(context['plan']).toBe('premium');

    // Safe fields should also be present
    expect(context['country']).toBe('EG');
  });
});
