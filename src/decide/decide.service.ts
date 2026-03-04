/**
 * ============================================================================
 * DECIDE SERVICE — Decision orchestration logic
 * ============================================================================
 *
 * This service orchestrates the three-step decision process:
 *   1. LOAD  → Fetch the ruleset for the requested siteId
 *   2. FILTER → Apply the consent boundary (strip unsafe fields)
 *   3. EVALUATE → Run the rule engine and return the winning variant
 *
 * It composes the ConfigService, ConsentFilterService, and RuleEngineService
 * via NestJS dependency injection — keeping each concern isolated.
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import { ConsentFilterService } from '../engine/consent-filter.service';
import { RuleEngineService } from '../engine/rule-engine.service';
import { DecideRequest, DecideResponse } from '../types';

@Injectable()
export class DecideService {
  /**
   * All three dependencies are injected by NestJS.
   * The DecideService doesn't know HOW configs are stored, HOW consent
   * is filtered, or HOW rules are evaluated — it only orchestrates.
   */
  constructor(
    private readonly configService: ConfigService,
    private readonly consentFilter: ConsentFilterService,
    private readonly ruleEngine: RuleEngineService,
  ) {}

  /**
   * Make a personalisation decision for a visitor.
   *
   * @param request - Contains siteId, url, visitor context, and consent
   * @returns The chosen variant (variantId, headline, flags, configVersion)
   * @throws NotFoundException if the siteId doesn't exist in the config store
   */
  decide(request: DecideRequest): DecideResponse {
    // ── Step 1: LOAD the ruleset configuration ────────────────────
    // Fetch the rules, fallback, and version for the requested site.
    const config = this.configService.getConfigBySiteId(request.siteId);

    // If the site doesn't exist, throw a 404 error.
    // NestJS will automatically convert this to a proper HTTP response.
    if (!config) {
      throw new NotFoundException(
        `Configuration not found for site: ${request.siteId}`,
      );
    }

    // ── Step 2: FILTER the visitor context through consent boundary ─
    // This is the privacy-critical step. If marketing=false, the consent
    // filter strips visitorId, traits, and any other personal identifiers.
    // The rule engine will only see consent-safe fields.
    const filteredContext = this.consentFilter.applyConsentBoundary(
      request.visitor,
      request.consent,
    );

    // ── Step 3: EVALUATE rules against the filtered context ───────
    // The rule engine checks rules top-to-bottom (first match wins).
    // It only sees the filtered context — it has no access to the
    // original visitor data. This guarantees the consent boundary.
    const result = this.ruleEngine.evaluate(
      config.rules,
      filteredContext,
      config.fallback,
    );

    // ── Build and return the decision response ────────────────────
    // Include the configVersion so the client knows which version
    // of the rules was used for this decision (useful for debugging).
    return {
      variantId: result.variantId,
      headline: result.headline,
      flags: result.flags,
      configVersion: config.configVersion,
    };
  }
}
