# Notification Service

A scalable, provider-agnostic notification dispatch system supporting Email,
SMS, and WhatsApp with:

- Pluggable, auto-registered providers
- Provider-specific templates
- Zod-validated request schemas
- Real-time and scheduled (other) queues
- Redis-backed worker using BRPOP
- Rate limiting, dedupe, retries
- Simple extensibility: add a provider by adding a folder

---

## Architecture Overview

```
src/
├─ app.ts                    # Fastify API
├─ server.ts                 # API + Worker spawn
├─ types/
│  ├─ index.ts               # NotifyRequest, Job
│  └─ provider.ts            # Provider interface specification
├─ lib/
│  ├─ queue.ts               # Redis queue push/pop
│  ├─ rate_limit.ts          # Token bucket limiter
│  ├─ dedupe.ts              # Redis dedupe TTL
│  ├─ redis.ts               # Redis connection
│  ├─ worker.ts              # Background worker
│  └─ providers/
│      ├─ email/
│      │    ├─ index.ts
│      │    └─ mailer.ts
│      ├─ sms/
│      │    ├─ index.ts
│      │    └─ msg91.ts
│      ├─ whatsapp/
│      │    ├─ index.ts
│      │    └─ twilio.ts
│      └─ index.ts           # Auto-loads all providers
```

---

## Features

### Provider-agnostic API

All notifications are sent through the same /notify endpoint.

### Strong input validation

Zod schemas per provider define required fields and variable structures.

### Automatic provider registration

Any folder inside `providers/` is automatically loaded without manual updates.

### Queue-backed architecture

Redis BRPOP ensures low CPU usage and efficient background workers.

### Dedupe system

Prevents sending the same notification repeatedly.

### Rate limiting

Per-provider token bucket limiting.

### Retry handling

Failed jobs are pushed into the "other" queue for retry.

---

## Requirements

- Node.js 20+
- Redis 6+
- Provider credentials (AWS SES / SMTP, MSG91, Twilio, etc.)

---

## Installation

```bash
pnpm install
```

---

## Running Locally

### 1. Copy environment variables

```bash
cp example.env .env
```

Fill in provider-specific credentials.

### 2. Start Redis

```bash
docker compose up redis
```

### 3. Start API + Worker

```bash
pnpm dev
```

The worker is automatically spawned by `server.ts`.

---

# API Usage

Endpoint:

```
POST /notify
```

Body:

```json
{
  "channel": "email | sms | whatsapp",
  "template_id": "string",
  "to": "recipient",
  "priority": "realtime | other",
  "variables": {},
  "dedupe_id": "optional"
}
```

---

# Provider Templates and Capabilities

The service exposes:

```
GET /providers
```

This returns:

- List of providers
- Templates supported by each provider
- Zod schema describing required variables

Useful for frontend or client-side integrations.

---

# Request Examples

## Email Example

```json
{
  "channel": "email",
  "template_id": "basic_email",
  "to": "user@example.com",
  "priority": "realtime",
  "variables": {
    "fromName": "Notification Service",
    "fromEmail": "no-reply@yourapp.com",
    "subject": "Welcome",
    "html": "<h1>Hello</h1>",
    "replyTo": "support@yourapp.com"
  }
}
```

## SMS Example (MSG91)

```json
{
  "channel": "sms",
  "template_id": "login_otp",
  "to": "+918888888888",
  "variables": {
    "message": "Your OTP is 987654"
  }
}
```

## WhatsApp Example (Twilio)

```json
{
  "channel": "whatsapp",
  "template_id": "otp",
  "to": "+918888888888",
  "variables": {
    "contentSid": "OTP_TEMPLATE_CONTENT_SID"
  }
}
```

---

# Provider Development Guide

To add a new provider:

### 1. Create a folder:

```
src/lib/providers/push/
```

### 2. Add index.ts:

```ts
export { pushProvider } from './push';
```

### 3. Implement the provider:

```ts
import { z } from 'zod';
import { ProviderDefinition } from '../../../types/provider';

export const pushProvider: ProviderDefinition = {
  name: 'push',

  templates: {
    welcome: 'PUSH_TEMPLATE_1',
  },

  schema: z.object({
    title: z.string(),
    message: z.string(),
  }),

  async send({ to, template_id, variables }) {
    // push notification logic
    return { ok: true };
  },
};
```

The provider is now automatically registered. No additional changes needed.

---

# Worker Description

Workers listen on:

- `queue:realtime`
- `queue:other`
- `queue:dead`
Each job is executed with:

```ts
provider.send({ to, template_id, variables });
```

Retries are handled by requeueing into `queue:other`.

---

# Configuration

### providerConfig.ts

```ts
export const providerConfig = {
  sms: { rate: 100, burst: 40 },
  email: { rate: 100, burst: 50 },
  whatsapp: { rate: 100, burst: 10 },
};
```

---

# Testing

Example using cURL:

```bash
curl -X POST http://localhost:3000/notify \
  -H "Content-Type: application/json" \
  -d '{"channel":"sms","template_id":"login_otp","to":"+918888888888","variables":{"message":"Hi"}}'
```

---

# Design Goals

- Unified and clean API
- Clear separation of providers
- Strict runtime validation
- Easy to extend
- Resilient under load
- Fully asynchronous delivery model
