# Decisioning API

A consent-safe personalisation decision API built with **NestJS** and **TypeScript**.

Given a visitor, a URL, and consent signals, this API returns which variant of content the visitor should see. Rules come from a configurable ruleset and are cacheable at CDN/edge/origin levels.

---

## Quick Start

### Prerequisites

- **Node.js 20+** (LTS recommended)
- **npm** (comes with Node.js)

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Start the development server (with hot-reload)
npm run start:dev

# 3. The API is now running at http://localhost:3000
```

### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:cov
```

---

## API Endpoints

### GET /config/:siteId

Returns the complete ruleset configuration for a site.

**Example:**

```bash
curl -i http://localhost:3000/config/site-nike
```

**Response:**

```json
{
  "siteId": "site-nike",
  "configVersion": "v3",
  "rules": [ ... ],
  "fallback": { "variantId": "default", "headline": "Welcome! Discover our offerings" }
}
```

**Cache Headers:**

| Header | Value | Purpose |
|--------|-------|---------|
| `ETag` | `"v3"` | Enables conditional requests (304 Not Modified) |
| `Cache-Control` | `public, max-age=60, s-maxage=300` | Browser: 60s, CDN: 5 min |

---

### POST /decide

Decides which variant a visitor should see.

**Example:**

```bash
curl -X POST http://localhost:3000/decide \
  -H "Content-Type: application/json" \
  -d '{
    "siteId": "site-nike",
    "url": "https://nike.com/pricing",
    "visitor": {
      "visitorId": "v1",
      "country": "EG",
      "language": "ar",
      "deviceType": "mobile",
      "referrerDomain": "google.com"
    },
    "consent": { "marketing": true }
  }'
```

**Response:**

```json
{
  "variantId": "mobile-sale",
  "headline": "Mobile users get 20% off",
  "flags": { "showDiscountBanner": true, "enableChat": false },
  "configVersion": "v3"
}
```

---

## Consent Boundary

When `consent.marketing = false`, only these fields may affect decisions:

| Allowed | Blocked |
|---------|---------|
| `country` | `visitorId` |
| `language` | `traits` |
| `deviceType` | `userId` |
| `referrerDomain` | Any personal identifier |

---

## Project Structure

```
src/
├── main.ts                          # Entry point
├── app.module.ts                    # Root module
├── config/
│   ├── config.module.ts             # Config feature module
│   ├── config.controller.ts         # GET /config/:siteId
│   └── config.service.ts            # In-memory ruleset store
├── decide/
│   ├── decide.module.ts             # Decide feature module
│   ├── decide.controller.ts         # POST /decide
│   └── decide.service.ts            # Decision orchestration
├── engine/
│   ├── rule-engine.service.ts       # Rule evaluation (first-match-wins)
│   └── consent-filter.service.ts    # Consent boundary enforcement
└── types/
    └── index.ts                     # TypeScript interfaces
```

---

## Tests

| Test | File | What It Proves |
|------|------|---------------|
| Rule Match | `test/rule-engine.spec.ts` | Multi-condition AND logic works, first-match-wins |
| Consent Boundary | `test/consent-boundary.spec.ts` | marketing=false ignores visitorId and traits |

---

## Architecture

See `Decisioning_API_Architecture_Document.html` for the full technical architecture document including system flows, consent boundary design, caching strategy, and API contracts.
