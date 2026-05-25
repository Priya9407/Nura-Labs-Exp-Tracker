# Startup Experiment Lifecycle Management Platform

A production-grade internal startup experiment tracking system built with Flask, MongoDB, and Redis.

## Overview

This platform replaces Excel-based experiment tracking with a modern, mobile-friendly web application for managing startup experiments through their complete lifecycle.

### Key Features

- **Experiment Lifecycle Management**: Track experiments from IDEA → BUILDING → WAITING_FOR_TEST → USER_TESTING → DECISION_PENDING → FINISHED
- **Timeline & Deadline Management**: Structured deadlines with mandatory reasoning for extensions
- **Observations Feed**: Timeline-based activity journaling for each experiment
- **Final Decisions**: Structured decision-making (ADD, DROP, ITERATE) with accountability
- **Full Audit History**: Every change tracked with reasons and timestamps
- **Role-Based Access**: Admin and Member roles with appropriate permissions
- **Mobile-First Design**: Responsive UI optimized for all devices

## Tech Stack

| Component | Technology |
|-----------|------------|
| Backend | Flask (Python 3.11+) |
| Database | MongoDB |
| Cache/Session | Redis |
| Frontend  HTML/CSS/JavaScript |
| Auth | Session-based (Redis) |
| Email | SMTP |

## Project Structure

```
├── backend/
│   ├── app.py                 # Flask application entry point
│   ├── config/
│   │   ├── __init__.py
│   │   └── settings.py        # Configuration management
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── auth.py           # Authentication routes
│   │   ├── users.py          # User management
│   │   ├── experiments.py    # Experiment CRUD
│   │   ├── phases.py         # Phase management
│   │   ├── observations.py   # Observations feed
│   │   └── decisions.py      # Final decisions
│   ├── middleware/
│   │   ├── __init__.py
│   │   ├── auth.py           # Auth middleware
│   │   ├── roles.py          # Role-based access
│   │   └── rate_limit.py     # Rate limiting
│   ├── services/
│   │   ├── __init__.py
│   │   ├── email.py          # Email service
│   │   ├── redis_service.py  # Redis operations
│   │   └── experiment_service.py
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   └── experiment.py
│   ├── utils/
│   │   ├── __init__.py
│   │   ├── validators.py
│   │   ├── decorators.py
│   │   └── helpers.py
│   └── requirements.txt
├── frontend/
│   ├── index.html            # Dashboard
│   ├── login.html
│   ├── activate.html
│   ├── experiment.html       # Detail page
│   ├── archived.html
│   ├── profile.html
│   ├── styles/
│   │   ├── main.css
│   │   └── components.css
│   └── scripts/
│       ├── api.js
│       ├── auth.js
│       ├── dashboard.js
│       └── experiment.js
├── .env.example
└── README.md
```

## Database Schema

### Users Collection

```javascript
{
  _id: ObjectId,              // MongoDB internal ID (never exposed)
  uuid: String,               // Public identifier (UUID v4)
  name: String,               // Full name
  email: String,              // Email address (unique)
  password_hash: String,      // bcrypt hash
  role: String,               // Enum: "ADMIN" | "MEMBER"
  is_active: Boolean,         // Account status
  created_at: ISODate,
  updated_at: ISODate
}
```

**Roles:**
- `ADMIN`: Can invite users, manage all experiments, override decisions, extend any deadline
- `MEMBER`: Can create experiments, manage own experiments, add observations, submit decisions

### Experiments Collection

```javascript
{
  _id: ObjectId,
  uuid: String,

  // Basic Information
  exp_no: String,             // Experiment number (e.g., "EXP-001")
  title: String,
  domain: String,               // Business domain/area
  owner: String,              // User UUID of owner
  assumption_statement: String,
  target_user: String,

  // Status
  status: String,             // "ACTIVE" | "COMPLETED" | "ARCHIVED" | "CANCELLED"
  current_phase: String,      // "IDEA" | "BUILDING" | "WAITING_FOR_TEST" | "USER_TESTING" | "DECISION_PENDING" | "FINISHED"

  // Timeline
  timeline: {
    build: {
      planned_start: ISODate,
      planned_end: ISODate,
      actual_start: ISODate,
      actual_end: ISODate,
      deadline: ISODate,
      extended_deadline: ISODate,
      extension_count: Number,
      completed_at: ISODate
    },
    testing: {
      planned_start: ISODate,
      planned_end: ISODate,
      actual_start: ISODate,
      actual_end: ISODate,
      deadline: ISODate,
      extended_deadline: ISODate,
      extension_count: Number,
      completed_at: ISODate
    },
    decision: {
      deadline: ISODate,
      extended_deadline: ISODate,
      extension_count: Number,
      completed_at: ISODate
    }
  },

  // Timeline History (audit trail)
  timeline_history: [{
    phase: String,            // Which phase was modified
    field: String,            // Which field changed
    old_value: ISODate,
    new_value: ISODate,
    reason: String,           // Mandatory reason for change
    updated_by: String,       // User UUID
    updated_at: ISODate
  }],

  // Observations Feed
  observations: [{
    uuid: String,
    day_number: Number,       // Day relative to phase start
    phase: String,            // Current phase when observation made
    content: String,
    metrics: Object,          // Flexible quantitative data
    created_by: String,       // User UUID
    created_at: ISODate
  }],

  // Final Decision
  decision: {
    decision: String,         // "ADD" | "DROP" | "ITERATE"
    reason: String,
    submitted_by: String,
    submitted_at: ISODate,
    locked: Boolean,          // Immutable after submission
    overridden_by: String,    // Admin override info
    overridden_at: ISODate
  },

  created_at: ISODate,
  updated_at: ISODate
}
```

## API Routes

### Authentication

| Method | Route | Description | Auth Required |
|--------|-------|-------------|---------------|
| POST | `/api/auth/login` | Login with email/password | No |
| POST | `/api/auth/logout` | Logout current user | Yes |
| GET | `/api/auth/me` | Get current user info | Yes |

**Login Request:**
```json
{
  "email": "user@company.com",
  "password": "secure_password"
}
```

**Login Response:**
```json
{
  "success": true,
  "user": {
    "uuid": "uuid-string",
    "name": "User Name",
    "email": "user@company.com",
    "role": "MEMBER"
  }
}
```

### User Management

| Method | Route | Description | Auth | Role |
|--------|-------|-------------|------|------|
| POST | `/api/users/invite` | Invite new user | Yes | ADMIN |
| POST | `/api/users/activate` | Activate invited account | No | - |
| GET | `/api/users` | List all users | Yes | ADMIN |
| GET | `/api/users/me` | Get current user | Yes | Any |

**Invite Request:**
```json
{
  "email": "newuser@company.com",
  "name": "New User",
  "role": "MEMBER"
}
```

**Activate Request:**
```json
{
  "token": "invitation-token",
  "password": "new_password"
}
```

### Experiments

| Method | Route | Description | Auth | Permissions |
|--------|-------|-------------|------|-------------|
| POST | `/api/experiments` | Create experiment | Yes | Any active user |
| GET | `/api/experiments` | List experiments | Yes | Any |
| GET | `/api/experiments/:uuid` | Get single experiment | Yes | Any |
| PUT | `/api/experiments/:uuid` | Update experiment | Yes | Owner or Admin |
| DELETE | `/api/experiments/:uuid` | Delete experiment | Yes | Owner or Admin |

**Create Experiment Request:**
```json
{
  "title": "New Feature Experiment",
  "domain": "Product",
  "assumption_statement": "Users will engage 20% more with new layout",
  "target_user": "Premium subscribers",
  "timeline": {
    "build": {
      "planned_start": "2026-05-25T00:00:00Z",
      "planned_end": "2026-06-01T00:00:00Z",
      "deadline": "2026-06-01T00:00:00Z"
    },
    "testing": {
      "planned_start": "2026-06-02T00:00:00Z",
      "planned_end": "2026-06-09T00:00:00Z",
      "deadline": "2026-06-09T00:00:00Z"
    },
    "decision": {
      "deadline": "2026-06-10T00:00:00Z"
    }
  }
}
```

### Phase Management

| Method | Route | Description | Auth | Permissions |
|--------|-------|-------------|------|-------------|
| PATCH | `/api/experiments/:uuid/phase` | Advance phase | Yes | Owner or Admin |

**Phase Update Request:**
```json
{
  "phase": "BUILDING",
  "actual_start": "2026-05-25T00:00:00Z"
}
```

### Deadline Extensions

| Method | Route | Description | Auth | Permissions |
|--------|-------|-------------|------|-------------|
| POST | `/api/experiments/:uuid/extend` | Extend deadline | Yes | Owner or Admin |

**Extension Request:**
```json
{
  "phase": "build",           // "build", "testing", or "decision"
  "new_deadline": "2026-06-05T00:00:00Z",
  "reason": "Waiting for API integration to complete"
}
```

### Observations

| Method | Route | Description | Auth | Permissions |
|--------|-------|-------------|------|-------------|
| POST | `/api/experiments/:uuid/observations` | Add observation | Yes | Any |
| GET | `/api/experiments/:uuid/observations` | List observations | Yes | Any |

**Add Observation Request:**
```json
{
  "content": "Users are responding positively to the new onboarding flow",
  "metrics": {
    "completion_rate": 0.75,
    "feedback_score": 4.2
  }
}
```

### Final Decisions

| Method | Route | Description | Auth | Permissions |
|--------|-------|-------------|------|-------------|
| POST | `/api/experiments/:uuid/decision` | Submit decision | Yes | Owner or Admin |
| POST | `/api/experiments/:uuid/decision/override` | Override decision | Yes | ADMIN only |

**Submit Decision Request:**
```json
{
  "decision": "ADD",
  "reason": "Exceeded engagement targets by 25%"
}
```

## Authentication Flow

### Session-Based Authentication (Redis)

1. **Login:**
   - User submits email/password
   - Server validates credentials
   - Creates session in Redis: `session:{session_id}` → user data
   - Sets HTTP-only cookie with session ID
   - Session TTL: 24 hours

2. **Session Validation:**
   - Middleware extracts session ID from cookie
   - Validates against Redis
   - Rejects if expired or invalid

3. **Logout:**
   - Deletes session from Redis
   - Clears cookie

### Invitation Flow

1. Admin creates invitation → Stores in Redis: `invite:{token}` → user data (TTL: 7 days)
2. Email sent with activation link
3. User clicks link, submits password
4. System validates token, creates MongoDB user
5. Redis entry deleted

**Redis Keys:**
- `session:{session_id}` - Active user sessions (TTL: 24h)
- `invite:{token}` - Pending invitations (TTL: 7d)
- `rate_limit:{ip}:{route}` - Rate limiting counters (TTL: varies)

## Middleware

### Auth Middleware
- Validates session from Redis
- Attaches user to request context
- Returns 401 if unauthorized

### Role Middleware
- Checks user role against required role
- Returns 403 if insufficient permissions

### Rate Limit Middleware
- Tracks requests per IP per route
- Configurable limits per endpoint
- Returns 429 if exceeded

**Rate Limits:**
- Auth endpoints: 5 requests/minute
- General API: 100 requests/minute
- Sensitive operations: 10 requests/minute

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { /* response data */ }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable error message"
  }
}
```

## Environment Variables

```bash
# Database
MONGODB_URL=mongodb://localhost:27017/experiment_platform

# Redis
REDIS_URL=redis://localhost:6379/0

# Session
SESSION_SECRET=your-secret-key-min-32-chars

# SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# URLs
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5000

# Environment
FLASK_ENV=development
FLASK_PORT=5000
```

## Ports

| Service | Port |
|---------|------|
| Flask Backend | 5000 |
| Frontend (served by Flask) | 5000 |
| MongoDB | 27017 |
| Redis | 6379 |

## Startup Commands

```bash
# 1. Install dependencies
pip install -r backend/requirements.txt

# 2. Configure environment
cp .env.example .env
# Edit .env with your settings

# 3. Start MongoDB (if not running)
mongod

# 4. Start Redis (if not running)
redis-server

# 5. Run Flask app
python backend/app.py

# 6. Access application
open http://localhost:5000
```

## Design System

- **Colors**: Dark matte backgrounds (#2F3D46, #344955), white text with opacity variations
- **Typography**: Inter font, thin to medium weights, generous spacing
- **Spacing**: Section padding 80-140px, card radius 18-28px
- **Effects**: Glassmorphism (blur 12px), soft shadows, smooth transitions
- **Mobile**: Responsive breakpoints, touch-friendly targets

## Security Features

- bcrypt password hashing
- HTTP-only session cookies
- CSRF protection
- Rate limiting
- Input validation
- No sensitive data in responses
- MongoDB ID never exposed externally
