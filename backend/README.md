# 🎓 English Learning Center — Backend API

Production-ready REST API for an English learning center mobile application.

---

## 🏗 Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT (Access + Refresh tokens) |
| Validation | Joi |
| Security | Helmet, bcryptjs, express-mongo-sanitize |
| Rate Limiting | express-rate-limit |
| Logging | Winston + DailyRotateFile |

---

## 📁 Project Structure

```
src/
├── app.js                    # Entry point
├── config/
│   ├── database.js           # MongoDB connection
│   └── constants.js          # Enums & role permissions
├── controllers/              # Request handlers (thin layer)
├── services/                 # Business logic
├── models/                   # Mongoose schemas
├── routes/                   # Express routers
├── middlewares/
│   ├── auth.middleware.js     # JWT verify + RBAC
│   ├── validate.middleware.js # Joi request validation
│   ├── error.middleware.js    # Global error handler
│   ├── rateLimiter.middleware.js
│   └── group.middleware.js    # Group membership checks
├── validators/               # Joi schemas per resource
└── utils/
    ├── AppError.js            # Custom error classes
    ├── response.js            # Standardized responses
    ├── jwt.js                 # Token helpers
    ├── pagination.js          # Query helpers
    ├── auditLog.js            # Audit trail helper
    ├── logger.js              # Winston logger
    └── seeder.js              # DB seed script
```

---

## 🚀 Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env with your MongoDB URI and secrets
```

### 3. Seed the database
```bash
npm run seed
```

### 4. Start the server
```bash
# Development
npm run dev

# Production
npm start
```

---

## 🔐 Authentication

All protected routes require:
```
Authorization: Bearer <accessToken>
```

Token flow:
1. `POST /api/v1/auth/login` → receive `accessToken` (15m) + `refreshToken` (7d)
2. When access token expires → `POST /api/v1/auth/refresh-token`
3. `POST /api/v1/auth/logout` → invalidates refresh token

---

## 👥 Roles & Permissions

| Role | Can Create |
|---|---|
| ADMIN | MANAGER, TEACHER, ASSISTANT, STUDENT |
| MANAGER | TEACHER, ASSISTANT, STUDENT |
| TEACHER | STUDENT |
| ASSISTANT | — |
| STUDENT | — |

---

## 📡 API Reference

Base URL: `http://localhost:5000/api/v1`

---

### 🔑 Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/login` | ❌ | Login with phone + password |
| POST | `/auth/refresh-token` | ❌ | Refresh access token |
| GET | `/auth/me` | ✅ | Get current user |
| POST | `/auth/logout` | ✅ | Logout (invalidate token) |
| PATCH | `/auth/change-password` | ✅ | Change password |

**Login Request:**
```json
{
  "phone": "+998901000001",
  "password": "Admin@12345"
}
```

**Login Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { "_id": "...", "firstName": "Super", "role": "ADMIN", "..." },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

---

### 👤 Users

| Method | Endpoint | Roles | Description |
|---|---|---|---|
| GET | `/users` | ADMIN, MANAGER, TEACHER | List users (paginated + filterable) |
| GET | `/users/:id` | ADMIN, MANAGER, TEACHER | Get user by ID |
| POST | `/users` | ADMIN, MANAGER, TEACHER | Create user |
| PATCH | `/users/:id` | ADMIN, MANAGER | Update user |
| PATCH | `/users/profile` | All | Update own profile |
| PATCH | `/users/:id/toggle-status` | ADMIN, MANAGER | Activate / deactivate |
| DELETE | `/users/:id` | ADMIN | Soft delete |

**Query params:** `role`, `search`, `isActive`, `page`, `limit`, `sort`

**Create User:**
```json
{
  "firstName": "Ali",
  "lastName": "Valiyev",
  "phone": "+998901234567",
  "password": "Pass@1234",
  "role": "STUDENT"
}
```

---

### 🏫 Groups

| Method | Endpoint | Roles | Description |
|---|---|---|---|
| GET | `/groups` | All | List groups (role-filtered) |
| GET | `/groups/:id` | All | Get group detail |
| POST | `/groups` | ADMIN, MANAGER | Create group |
| PATCH | `/groups/:id` | ADMIN, MANAGER | Update group |
| DELETE | `/groups/:id` | ADMIN, MANAGER | Soft delete |
| POST | `/groups/:id/students` | ADMIN, MANAGER, TEACHER | Add student |
| DELETE | `/groups/:id/students/:studentId` | ADMIN, MANAGER, TEACHER | Remove student |

**Create Group:**
```json
{
  "name": "Intermediate B1 - Morning",
  "teacher": "<teacherId>",
  "assistant": "<assistantId>",
  "level": "INTERMEDIATE",
  "startDate": "2025-01-15",
  "maxStudents": 12,
  "schedule": {
    "days": ["MONDAY", "WEDNESDAY", "FRIDAY"],
    "startTime": "09:00",
    "endTime": "10:30",
    "room": "Room 201"
  }
}
```

---

### 📅 Attendance

| Method | Endpoint | Roles | Description |
|---|---|---|---|
| POST | `/attendance` | TEACHER, ASSISTANT | Mark attendance |
| PATCH | `/attendance/:id` | TEACHER, ASSISTANT, ADMIN, MANAGER | Update record |
| GET | `/attendance` | TEACHER, ASSISTANT, ADMIN, MANAGER | List (filterable) |
| GET | `/attendance/student/:studentId` | TEACHER, ASSISTANT, ADMIN, MANAGER | Student stats |
| GET | `/attendance/me` | STUDENT | Own attendance |

**Mark Attendance:**
```json
{
  "group": "<groupId>",
  "date": "2025-01-20",
  "topic": "Present Simple tense",
  "records": [
    { "student": "<studentId>", "status": "PRESENT" },
    { "student": "<studentId2>", "status": "ABSENT", "note": "Sick" }
  ]
}
```

**Status values:** `PRESENT` | `ABSENT` | `LATE` | `EXCUSED`

---

### 📚 Vocabulary

| Method | Endpoint | Roles | Description |
|---|---|---|---|
| GET | `/vocabulary` | All | List vocabulary sets |
| GET | `/vocabulary/:id` | All | Get vocabulary set |
| POST | `/vocabulary` | TEACHER, ASSISTANT, ADMIN, MANAGER | Create |
| PATCH | `/vocabulary/:id` | TEACHER, ASSISTANT, ADMIN, MANAGER | Update |
| PATCH | `/vocabulary/:id/translation` | TEACHER, ASSISTANT, ADMIN, MANAGER | Edit one word's translation |
| DELETE | `/vocabulary/:id` | TEACHER, ADMIN, MANAGER | Soft delete |

**Create Vocabulary:**
```json
{
  "title": "Unit 3 - Daily Routines",
  "group": "<groupId>",
  "items": [
    {
      "word": "Wake up",
      "language": "EN",
      "autoTranslation": "Uyg'onmoq",
      "example": "I wake up at 7am."
    },
    {
      "word": "Nonushta", 
      "language": "UZ",
      "autoTranslation": "Breakfast",
      "editedTranslation": "Breakfast / morning meal"
    }
  ]
}
```

**Update a single translation:**
```json
{
  "itemId": "<vocabularyItemId>",
  "editedTranslation": "To wake up (from sleep)"
}
```

---

### 📝 Homework

| Method | Endpoint | Roles | Description |
|---|---|---|---|
| GET | `/homework` | All | List (role-filtered) |
| GET | `/homework/:id` | All | Get detail |
| POST | `/homework` | TEACHER, ASSISTANT, ADMIN, MANAGER | Create |
| PATCH | `/homework/:id` | TEACHER, ASSISTANT, ADMIN, MANAGER | Update |
| PATCH | `/homework/:id/publish` | TEACHER, ADMIN, MANAGER | Publish to students |
| DELETE | `/homework/:id` | TEACHER, ADMIN, MANAGER | Soft delete |
| GET | `/homework/group/:groupId/stats` | TEACHER, ASSISTANT, ADMIN, MANAGER | Stats |

**Create URL Homework:**
```json
{
  "title": "Watch: BBC English Learning Episode 5",
  "type": "URL",
  "group": "<groupId>",
  "dueDate": "2025-02-01",
  "resourceUrl": "https://www.bbc.co.uk/learningenglish/...",
  "urlDescription": "Watch and take notes on 5 new words"
}
```

**Create Text Homework:**
```json
{
  "title": "Write about your daily routine",
  "type": "TEXT",
  "group": "<groupId>",
  "dueDate": "2025-02-01",
  "textContent": "Write 100-150 words describing a typical day in your life. Use Present Simple tense."
}
```

**Create Vocabulary Homework:**
```json
{
  "title": "Speaking Test: Unit 3 Vocabulary",
  "type": "VOCABULARY",
  "group": "<groupId>",
  "dueDate": "2025-02-01",
  "vocabulary": "<vocabularyId>",
  "timeLimitSeconds": 90
}
```

---

### 📤 Submissions

| Method | Endpoint | Roles | Description |
|---|---|---|---|
| GET | `/submissions` | All (filtered) | List submissions |
| GET | `/submissions/:id` | All | Get single |
| POST | `/submissions/homework/:homeworkId` | STUDENT | Submit homework |
| PATCH | `/submissions/:id/review` | TEACHER, ASSISTANT, ADMIN, MANAGER | Review |
| GET | `/submissions/group/:groupId/stats` | TEACHER, ASSISTANT, ADMIN, MANAGER | Stats |

**Submit Text/URL Homework:**
```json
{
  "textAnswer": "I usually wake up at 7am. First I ...",
  "urlNote": "I watched this video and learned 5 new words: ..."
}
```

**Submit Vocabulary Homework (from mobile speaking test):**
```json
{
  "vocabularyAnswers": [
    { "vocabularyItemId": "<id>", "word": "Wake up", "isCorrect": true, "timeTakenSeconds": 3 },
    { "vocabularyItemId": "<id>", "word": "Nonushta", "isCorrect": false, "timeTakenSeconds": 8 }
  ]
}
```

**Review Submission:**
```json
{
  "status": "APPROVED",
  "feedback": "Great work! Your vocabulary usage is excellent.",
  "score": 92
}
```

---

### 🗣 Speaking Results

| Method | Endpoint | Roles | Description |
|---|---|---|---|
| POST | `/speaking-results/approve` | TEACHER, ASSISTANT, ADMIN, MANAGER | Approve student for test |
| POST | `/speaking-results/submit` | STUDENT | Submit test result (from mobile) |
| GET | `/speaking-results` | All | List results |
| GET | `/speaking-results/:id` | All | Get result |
| PATCH | `/speaking-results/:id/note` | TEACHER, ASSISTANT, ADMIN, MANAGER | Add teacher note |
| GET | `/speaking-results/student/:studentId/progress` | TEACHER, ASSISTANT, ADMIN, MANAGER | Student progress |

**Approve student:**
```json
{
  "homework": "<homeworkId>",
  "student": "<studentId>"
}
```

**Submit result (mobile processes audio, sends only metadata):**
```json
{
  "homework": "<homeworkId>",
  "vocabulary": "<vocabularyId>",
  "durationSeconds": 73,
  "startedAt": "2025-01-20T09:00:00Z",
  "completedAt": "2025-01-20T09:01:13Z",
  "wordResults": [
    { "vocabularyItemId": "<id>", "word": "Wake up", "isCorrect": true, "timeTakenSeconds": 2 },
    { "vocabularyItemId": "<id>", "word": "Brush teeth", "isCorrect": true, "timeTakenSeconds": 3 },
    { "vocabularyItemId": "<id>", "word": "Commute", "isCorrect": false, "timeTakenSeconds": 10 }
  ]
}
```

> ⚠️ No audio is ever sent to or stored by the backend. All speech recognition is done on-device. The backend stores only pass/fail metadata per word, score, and duration. Fields like `aiConfidence` are reserved for future AI integration.

---

### 📊 Analytics

| Method | Endpoint | Roles | Description |
|---|---|---|---|
| GET | `/analytics/me/progress` | STUDENT | Own full progress report |
| GET | `/analytics/students/:studentId/progress` | TEACHER, ASSISTANT, ADMIN, MANAGER | Student progress |
| GET | `/analytics/groups/:groupId` | TEACHER, ASSISTANT, ADMIN, MANAGER | Group analytics |
| GET | `/analytics/overview` | ADMIN, MANAGER | Center-wide overview |

**Student Progress Response:**
```json
{
  "attendance": {
    "total": 24, "present": 21, "absent": 2, "late": 1, "rate": 88
  },
  "homework": {
    "total": 18, "approved": 15, "completionRate": 83, "avgScore": 87
  },
  "speaking": {
    "totalTests": 6, "avgScore": 79, "totalCorrect": 47, "totalWords": 60
  },
  "scoreTrend": [...]
}
```

---

## 🧱 Response Format

**Success:**
```json
{
  "success": true,
  "message": "...",
  "data": { ... },
  "meta": {
    "total": 45,
    "page": 1,
    "limit": 20,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    { "field": "phone", "message": "phone is required" }
  ]
}
```

---

## 🗄 Database Models

| Model | Key Fields |
|---|---|
| User | firstName, lastName, phone, role, isActive, isDeleted, groups[] |
| Group | name, teacher, assistant, students[], schedule, level |
| Attendance | group, date, records[{student, status}], markedBy |
| Vocabulary | title, group, items[{word, language, translation, autoTranslation, editedTranslation}] |
| Homework | title, type (URL/TEXT/VOCABULARY), group, dueDate, vocabulary, isPublished |
| Submission | homework, student, group, status, score, feedback, vocabularyAnswers[] |
| SpeakingResult | student, homework, score, wordResults[], durationSeconds, aiConfidence (future) |
| AuditLog | user, action, resource, resourceId, ip, userAgent |

---

## 🧪 Seed Credentials

After running `npm run seed`:

| Role | Phone | Password |
|---|---|---|
| ADMIN | +998901000001 | Admin@12345 |
| MANAGER | +998901000002 | Manager@123 |
| TEACHER | +998901000003 | Teacher@123 |
| ASSISTANT | +998901000004 | Assistant@123 |
| STUDENT | +998901000005 | Student@123 |

---

## 🔮 Future AI Integration

The `SpeakingResult` model is designed to accept AI-powered speech recognition results in the future:

```js
// Fields reserved for AI
aiProcessed: Boolean,
aiProvider: String,          // e.g. "whisper", "google-speech"
aiMetadata: Mixed,           // raw AI response
wordResults[].aiConfidence   // 0–1 confidence score per word
```

When integrating an AI provider, simply populate these fields from the mobile client or a backend AI service — no schema changes needed.

---

## 🛡 Security Features

- JWT access (15m) + refresh (7d) token rotation
- bcrypt password hashing (12 rounds)
- Helmet HTTP security headers
- MongoDB operator injection prevention
- Rate limiting: 100 req/15min (global), 20 req/15min (auth), 5 req/hr (password change)
- Soft delete (no hard removal of user data)
- Audit logs for all create/update/delete/auth actions
- Role-based access control on every route
