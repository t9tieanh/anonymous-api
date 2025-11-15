# API Documentation - Learning Platform

## Base URL
```
https://api.yourdomain.com/v1
```

## Authentication
All authenticated endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## 1. Authentication APIs

### 1.1 Login
**Endpoint:** `POST /auth/login`

**Description:** Authenticate user and receive access token

**Request Body:**
```json
{
  "email": "quy@student.edu",
  "password": "password123",
  "rememberMe": true
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user123",
      "name": "Nguyen Cong Quy",
      "email": "quy@student.edu",
      "theme": "light",
      "notifications": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh_token_here"
  }
}
```

**Error Response (401 Unauthorized):**
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

---

### 1.2 Register
**Endpoint:** `POST /auth/register`

**Description:** Create new user account

**Request Body:**
```json
{
  "name": "Nguyen Cong Quy",
  "email": "quy@student.edu",
  "password": "password123"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "id": "user123",
      "name": "Nguyen Cong Quy",
      "email": "quy@student.edu",
      "theme": "light",
      "notifications": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh_token_here"
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Email already registered"
}
```

---

### 1.3 Logout
**Endpoint:** `POST /auth/logout`

**Description:** Invalidate user session

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### 1.4 Refresh Token
**Endpoint:** `POST /auth/refresh`

**Description:** Get new access token using refresh token

**Request Body:**
```json
{
  "refreshToken": "refresh_token_here"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "token": "new_access_token",
    "refreshToken": "new_refresh_token"
  }
}
```

---

## 2. User/Profile APIs

### 2.1 Get User Profile
**Endpoint:** `GET /users/profile`

**Description:** Get current user profile information

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "user123",
    "name": "Nguyen Cong Quy",
    "email": "quy@student.edu",
    "theme": "light",
    "notifications": true,
    "createdAt": "2025-01-01T00:00:00Z"
  }
}
```

---

### 2.2 Update User Profile
**Endpoint:** `PUT /users/profile`

**Description:** Update user profile information

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Nguyen Cong Quy Updated",
  "email": "newemail@student.edu",
  "notifications": false
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": "user123",
    "name": "Nguyen Cong Quy Updated",
    "email": "newemail@student.edu",
    "theme": "light",
    "notifications": false
  }
}
```

---

### 2.3 Get User Statistics
**Endpoint:** `GET /users/statistics`

**Description:** Get user's learning statistics for dashboard and settings

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "totalFiles": 12,
    "totalSummaries": 18,
    "totalQuizzes": 8,
    "completedQuizzes": 5,
    "averageScore": "85%",
    "trends": {
      "files": "+2 this week",
      "summaries": "+1 today",
      "quizzes": "+3 this week",
      "score": "+5% from last week"
    }
  }
}
```

---

## 3. Subject APIs

### 3.1 Get All Subjects
**Endpoint:** `GET /subjects`

**Description:** Get all subjects for the authenticated user

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "subj1",
      "name": "Mathematics",
      "folders": ["Calculus", "Algebra", "Statistics"],
      "color": "#3B82F6",
      "createdAt": "2025-01-01T00:00:00Z",
      "stats": {
        "totalFiles": 5,
        "totalSummaries": 8,
        "totalQuizzes": 4
      }
    },
    {
      "id": "subj2",
      "name": "Physics",
      "folders": ["Mechanics", "Electromagnetism", "Thermodynamics"],
      "color": "#10B981",
      "createdAt": "2025-01-02T00:00:00Z",
      "stats": {
        "totalFiles": 3,
        "totalSummaries": 4,
        "totalQuizzes": 2
      }
    }
  ]
}
```

---

### 3.2 Create Subject
**Endpoint:** `POST /subjects`

**Description:** Create a new subject

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Computer Science",
  "folders": ["Data Structures", "Algorithms", "AI Basics"],
  "color": "#8B5CF6"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Subject created successfully",
  "data": {
    "id": "subj3",
    "name": "Computer Science",
    "folders": ["Data Structures", "Algorithms", "AI Basics"],
    "color": "#8B5CF6",
    "createdAt": "2025-01-15T00:00:00Z",
    "stats": {
      "totalFiles": 0,
      "totalSummaries": 0,
      "totalQuizzes": 0
    }
  }
}
```

---

### 3.3 Get Subject by ID
**Endpoint:** `GET /subjects/:subjectId`

**Description:** Get detailed information about a specific subject

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "subj1",
    "name": "Mathematics",
    "folders": ["Calculus", "Algebra", "Statistics"],
    "color": "#3B82F6",
    "createdAt": "2025-01-01T00:00:00Z",
    "stats": {
      "totalFiles": 5,
      "totalSummaries": 8,
      "totalQuizzes": 4
    }
  }
}
```

---

### 3.4 Update Subject
**Endpoint:** `PUT /subjects/:subjectId`

**Description:** Update subject information

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Advanced Mathematics",
  "folders": ["Calculus", "Algebra", "Statistics", "Geometry"],
  "color": "#1E40AF"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Subject updated successfully",
  "data": {
    "id": "subj1",
    "name": "Advanced Mathematics",
    "folders": ["Calculus", "Algebra", "Statistics", "Geometry"],
    "color": "#1E40AF",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-15T00:00:00Z"
  }
}
```

---

### 3.5 Delete Subject
**Endpoint:** `DELETE /subjects/:subjectId`

**Description:** Delete a subject (will also delete all associated files, summaries, and quizzes)

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Subject deleted successfully"
}
```

---

## 4. File APIs

### 4.1 Get Files by Subject
**Endpoint:** `GET /subjects/:subjectId/files`

**Description:** Get all files for a specific subject

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `folder` (optional): Filter by folder name
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "files": [
      {
        "id": "file1",
        "name": "Limits and Continuity.pdf",
        "subject": "Mathematics",
        "folder": "Calculus",
        "uploadDate": "2025-01-10",
        "size": "2.4 MB",
        "sizeBytes": 2516582,
        "mimeType": "application/pdf",
        "summaryCount": 2,
        "quizCount": 2,
        "url": "https://storage.yourdomain.com/files/file1.pdf"
      },
      {
        "id": "file2",
        "name": "Derivatives.pdf",
        "subject": "Mathematics",
        "folder": "Calculus",
        "uploadDate": "2025-11-14",
        "size": "1.9 MB",
        "sizeBytes": 1991065,
        "mimeType": "application/pdf",
        "summaryCount": 1,
        "quizCount": 0,
        "url": "https://storage.yourdomain.com/files/file2.pdf"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalItems": 2,
      "itemsPerPage": 20
    }
  }
}
```

---

### 4.2 Upload File
**Endpoint:** `POST /files`

**Description:** Upload a new file with optional processing options

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body (Form Data):**
```
file: [Binary file data]
subject: "Mathematics"
createSummary: true
generateQuiz: false
quizQuestions: 10
quizDifficulty: "Medium"
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "file": {
      "id": "file123",
      "name": "New Chapter.pdf",
      "subject": "Mathematics",
      "folder": "General",
      "uploadDate": "2025-01-15",
      "size": "3.2 MB",
      "sizeBytes": 3355443,
      "mimeType": "application/pdf",
      "summaryCount": 0,
      "quizCount": 0,
      "url": "https://storage.yourdomain.com/files/file123.pdf"
    },
    "processing": {
      "summary": {
        "status": "queued",
        "jobId": "job_sum_123"
      },
      "quiz": {
        "status": "not_requested"
      }
    }
  }
}
```

---

### 4.3 Get File by ID
**Endpoint:** `GET /files/:fileId`

**Description:** Get detailed information about a specific file

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "file1",
    "name": "Limits and Continuity.pdf",
    "subject": "Mathematics",
    "folder": "Calculus",
    "uploadDate": "2025-01-10",
    "size": "2.4 MB",
    "sizeBytes": 2516582,
    "mimeType": "application/pdf",
    "summaryCount": 2,
    "quizCount": 2,
    "url": "https://storage.yourdomain.com/files/file1.pdf",
    "metadata": {
      "pages": 45,
      "language": "en"
    }
  }
}
```

---

### 4.4 Delete File
**Endpoint:** `DELETE /files/:fileId`

**Description:** Delete a file (will also delete all associated summaries and quizzes)

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

---

### 4.5 Download File
**Endpoint:** `GET /files/:fileId/download`

**Description:** Get download URL or redirect to file

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "downloadUrl": "https://storage.yourdomain.com/files/file1.pdf?token=xyz",
    "expiresAt": "2025-01-15T12:00:00Z"
  }
}
```

---

## 5. Summary APIs

### 5.1 Get All Summaries
**Endpoint:** `GET /summaries`

**Description:** Get all summaries for the authenticated user

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `search` (optional): Search in fileName or content
- `important` (optional): Filter by importance (true/false)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "summaries": [
      {
        "id": "sum1",
        "fileId": "file1",
        "fileName": "Limits and Continuity.pdf",
        "content": "This document covers the fundamental concepts of limits and continuity in calculus. The epsilon-delta definition provides a rigorous foundation for understanding limits...",
        "keyConcepts": [
          "Epsilon-Delta Definition",
          "Continuity",
          "Limit Laws",
          "Intermediate Value Theorem",
          "One-sided Limits"
        ],
        "createdAt": "2025-01-10",
        "isImportant": true,
        "language": "english"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalItems": 42,
      "itemsPerPage": 20
    }
  }
}
```

---

### 5.2 Get Summaries by File
**Endpoint:** `GET /files/:fileId/summaries`

**Description:** Get all summaries for a specific file

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "sum1",
      "fileId": "file1",
      "fileName": "Limits and Continuity.pdf",
      "content": "This document covers the fundamental concepts of limits and continuity...",
      "keyConcepts": [
        "Epsilon-Delta Definition",
        "Continuity",
        "Limit Laws"
      ],
      "createdAt": "2025-01-10",
      "isImportant": true,
      "language": "english"
    }
  ]
}
```

---

### 5.3 Generate Summary
**Endpoint:** `POST /files/:fileId/summaries`

**Description:** Generate AI summary for a file

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "language": "english"
}
```

**Response (202 Accepted):**
```json
{
  "success": true,
  "message": "Summary generation started",
  "data": {
    "jobId": "job_sum_456",
    "status": "processing",
    "estimatedTime": "30-60 seconds"
  }
}
```

---

### 5.4 Get Summary by ID
**Endpoint:** `GET /summaries/:summaryId`

**Description:** Get detailed summary information

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "sum1",
    "fileId": "file1",
    "fileName": "Limits and Continuity.pdf",
    "content": "This document covers the fundamental concepts of limits and continuity in calculus...",
    "keyConcepts": [
      "Epsilon-Delta Definition",
      "Continuity",
      "Limit Laws",
      "Intermediate Value Theorem",
      "One-sided Limits"
    ],
    "createdAt": "2025-01-10",
    "isImportant": true,
    "language": "english",
    "metadata": {
      "wordCount": 450,
      "readingTime": "3 min"
    }
  }
}
```

---

### 5.5 Toggle Summary Importance
**Endpoint:** `PATCH /summaries/:summaryId/importance`

**Description:** Mark/unmark summary as important

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "isImportant": true
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Summary importance updated",
  "data": {
    "id": "sum1",
    "isImportant": true
  }
}
```

---

### 5.6 Translate Summary
**Endpoint:** `POST /summaries/:summaryId/translate`

**Description:** Translate summary to different language

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "targetLanguage": "vietnamese"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Summary translated successfully",
  "data": {
    "id": "sum1",
    "content": "Tài liệu này bao gồm các khái niệm cơ bản về giới hạn và tính liên tục trong giải tích...",
    "language": "vietnamese",
    "originalLanguage": "english"
  }
}
```

---

### 5.7 Delete Summary
**Endpoint:** `DELETE /summaries/:summaryId`

**Description:** Delete a summary

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Summary deleted successfully"
}
```

---

## 6. Quiz APIs

### 6.1 Get All Quizzes
**Endpoint:** `GET /quizzes`

**Description:** Get all quizzes for the authenticated user

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `subject` (optional): Filter by subject
- `difficulty` (optional): Filter by difficulty (Easy/Medium/Hard)
- `completed` (optional): Filter by completion status (true/false)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "quizzes": [
      {
        "id": "quiz1",
        "fileId": "file1",
        "fileName": "Limits and Continuity.pdf",
        "subject": "Mathematics",
        "difficulty": "Medium",
        "totalQuestions": 10,
        "createdAt": "2025-01-11",
        "completed": true,
        "score": 85,
        "timeSpent": "15 minutes"
      },
      {
        "id": "quiz2",
        "fileId": "file4",
        "fileName": "Binary Trees.pdf",
        "subject": "Computer Science",
        "difficulty": "Hard",
        "totalQuestions": 12,
        "createdAt": "2025-01-16",
        "completed": false,
        "score": null,
        "timeSpent": null
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalItems": 25,
      "itemsPerPage": 20
    }
  }
}
```

---

### 6.2 Get Quizzes by File
**Endpoint:** `GET /files/:fileId/quizzes`

**Description:** Get all quizzes for a specific file

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "quiz1",
      "fileId": "file1",
      "fileName": "Limits and Continuity.pdf",
      "subject": "Mathematics",
      "difficulty": "Medium",
      "totalQuestions": 10,
      "createdAt": "2025-01-11",
      "completed": true,
      "score": 85,
      "timeSpent": "15 minutes"
    }
  ]
}
```

---

### 6.3 Generate Quiz
**Endpoint:** `POST /files/:fileId/quizzes`

**Description:** Generate AI quiz for a file

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "difficulty": "Medium",
  "numberOfQuestions": 10
}
```

**Response (202 Accepted):**
```json
{
  "success": true,
  "message": "Quiz generation started",
  "data": {
    "jobId": "job_quiz_789",
    "status": "processing",
    "estimatedTime": "45-90 seconds"
  }
}
```

---

### 6.4 Get Quiz Details
**Endpoint:** `GET /quizzes/:quizId`

**Description:** Get detailed quiz information with all questions

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "quiz1",
    "fileId": "file1",
    "fileName": "Limits and Continuity.pdf",
    "subject": "Mathematics",
    "difficulty": "Medium",
    "createdAt": "2025-01-11",
    "completed": true,
    "score": 85,
    "timeSpent": "15 minutes",
    "questions": [
      {
        "id": "q1",
        "question": "What is the epsilon-delta definition of a limit?",
        "options": [
          "For every ε > 0, there exists δ > 0 such that |f(x) - L| < ε whenever 0 < |x - a| < δ",
          "The function approaches a finite value as x increases",
          "The derivative exists at every point",
          "The function is continuous everywhere"
        ],
        "correctAnswer": 0,
        "userAnswer": 0,
        "isCorrect": true
      },
      {
        "id": "q2",
        "question": "Which condition is necessary for a function to be continuous at x = a?",
        "options": [
          "The function must be differentiable at a",
          "lim(x→a) f(x) = f(a)",
          "The function must be linear",
          "The derivative must be zero"
        ],
        "correctAnswer": 1,
        "userAnswer": 1,
        "isCorrect": true
      }
    ]
  }
}
```

---

### 6.5 Submit Quiz Answers
**Endpoint:** `POST /quizzes/:quizId/submit`

**Description:** Submit quiz answers and get score

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "answers": [
    {
      "questionId": "q1",
      "selectedAnswer": 0
    },
    {
      "questionId": "q2",
      "selectedAnswer": 1
    },
    {
      "questionId": "q3",
      "selectedAnswer": 2
    }
  ],
  "timeSpent": "15 minutes"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Quiz submitted successfully",
  "data": {
    "quizId": "quiz1",
    "score": 85,
    "correctAnswers": 17,
    "totalQuestions": 20,
    "timeSpent": "15 minutes",
    "completed": true,
    "completedAt": "2025-01-15T10:30:00Z",
    "results": [
      {
        "questionId": "q1",
        "isCorrect": true,
        "selectedAnswer": 0,
        "correctAnswer": 0
      },
      {
        "questionId": "q2",
        "isCorrect": true,
        "selectedAnswer": 1,
        "correctAnswer": 1
      },
      {
        "questionId": "q3",
        "isCorrect": false,
        "selectedAnswer": 2,
        "correctAnswer": 1
      }
    ]
  }
}
```

---

### 6.6 Delete Quiz
**Endpoint:** `DELETE /quizzes/:quizId`

**Description:** Delete a quiz

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Quiz deleted successfully"
}
```

---

## 7. Dashboard/Activity APIs

### 7.1 Get Recent Activity
**Endpoint:** `GET /activities/recent`

**Description:** Get recent user activities for dashboard

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `limit` (optional): Number of activities to return (default: 10)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "act1",
      "type": "quiz",
      "title": "Completed Quiz",
      "subtitle": "Binary Trees - Hard",
      "timestamp": "2025-01-16T09:30:00Z",
      "metadata": {
        "quizId": "quiz4",
        "score": 90
      }
    },
    {
      "id": "act2",
      "type": "summary",
      "title": "Generated Summary",
      "subtitle": "Binary Trees.pdf",
      "timestamp": "2025-01-15T14:20:00Z",
      "metadata": {
        "summaryId": "sum3",
        "fileId": "file4"
      }
    },
    {
      "id": "act3",
      "type": "file",
      "title": "Uploaded File",
      "subtitle": "Maxwell Equations.pdf",
      "timestamp": "2025-01-14T11:15:00Z",
      "metadata": {
        "fileId": "file5"
      }
    }
  ]
}
```

---

## 8. Processing/Job Status APIs

### 8.1 Get Job Status
**Endpoint:** `GET /jobs/:jobId`

**Description:** Check status of processing job (summary/quiz generation)

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK) - Processing:**
```json
{
  "success": true,
  "data": {
    "jobId": "job_sum_123",
    "type": "summary",
    "status": "processing",
    "progress": 45,
    "startedAt": "2025-01-15T10:00:00Z",
    "estimatedCompletion": "2025-01-15T10:01:00Z"
  }
}
```

**Response (200 OK) - Completed:**
```json
{
  "success": true,
  "data": {
    "jobId": "job_sum_123",
    "type": "summary",
    "status": "completed",
    "progress": 100,
    "startedAt": "2025-01-15T10:00:00Z",
    "completedAt": "2025-01-15T10:00:45Z",
    "result": {
      "summaryId": "sum123"
    }
  }
}
```

**Response (200 OK) - Failed:**
```json
{
  "success": true,
  "data": {
    "jobId": "job_sum_123",
    "type": "summary",
    "status": "failed",
    "progress": 0,
    "startedAt": "2025-01-15T10:00:00Z",
    "failedAt": "2025-01-15T10:00:30Z",
    "error": {
      "code": "PROCESSING_ERROR",
      "message": "Unable to extract text from file"
    }
  }
}
```

---

## 9. Search APIs

### 9.1 Global Search
**Endpoint:** `GET /search`

**Description:** Search across files, summaries, and quizzes

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `q`: Search query (required)
- `type` (optional): Filter by type (files/summaries/quizzes)
- `subject` (optional): Filter by subject
- `limit` (optional): Results per category (default: 5)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "files": [
      {
        "id": "file1",
        "name": "Limits and Continuity.pdf",
        "subject": "Mathematics",
        "relevance": 0.95
      }
    ],
    "summaries": [
      {
        "id": "sum1",
        "fileName": "Limits and Continuity.pdf",
        "content": "...highlighted content...",
        "relevance": 0.88
      }
    ],
    "quizzes": [
      {
        "id": "quiz1",
        "fileName": "Limits and Continuity.pdf",
        "subject": "Mathematics",
        "difficulty": "Medium",
        "relevance": 0.75
      }
    ]
  }
}
```

---

## Error Responses

### Common Error Codes:

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "email",
      "message": "Please enter a valid email address"
    }
  ]
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Authentication required"
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "message": "You don't have permission to access this resource"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Resource not found"
}
```

**429 Too Many Requests:**
```json
{
  "success": false,
  "message": "Rate limit exceeded. Please try again later.",
  "retryAfter": 60
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "An internal error occurred. Please try again later."
}
```

---

## Rate Limiting

- **Authentication endpoints:** 5 requests per minute
- **File upload:** 10 files per hour
- **Summary/Quiz generation:** 20 requests per hour
- **Other endpoints:** 100 requests per minute

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642262400
```

---

## Pagination

All list endpoints support pagination with the following parameters:
- `page`: Page number (starting from 1)
- `limit`: Items per page (max 100)

Pagination response format:
```json
{
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 87,
    "itemsPerPage": 20,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

---

## Webhooks (Optional)

### 9.2 Register Webhook
**Endpoint:** `POST /webhooks`

**Description:** Register a webhook for processing completion events

**Request Body:**
```json
{
  "url": "https://yourapp.com/webhooks/processing",
  "events": ["summary.completed", "quiz.completed", "file.processed"],
  "secret": "your_webhook_secret"
}
```

**Webhook Payload Example:**
```json
{
  "event": "summary.completed",
  "timestamp": "2025-01-15T10:01:00Z",
  "data": {
    "summaryId": "sum123",
    "fileId": "file1",
    "userId": "user123"
  }
}
```

---

## Notes for Implementation:

1. **File Upload:** Use multipart/form-data for file uploads. Maximum file size: 50MB.

2. **Processing Time:** 
   - Summary generation: 30-60 seconds
   - Quiz generation: 45-90 seconds
   - Use polling or webhooks for completion notifications

3. **Supported File Types:**
   - PDF (.pdf)
   - Word Documents (.docx, .doc)
   - Markdown (.md)
   - Text files (.txt)

4. **Language Support for Translation:**
   - English
   - Vietnamese
   - Chinese (Simplified & Traditional)

5. **Quiz Difficulty Mapping:**
   - Easy: Basic comprehension questions
   - Medium: Application and analysis questions
   - Hard: Advanced synthesis and evaluation questions

6. **Important Concepts Extraction:**
   - AI automatically identifies 3-7 key concepts per summary
   - Concepts are ranked by importance and relevance

7. **Security:**
   - All API requests must use HTTPS
   - Tokens expire after 24 hours
   - Refresh tokens expire after 30 days
   - Files are stored securely with encryption at rest