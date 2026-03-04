/**
 * ============================================================================
 * CONFIG MODULE — NestJS feature module for the /config endpoint
 * ============================================================================
 *
 * This module bundles the ConfigController and ConfigService together.
 * It also EXPORTS the ConfigService so other modules (like DecideModule)
 * can inject it and access the ruleset store.
 */

import { Module } from '@nestjs/common';
import { ConfigController } from './config.controller';
import { ConfigService } from './config.service';

@Module({
  controllers: [ConfigController],
  providers: [ConfigService],
  exports: [ConfigService], // Exported so DecideModule can use it
})
export class ConfigModule {}
