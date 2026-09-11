# MIND2I Frontend Application ⚡

React 19 + TypeScript + Vite frontend client for the MIND2I Workshop & Bootcamp Hub.

---

## 🚀 Running the Frontend Locally

### Prerequisites
- Node.js (v18+)
- npm or bun

### Setup Steps
1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy the environment file:
   ```bash
   cp .env.example .env
   ```
   *Make sure `GEMINI_API_KEY` is set in your `.env` file.*

3. Start the development server:
   ```bash
   npm run dev
   ```
   *The application will start on `http://localhost:3000`.*

---

## 📜 Available Scripts

- `npm run dev`: Runs the full-stack dev server (`tsx server.ts` with Vite middleware) on port 3000.
- `npm run build`: Type-checks and creates an optimized production build in `dist/`.
- `npm run lint`: Performs type validation with `tsc --noEmit`.
- `npm start`: Runs the production bundle from `dist/server.cjs`.

---

## 🧩 Key Architecture
- **In-Browser PPTX Parser**: Powered by `JSZip` to extract real slide XML, images, and text runs.
- **DOCX Parser**: Powered by `Mammoth`.
- **Code Execution**: Live browser & server-side sandboxed code testing across multiple languages.
- **State & Real-Time Sync**: Polling layer in `App.tsx` ensuring live classroom state is synced with the Django REST backend.
