# Andhra Pradesh Voter Directory & Constituency Management System
## (ఆంధ్రప్రదేశ్ ఓటర్ల సమాచార & నియోజకవర్గ నిర్వహణ వ్యవస్థ)

A full-stack, secure, bilingual (English & Telugu) web application built for managing electoral-roll records, polling booths, and constituency information in Andhra Pradesh, India. Initial deployment supports an MPTC constituency with 3,000 voter records, with architecture engineered to scale to larger datasets and multiple constituencies.

---

## 🏛️ Key Capabilities & Features

### 1. Three Role-Based Portals with Server-Side Enforcement
- **Super Admin**:
  - Full control over geographic hierarchy (Districts → Mandals → Villages → MPTC Constituencies → Parts → Polling Stations).
  - Robust CSV Import Wizard with duplicate detection, schema validation, and error reporting.
  - Review, approve, reject, or revoke Leader access requests (with self-approval prevention).
  - System-wide audit log inspection and official political party/candidate management.
- **Constituency Leader**:
  - Access restricted exclusively to approved constituencies.
  - Interactive Voter Directory with debounced bilingual search (Telugu & English) and infinite scrolling.
  - Multi-select checkboxes and floating bulk administrative operations.
  - Private Leader Workspace: follow-up notes, field verification tasks, and timestamps isolated by owner.
  - Private Aggregate Estimates Dashboard: Party count projections with total elector base comparison and excess warning triggers.
- **Commoner (Citizen)**:
  - Read-only public directory displaying strictly `is_public_approved = true` records.
  - Location selectors (District, Mandal, Village, Constituency, Part).
  - Masked sensitive identifiers (EPIC number masked, administrative tags hidden).

### 2. Bilingual Support (English & Telugu)
- Complete UI localization powered by `i18next` and `react-i18next`.
- One-click language switcher (`🌐 తెలుగు` / `🌐 English`) in the navigation bar.
- Dedicated Telugu typography loading Google Fonts `Noto Sans Telugu` and `Inter`.
- Dual database storage for names and addresses (`name_en`, `name_te`, `house_number_en`, `house_number_te`).

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite 6, JavaScript (`.js`), React Router v6, Lucide Icons, `i18next` |
| **Styling** | Custom Vanilla CSS design system (Andhra Pradesh civic emerald & sapphire palette) |
| **Backend** | Node.js (v24), Express.js, JWT, Bcrypt, Multer, `csv-parse`, Zod validation |
| **Database** | PostgreSQL, Supabase (with full RLS, Trigram indexes, and automated triggers) |
| **Testing** | Node native test runner (`node --test`), automated integration tests |

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### 1. Installation
Clone the repository and install all dependencies:
```bash
npm install
```

### 2. Environment Configuration
Copy the sample environment file in `backend/`:
```bash
cp backend/.env.example backend/.env
```
*(By default, the application runs out of the box with an in-memory seed datastore populated with 3,000 realistic Andhra Pradesh voter records across 3 electoral roll parts in Atmakuru MPTC - 04).*

### 3. Running Development Servers
You can start both backend and frontend concurrently:
```bash
npm run dev:backend
npm run dev:frontend
```
- **Backend API**: `http://localhost:5000` (Health check: `http://localhost:5000/api/health`)
- **Frontend Web App**: `http://localhost:5173`

---

## 👥 Demo User Accounts

The application features a convenient **Demo Mode Role Switcher** at the top of the screen to switch between roles in 1 click, or you can log in manually:

| Role | Email | Password | Scope |
|---|---|---|---|
| **Super Admin** | `admin@apvoters.gov.in` | `Admin@123` | Complete administrative access |
| **Constituency Leader** | `leader.atmakuru@apvoters.gov.in` | `Leader@123` | Approved for `Atmakuru MPTC - 04` |
| **Commoner Citizen** | `citizen.guntur@apvoters.gov.in` | `Citizen@123` | Public directory only |

---

## 🧪 Automated Testing

Run the comprehensive backend integration test suite:
```bash
npm run test
```
The test suite verifies:
1. System health check
2. Authentication flow & role verification
3. Voter directory debounced bilingual search & infinite scroll pagination
4. Security & constituency isolation (preventing unauthorized cross-constituency access)
5. Commoner read-only public directory restrictions (masking sensitive fields)
6. Leader private notes & tasks ownership enforcement
7. Leader aggregate estimates & elector limit warning
8. Bulk administrative actions permissions

---

## 📁 Project Structure

```
├── backend/
│   ├── src/
│   │   ├── config/          # Environment & Supabase initialization
│   │   ├── middleware/      # Auth, RoleGuard, ConstituencyGuard, ErrorHandler
│   │   ├── routes/          # REST route handlers
│   │   ├── services/        # DataStore, voter synthesizer, audit logger
│   │   ├── tests/           # Automated integration test suite
│   │   └── server.js        # Express app server
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # Common, Directory, Leader, Admin components
│   │   ├── context/         # AuthContext, ToastContext
│   │   ├── locales/         # en.json, te.json translation dictionaries
│   │   ├── pages/           # Home, Directory, Workspace, Estimates, Admin, Public
│   │   ├── services/        # Frontend API client
│   │   ├── i18n.js          # i18next configuration
│   │   ├── index.css        # Core design system
│   │   └── main.js          # Entry point
│   ├── index.html
│   └── vite.config.js
├── database/
│   └── migrations/          # 5 PostgreSQL migration SQL files
├── templates/
│   ├── voters_template.csv     # Voter CSV import template
│   └── geography_template.csv  # Geography import template
├── API_DOCS.md              # Complete API reference
├── DATABASE_SETUP.md        # Supabase and PostgreSQL setup guide
└── README.md
```

---

## 🛡️ Security Architecture
- **Row-Level Security (RLS)**: Policies defined in `03_row_level_security.sql`.
- **Constituency Scope Guard**: Leaders attempting to access records, notes, or estimates outside their approved constituency receive `403 Forbidden`.
- **Privacy Protection**: EPIC numbers are masked in the UI; commoners never see private tags or unapproved records.
- **Audit Trails**: All privileged actions (bulk updates, CSV commits, access approvals) are logged with user ID, action, timestamp, and IP.
