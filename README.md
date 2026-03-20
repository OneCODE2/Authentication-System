Authentication System

A full-stack authentication system built using Node.js, Express, MongoDB, React, and Vite.

It covers a complete auth flow — from signup to login — with email OTP verification, JWT-based authentication, and session handling across devices.

I built this project to understand how real-world authentication systems actually work beyond basic tutorials.

What this project does

Users can register and login

Email verification using OTP

Passwords are securely hashed

Uses access + refresh token strategy

Handles multiple user sessions (devices)

Protected routes on both frontend and backend

Tech Stack

Frontend

React

TypeScript

Vite

Backend

Node.js

Express

JWT (jsonwebtoken)

bcrypt

Nodemailer

Database

MongoDB (Mongoose)

How the auth flow works

User signs up with email + password

Server hashes the password and stores user as unverified

OTP is generated and sent to email

User verifies OTP

After verification, user can login

Login returns:

Access token (short-lived)

Refresh token (stored in HTTP-only cookie)

Access token is used for protected APIs

When it expires, refresh token is used to get a new one

Sessions

Each login creates a session in the database.

You can see all active sessions

Logout from current device

Logout from all devices

Revoke a specific session

Security stuff (important)

Passwords are hashed using bcrypt

OTP is stored as a hash (not plain text)

Refresh token is stored in HTTP-only cookie

Tokens are validated on every request

Sessions can be revoked from DB

API (basic overview)
POST   /api/auth/register
POST   /api/auth/verify-email
POST   /api/auth/login
GET    /api/auth/get-me
POST   /api/auth/refresh-token
POST   /api/auth/logout
POST   /api/auth/logout-all
GET    /api/auth/sessions
POST   /api/auth/revoke-session
Running the project
git clone <your-repo-url>
cd authentication-system
npm install
npm run dev:all
Environment variables

Create a .env file:

NODE_ENV=development
API_PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/auth_system
JWT_SECRET=your_secret

GOOGLE_USER=your_email@gmail.com
GOOGLE_APP_PASSWORD=your_app_password
Folder structure (simplified)
src/
 ├── controllers/
 ├── models/
 ├── routes/
 ├── services/
 ├── client/ (React app)
Future improvements

Forgot password flow

Rate limiting

Better error handling

Add tests

Docker setup

Why I built this

Most tutorials stop at login/signup.

I wanted to build something closer to production:

Proper token flow

Session tracking

OTP security
