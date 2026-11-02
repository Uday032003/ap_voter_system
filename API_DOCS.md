# Andhra Pradesh Voter Directory & Constituency Management System
## Comprehensive REST API Documentation

This document describes all API endpoints provided by the backend service.

---

### Base URL
- Development: `http://localhost:5000/api`
- Frontend Proxy: `/api`

### Standard Response Format
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional descriptive status message"
}
```

---

### 1. Authentication & Session Management (`/api/auth`)

#### `POST /api/auth/login`
Authenticates a user and issues a signed JWT token.
- **Request Body**:
  ```json
  {
    "email": "leader.atmakuru@apvoters.gov.in",
    "password": "Leader@123"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5...",
    "user": {
      "id": "22222222-2222-2222-2222-222222222222",
      "email": "leader.atmakuru@apvoters.gov.in",
      "full_name_en": "Smt. K. Bhavani (Constituency Leader)",
      "full_name_te": "శ్రీమతి కె. భవాని",
      "role": "leader",
      "approvedConstituencies": [ ... ]
    }
  }
  ```

#### `POST /api/auth/register`
Registers a new citizen account with default `commoner` role.
- **Request Body**:
  ```json
  {
    "email": "citizen@example.com",
    "password": "SecurePassword@123",
    "full_name_en": "Venkatesh Rao",
    "full_name_te": "వెంకటేష్ రావు",
    "phone": "9848011223"
  }
  ```

#### `GET /api/auth/me`
Retrieves current profile and approved constituencies using Bearer token.
- **Headers**: `Authorization: Bearer <token>`

#### `POST /api/auth/demo-switch`
Convenience role switch for evaluators and demonstration purposes.
- **Request Body**: `{"role": "super_admin" | "leader" | "commoner"}`

---

### 2. Voter Directory (`/api/voters`)
*Requires `super_admin` or `leader` role with active constituency authorization.*

#### `GET /api/voters`
Fetches a paginated, sorted list of voters matching search and filter parameters.
- **Query Parameters**:
  - `constituencyId` (required for Leader scope)
  - `search`: Debounced search string across English/Telugu names, serial number, house number.
  - `partId`: Filter by Electoral Roll Part UUID.
  - `reviewStatus`: `approved` | `needs_review` | `flagged`.
  - `gender`: `M` | `F`.
  - `page`: Page number (default: 1).
  - `limit`: Records per page (default: 30, max: 100).
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "records": [ ... ],
    "totalCount": 3000,
    "page": 1,
    "limit": 30,
    "totalPages": 100,
    "hasMore": true
  }
  ```

#### `GET /api/voters/:id`
Retrieves single voter detail with masked EPIC identifier and polling station metadata.

#### `PUT /api/voters/:id/review`
Updates review status or administrative tag.
- **Request Body**:
  ```json
  {
    "review_status": "approved",
    "admin_tag": "Senior Citizen"
  }
  ```

#### `POST /api/voters/bulk-action`
Executes server-validated bulk administrative operations.
- **Request Body**:
  ```json
  {
    "constituency_id": "c1111111-0000-0000-0000-000000000001",
    "voter_ids": ["vtr-101-1", "vtr-101-2"],
    "action": "mark_reviewed" | "mark_needs_review" | "mark_flagged" | "assign_tag" | "export_minimized",
    "tag_value": "Resident Beneficiary"
  }
  ```

---

### 3. Private Leader Workspace (`/api/leader`)
*Ownership strictly enforced: users can only view, edit, or delete their own notes & tasks.*

#### `GET /api/leader/notes?constituencyId=<id>`
Fetches authenticated leader's private follow-up notes.

#### `POST /api/leader/notes`
Creates a private note, optionally associated with an authorized voter record.
- **Request Body**:
  ```json
  {
    "constituency_id": "c1111111-0000-0000-0000-000000000001",
    "voter_record_id": "vtr-101-10",
    "title": "Address Verification Note",
    "content": "Verified door number correction with booth agent."
  }
  ```

#### `GET /api/leader/tasks?constituencyId=<id>&status=pending`
Fetches field follow-up tasks.

#### `POST /api/leader/tasks`
Creates a follow-up task.
- **Request Body**:
  ```json
  {
    "constituency_id": "c1111111-0000-0000-0000-000000000001",
    "title": "Check Booth 102 additions",
    "description": "Cross-reference newly added electors in Ward 2",
    "due_date": "2026-11-05",
    "priority": "high"
  }
  ```

---

### 4. Private Aggregate Estimates Dashboard (`/api/leader/estimates`)

#### `GET /api/leader/estimates?constituencyId=<id>`
Returns leader's entered aggregate projections, comparison with registered elector base, and excess warning indicator.

#### `POST /api/leader/estimates`
Upserts aggregate count for a political party.
- **Request Body**:
  ```json
  {
    "constituency_id": "c1111111-0000-0000-0000-000000000001",
    "party_id": "p1111111-0000-0000-0000-000000000001",
    "estimated_count": 1200,
    "notes": "Booth baseline survey trend"
  }
  ```

---

### 5. CSV Import Workflow (`/api/imports`)
*Super Admin only.*

#### `POST /api/imports/preview`
Multipart upload of `.csv` file. Validates headers, data types, resolves UUIDs, checks duplicates, and returns a 10-row preview with error diagnostics.

#### `POST /api/imports/commit`
Commits a staged batch to the database.
- **Request Body**: `{"stagingJobId": "job-stage-..."}`

#### `GET /api/imports/history`
Returns history of all import jobs.

#### `GET /api/imports/template/:type`
Downloads standard CSV template (`voters` or `geography`).

---

### 6. Leader Access Requests Workflow (`/api/access-requests`)

#### `POST /api/access-requests`
Submits a Leader access request for a specific MPTC constituency.

#### `GET /api/access-requests`
Lists pending access requests (Super Admin sees all; users see their own).

#### `PUT /api/access-requests/:id/approve`
Super Admin approves access request and grants active constituency permissions. Self-approval is rejected.

#### `PUT /api/access-requests/:id/reject`
Super Admin rejects access request with review notes.

---

### 7. Public Commoner Portal (`/api/public`)
*No authentication required. Strictly returns `is_public_approved = true` records with minimized fields.*

#### `GET /api/public/voters`
Query params: `constituencyId`, `search`, `page`, `limit`.
- Excludes: EPIC numbers, administrative tags, review status, internal database UUIDs.

#### `GET /api/public/constituency-info/:id`
Returns public constituency demographics, parts count, and official candidates.
