/**
 * ============================================================================
 * DECIDE MODULE — NestJS feature module for the /decide endpoint
 * ============================================================================
 *
 * This module bundles the DecideController, DecideService, and the
 * engine providers (ConsentFilterService, RuleEngineService) together.
 *
 * It IMPORTS the ConfigModule to access the ConfigService
 * (which holds the ruleset store).
 */

import { Module } from '@nestjs/common';
import { DecideController } from './decide.controller';
import { DecideService } from './decide.service';
import { ConsentFilterService } from '../engine/consent-filter.service';
import { RuleEngineService } from '../engine/rule-engine.service';
import { ConfigModule } from '../config/config.module';

@Module({
  imports: [ConfigModule], // Import ConfigModule to access ConfigService
  controllers: [DecideController],
  providers: [
    DecideService,
    ConsentFilterService, // Consent boundary enforcement
    RuleEngineService,    // Rule evaluation engine
  ],
})
export class DecideModule {}
