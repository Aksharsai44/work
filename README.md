# MIND2I Workshop & Bootcamp Hub 🚀

An all-in-one, real-time enterprise education platform for conducting live AI workshops, coding bootcamps, interactive learn hubs, dynamic Q&A polling, auto-graded IDE assessments, and telemetry dashboards.

---

## 🌟 Key Features

### 1. 🎓 Interactive Learn Hub
- **Multi-Slide Keynote Presentation Deck**: Slide-by-slide presentation viewer for PPTX, PDF, and DOCX documents with thumbnail filmstrip navigation, fullscreen presentation mode, and slide counters.
- **Direct PPTX Binary Ingestion**: Automatically extracts real slides, XML text runs, images, and outlines from uploaded `.pptx` PowerPoint files.
- **Smart Terminology & Micro-Quizzes**: Interactive highlighted keyword tags with definitions, pronunciation, and instant concept evaluation mini-quizzes.
- **Document & File Management**: Multi-file attachment support with live PDF preview and download capabilities.

### 2. ⚡ Live Interactive Q&A & Rapid Polling
- **Real-Time Synchronized Classroom Feed**: Instant question broadcasting across all students with live response counters.
- **Privacy & Teacher Controls**: 1-click **Lock / Unlock** mechanism per question to control visibility for students.
- **Submission Timer Freeze**: Countdown timers freeze immediately upon answer submission, switching to verified green badges.
- **Role-Based Telemetry**: Student submission leaderboards, open-ended question feeds, and detailed speed metrics restricted to instructor view.
- **Student Dashboard Vertical Feed**: Questions presented sequentially one-by-one with independent answer submission and instant feedback.

### 3. 💻 In-Browser Coding Studio & Assignment Assessments
- **White-Theme In-Browser IDE**: Multi-language code editor (Python, JavaScript, TypeScript, Java, C++, SQL, Bash) with auto-completion, line numbers, and sample test case execution.
- **Assignment Locking System**: 1-click **`🔒 Locked` / `🔓 Unlocked`** buttons on each assignment tab and header to control assignment release to students.
- **AI Assignment Generator**: Generate custom quizzes, mixed tests, and coding challenges from uploaded PPTX slides or course notes using Google Gemini AI.
- **Automated Test Suite Evaluator**: Server-side and browser sandboxed code execution with automated assertion testing and score recording.
- **Instructor Grading & Analytics Hub**: Real-time assignment leaderboard, grading history, test case pass rates, and custom feedback dispatcher.

### 4. 👥 Batch & Student Management
- **QR Code Onboarding**: Generate batch-specific QR codes and direct enrollment join links for seamless student registration.
- **Live Classroom Attendance**: Real-time student attendance tracking and session participation metrics.
- **Comprehensive Score Tracking**: Consolidated student profiles with quiz scores, coding scores, live Q&A accuracy, and overall ranking.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend UI** | React 19, TypeScript, Vite, TailwindCSS, Motion (Framer Motion), Lucide Icons, Canvas Confetti |
| **Document Processing** | JSZip (client-side PPTX parsing), Mammoth (DOCX parsing), QRCode |
| **Backend API** | Django 5.x, Django REST Framework (DRF), Django CORS Headers |
| **AI Engine** | Google Gemini API (`@google/genai` SDK) |
| **Database** | SQLite (development) / PostgreSQL (production ready) |
| **Runtime & Server** | Node.js / Express / TSX, Python 3.10+ |

---

## 📁 Project Structure

```
mind2i-workshop-bootcamp-hub/
├── backend/                        # Django REST API Backend
│   ├── api/                        # App models, views, serializers, migrations
│   │   ├── migrations/             # Database migrations
│   │   ├── models.py               # Batch, Student, Assignment, LiveQuestion, LearnHub models
│   │   ├── serializers.py          # DRF Serializers
│   │   ├── urls.py                 # REST endpoints
│   │   └── views.py                # ViewSets & custom actions
│   ├── core/                       # Django project configuration
│   │   ├── settings.py             # Settings (CORS, DB, Installed Apps)
│   │   ├── urls.py                 # Core routing
│   │   └── wsgi.py
│   ├── .env.example                # Backend environment template
│   ├── manage.py
│   └── requirements.txt            # Python dependencies
│
├── frontend/                       # React + TypeScript + Vite Frontend
│   ├── src/
│   │   ├── components/             # UI Components
│   │   │   ├── AssignmentManagerView.tsx
│   │   │   ├── CodingChallengeIDE.tsx
│   │   │   ├── LearnHubInteractive.tsx
│   │   │   ├── LiveQAManagerView.tsx
│   │   │   ├── StudentDashboardView.tsx
│   │   │   ├── AdminDashboardView.tsx
│   │   │   └── ...
│   │   ├── data/                   # Default datasets and presets
│   │   ├── types.ts                # Full TypeScript data contracts
│   │   ├── App.tsx                 # Root application component
│   │   └── main.tsx
│   ├── .env.example                # Frontend environment template
│   ├── package.json
│   ├── server.ts                   # Express development & AI API bridge server
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── .env.example                    # Root environment configuration guide
├── .gitignore                      # Root git ignore rules
└── README.md                       # Documentation
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** (v18+ recommended)
- **Python** (v3.10+ recommended)
- **Git**

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/Mind2I/Workshop_Mind2i.git
cd Workshop_Mind2i
```

---

### Step 2: Set Up Backend (Django)

1. Navigate to the backend folder:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   ```bash
   # Windows
   python -m venv venv
   .\venv\Scripts\activate

   # macOS / Linux
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Create your `.env` configuration:
   ```bash
   # Windows PowerShell
   Copy-Item .env.example .env

   # Linux / macOS
   cp .env.example .env
   ```

5. Run database migrations:
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

6. Start the Django backend server:
   ```bash
   python manage.py runserver 8000
   ```
   *Backend will be running at `http://127.0.0.1:8000/api/`*

---

### Step 3: Set Up Frontend (React + Vite)

1. Open a new terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   ```

2. Install Node dependencies:
   ```bash
   npm install
   ```

3. Create your `.env` configuration:
   ```bash
   # Windows PowerShell
   Copy-Item .env.example .env

   # Linux / macOS
   cp .env.example .env
   ```
   *Edit `.env` and set your `GEMINI_API_KEY` for AI features.*

4. Start the frontend development server:
   ```bash
   npm run dev
   ```
   *Frontend will be running at `http://localhost:3000`*

---

## 🔑 Default Credentials & Access

| Role | Email / Username | Password | Permissions |
|---|---|---|---|
| **Instructor / Admin** | `admin@mind2i.edu` | `mind2i@admin` | Full control: Create/Edit/Lock/Unlock assignments, questions, modules, telemetry reports, and QR codes |
| **Student** | Select any enrolled student or register via Batch QR code | `student123` | View unlocked assignments, interactive learn hub, participate in live Q&A, and run code in the IDE |

---

## ⚙️ Environment Variables Reference

### Frontend (`frontend/.env`)
| Variable | Description | Default / Example |
|---|---|---|
| `GEMINI_API_KEY` | Google Gemini AI API key for AI document analysis & question generation | `AIzaSy...` |
| `APP_URL` | Application hosting URL | `http://localhost:3000` |
| `PORT` | Local dev server port | `3000` |

### Backend (`backend/.env`)
| Variable | Description | Default / Example |
|---|---|---|
| `SECRET_KEY` | Django cryptographic secret key | `django-insecure-...` |
| `DEBUG` | Django debug mode | `True` |
| `DB_NAME` | Database name (optional if using SQLite) | `mind2i_db` |
| `DB_USER` | PostgreSQL database user | `postgres` |
| `DB_PASSWORD` | PostgreSQL database password | `password` |
| `DB_HOST` | Database host address | `localhost` |
| `DB_PORT` | Database port | `5432` |
| `ADMIN_USERNAME` | Default admin email | `admin@mind2i.edu` |
| `ADMIN_PASSWORD` | Default admin password | `mind2i@admin` |

---

## 🧪 Available Scripts

### Frontend
- `npm run dev`: Starts the local dev server (Vite + Express backend proxy) on port 3000.
- `npm run build`: Bundles the React application and builds the server for production.
- `npm run lint`: Checks TypeScript types with zero emissions (`tsc --noEmit`).
- `npm start`: Runs the built production bundle from `dist/server.cjs`.

### Backend
- `python manage.py runserver 8000`: Runs Django API server on port 8000.
- `python manage.py makemigrations`: Prepares new database migration files.
- `python manage.py migrate`: Applies pending migrations to the database.

---

## 📄 License
This project is proprietary and maintained for MIND2I workshop, training, and bootcamp programs.
