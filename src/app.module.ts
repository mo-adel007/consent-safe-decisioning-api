/**
 * ============================================================================
 * APP MODULE — Root NestJS module
 * ============================================================================
 *
 * This is the application's root module. It imports all feature modules:
 *   - ConfigModule → Handles GET /config/:siteId
 *   - DecideModule → Handles POST /decide
 *
 * NestJS uses this module as the entry point for dependency injection,
 * route registration, and application bootstrapping.
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { DecideModule } from './decide/decide.module';

@Module({
  imports: [
    ConfigModule, // GET /config/:siteId — ruleset retrieval + caching
    DecideModule, // POST /decide — personalisation decisions
  ],
})
export class AppModule {}
