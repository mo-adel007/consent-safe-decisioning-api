# 🚦 Consent-Safe Decisioning API

A lightweight **rule-based personalization engine** built with **NestJS + TypeScript** that determines which content variant a visitor should see based on contextual signals while respecting **user consent boundaries**.

This project demonstrates the architecture used by modern **A/B testing, feature flag, and personalization platforms**.

---

# ✨ Key Idea

Instead of hardcoding personalization logic in the frontend, the frontend asks a backend decision service:

> “Given this visitor and their context, which version of the content should they see?”

The service evaluates configured rules and returns the correct **variant**.

---

# 🧠 Core Concepts

### Variant

A **variant** is a version of content shown to a visitor.

Example:

| Variant ID   | Headline                        |
| ------------ | ------------------------------- |
| mobile-sale  | Mobile users get 20% off        |
| seo-variant  | Welcome Google visitors         |
| arabic-offer | مرحباً! اكتشف عروضنا            |
| default      | Welcome! Discover our offerings |

---

### Rule Engine

Rules are evaluated **top-to-bottom**.

Example rule:

```
IF country = EG
AND deviceType = mobile
→ mobile-sale
```

The **first rule that matches wins**.

If no rules match → **fallback variant** is returned.

---

# 🔒 Consent Boundary

To comply with privacy regulations (GDPR-style rules), the system enforces a strict **consent boundary**.

When:

```
consent.marketing = false
```

The decision engine must **ignore personal identifiers**.

### ❌ Blocked signals

```
visitorId
userId
email
traits
```

### ✅ Allowed signals

```
country
language
deviceType
referrerDomain
```

This ensures personalization remains **privacy-safe**.

---

# 🏗 Architecture

```
User visits website
        ↓
Frontend gathers visitor context
        ↓
POST /decide
        ↓
Consent filter removes restricted fields
        ↓
Rule engine evaluates rules
        ↓
Variant returned
        ↓
Frontend renders content
```

---

# 📡 API Endpoints

## 1️⃣ Get Configuration

### GET `/config/:siteId`

Returns the ruleset configuration for a site.

### Example Request

```
GET http://localhost:3000/config/site-nike
```

### Example Response

```json
{
  "siteId": "site-nike",
  "configVersion": "v3",
  "rules": [
    {
      "id": "rule-eg-mobile",
      "conditions": {
        "country": "EG",
        "deviceType": "mobile"
      },
      "variantId": "mobile-sale"
    },
    {
      "id": "rule-google-seo",
      "conditions": {
        "referrerDomain": "google.com"
      },
      "variantId": "seo-variant"
    }
  ],
  "fallback": {
    "variantId": "default",
    "headline": "Welcome! Discover our offerings"
  }
}
```

### Response Headers

```
ETag: "v3"
Cache-Control: public, max-age=60, s-maxage=300
```

These headers allow **browser and CDN caching**.

---

## 2️⃣ Decide Variant

### POST `/decide`

Determines which variant a visitor should see.

### Example Request

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

### Example Response

```json
{
  "variantId": "mobile-sale",
  "headline": "Mobile users get 20% off",
  "flags": {
    "showDiscountBanner": true
  },
  "configVersion": "v3"
}
```

---

# 🧪 Testing

Two automated tests verify core behavior.

---

### Test 1 — Rule Matching

Ensures rules produce the expected variant.

Example:

```
country = EG
deviceType = mobile
```

Expected result:

```
mobile-sale
```

---

### Test 2 — Consent Boundary

Ensures personal identifiers are ignored when marketing consent is disabled.

Example:

```
visitorId = vip123
marketing = false
```

Expected result:

```
fallback variant
```

---

# 🧪 Manual Testing (Postman)

### Fetch rules

```
GET /config/site-nike
```

Verify:

* rules returned
* configVersion
* ETag header
* Cache-Control header

---

### Egyptian Mobile User

```
POST /decide
```

Body:

```json
{
  "siteId": "site-nike",
  "url": "/home",
  "visitor": {
    "country": "EG",
    "deviceType": "mobile"
  },
  "consent": {
    "marketing": true
  }
}
```

Expected:

```
mobile-sale variant
```

---

### Consent Boundary Test

```json
{
  "siteId": "site-nike",
  "url": "/home",
  "visitor": {
    "visitorId": "vip-123",
    "country": "US"
  },
  "consent": {
    "marketing": false
  }
}
```

Expected:

```
fallback variant
```

Because **visitorId must be ignored**.

---

# 🗂 Project Structure

```
decisioning-api
│
├── src
│   ├── config
│   │   ├── config.controller.ts
│   │   └── config.service.ts
│   │
│   ├── decide
│   │   ├── decide.controller.ts
│   │   └── decide.service.ts
│   │
│   ├── engine
│   │   ├── rule-engine.service.ts
│   │   └── consent-filter.service.ts
│   │
│   └── types
│       └── index.ts
│
├── test
│   ├── rule-engine.spec.ts
│   └── consent-boundary.spec.ts
│
├── package.json
└── README.md
```

---

# ⚙️ Running the Project

### Install dependencies

```
npm install
```

---

### Start development server

```
npm run start:dev
```

Server runs at:

```
http://localhost:3000
```

---

# ▶ Run Tests

```
npm test
```

---

# 🧩 Technology Stack

| Layer        | Technology                 |
| ------------ | -------------------------- |
| Runtime      | Node.js                    |
| Framework    | NestJS                     |
| Language     | TypeScript                 |
| Testing      | Jest                       |
| Architecture | Rule-based decision engine |

---

# 🎯 Acceptance Criteria Covered

✔ `/config/:siteId` returns rules and `configVersion`
✔ Response includes **ETag + Cache-Control**
✔ `/decide` returns `{ variantId, headline, flags, configVersion }`
✔ Rule engine evaluates rules + fallback
✔ Consent boundary enforced
✔ Two automated tests provided
✔ README documentation included

---

# 📌 Summary

This project implements a minimal **personalization decision engine** used in modern platforms such as:

* A/B testing systems
* feature flag platforms
* marketing personalization engines

The design separates:

| Concern           | Location |
| ----------------- | -------- |
| Decision logic    | Backend  |
| Content rendering | Frontend |

This separation enables **safe experimentation, flexible personalization, and privacy-compliant targeting** without redeploying frontend code.
