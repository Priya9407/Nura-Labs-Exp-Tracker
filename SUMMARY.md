# Nura AI Labs - Complete Application Data Flow

This document traces the complete data flow through the application, from login through all user actions, showing exactly what endpoints are called, what data changes occur, and the resulting state.

---

## Table of Contents

1. [Authentication Flow](#1-authentication-flow)
2. [Dashboard & Experiment List](#2-dashboard--experiment-list)
3. [Creating an Experiment](#3-creating-an-experiment)
4. [Phase 1: IDEA → BUILDING](#4-phase-1-idea--building)
5. [Phase 2: BUILDING → WAITING_FOR_TEST](#5-phase-2-building--waiting_for_test)
6. [Phase 3: WAITING_FOR_TEST → USER_TESTING](#6-phase-3-waiting_for_test--user_testing)
7. [Phase 4: USER_TESTING (Observations)](#7-phase-4-user_testing-observations)
8. [Phase 5: USER_TESTING → DECISION_PENDING](#8-phase-5-user_testing--decision_pending)
9. [Phase 6: DECISION_PENDING → FINISHED](#9-phase-6-decision_pending--finished)
10. [Decision: ITERATE (New Iteration)](#10-decision-iterate-new-iteration)
11. [Viewing Experiment History](#11-viewing-experiment-history)
12. [Data Models Summary](#12-data-models-summary)

---

## 1. Authentication Flow

### Step 1: Login Screen
**User Action:** Enters email and password, clicks Login

**Frontend:**
```javascript
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Backend Processing:**
1. Lookup user by email in `users` collection
2. Verify bcrypt password hash
3. Create session in Redis: `session:<session_id>` → user_uuid
4. Set session cookie: `session=<session_id>; HttpOnly; Secure`

**Response:**
```json
{
  "success": true,
  "user": {
    "uuid": "usr-abc-123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "MEMBER"
  }
}
```

**Result State:**
- User is authenticated
- Session stored in Redis (TTL: 24 hours)
- Cookie sent to browser
- Frontend redirects to `/dashboard`

---

## 2. Dashboard & Experiment List

### Step 1: Dashboard Loads
**User Action:** Navigates to `/dashboard`

**Frontend Requests:**
```javascript
// Parallel requests
GET /api/experiments                    // List experiments
GET /api/auth/me                      // Verify session
GET /api/experiments/{uuid}/activities // For each visible experiment
```

### Step 2: Load Experiments
**Backend Processing:**
```python
# Query experiments collection
experiments.find({"owner": current_user_uuid})
  .sort("created_at", -1)
  .limit(20)

# For each experiment, get current iteration
for exp in experiments:
    iteration = experiment_iterations.find_one({
        "experiment_uuid": exp["uuid"],
        "uuid": exp["current_iteration_uuid"]
    })
```

**Response:**
```json
{
  "success": true,
  "experiments": [
    {
      "uuid": "exp-uuid-001",
      "exp_no": "EXP-001",
      "title": "New Feature Test",
      "status": "ACTIVE",
      "current_iteration_no": 1,
      "current_phase": "USER_TESTING",
      "created_at": "2025-01-15T10:00:00Z"
    }
  ]
}
```

### Step 3: Load Activity Feed
**Backend Processing:**
```python
activity_logs.find({
    "experiment_uuid": {"$in": [exp1_uuid, exp2_uuid, ...]}
}).sort("created_at", -1).limit(50)
```

**Response:**
```json
{
  "activities": [
    {
      "activity_type": "phase_changed",
      "description": "moved from BUILDING to WAITING_FOR_TEST",
      "timestamp": "2025-01-17T14:00:00Z",
      "user_name": "John Doe"
    }
  ]
}
```

---

## 3. Creating an Experiment

### Step 1: User Fills Form
**User Action:** Clicks "New Experiment", fills form, submits

**Frontend:**
```javascript
POST /api/experiments
{
  "title": "New Feature Onboarding",
  "domain": "Product",
  "assumption_statement": "Users want better onboarding",
  "target_user": "New signups"
}
```

### Step 2: Backend Creates Experiment
**Database Operations:**

**A. Create Experiment Document:**
```javascript
// experiments collection
{
  "uuid": "exp-uuid-789",
  "exp_no": "EXP-004",           // Auto-generated
  "title": "New Feature Onboarding",
  "domain": "Product",
  "owner": "usr-abc-123",        // Current user
  "assumption_statement": "Users want better onboarding",
  "target_user": "New signups",
  "status": "ACTIVE",
  "current_iteration_uuid": "itr-uuid-001",  // Will be set after B
  "current_iteration_no": 1,
  "iteration_count": 1,
  "created_at": "2025-01-20T10:00:00Z",
  "updated_at": "2025-01-20T10:00:00Z"
}
```

**B. Create Initial Iteration:**
```javascript
// experiment_iterations collection
{
  "uuid": "itr-uuid-001",
  "experiment_uuid": "exp-uuid-789",
  "iteration_no": 1,
  "status": "ACTIVE",
  "current_phase": "IDEA",
  "timeline": null,              // No timeline yet
  "observation_schedule": [],
  "observations": [],
  "timeline_history": [],
  "created_at": "2025-01-20T10:00:00Z",
  "updated_at": "2025-01-20T10:00:00Z"
}
```

**C. Update Experiment with Iteration UUID:**
```javascript
experiments.updateOne(
    {"uuid": "exp-uuid-789"},
    {"$set": {"current_iteration_uuid": "itr-uuid-001"}}
)
```

**D. Log Activity:**
```javascript
activity_logs.insertOne({
    "uuid": "act-uuid-001",
    "experiment_uuid": "exp-uuid-789",
    "iteration_no": 1,
    "activity_type": "experiment_created",
    "details": {"title": "New Feature Onboarding"},
    "user_uuid": "usr-abc-123",
    "created_at": "2025-01-20T10:00:00Z"
})
```

### Step 3: Response
```json
{
  "success": true,
  "experiment": {
    "uuid": "exp-uuid-789",
    "exp_no": "EXP-004",
    "title": "New Feature Onboarding",
    "current_phase": "IDEA",
    "current_iteration": 1
  }
}
```

**Result State:**
- Experiment exists with IDEA phase
- No timeline generated yet
- User sees "Start Building" button

---

## 4. Phase 1: IDEA → BUILDING

### Step 1: User Clicks "Start Building"
**User Action:** Clicks "Start Building" button on experiment detail page

**Frontend:**
```javascript
POST /api/iterations/{iteration_uuid}/start-build
```

### Step 2: Backend Generates Timeline
**Database Changes:**

**Update Iteration:**
```javascript
experiment_iterations.updateOne(
    {"uuid": "itr-uuid-001"},
    {"$set": {
        "current_phase": "BUILDING",
        "timeline": {
            "build": {
                "actual_start": "2025-01-20T10:30:00Z",
                "actual_end": null,
                "deadline": "2025-01-22T10:30:00Z",  // +2 days fixed
                "extended_deadline": null,
                "extension_count": 0,
                "is_completed": false
            },
            "testing": null,
            "decision": null
        },
        "updated_at": "2025-01-20T10:30:00Z"
    }}
)
```

**Log Activity:**
```javascript
activity_logs.insertOne({
    "activity_type": "phase_changed",
    "details": {
        "from": "IDEA",
        "to": "BUILDING",
        "timeline_start": "2025-01-20T10:30:00Z"
    }
})
```

### Step 3: Response & UI Update
```json
{
  "success": true,
  "iteration": {
    "current_phase": "BUILDING",
    "timeline": {
      "build": {
        "deadline": "2025-01-22T10:30:00Z",
        "days_remaining": 2
      }
    }
  }
}
```

**Result State:**
- Phase: BUILDING
- Build deadline: 2 days from now
- UI shows: Progress bar, days remaining, "Mark as Complete" button

---

## 5. Phase 2: BUILDING → WAITING_FOR_TEST

### Step 1: User Completes Build
**User Action:** Clicks "Mark as Complete"

**Frontend:**
```javascript
POST /api/iterations/{iteration_uuid}/complete-build
```

### Step 2: Backend Updates Timeline
**Database Changes:**

**Update Iteration:**
```javascript
experiment_iterations.updateOne(
    {"uuid": "itr-uuid-001"},
    {"$set": {
        "current_phase": "WAITING_FOR_TEST",
        "timeline.build.actual_end": "2025-01-21T15:00:00Z",
        "timeline.build.is_completed": true,
        "updated_at": "2025-01-21T15:00:00Z"
    }}
)
```

**Log Activity:**
```javascript
activity_logs.insertOne({
    "activity_type": "phase_changed",
    "details": {
        "from": "BUILDING",
        "to": "WAITING_FOR_TEST"
    }
})
```

**Result State:**
- Phase: WAITING_FOR_TEST
- Build marked complete
- UI shows: "Start Testing" button (no timeline for testing yet)

---

## 6. Phase 3: WAITING_FOR_TEST → USER_TESTING

### Step 1: User Starts Testing
**User Action:** Clicks "Start Testing", enters duration (e.g., 4 days)

**Frontend:**
```javascript
POST /api/iterations/{iteration_uuid}/start-testing
{
  "duration_days": 4
}
```

### Step 2: Backend Generates Testing Timeline
**Calculations:**
```python
now = "2025-01-21T15:30:00Z"
testing_start = now
testing_end = now + 4 days = "2025-01-25T15:30:00Z"
decision_deadline = testing_end + 1 day = "2025-01-26T15:30:00Z"

# Generate observation schedule
observation_schedule = [
    {"day_number": 1, "date": "2025-01-21T15:30:00Z"},
    {"day_number": 2, "date": "2025-01-22T15:30:00Z"},
    {"day_number": 3, "date": "2025-01-23T15:30:00Z"},
    {"day_number": 4, "date": "2025-01-24T15:30:00Z"}
]
```

**Database Changes:**

**Update Iteration:**
```javascript
experiment_iterations.updateOne(
    {"uuid": "itr-uuid-001"},
    {"$set": {
        "current_phase": "USER_TESTING",
        "timeline.testing": {
            "actual_start": "2025-01-21T15:30:00Z",
            "actual_end": null,
            "deadline": "2025-01-25T15:30:00Z",
            "duration_days": 4,
            "extended_deadline": null,
            "extension_count": 0,
            "is_completed": false
        },
        "timeline.decision": {
            "deadline": "2025-01-26T15:30:00Z",
            "extended_deadline": null
        },
        "observation_schedule": [
            {"day_number": 1, "date": "2025-01-21T15:30:00Z"},
            {"day_number": 2, "date": "2025-01-22T15:30:00Z"},
            {"day_number": 3, "date": "2025-01-23T15:30:00Z"},
            {"day_number": 4, "date": "2025-01-24T15:30:00Z"}
        ],
        "updated_at": "2025-01-21T15:30:00Z"
    }}
)
```

**Log Activity:**
```javascript
activity_logs.insertOne({
    "activity_type": "testing_started",
    "details": {
        "duration_days": 4,
        "start": "2025-01-21T15:30:00Z",
        "end": "2025-01-25T15:30:00Z"
    }
})
```

**Result State:**
- Phase: USER_TESTING
- Testing deadline: 4 days from now
- Observation schedule: Days 1-4 with dates
- UI shows: Observation tab with Day 1 unlocked (current day)

---

## 7. Phase 4: USER_TESTING (Observations)

### Step 1: User Submits Observation
**User Action:** Day 1, clicks "Submit Observation", enters content

**Frontend:**
```javascript
POST /api/experiments/{exp_uuid}/observations
{
  "day_number": 1,
  "content": "Users found the onboarding confusing. Need clearer instructions."
}
```

### Step 2: Backend Stores Observation
**Database Changes:**

**Add Observation to Iteration:**
```javascript
experiment_iterations.updateOne(
    {"uuid": "itr-uuid-001"},
    {"$push": {
        "observations": {
            "uuid": "obs-uuid-001",
            "day_number": 1,
            "content": "Users found the onboarding confusing...",
            "metrics": {},
            "created_by": "usr-abc-123",
            "created_at": "2025-01-21T16:00:00Z"
        }
    }}
)
```

**Log Activity:**
```javascript
activity_logs.insertOne({
    "activity_type": "observation_submitted",
    "details": {"day_number": 1}
})
```

### Step 3: Observation Status Calculation
**Computed on Read:**
```javascript
// For each day in observation_schedule:
function getDayStatus(day) {
    const today = new Date(); // 2025-01-21
    const dayDate = new Date(day.date);
    
    const isSubmitted = iteration.observations.some(o => o.day_number === day.day_number);
    const isCurrent = dayDate.toDateString() === today.toDateString();
    const isOverdue = dayDate < today && !isSubmitted;
    const isLocked = dayDate > today;
    
    return { isSubmitted, isCurrent, isOverdue, isLocked };
}
```

**Result State (After Day 1):**
- Day 1: ✓ Complete (cannot submit again)
- Day 2: ● Current (submit button available)
- Day 3: 🔒 Locked
- Day 4: 🔒 Locked

### Step 4: Day 2 - Missed (Overdue)
**Scenario:** User forgets to submit Day 2 observation

**Next Day (2025-01-22):**
- Day 2 becomes ⚠️ Overdue (RED warning)
- **But can still submit** (flexible mode)

**User Submits Day 2 (late):**
```javascript
POST /api/experiments/{exp_uuid}/observations
{
  "day_number": 2,
  "content": "Day 2 observation submitted late..."
}
```

**Result State:**
- Day 1: ✓ Complete
- Day 2: ✓ Complete (submitted, was overdue)
- Day 3: ● Current (now unlocked)
- Day 4: 🔒 Locked

---

## 8. Phase 5: USER_TESTING → DECISION_PENDING

### Step 1: User Completes Testing
**User Action:** All 4 observations submitted, clicks "Complete Testing"

**Frontend:**
```javascript
POST /api/iterations/{iteration_uuid}/complete-testing
```

### Step 2: Backend Updates Phase
**Database Changes:**

**Update Iteration:**
```javascript
experiment_iterations.updateOne(
    {"uuid": "itr-uuid-001"},
    {"$set": {
        "current_phase": "DECISION_PENDING",
        "timeline.testing.actual_end": "2025-01-25T18:00:00Z",
        "timeline.testing.is_completed": true,
        "updated_at": "2025-01-25T18:00:00Z"
    }}
)
```

**Log Activity:**
```javascript
activity_logs.insertOne({
    "activity_type": "phase_changed",
    "details": {
        "from": "USER_TESTING",
        "to": "DECISION_PENDING",
        "observations_submitted": 4
    }
})
```

**Result State:**
- Phase: DECISION_PENDING
- Observations tab becomes read-only
- UI shows: "Submit Decision" button

---

## 9. Phase 6: DECISION_PENDING → FINISHED

### Step 1: User Submits Decision
**User Action:** Clicks "Submit Decision", selects ADD/DROP/ITERATE, enters reason

**Frontend:**
```javascript
POST /api/iterations/{iteration_uuid}/decision
{
  "decision": "ITERATE",  // or "ADD" or "DROP"
  "reason": "Need more testing time to validate hypothesis with larger user sample"
}
```

### Step 2: Backend Processes Decision

**A. Update Iteration:**
```javascript
experiment_iterations.updateOne(
    {"uuid": "itr-uuid-001"},
    {"$set": {
        "current_phase": "FINISHED",
        "status": "COMPLETED",
        "decision": {
            "decision": "ITERATE",
            "reason": "Need more testing time...",
            "submitted_by": "usr-abc-123",
            "submitted_at": "2025-01-26T10:00:00Z"
        },
        "updated_at": "2025-01-26T10:00:00Z"
    }}
)
```

**B. Log Activity:**
```javascript
activity_logs.insertOne({
    "activity_type": "decision_submitted",
    "details": {
        "decision": "ITERATE",
        "reason": "Need more testing time..."
    }
})
```

### Step 3: Decision-Based Actions

**If Decision = ADD or DROP:**
```javascript
// Update experiment status
experiments.updateOne(
    {"uuid": "exp-uuid-789"},
    {"$set": {
        "status": "COMPLETED",  // or "ARCHIVED" for DROP
        "updated_at": "2025-01-26T10:00:00Z"
    }}
)
```

**If Decision = ITERATE:**
See Section 10 below

**Result State (ITERATE):**
- Iteration 1: FINISHED, decision = ITERATE
- New iteration (2) will be created
- User continues with fresh validation cycle

---

## 10. Decision: ITERATE (New Iteration)

### Step 1: Backend Creates New Iteration
**Database Operations:**

**A. Create Iteration 2:**
```javascript
// experiment_iterations collection
{
  "uuid": "itr-uuid-002",           // NEW UUID
  "experiment_uuid": "exp-uuid-789",
  "iteration_no": 2,               // Incremented
  "status": "ACTIVE",
  "current_phase": "IDEA",
  "timeline": null,
  "observation_schedule": [],
  "observations": [],
  "timeline_history": [],
  "previous_iteration_summary": {   // Optional: reference to prev
    "iteration_no": 1,
    "decision": "ITERATE",
    "reason": "Need more testing time..."
  },
  "created_at": "2025-01-26T10:05:00Z",
  "updated_at": "2025-01-26T10:05:00Z"
}
```

**B. Update Experiment:**
```javascript
experiments.updateOne(
    {"uuid": "exp-uuid-789"},
    {"$set": {
        "current_iteration_uuid": "itr-uuid-002",
        "current_iteration_no": 2,
        "iteration_count": 2,
        // Add summary of completed iteration
        "experiment_history": [
            {
                "iteration_no": 1,
                "decision": "ITERATE",
                "decision_reason": "Need more testing time...",
                "submitted_at": "2025-01-26T10:00:00Z",
                "observations_count": 4
            }
        ],
        "updated_at": "2025-01-26T10:05:00Z"
    }}
)
```

**C. Log Activity:**
```javascript
activity_logs.insertOne({
    "activity_type": "iteration_created",
    "details": {
        "from_iteration": 1,
        "decision": "ITERATE",
        "iteration_no": 2
    }
})
```

### Step 2: Response
```json
{
  "success": true,
  "experiment": {
    "uuid": "exp-uuid-789",
    "current_iteration_no": 2,
    "current_phase": "IDEA"
  },
  "previous_iteration": {
    "iteration_no": 1,
    "decision": "ITERATE"
  }
}
```

**Result State:**
- Iteration 1: Preserved as COMPLETED with ITERATE decision
- Iteration 2: New IDEA phase, ready to start
- User sees: "Start Building" button again for new iteration

---

## 11. Viewing Experiment History

### Step 1: Load Experiment Detail
**User Action:** Navigates to experiment detail page

**Frontend:**
```javascript
GET /api/experiments/{exp_uuid}
GET /api/experiments/{exp_uuid}/iterations  // All iterations
```

### Step 2: Backend Queries

**A. Get Experiment:**
```javascript
experiments.findOne({"uuid": "exp-uuid-789"})
// Returns: exp with current_iteration_uuid
```

**B. Get Current Iteration:**
```javascript
experiment_iterations.findOne({
    "uuid": exp.current_iteration_uuid
})
```

**C. Get All Iterations (for history):**
```javascript
experiment_iterations.find({
    "experiment_uuid": "exp-uuid-789"
}).sort("iteration_no", 1)
```

**D. Get Activities:**
```javascript
activity_logs.find({
    "experiment_uuid": "exp-uuid-789"
}).sort("created_at", -1)
```

### Step 3: Combined Response
```json
{
  "experiment": {
    "uuid": "exp-uuid-789",
    "title": "New Feature Onboarding",
    "current_iteration_no": 2,
    "iteration_count": 2
  },
  "current_iteration": {
    "uuid": "itr-uuid-002",
    "iteration_no": 2,
    "current_phase": "IDEA",
    "timeline": null
  },
  "iterations": [
    {
      "iteration_no": 1,
      "status": "COMPLETED",
      "decision": {
        "decision": "ITERATE",
        "reason": "Need more testing time..."
      },
      "observations_count": 4
    },
    {
      "iteration_no": 2,
      "status": "ACTIVE",
      "current_phase": "IDEA"
    }
  ],
  "activities": [
    {"activity_type": "iteration_created", "timestamp": "2025-01-26T10:05:00Z"},
    {"activity_type": "decision_submitted", "timestamp": "2025-01-26T10:00:00Z"},
    {"activity_type": "testing_started", "timestamp": "2025-01-21T15:30:00Z"},
    {"activity_type": "phase_changed", "timestamp": "2025-01-21T15:00:00Z"},
    {"activity_type": "phase_changed", "timestamp": "2025-01-20T10:30:00Z"},
    {"activity_type": "experiment_created", "timestamp": "2025-01-20T10:00:00Z"}
  ]
}
```

---

## 12. Data Models Summary

### Collection Relationships

```
┌─────────────────────────────────────────────────────────────┐
│                      EXPERIMENTS                             │
├─────────────────────────────────────────────────────────────┤
│ uuid (PK)                                                    │
│ exp_no                                                       │
│ title                                                        │
│ owner → users.uuid                                           │
│ current_iteration_uuid ──────┐                               │
│ current_iteration_no         │                               │
│ iteration_count              │                               │
│ status                       │                               │
└──────────────────────────────┼───────────────────────────────┘
                               │
                               │ 1:N relationship
                               │
                    ┌──────────▼───────────────────────────┐
                    │         EXPERIMENT_ITERATIONS           │
                    ├────────────────────────────────────────┤
                    │ uuid (PK)                               │
                    │ experiment_uuid ────────────────────────┤
                    │ iteration_no                            │
                    │ current_phase                           │
                    │ timeline (build/testing/decision)     │
                    │ observation_schedule                      │
                    │ observations[]                          │
                    │ decision                                │
                    │ timeline_history[]                      │
                    └─────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                        USERS                                 │
├─────────────────────────────────────────────────────────────┤
│ uuid (PK)                                                    │
│ email                                                        │
│ name                                                         │
│ role (ADMIN|MEMBER)                                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     ACTIVITY_LOGS                           │
├─────────────────────────────────────────────────────────────┤
│ uuid (PK)                                                    │
│ experiment_uuid ─────────────────────────────────────────┐  │
│ iteration_no                                               │  │
│ activity_type                                              │  │
│ details                                                    │  │
│ user_uuid                                                  │  │
└────────────────────────────────────────────────────────────┘  │
                                                               │
                    Many-to-One with experiments ◄───────────────┘
```

### Key Design Decisions

1. **Separate Collections**: Experiments and iterations are separate to avoid MongoDB's 16MB limit and enable flexible querying

2. **Current Iteration UUID**: Experiment stores `current_iteration_uuid` for O(1) lookup of active iteration

3. **Flexible Observations**: Users can submit observations even after the day passes (overdue), but not for future days

4. **Activity Logging**: All state changes logged to `activity_logs` for audit trail

5. **Iteration History**: Previous iterations preserved with decisions for reference

---

## 13. Complete Flow Summary

```
┌────────────────────────────────────────────────────────────────────┐
│                         USER JOURNEY                               │
└────────────────────────────────────────────────────────────────────┘

[Login]
    ↓
POST /api/auth/login → Redis session created
    ↓
[Dashboard] ← GET /api/experiments (list)
    ↓
[Create Experiment]
    ↓
POST /api/experiments → Creates exp + iteration_1 in IDEA phase
    ↓
[Experiment Detail]
    ↓
[Start Building] → POST /api/iterations/{id}/start-build
    ↓
BUILDING phase (2 days) ← GET /api/iterations/{id}
    ↓
[Mark Complete] → POST /api/iterations/{id}/complete-build
    ↓
WAITING_FOR_TEST phase
    ↓
[Start Testing] → POST /api/iterations/{id}/start-testing
    ↓
USER_TESTING phase (N days)
    ↓
[Submit Observation] → POST /api/experiments/{id}/observations
    ↓
[Complete Testing] → POST /api/iterations/{id}/complete-testing
    ↓
DECISION_PENDING phase
    ↓
[Submit Decision] → POST /api/iterations/{id}/decision
    ↓
    ├─ ADD → Experiment COMPLETED
    ├─ DROP → Experiment ARCHIVED
    └─ ITERATE → New iteration created, back to IDEA

```

---

*Document generated based on README.md and codebase analysis*
