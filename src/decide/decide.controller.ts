/**
 * ============================================================================
 * DECIDE CONTROLLER — HTTP handler for POST /decide
 * ============================================================================
 *
 * This controller handles the core personalisation endpoint.
 * It receives the visitor's context and consent, delegates the decision
 * to the DecideService, and returns the chosen variant.
 *
 * REQUEST:  POST /decide  { siteId, url, visitor, consent }
 * RESPONSE: 200 OK        { variantId, headline, flags, configVersion }
 */

import { Controller, Post, Body } from '@nestjs/common';
import { DecideService } from './decide.service';
import { DecideRequest, DecideResponse } from '../types';

@Controller('decide')
export class DecideController {
  /**
   * Inject the DecideService via NestJS dependency injection.
   * The controller is intentionally thin — it only handles HTTP concerns.
   * All business logic lives in the service layer.
   */
  constructor(private readonly decideService: DecideService) {}

  /**
   * POST /decide
   *
   * Accepts visitor context and consent preferences, then returns
   * which variant the visitor should see.
   *
   * The consent boundary is enforced inside the DecideService:
   * - If marketing=true  → full personalisation (all visitor fields used)
   * - If marketing=false → only consent-safe fields affect the decision
   *
   * @param body - The decision request containing siteId, url, visitor, consent
   * @returns The personalisation decision with variantId, headline, flags
   */
  @Post()
  decide(@Body() body: DecideRequest): DecideResponse {
    // Delegate entirely to the service layer.
    // The controller doesn't know about rules, consent filtering, or variants.
    // It just receives the HTTP request and returns the service's response.
    return this.decideService.decide(body);
  }
}
