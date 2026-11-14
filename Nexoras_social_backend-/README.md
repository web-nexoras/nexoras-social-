# Jakariya Unode Backend

Authentication + Friends backend (Node.js/Express/MongoDB) with Redis, Swagger, Cloudinary.

## Features
- Signup + OTP verification (Redis TTL 5 min)
- Signin / Signout / Refresh token rotation
- Forgot/Reset password
- Profile get/update (text + avatar)
- Friends system (suggestions, requests, accept/reject/cancel, list, profile view)
- Redis cache + rate limiting
- Swagger docs at `/api-docs`

## Setup
1. `cp .env.example .env`
2. Fill DB/JWT/Email/Cloudinary/Redis values
3. `npm install`
4. `npm run dev` (uses `node --watch server.js`)

## Backend Flow
```text
Client Request
   ↓
server.js (helmet, cors, json, cookie-parser, attachRedis, swagger)
   ↓
routes/index.js (baseUrl prefix)
   ↓
routes/<feature>/index.js (authMiddleware + checkActive)
   ↓
routes/<feature>/*Routes.js (controller mapping)
   ↓
controller/<feature>/*.js (business logic)
   ↓
services/* (shared logic)
   ↓
models/* (Mongoose)
   ↓
MongoDB / Redis
   ↓
JSON Response
```

## Auth Flow
```text
Signup → OTP Verify → Signin → JWT Cookies → /me → Profile Update → Refresh → Signout
```

## Friends Flow
```text
Suggestions → Send Request → Incoming → Accept/Reject/Cancel → Friends List → Friend Profile
```

## Env
See `.env.example`

## Notes
- Redis optional: set `REDIS_ENABLED=true`
- Swagger: `http://localhost:PORT/api-docs`
- Health: `GET /health`, `GET /health/redis`
