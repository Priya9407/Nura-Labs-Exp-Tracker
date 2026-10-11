# Nura AI Labs - Experiment Lifecycle Management Platform

A professional experiment lifecycle management system for startups with automatic phase progression, variable testing duration, mandatory daily observations, and **multi-iteration support**.

---

## Quick Start

### Option 1: Docker Compose (Recommended)

```bash
# Build and start all services (MongoDB, Redis, App)
docker-compose up --build

# Or run in background
docker-compose up -d --build

# Stop services
docker-compose down
```

Access the app at **http://localhost:5000**

### Option 2: Manual Development Setup

**Prerequisites:** Python 3.11+, Node.js 18+, MongoDB, Redis

```bash
# Terminal 1 - Backend
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Mac/Linux
pip install -r requirements.txt
python app.py

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev
```

Access the app at **http://localhost:5173**

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Architecture Overview](#architecture-overview)
3. [Experiment vs Iteration](#experiment-vs-iteration)
3. [Workflow & Data Flow](#workflow--data-flow)
4. [Phase System](#phase-system)
5. [Database Schema](#database-schema)
6. [API Endpoints](#api-endpoints)
7. [Installation](#installation)
8. [Usage Guide](#usage-guide)

---

## Core Concept: Linked Experiments

Each experiment is a complete validation cycle. When a user chooses **ITERATE**, a **new experiment** is created with links to the previous attempt.

### Experiment = One Validation Cycle

**Experiment contains:**
- Core idea (title, domain)
- Assumption statement
- Target user
- Complete timeline (build → test → decision)
- Daily observations
- Final decision

### Experiment Links

| Field | Purpose |
|-------|---------|
| `parent_experiment_uuid` | Previous attempt (null if first) |
| `root_experiment_uuid` | Original experiment in chain |
| `iteration_number` | 1, 2, 3... for UI display |

### Decision Behavior

| Decision | Action | Result |
|----------|--------|--------|
| **ADD** | Experiment succeeds | Status: COMPLETED |
| **DROP** | Experiment fails | Status: ARCHIVED |
| **ITERATE** | Try again | Create new experiment, link to current |

### Experiment Chain

```
EXP-001 "AI Onboarding"
├── current_phase: COMPLETED
├── decision: ITERATE
├── parent_uuid: null (first)
└── root_uuid: EXP-001 (self)
    │
    ▼
EXP-002 "AI Onboarding V2"
├── current_phase: COMPLETED
├── decision: ITERATE
├── parent_uuid: EXP-001
├── root_uuid: EXP-001
└── iteration_number: 2
    │
    ▼
EXP-003 "AI Onboarding V3"
├── current_phase: ACTIVE
├── current_phase: TESTING
├── parent_uuid: EXP-002
├── root_uuid: EXP-001
└── iteration_number: 3
```

### Query All Attempts

```javascript
db.experiments
  .find({ root_experiment_uuid: "EXP-001" })
  .sort({ iteration_number: 1 });
```

---

## Architecture Overview

### Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Backend | Flask (Python) |
| Database | MongoDB |
| Cache/Sessions | Redis |
| Authentication | Session-based (Redis) |

### Project Structure

```text
Nura AI Labs/
├── backend/
│   ├── app.py
│   ├── config/
│   │   └── settings.py
│   ├── middleware/
│   │   ├── auth.py
│   │   ├── roles.py
│   │   └── rate_limit.py
│   ├── models/
│   │   ├── user.py
│   │   └── experiment.py
│   ├── routes/
│   │   ├── auth.py
│   │   ├── experiments.py
│   │   ├── users.py
│   │   ├── activity_logs.py
│   │   └── docs.py
│   ├── services/
│   │   ├── activity_log_service.py
│   │   ├── lifecycle_engine.py
│   │   ├── notification_service.py
│   │   ├── redis_service.py
│   │   └── email.py
│   └── utils/
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── ExperimentDetail.jsx
│   │   │   ├── Experiments.jsx
│   │   │   ├── Archived.jsx
│   │   │   ├── Team.jsx
│   │   │   └── Profile.jsx
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   │   └── ActivityFeed.jsx
│   │   │   └── layout/
│   │   ├── api/
│   │   │   ├── experiments.js
│   │   │   └── users.js
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── ThemeContext.jsx
│   │   └── utils/
│   │       └── format.js
│   ├── login.html
│   ├── activate.html
│   └── scripts/
│       └── api.js
└── README.md
```

---

## Workflow & Data Flow

### Complete Experiment Lifecycle (5 Phases)

```text
┌──────────┐      ┌────────────┐      ┌─────────────┐
│   IDEA   │ ──▶ │  BUILDING  │ ───▶ │   TESTING   │
└──────────┘      │  (2 days)  │      │  (N days)   │
                  └────────────┘      └─────────────┘
                                             │
                                             ▼
                                      ┌──────────────┐
                                      │ Observations │
                                      │ (1 per day)  │
                                      └──────────────┘
                                             │
                                             ▼
                                      ┌────────────┐
                                      │  DECISION  │
                                      └────────────┘
                                             │
                                             ▼
                                      ┌───────────┐
                                      │ COMPLETED │
                                      └───────────┘
```

---

**Learnings from both iterations are preserved for future reference.**

### Phase Actions & Transitions

| Phase | Action Buttons | Next Phase |
|-------|---------------|------------|
| IDEA | Start Building | BUILDING |
| BUILDING | Mark as Complete | TESTING |
| TESTING | Submit Observation, Complete Testing | DECISION |
| DECISION | Submit ADD/DROP/ITERATE | COMPLETED |

**Phases simplified from 6 to 5:**
- `WAITING_FOR_TEST` removed (was just state between build complete and testing start)
- `USER_TESTING` merged into `TESTING`
- `DECISION_PENDING` renamed to `DECISION`
- `FINISHED` renamed to `COMPLETED`

---

## Phase System (5 Phases)

Simplified phases: **IDEA → BUILDING → TESTING → DECISION → COMPLETED**

### Phase 1: IDEA

**State:**
```json
{
  "current_phase": "IDEA",
  "timeline": null,
  "observations": []
}
```

**UI Actions:**
- `[Start Building]` - Primary button
  - Generates 2-day build timeline
  - Sets deadline = now + 2 days

**Database Changes:**
```javascript
db.experiments.updateOne(
  {"uuid": "exp-uuid"},
  {"$set": {
    "current_phase": "BUILDING",
    "timeline.build": {
      "actual_start": "2025-01-20T10:00:00Z",
      "actual_end": null,
      "deadline": "2025-01-22T10:00:00Z",
      "extended_deadline": null,
      "extension_count": 0,
      "is_completed": false
    }
  }}
)
```

---

### Phase 2: BUILDING (Fixed 2 Days)

**State:**
```json
{
  "current_phase": "BUILDING",
  "timeline": {
    "build": {
      "actual_start": "2025-01-20T10:00:00Z",
      "actual_end": null,
      "deadline": "2025-01-22T10:00:00Z",
      "is_completed": false
    },
    "testing": null,
    "decision": null
  }
}
```

**UI Actions:**

| Condition | Primary Button | Secondary Button |
|-----------|----------------|------------------|
| On time | `[Mark Complete]` | `[Request Extension]` |
| Overdue | `[Mark Complete]` ⚠️ | `[Request Extension]` |

**Database Changes:**
```javascript
db.experiments.updateOne(
  {"uuid": "exp-uuid"},
  {"$set": {
    "current_phase": "TESTING",
    "timeline.build.actual_end": "2025-01-21T15:00:00Z",
    "timeline.build.is_completed": true
  }}
)
```

---

### Phase 3: TESTING

**State:**
```json
{
  "current_phase": "TESTING",
  "timeline": {
    "build": {
      "actual_end": "2025-01-21T15:00:00Z",
      "is_completed": true
    },
    "testing": {
      "actual_start": "2025-01-21T15:30:00Z",
      "actual_end": null,
      "deadline": "2025-01-25T15:30:00Z",
      "duration_days": 4,
      "is_completed": false
    }
  },
  "observations": []
}
```

**Observation Status (Computed Dynamically):**
| Day | Status | Can Submit? |
|-----|--------|-------------|
| 1 | ✓ Complete | No |
| 2 | ⚠️ Overdue | Yes |
| 3 | ● Current | Yes |
| 4 | 🔒 Locked | No |

**Rules:**
- `is_submitted` → day_number exists in observations array
- `is_current` → today matches day date
- `is_overdue` → day passed without submission (can still submit)
- `is_locked` → future day

**Starting Testing:**
```javascript
db.experiments.updateOne(
  {"uuid": "exp-uuid"},
  {"$set": {
    "current_phase": "TESTING",
    "timeline.testing": {
      "actual_start": "2025-01-21T15:30:00Z",
      "actual_end": null,
      "deadline": "2025-01-25T15:30:00Z",
      "duration_days": 4,
      "is_completed": false
    }
  }}
)
```

**Submitting Observation:**
```javascript
db.experiments.updateOne(
  {"uuid": "exp-uuid"},
  {"$push": {
    "observations": {
      "day_number": 1,
      "content": "Users found onboarding confusing...",
      "created_at": "2025-01-21T16:00:00Z"
    }
  }}
)
```

---

### Phase 4: DECISION

**State:**
```json
{
  "current_phase": "DECISION",
  "timeline": {
    "testing": {
      "actual_end": "2025-01-25T18:00:00Z",
      "is_completed": true
    }
  },
  "observations": [
    {"day_number": 1, "content": "..."},
    {"day_number": 2, "content": "..."},
    {"day_number": 3, "content": "..."},
    {"day_number": 4, "content": "..."}
  ]
}
```

**UI Actions:**
- `[Submit Decision]` - Opens modal
  - Options: ADD, DROP, ITERATE
  - Required: Reason (20+ chars)

**Database Changes:**

**If ADD or DROP:**
```javascript
db.experiments.updateOne(
  {"uuid": "exp-uuid"},
  {"$set": {
    "current_phase": "COMPLETED",
    "status": "COMPLETED",
    "decision": {
      "decision": "ADD",
      "reason": "Positive user feedback...",
      "submitted_at": "2025-01-26T10:00:00Z"
    }
  }}
)
```

**If ITERATE:**
```javascript
// 1. Mark current complete
db.experiments.updateOne(
  {"uuid": "exp-001"},
  {"$set": {
    "current_phase": "COMPLETED",
    "status": "COMPLETED",
    "decision": {...}
  }}
)

// 2. Create new experiment
db.experiments.insertOne({
  "uuid": "exp-002",
  "exp_no": "EXP-002",
  "parent_experiment_uuid": "exp-001",
  "root_experiment_uuid": "exp-001",
  "iteration_number": 2,
  "title": "AI Onboarding",
  "current_phase": "IDEA",
  "status": "ACTIVE"
})
```

---

### Phase 5: COMPLETED

**State:**
```json
{
  "current_phase": "COMPLETED",
  "status": "COMPLETED",
  "decision": {
    "decision": "ADD",
    "reason": "Positive user feedback...",
    "submitted_at": "2025-01-26T10:00:00Z"
  }
}
```

**UI:** Read-only view of all data

---

## Database Setup & Management

### MongoDB Installation

#### Option 1: Local MongoDB

**Windows:**
```bash
# Install via Chocolatey
choco install mongodb

# Start MongoDB
net start MongoDB
```

**Mac:**
```bash
# Install via Homebrew
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community
```

**Linux:**
```bash
# Ubuntu/Debian
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
```

#### Option 2: MongoDB Atlas (Cloud)

1. Sign up at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create a free cluster
3. Get your connection string:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/experiment_platform
   ```

### Database Initialization

**Create Database & Collections:**
```javascript
// Connect to MongoDB
mongo

// Create database
use experiment_platform

// Create collections (optional - MongoDB creates them automatically)
db.createCollection("users")
db.createCollection("experiments")
db.createCollection("activity_logs")
db.createCollection("email_logs")

// Create indexes for better performance
db.users.createIndex({ "uuid": 1 }, { unique: true })
db.users.createIndex({ "email": 1 }, { unique: true })
db.experiments.createIndex({ "uuid": 1 }, { unique: true })
db.experiments.createIndex({ "owner": 1 })
db.experiments.createIndex({ "status": 1 })
db.experiments.createIndex({ "root_experiment_uuid": 1 })  // For finding related experiments
db.activity_logs.createIndex({ "experiment_uuid": 1 })
db.activity_logs.createIndex({ "created_at": -1 })
```

### Database Seeding

**Create Default Admin User:**
```javascript
// In MongoDB shell or MongoDB Compass
db.users.insertOne({
  uuid: "admin-uuid-001",
  email: "admin@example.com",
  name: "Admin User",
  role: "ADMIN",
  status: "active",
  password_hash: "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYA.qGZvKG6G",  // "password123"
  activation_token: null,
  created_at: new Date(),
  updated_at: new Date()
})
```

**Python Seeding Script:**
```python
# backend/seed_db.py
from pymongo import MongoClient
from datetime import datetime, timezone
import os

MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/experiment_platform')

client = MongoClient(MONGODB_URI)
db = client.get_default_database()

# Seed data
def seed_database():
    # Clear existing data (optional)
    db.users.delete_many({})
    db.experiments.delete_many({})
    # Create indexes
    db.users.create_index("uuid", unique=True)
    db.users.create_index("email", unique=True)
    db.experiments.create_index("uuid", unique=True)
    db.experiments.create_index("root_experiment_uuid")  # For finding related experiments
    
    print("Database seeded successfully!")

if __name__ == "__main__":
    seed_database()
```

Run: `python backend/seed_db.py`

### Database Backup & Restore

**Backup:**
```bash
# Local MongoDB
mongodump --db experiment_platform --out ./backups/$(date +%Y%m%d)

# MongoDB Atlas
mongodump --uri="mongodb+srv://user:pass@cluster.mongodb.net/experiment_platform" --out ./backups/$(date +%Y%m%d)
```

**Restore:**
```bash
# Local MongoDB
mongorestore --db experiment_platform ./backups/20250601/experiment_platform

# MongoDB Atlas
mongorestore --uri="mongodb+srv://user:pass@cluster.mongodb.net" --db experiment_platform ./backups/20250601/experiment_platform
```

### Database Monitoring

```bash
# Check MongoDB status
mongo --eval "db.serverStatus()"

# Check database stats
mongo --eval "db.stats()"

# List collections
mongo --eval "show collections"
```

---

## Redis Setup (Session Store)

### Install Redis

**Docker (Recommended):**
```bash
docker run -d --name redis -p 6379:6379 redis:alpine
```

**Windows:**
```bash
# Via Chocolatey
choco install redis-64

# Start Redis
redis-server
```

**Mac:**
```bash
brew install redis
brew services start redis
```

**Linux:**
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

### Verify Redis Connection

```bash
redis-cli ping
# Should return: PONG
```

---

## Database Schema

### Collections Overview

| Collection | Description | Key Fields |
|------------|-------------|------------|
| `users` | User accounts | `uuid`, `email`, `role`, `is_active` |
| `experiments` | Full experiment data with embedded timeline & observations (source of truth) | `uuid`, `exp_no`, `status`, `root_experiment_uuid` |
| `activity_logs` | **Audit trail only** - historical events, not source of truth | `uuid`, `experiment_uuid`, `activity_type`, `user_uuid` |
| `notifications` | User notifications | `user_uuid`, `type`, `is_read` |

**Architecture:** Single `experiments` collection with embedded timeline and observations. Each retry creates a **new experiment** linked via `parent_experiment_uuid` → `root_experiment_uuid`. This design:
- Simpler queries (no joins)
- Single mental model (experiments only)
- Activity logs are audit trail only (not used for state reconstruction)
- Easy to view "all attempts of this idea"

**Important:** The `experiments` collection is the **source of truth** for current state. The `activity_logs` collection is **read-only audit trail** that answers "what happened and when?" but should never be used to reconstruct experiment state. This prevents synchronization issues and unnecessary complexity.

### Experiments Collection (Complete Lifecycle)

Each experiment contains its full lifecycle data. When a user chooses ITERATE, a **new experiment** is created with links to the previous.

```javascript
{
  // Identity
  "uuid": "string (unique)",
  "exp_no": "string (e.g., EXP-003)",
  "title": "string",
  "domain": "string",
  "owner": "user_uuid",

  // Links (for tracking retries)
  "parent_experiment_uuid": "string | null", // Previous attempt (parent)
  "root_experiment_uuid": "string",           // Original/first attempt
  "iteration_number": 1,                       // 1, 2, 3... for UI
  "created_from_decision": "ITERATE | null", // How this experiment was created

  // Core Content
  "assumption_statement": "string",
  "target_user": "string",

  // Status
  "status": "ACTIVE | COMPLETED | CANCELLED | ARCHIVED",
  "current_phase": "IDEA | BUILDING | TESTING | DECISION | COMPLETED",  // Workflow phase

  // Timeline (inline)
  "timeline": {
    "build": {
      "actual_start": "ISO timestamp | null",
      "actual_end": "ISO timestamp | null",
      "deadline": "ISO timestamp | null",
      "extended_deadline": "ISO timestamp | null",
      "extension_count": 0,
      "is_completed": false
    },
    "testing": {
      "actual_start": "ISO timestamp | null",
      "actual_end": "ISO timestamp | null",
      "deadline": "ISO timestamp | null",
      "duration_days": 4,
      "extended_deadline": "ISO timestamp | null",
      "extension_count": 0,
      "is_completed": false
    },
    "decision": {
      "deadline": "ISO timestamp | null",
      "extended_deadline": "ISO timestamp | null"
    }
  },

  // Observations (only actual submissions)
  "observations": [
    {
      "day_number": 1,
      "content": "string",
      "created_at": "ISO timestamp"
    }
  ],

  // Final Decision
  "decision": {
    "decision": "ADD | DROP | ITERATE | null",
    "reason": "string | null",
    "submitted_at": "ISO timestamp | null"
  },

  "created_at": "ISO timestamp",
  "updated_at": "ISO timestamp"
}
```

### Query: Find Related Experiments

To view all attempts of the same idea:

```javascript
// All experiments in this "family"
db.experiments.find({
  "root_experiment_uuid": "EXP-001"
}).sort("iteration_number", 1)
```

### Users Collection

```javascript
{
  "uuid": "string (unique)",
  "name": "string",
  "email": "string (unique)",
  "password_hash": "string",
  "role": "ADMIN | MEMBER",
  "is_active": true,
  "created_at": "ISO timestamp"
}
```

---

## API Endpoints

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Get current user |

### Users

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/users/invite` | Admin | Invite user |
| POST | `/api/users/activate` | No | Activate account |
| GET | `/api/users` | Admin | List users |
| GET | `/api/users/me` | Yes | Get current user profile |
| PUT | `/api/users/me` | Yes | Update current user |
| POST | `/api/users/<uuid>/blacklist` | Admin | Blacklist user |
| POST | `/api/users/<uuid>/unblacklist` | Admin | Unblacklist user |

### Experiments

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/experiments` | Yes | List experiments |
| POST | `/api/experiments` | Yes | Create new experiment |
| GET | `/api/experiments/<uuid>` | Yes | Get experiment details |
| GET | `/api/experiments/<uuid>/activities` | Yes | Get activity timeline |
| GET | `/api/experiments?root_uuid=<uuid>` | Yes | List all attempts of same idea |

### Experiment Actions (Phase Transitions)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/experiments/<uuid>/start-build` | Yes | IDEA → BUILDING |
| POST | `/api/experiments/<uuid>/complete-build` | Yes | BUILDING → TESTING |
| POST | `/api/experiments/<uuid>/start-testing` | Yes | Start testing (with duration) |
| POST | `/api/experiments/<uuid>/schedule-testing` | Yes | Schedule testing for future date |
| POST | `/api/experiments/<uuid>/edit-testing-schedule` | Yes | Edit scheduled testing date |
| POST | `/api/experiments/<uuid>/complete-testing` | Yes | Complete testing phase |
| POST | `/api/experiments/<uuid>/extend` | Yes | Extend deadline (build or testing) |
| POST | `/api/experiments/<uuid>/submit-decision` | Yes | Submit ADD/DROP/ITERATE |
| POST | `/api/experiments/<uuid>/cancel` | Yes | Cancel experiment |

### Observations

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/experiments/<uuid>/observations/schedule` | Yes | Get observation schedule |
| POST | `/api/experiments/<uuid>/observations` | Yes | Add/edit observation |
| GET | `/api/experiments/<uuid>/observations` | Yes | List observations |

### Activity Logs

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/experiments/<uuid>/activities` | Yes | Get activity log for experiment |
| GET | `/api/experiments/<uuid>/activities/timeline` | Yes | Get chronological timeline |
| GET | `/api/activities/recent` | Admin | Get recent activities across all experiments |

### Notifications

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/notifications` | Yes | Get user notifications |
| PUT | `/api/notifications/<id>/read` | Yes | Mark notification as read |
| PUT | `/api/notifications/read-all` | Yes | Mark all notifications as read |

---

## Installation

### Prerequisites

- Python 3.11+
- Node.js 18+
- MongoDB
- Redis

---

## Quick Start with Docker (Recommended)

The fastest way to get started is using Docker Compose. This runs the entire stack (app, MongoDB, Redis) with one command.

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

### Running with Docker Compose

```bash
# Clone/navigate to project
cd Nura-Experiments

# Build and start all services
docker-compose up --build

# Or run in detached mode (background)
docker-compose up -d --build
```

**Access the application:**
- **App**: http://localhost:5000
- **MongoDB**: localhost:27017
- **Redis**: localhost:6379

### Docker Commands

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down

# Stop and remove volumes (clears database data)
docker-compose down -v

# Rebuild after code changes
docker-compose up --build
```

### Docker Environment Variables

Create a `.env` file in the project root (optional):

```env
SESSION_SECRET=your-secret-key-here
ADMIN_EMAIL=admin@example.com
ADMIN_NAME=Admin User
ADMIN_PASSWORD=secure-password
SMTP_EMAIL=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FRONTEND_URL=http://localhost:5000
BACKEND_URL=http://localhost:5000
```

Or set them inline when running:

```bash
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=pass123 docker-compose up -d
```

---

## Manual Installation (Development)

If you prefer to run without Docker:

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create .env
cp .env.example .env
# Edit .env with your settings

# Run
python app.py
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Environment Variables

```env
MONGODB_URL=mongodb://localhost:27017/nura_labs
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=your-secret-key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FRONTEND_URL=http://localhost:5173
FLASK_PORT=5000
FLASK_ENV=development
```

---

## Usage Guide

### Creating an Experiment

1. Click "New Experiment"
2. Fill: Title, Domain, Assumption, Target User
3. Click Create → **IDEA phase**

### Starting Build

1. Click "Start Building"
2. 2-day timeline generated automatically
3. See days remaining
4. **Must complete before deadline**

### Completing Build

1. Click "Mark Complete" when done
2. Build phase complete
3. Ready to start testing

### Starting Testing

1. Click "Start Testing"
2. Enter duration: 1-14 days
3. Generates testing timeline and observation schedule
4. Phase changes to **TESTING**

### Submitting Observations

1. Observation tab visible
2. Current day shows "Submit" button
3. Submit content (min 5 chars)
4. Day marked complete
5. Next day unlocks
6. **Missed days show RED** (but can still submit)

### Completing Testing

1. All observations done OR time passed
2. Click "Complete Testing"
3. Phase changes to **DECISION**
4. Observation tab read-only

### Submitting Decision

1. Click "Submit Decision" (calls `/api/experiments/{id}/submit-decision`)
2. Choose: ADD, DROP, ITERATE
3. Provide reason (20+ chars)

**If ADD or DROP:**
- Status: **COMPLETED**
- Experiment finished

**If ITERATE:**
- Current experiment: **COMPLETED**
- New experiment created: **EXP-002**
- Iteration number: 2
- New experiment starts at **IDEA** phase

---

## Key Features

1. **Automatic Phase Management** - Actions drive phase changes, no manual selection
2. **Variable Testing Duration** - User defines 1-14 days
3. **Mandatory Daily Observations** - Sequential unlocking, overdue tracking
4. **Overdue Handling** - Visual warnings, extension options
5. **Timeline Extensions** - With reason, auto-shifts future phases

---

## License

MIT License - Nura AI Labs 2025
