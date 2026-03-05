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

### 1. Base URL (Local Development)

If you run NestJS locally:
`http://localhost:3000`

Your endpoints will be:
- `GET  http://localhost:3000/config/:siteId`
- `POST http://localhost:3000/decide`

*(No authentication is required for these endpoints based on the architecture.)*

---

### 2. Endpoint 1 — Get Config

#### Request
`GET http://localhost:3000/config/site-nike`

**Headers (optional)**
- `Accept: application/json`

#### Expected Response
```json
{
  "siteId": "site-nike",
  "configVersion": "v3",
  "rules": [
    {
      "id": "rule-eg-mobile",
      "conditions": [
        { "field": "country", "operator": "eq", "value": "EG" },
        { "field": "deviceType", "operator": "eq", "value": "mobile" }
      ],
      "variantId": "mobile-sale",
      "headline": "Mobile users get 20% off",
      "flags": { "showDiscountBanner": true, "enableChat": false }
    },
    {
      "id": "rule-google-seo",
      "conditions": [
        { "field": "referrerDomain", "operator": "eq", "value": "google.com" }
      ],
      "variantId": "seo-variant",
      "headline": "Welcome Google visitors",
      "flags": { "showDiscountBanner": false, "enableChat": true }
    },
    {
      "id": "rule-arabic",
      "conditions": [
        { "field": "language", "operator": "eq", "value": "ar" }
      ],
      "variantId": "arabic-offer",
      "headline": "مرحباً! اكتشف عروضنا",
      "flags": { "showDiscountBanner": false, "enableChat": true }
    }
  ],
  "fallback": {
    "variantId": "default",
    "headline": "Welcome! Discover our offerings",
    "flags": { "showDiscountBanner": false, "enableChat": true }
  }
}
```


---

### 3. Endpoint 2 — Decide Variant

#### Request
`POST http://localhost:3000/decide`

**Headers**
- `Content-Type: application/json`
- `Accept: application/json`

---

### 4. Test Case 1 — Egyptian Mobile User (Rule Match)

**Body**
```json
{
  "siteId": "site-nike",
  "url": "/pricing",
  "visitor": {
    "visitorId": "visitor-123",
    "country": "EG",
    "language": "ar",
    "deviceType": "mobile",
    "referrerDomain": "facebook.com"
  },
  "consent": {
    "marketing": true
  }
}
```

**Expected Response**
```json
{
  "variantId": "mobile-sale",
  "headline": "Mobile users get 20% off",
  "flags": {
    "showDiscountBanner": true,
    "enableChat": false
  },
  "configVersion": "v3"
}
```
*Reason: `country = EG` and `deviceType = mobile`. Matches rule: `rule-eg-mobile`.*

---

### 5. Test Case 2 — Google Visitor

**Body**
```json
{
  "siteId": "site-nike",
  "url": "/home",
  "visitor": {
    "visitorId": "visitor-555",
    "country": "GB",
    "language": "en",
    "deviceType": "desktop",
    "referrerDomain": "google.com"
  },
  "consent": {
    "marketing": true
  }
}
```

**Expected Response**
```json
{
  "variantId": "seo-variant",
  "headline": "Welcome Google visitors",
  "flags": {
    "showDiscountBanner": false,
    "enableChat": true
  },
  "configVersion": "v3"
}
```
*Reason: `referrerDomain = google.com`. Matches rule: `rule-google-seo`.*

---

### 6. Test Case 3 — Consent Boundary (Important)
*This is one of the required tests in the assignment.*

**Body**
```json
{
  "siteId": "site-nike",
  "url": "/home",
  "visitor": {
    "visitorId": "vip-123",
    "country": "US",
    "language": "en",
    "deviceType": "desktop",
    "referrerDomain": "linkedin.com"
  },
  "consent": {
    "marketing": false
  }
}
```

**Expected Result**
```json
{
  "variantId": "default",
  "headline": "Welcome! Discover our offerings",
  "flags": {
    "showDiscountBanner": false,
    "enableChat": true
  },
  "configVersion": "v3"
}
```
*Reason: `visitorId` exists, BUT `marketing = false`. `visitorId` MUST be ignored. So no rules match → fallback. This verifies the privacy boundary.*

---

### 7. Test Case 4 — Fallback Rule

**Body**
```json
{
  "siteId": "site-nike",
  "url": "/about",
  "visitor": {
    "country": "US",
    "language": "en",
    "deviceType": "desktop",
    "referrerDomain": "linkedin.com"
  },
  "consent": {
    "marketing": true
  }
}
```

**Expected Response**
```json
{
  "variantId": "default",
  "headline": "Welcome! Discover our offerings",
  "flags": {
    "showDiscountBanner": false,
    "enableChat": true
  },
  "configVersion": "v3"
}
```
*Reason: No rule matches → fallback.*

---

## Postman Collection Structure

Recommended Postman folder structure:

```text
Decisioning API/
├── GET Config
│   └── GET /config/site-nike
│
├── Decide – Egyptian Mobile
│   └── POST /decide
│
├── Decide – Google Visitor
│   └── POST /decide
│
├── Decide – Consent Boundary
│   └── POST /decide
│
└── Decide – Fallback
    └── POST /decide
```

---

## What Reviewers Expect You to Show

When you demo this API:
1. **Call `/config/site-nike`** → Show rules, configVersion, ETag, and Cache-Control headers.
2. **Call `/decide` with EG mobile user** → Show `mobile-sale` variant.
3. **Call `/decide` with google referrer** → Show `seo-variant`.
4. **Call `/decide` with marketing=false** → Show that visitorId is ignored and the fallback is correctly served.

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

