/**
 * ============================================================================
 * MAIN — Application entry point
 * ============================================================================
 *
 * This file bootstraps the NestJS application:
 *   1. Creates the NestJS app from the root AppModule
 *   2. Starts listening on port 3000
 *
 * In production, you would add:
 *   - CORS configuration
 *   - Global validation pipes
 *   - Swagger documentation
 *   - Helmet security headers
 *   - Logging middleware
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  // Create the NestJS application from the root module
  const app = await NestFactory.create(AppModule);

  // Start listening on port 3000
  const port = process.env.PORT || 3000;
  await app.listen(port);

  // Log the server URL for convenience
  console.log(`🚀 Decisioning API is running on: http://localhost:${port}`);
  console.log(`📋 Config endpoint:  GET  http://localhost:${port}/config/:siteId`);
  console.log(`🎯 Decide endpoint:  POST http://localhost:${port}/decide`);
}

// Bootstrap the application
bootstrap();
