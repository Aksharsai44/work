# MIND2I Workshop & Bootcamp Hub — Deployment Guide

This guide details how to deploy the fullstack **MIND2I Workshop & Bootcamp Hub** application to production directly from the GitHub repository:  
**[`https://github.com/Aksharsai44/work.git`](https://github.com/Aksharsai44/work.git)**

---

## Architecture Overview

- **Frontend (`frontend/`)**: React 19 + TypeScript + Vite + Express reverse proxy running on Node 20.
- **Backend (`backend/`)**: Django 5 + Django REST Framework + Gunicorn + WhiteNoise static files.
- **Database**: PostgreSQL with automatic schema migrations.

---

## Option 1: Render.com (Recommended — 1-Click Blueprint)

The repository includes a ready-to-use [`render.yaml`](./render.yaml) blueprint that automatically provisions the PostgreSQL database, Django backend, and Node frontend.

### Step 1: Sign Up / Log In to Render
1. Go to [Render.com](https://render.com) and log in (or sign up with your GitHub account).

### Step 2: Create a New Blueprint
1. In the Render Dashboard, click the **"New +"** button in the top right.
2. Select **"Blueprint"**.
3. Connect your GitHub repository: `Aksharsai44/work`.
4. Render will detect the `render.yaml` file and display the planned resources:
   - **`mind2i-db`** (Managed PostgreSQL Database)
   - **`mind2i-backend`** (Python Web Service)
   - **`mind2i-frontend`** (Node.js Web Service)

### Step 3: Configure Environment Variables
1. Render will prompt you for any unset environment variables:
   - `GEMINI_API_KEY`: Enter your Google Gemini API key (from [Google AI Studio](https://aistudio.google.com/)).
2. Click **"Apply"**.

### Step 4: Access Your Live Application
- Once the build succeeds, open the URL provided by the `mind2i-frontend` service (e.g. `https://mind2i-frontend.onrender.com`).
- The frontend reverse-proxies all `/api/*` and `/media/*` requests directly to the Django backend.

---

## Option 2: Railway

1. Sign in to [Railway.app](https://railway.app).
2. Click **"New Project"** -> **"Deploy from GitHub repo"**.
3. Select `Aksharsai44/work`.
4. Add a **PostgreSQL** plugin to your project.
5. In your **Backend** service settings:
   - Root Directory: `backend`
   - Build Command: `pip install -r requirements.txt && python manage.py collectstatic --no-input && python manage.py migrate`
   - Start Command: `gunicorn core.wsgi:application --bind 0.0.0.0:$PORT`
   - Add environment variables:
     - `DATABASE_URL`: `${{Postgres.DATABASE_URL}}`
     - `SECRET_KEY`: `<your-random-secret-key>`
     - `DEBUG`: `False`
     - `ALLOWED_HOSTS`: `*`
6. In your **Frontend** service settings:
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Add environment variables:
     - `NODE_ENV`: `production`
     - `DJANGO_BACKEND_URL`: `<URL of your Railway backend service>`
     - `GEMINI_API_KEY`: `<your-gemini-api-key>`

---

## Option 3: Docker / Cloud VPS (DigitalOcean, AWS, Hetzner, etc.)

If you have a Linux server with Docker and Docker Compose installed:

```bash
# 1. Clone the repository
git clone https://github.com/Aksharsai44/work.git
cd work

# 2. Set environment variables
export GEMINI_API_KEY="your_api_key_here"

# 3. Build and launch containers
docker compose up -d --build

# 4. Create Django Superuser (Optional)
docker compose exec backend python manage.py createsuperuser
```

The application will be accessible at `http://your-server-ip:3000`.

---

## Post-Deployment Checklist

1. **Create Admin User**:
   Run Django admin superuser creation in your cloud service shell:
   ```bash
   python manage.py createsuperuser
   ```
2. **Verify Gemini AI**:
   Navigate to the Live Q&A or Assignment generator and ensure AI response evaluation functions properly.
3. **Verify Static & Media Files**:
   Ensure images, logos, and uploaded resources load seamlessly via WhiteNoise and the frontend media streaming proxy.