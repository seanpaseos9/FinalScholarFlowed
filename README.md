# ScholarFlow — Scholarship Application & Management Portal

> An institutional scholarship and financial aid management platform designed for transparent evaluations, paperless grant processing, and real-time student tracking.

---

## 📁 Project Folder Structure

```
ScholarFlow/
│
├── index.html                          # App entry point (Vite HTML shell)
├── package.json                        # Project dependencies & npm scripts
├── tsconfig.json                       # TypeScript compiler configuration
├── vite.config.ts                      # Vite bundler configuration
├── firestore.rules                     # Firebase Firestore security rules
├── firebase-blueprint.json             # Firestore schema blueprint
├── firebase-applet-config.json         # Firebase project connection config
├── server.ts                           # Express.js REST API backend server
├── .env.example                        # Environment variable template
├── .gitignore                          # Git ignore rules
│
├── /public/                            # Static assets served directly
│   ├── logo.png                        # App logo (browser tab & favicon)
│   └── scholarflow_LOGO.png            # Official ScholarFlow logo
│
├── /src/                               # Main application source code
│   ├── main.tsx                        # React app entry point
│   ├── App.tsx                         # Root component — routing & state
│   ├── index.css                       # Global base styles
│   ├── vite-env.d.ts                   # Vite TypeScript environment types
│   │
│   ├── /assets/                        # Internal app assets
│   │   └── /images/                    # Image files used within the app
│   │       ├── logo.png
│   │       ├── scholarflow_LOGO.png
│   │       ├── scholarflow_logo.jpg
│   │       ├── mapua_intramuros_facade.jpg
│   │       └── scholarship_portal_bg.jpg
│   │
│   ├── /components/                    # All UI components
│   │   │
│   │   ├── /common/                    # Shared/reusable components
│   │   │   ├── Header.tsx              # Responsive sticky navigation header
│   │   │   ├── Footer.tsx              # Site footer with navigation links
│   │   │   ├── HelpGuideModal.tsx      # Eligibility & FAQ guide modal
│   │   │   ├── DocumentUploader.tsx    # File upload component for applications
│   │   │   ├── DocumentViewerModal.tsx # Document preview modal
│   │   │   ├── ScholarFlowLogo.tsx     # SVG logo component
│   │   │   ├── ScholarFlowOfficialEmblem.tsx  # Official emblem component
│   │   │   └── UserProfileModal.tsx    # Staff/Admin profile editor modal
│   │   │
│   │   ├── /portal/                    # Portal Home (Landing Page)
│   │   │   └── PortalSelection.tsx     # Gateway selection page
│   │   │
│   │   ├── /student/                   # Student Portal views
│   │   │   ├── StudentPortal.tsx       # Student dashboard with tabs
│   │   │   ├── ScholarshipCatalog.tsx  # Browse & filter scholarships
│   │   │   ├── ApplicationWizard.tsx   # 3-step application form wizard
│   │   │   └── StatusTracker.tsx       # Application status lookup
│   │   │
│   │   ├── /auth/                      # Authentication
│   │   │   └── StaffAdminLogin.tsx     # Staff & Admin login form
│   │   │
│   │   ├── /staff/                     # Staff Coordinator dashboard
│   │   │   └── StaffPanel.tsx          # Application management panel
│   │   │
│   │   └── /admin/                     # Administrator dashboard
│   │       └── AdminDashboard.tsx      # Full system control dashboard
│   │
│   ├── /lib/                           # Utility libraries & API services
│   │   ├── firebase.ts                 # Firestore CRUD & real-time subscriptions
│   │   ├── dataSync.ts                 # Dual-layer sync (REST API + Firestore)
│   │   ├── storage.ts                  # localStorage session management
│   │   ├── duplicateCheck.ts           # Prevent duplicate applications
│   │   ├── logger.ts                   # Audit log event recorder
│   │   ├── crypto.ts                   # Reference code generation
│   │   ├── formatters.ts               # Date & currency formatters
│   │   ├── pdfGenerator.ts             # PDF export for applications
│   │   └── sampleDocumentGenerator.ts  # Sample document generator
│   │
│   ├── /types/                         # TypeScript type definitions
│   │   └── index.ts                    # All shared interfaces & types
│   │
│   └── /data/                          # Static seed & reference data
│       ├── initialData.ts              # Default scholarship seed records
│       └── programs.ts                 # Academic programs reference list
│
├── /dist/                              # Production build output (auto-generated)
│   └── index.html                      # Compiled production HTML
│
├── /.github/                           # GitHub configuration
│   └── /workflows/                     # CI/CD GitHub Actions workflows
│
├── SRS.md                              # Software Requirements Specification
├── security_spec.md                    # Security specification document
├── AGENTS.md                           # AI agent configuration rules
└── metadata.json                       # Project metadata
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend UI | React 19 + TypeScript | Component-based user interface |
| Styling | Tailwind CSS | Utility-first responsive styling |
| Animations | Framer Motion (motion/react) | Smooth UI transitions & animations |
| Icons | Lucide React | Consistent icon library |
| Build Tool | Vite | Fast development server & bundler |
| Backend API | Express.js (server.ts) | REST API for data operations |
| Database | Firebase Firestore | Real-time NoSQL cloud database |
| Security Rules | firestore.rules | Role-based data access control |

---

## 👥 User Roles

| Role | Login Required | Access |
|------|--------------|--------|
| **Student** | No | Browse scholarships, apply, track status |
| **Staff Coordinator** | Yes | Manage applications, freeze programs, schedule interviews |
| **Administrator** | Yes | Full system control — scholarships, users, audit logs |

---

## 🚀 Getting Started

### 1. Clone the repository
```
git clone https://github.com/your-username/ScholarFlow.git
cd ScholarFlow
```

### 2. Install dependencies
```
npm install
```

### 3. Configure Firebase
Copy `.env.example` to `.env` and fill in your Firebase credentials:
```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. Run the development server
```
npm run dev
```
Open http://localhost:5173 in your browser.

### 5. Run the backend API (optional)
```
npx ts-node server.ts
```

---

## ✨ Key Features

- Scholarship Catalog — Browse and filter all available scholarship programs
- 3-Step Application Wizard — Guided form with document upload support
- Status Tracker — Look up application status using a reference code
- Freeze Announcements — Staff can freeze programs; students see live alerts
- Real-Time Sync — All data synced instantly via Firebase Firestore
- Role-Based Access — Separate portals for Students, Staff, and Admins
- Audit Logs — Every action recorded for transparency
- PDF Export — Generate printable application summaries

---

## 📄 Documentation

| File | Description |
|------|-------------|
| SRS.md | Software Requirements Specification |
| security_spec.md | Security design and Firestore rules |
| firestore.rules | Database access control rules |
| firebase-blueprint.json | Firestore collection schema |

---

## 📬 Contact

**Academic Aid Office**
- Email: aid@scholarflow.edu
- Phone: +1 (800) 555-0199
- Address: Student Services Center, University Campus

---

*© 2026 ScholarFlow Platform. All rights reserved. Enterprise Scholarship Operations System.*
