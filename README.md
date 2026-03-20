# Authentication System

A full-stack authentication platform built with **Node.js, Express, MongoDB, React, and Vite**. It implements a modern auth flow with email OTP verification, JWT access/refresh token strategy, and session management across devices.

This project is both:
- **Production-ready foundation** for real applications that need secure authentication patterns
- **Learning-focused reference** for developers who want to understand and build end-to-end auth systems

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Features](#features)
- [Architecture Overview](#architecture-overview)
- [Folder Structure](#folder-structure)
- [API Endpoints](#api-endpoints)
- [Authentication Flow (Step-by-Step)](#authentication-flow-step-by-step)
- [Security Practices](#security-practices)
- [Setup Instructions](#setup-instructions)
- [Environment Variables](#environment-variables)
- [Screenshots](#screenshots)
- [Future Improvements](#future-improvements)
- [License](#license)

---

## Tech Stack

### Frontend
- React 18
- TypeScript
- Vite
- Fetch API (with `credentials: include`)

### Backend
- Node.js
- Express 5
- JWT (`jsonwebtoken`)
- bcrypt
- Nodemailer
- Cookie Parser
- Morgan

### Database
- MongoDB
- Mongoose

### Tools & Dev Experience
- Concurrently
- wait-on
- TypeScript (mixed JS/TS codebase)

---

## Features

### 1. User Signup and Login
Users can register with email/password and log in after verification. Registration creates a user account with a hashed password and a pending verification state.

### 2. Email OTP Verification
After signup, a one-time password (OTP) is generated and sent via email. The OTP is never stored in plaintext. Only its hash is saved in the database with an expiry timestamp.

### 3. Secure Password Handling
Passwords are hashed with bcrypt before storage. Login compares user input against the stored hash, preventing plaintext password exposure.

### 4. JWT-Based Authentication
The app uses a **dual-token model**:
- **Access token** (short-lived, ~15 min) for protected API access
- **Refresh token** (long-lived, ~7 days) stored as an **HTTP-only cookie** and rotated on refresh

### 5. Session Management
Each login creates a dedicated session record in MongoDB (device + IP + revocation state). Users can:
- View active sessions
- Revoke individual sessions
- Revoke all sessions at once

### 6. Protected Routes (Frontend + Backend)
- Backend validates bearer access tokens for protected endpoints like `get-me`
- Frontend restores sessions on app boot by attempting token refresh before showing dashboard

### 7. Form Validation
- Frontend validates email format, password length, OTP length, and password confirmation
- Backend validates required fields, verification status, token validity, OTP expiry, and session ownership

### 8. Consistent API Messaging
API responses use a predictable structure with `message` and payload fields (`user`, `accessToken`, `sessions`) or error messages for failures.

### Signup to Login Flow
`Signup -> OTP email sent -> Verify OTP -> Login -> Access token + refresh cookie -> Protected dashboard`

---

## Architecture Overview

### Frontend-Backend Interaction
- React client calls `/api/auth/*` endpoints.
- `fetch(..., { credentials: "include" })` ensures refresh-token cookie is sent automatically.
- Access token is kept in client state and sent as `Authorization: Bearer <token>` for protected calls.

### JWT Lifecycle
1. Login issues access token + refresh token.
2. Refresh token is stored in HTTP-only cookie.
3. When access token expires, client calls `/refresh-token`.
4. Server validates refresh token, checks hashed token in session DB, rotates token, and returns a new access token.
5. On logout/logout-all/revoke, sessions are marked revoked and token usage is blocked.

### Validation and Security Boundaries
- **Frontend:** user input quality and UX validation
- **Backend:** authoritative validation, credential verification, token checks, OTP checks, and session authorization
- **Database:** stores only hashed secrets (password hash, OTP hash, refresh token hash)

---

## Folder Structure

```text
Authentication System/
|- server.js
|- package.json
|- vite.config.ts
|- src/
|  |- app.js
|  |- config/
|  |  |- config.js
|  |  |- database.js
|  |- routes/
|  |  |- auth.routes.js
|  |- controllers/
|  |  |- auth.controller.js
|  |- models/
|  |  |- user.model.js
|  |  |- session.model.js
|  |  |- otp.model.js
|  |- services/
|  |  |- email.services.js
|  |- utils/
|  |  |- utils.js
|  |- client/
|  |  |- main.tsx
|  |  |- AuthApp.tsx
|  |  |- services/
|  |  |  |- auth.api.ts
|  |  |- screens/
|  |  |  |- LoginScreen.tsx
|  |  |  |- RegisterScreen.tsx
|  |  |  |- VerifyOTPScreen.tsx
|  |  |  |- DashboardScreen.tsx
|  |  |  |- EndScreen.tsx
|  |  |- hooks/
|  |  |- components/
|  |  |- styles/
|  |- *.ts (typed variants and shared utilities)
```

### Structure Notes
- `controllers/` holds request handlers and auth logic orchestration.
- `models/` defines persistence for users, sessions, and OTP records.
- `services/` integrates external providers (email transport).
- `client/` contains the React app with screen-based auth flow.
- The repo currently includes both `.js` and `.ts` files, indicating an incremental TypeScript migration.

---

## API Endpoints

Base URL: `http://localhost:5000/api/auth`

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | `/register` | Create account and send OTP email | No |
| POST | `/verify-email` | Verify account with OTP | No |
| POST | `/login` | Login and issue tokens | No |
| GET | `/get-me` | Get current user from access token | Access Token |
| POST | `/refresh-token` | Rotate refresh token and issue new access token | Refresh Cookie |
| POST | `/logout` | Revoke current session | Refresh Cookie |
| POST | `/logout-all` | Revoke all sessions for user | Refresh Cookie |
| GET | `/sessions` | List active sessions | Refresh Cookie |
| POST | `/revoke-session` | Revoke one non-current session | Refresh Cookie |

### Request/Response Examples

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "john",
  "email": "john@example.com",
  "password": "StrongPass123"
}
```

```json
{
  "message": "User registered successfully",
  "user": {
    "username": "john",
    "email": "john@example.com",
    "verified": false
  }
}
```

#### Verify Email OTP
```http
POST /api/auth/verify-email
Content-Type: application/json

{
  "email": "john@example.com",
  "otp": "123456"
}
```

```json
{
  "message": "Email verified successfully",
  "user": {
    "username": "john",
    "email": "john@example.com",
    "verified": true
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "StrongPass123"
}
```

```json
{
  "message": "User logged in successfully",
  "user": {
    "username": "john",
    "email": "john@example.com"
  },
  "accessToken": "<jwt-access-token>"
}
```

#### Get Current User
```http
GET /api/auth/get-me
Authorization: Bearer <jwt-access-token>
```

```json
{
  "message": "User found",
  "user": {
    "username": "john",
    "email": "john@example.com"
  }
}
```

#### Refresh Token
```http
POST /api/auth/refresh-token
Cookie: refreshToken=<http-only-cookie>
```

```json
{
  "message": "Access token refreshed successfully",
  "accessToken": "<new-access-token>"
}
```

#### Sessions
```http
GET /api/auth/sessions
Cookie: refreshToken=<http-only-cookie>
```

```json
{
  "message": "Sessions fetched successfully",
  "sessions": [
    {
      "id": "67f...",
      "device": "Mozilla/5.0 ...",
      "location": "::1",
      "lastSeen": "2026-03-21T10:00:00.000Z",
      "current": true
    }
  ]
}
```

---

## Authentication Flow (Step-by-Step)

1. User opens app and registers with email + password.
2. Backend hashes password and stores unverified user.
3. Backend generates OTP, hashes OTP, stores OTP document with expiry, and emails the OTP.
4. User submits OTP via verify endpoint.
5. Backend validates OTP hash + expiry and marks user as verified.
6. User logs in with verified account.
7. Backend creates a session record and returns:
   - Access token in response body
   - Refresh token in HTTP-only cookie
8. Frontend uses access token for protected requests (`/get-me`).
9. When needed, frontend calls `/refresh-token` to rotate refresh token and renew access token.
10. User can logout current session, logout all sessions, or revoke specific devices.

---

## Security Practices

- **Password Hashing:** bcrypt with salt rounds before storage.
- **OTP Security:** OTP is hashed before persistence and time-limited.
- **Refresh Token Protection:** stored as HTTP-only cookie (`httpOnly`, `sameSite=strict`, secure in production).
- **Token Rotation:** refresh token is rotated and re-hashed on each refresh.
- **Session Revocation:** each refresh token is linked to a DB session that can be revoked.
- **Input Validation:** frontend and backend checks for required fields and format.
- **Token Verification:** JWT signature and expiry are validated before protected operations.

---

## Setup Instructions

### 1. Clone Repository
```bash
git clone <your-repo-url>
cd Authentication\ System
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment
Create a `.env` file in project root (example below).

### 4. Run API + UI Together
```bash
npm run dev:all
```

### 5. Run Individually (Optional)
```bash
npm run dev:api
npm run dev
```

### Build / Type Check
```bash
npm run build
npm run check
```

### Important (Windows + WSL)
If you run in WSL, install dependencies in WSL terminal for that environment (avoid reusing `node_modules` installed from Windows shell).

---

## Environment Variables

Create `.env` in project root:

```env
# App
NODE_ENV=development
API_PORT=5000

# Database
MONGO_URI=mongodb://127.0.0.1:27017/auth_system

# JWT
JWT_SECRET=your_super_secret_jwt_key

# Email sender account
GOOGLE_USER=youremail@gmail.com

# Option A: Gmail App Password (recommended for simple setup)
GOOGLE_APP_PASSWORD=your_google_app_password

# Option B: OAuth2 credentials (required if not using GOOGLE_APP_PASSWORD)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REFRESH_TOKEN=your_google_refresh_token
```

### Variable Reference

| Variable | Required | Description |
|---|---|---|
| `NODE_ENV` | No | `development` or `production` |
| `API_PORT` | No | API server port (default `5000`) |
| `MONGO_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret key used to sign JWTs |
| `GOOGLE_USER` | Yes | Email used as sender |
| `GOOGLE_APP_PASSWORD` | Conditional | Gmail app password (if not using OAuth2) |
| `GOOGLE_CLIENT_ID` | Conditional | OAuth2 client ID |
| `GOOGLE_CLIENT_SECRET` | Conditional | OAuth2 client secret |
| `GOOGLE_REFRESH_TOKEN` | Conditional | OAuth2 refresh token for Nodemailer |

---

## Screenshots

> Add screenshots after UI capture.

- `docs/screenshots/register.png` - Register screen
- `docs/screenshots/otp-verify.png` - OTP verification screen
- `docs/screenshots/login.png` - Login screen
- `docs/screenshots/dashboard.png` - Protected dashboard
- `docs/screenshots/sessions.png` - Active sessions panel

---

## Future Improvements

- Add rate limiting for login and OTP verification endpoints
- Add forgot-password and password reset flow
- Add CSRF protection strategy for cookie-based refresh endpoint
- Add account lockout policy after repeated failed logins
- Add resend-OTP backend endpoint with cooldown enforcement
- Add role-based authorization and admin controls
- Add unit/integration/e2e tests and CI pipeline
- Complete full TypeScript migration for backend runtime files
- Add Docker and production deployment docs

---

## License

This project is licensed under the **ISC License**.

If you plan to open-source under a different license (MIT/Apache-2.0), update this section and `package.json` accordingly.
