/**
 * ============================================================================
 * CONFIG CONTROLLER — HTTP handler for GET /config/:siteId
 * ============================================================================
 *
 * This controller serves the ruleset configuration for a given site.
 * It is a READ-ONLY endpoint designed to be heavily cached at the
 * CDN, edge, and browser levels.
 *
 * CACHING STRATEGY:
 *   - ETag: Set to the configVersion (e.g., "v3")
 *   - Cache-Control: public, max-age=60, s-maxage=300
 *     → Browser caches for 60 seconds
 *     → CDN/edge caches for 300 seconds (5 minutes)
 *   - Supports conditional requests via If-None-Match → 304 Not Modified
 */

import { Controller, Get, Param, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { ConfigService } from './config.service';

@Controller('config')
export class ConfigController {
  /**
   * Inject the ConfigService via NestJS dependency injection.
   * The controller doesn't know how configs are stored — it just asks
   * the service to fetch them.
   */
  constructor(private readonly configService: ConfigService) {}

  /**
   * GET /config/:siteId
   *
   * Returns the complete ruleset configuration for the given site,
   * including rules, fallback, and configVersion.
   *
   * Sets ETag and Cache-Control headers for HTTP caching:
   * - ETag enables conditional requests (304 Not Modified)
   * - Cache-Control defines freshness for browser and CDN
   *
   * @param siteId - The site to retrieve configuration for
   * @param res    - Express response object (for manual header control)
   */
  @Get(':siteId')
  getConfig(
    @Param('siteId') siteId: string,
    @Res() res: Response,
  ): void {
    // ── Step 1: Load the configuration from the store ──────────────
    const config = this.configService.getConfigBySiteId(siteId);

    // If the site doesn't exist, return 404
    if (!config) {
      res.status(HttpStatus.NOT_FOUND).json({
        statusCode: 404,
        message: `Configuration not found for site: ${siteId}`,
      });
      return;
    }

    // ── Step 2: Check for conditional request (If-None-Match) ─────
    // If the client already has this version cached, they'll send
    // an If-None-Match header with the ETag. If it matches our
    // current configVersion, we return 304 (no body = saves bandwidth).
    const clientETag = res.req.headers['if-none-match'];
    if (clientETag === `"${config.configVersion}"`) {
      res.status(HttpStatus.NOT_MODIFIED).end();
      return;
    }

    // ── Step 3: Set caching headers ───────────────────────────────
    // ETag: Fingerprint of the response content (the config version).
    //   When cache expires, the client sends If-None-Match with this value.
    //   If unchanged, server returns 304 Not Modified (no body).
    res.setHeader('ETag', `"${config.configVersion}"`);

    // Cache-Control: Defines how long this response can be cached.
    //   - "public"      → Any cache (browser, CDN, proxy) may store this
    //   - "max-age=60"  → Browser considers response fresh for 60 seconds
    //   - "s-maxage=300" → Shared caches (CDN/edge) cache for 5 minutes
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300');

    // ── Step 4: Return the full configuration as JSON ─────────────
    res.status(HttpStatus.OK).json(config);
  }
}
