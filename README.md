# RewriteAI — AI-Powered Chrome Extension & Production Backend

**RewriteAI** is an AI-powered grammar correction and tone rewriting assistant built on Chrome Extension Manifest V3, powered by Google Gemini (using the `@google/genai` TypeScript/JavaScript SDK), and backed by a hardened Express backend service ready for cloud hosting (Render, Railway, Fly.io, Cloud Run).

When you select text anywhere on the web (Google Docs, Notion, Gmail, Slack, forms, social media, or articles), RewriteAI provides:
- A floating **✨ Rewrite** badge near your selection
- Quick right-click context menu: **"✨ Rewrite with RewriteAI"**
- Global keyboard shortcut: <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>R</kbd> (or <kbd>Cmd</kbd> + <kbd>Shift</kbd> + <kbd>R</kbd> on macOS)
- In-place text replacement across `<textarea>`, `<input>`, and `contenteditable` elements with automatic clipboard fallback
- Full-featured extension popup with 9 specialized rewriting modes, dark/light themes, and opt-in local history.

---

## 1. Project Directory Structure

```text
rewrite-ai/
├── .env.example                     # Environment variables template (GEMINI_API_KEY)
├── .gitignore                       # Git ignore list
├── metadata.json                    # Application metadata
├── package.json                     # Root project dependencies & scripts
├── tsconfig.json                    # TypeScript compiler configuration
├── vite.config.ts                   # Vite configuration
├── server.ts                        # Development server entry point
├── PRIVACY.md                       # Complete privacy & zero-exposure policy
├── README.md                        # Documentation & deployment guide
│
├── extension/                       # Chrome Extension (Manifest V3 - Production)
│   ├── manifest.json                # Manifest V3 configuration with minimal permissions
│   ├── config.js                    # Centralized production HTTPS backend config & dev toggle
│   ├── background.js                # Service worker for context menus, commands & API dispatch
│   ├── content.js                   # Selection listener, Shadow DOM floating button, in-page replacement
│   ├── content.css                  # Content script styles
│   ├── popup.html                   # Extension popup interface
│   ├── popup.js                     # Popup state logic, history, settings, dark mode
│   ├── popup.css                    # Popup styling (light/dark themes)
│   └── icons/                       # Extension icons (16x16, 32x32, 48x48, 128x128 PNG & SVG)
│       ├── icon16.png
│       ├── icon32.png
│       ├── icon48.png
│       ├── icon128.png
│       └── icon.svg
│
├── server/                          # Backend Express Application (Deployable to Cloud)
│   ├── package.json                 # Standalone backend package file (Node.js >= 18)
│   ├── server.js                    # Express app definition & standalone startup listener
│   ├── controllers/
│   │   └── rewriteController.js     # Orchestrates Gemini rewrites & token calculations
│   ├── middleware/
│   │   ├── corsMiddleware.js        # Strict CORS filtering for extensions and domains
│   │   ├── rateLimiter.js           # IP-based rate limiting (60 requests/min)
│   │   ├── requestValidator.js      # Input length validation (15,000 chars) & mode sanitation
│   │   └── errorHandler.js          # Privacy-safe error handling without exposing secrets
│   ├── routes/
│   │   └── rewrite.js               # POST /api/rewrite route handler
│   └── services/
│       └── geminiService.js         # Isolated Google Gen AI SDK integration (@google/genai)
│
├── store/                           # Chrome Web Store submission assets
│   ├── short-description.txt        # 132-character concise store tagline
│   ├── detailed-description.txt     # Complete markdown store listing description
│   ├── privacy-policy.md            # Store-hosted privacy policy
│   └── permissions-explanation.md   # Justification of all requested Chrome permissions
│
└── src/                             # Interactive Web Studio & Live Extension Sandbox
    ├── App.tsx                      # Main Studio app with interactive playground & guides
    ├── main.tsx                     # React client entry point
    ├── index.css                    # Tailwind CSS definitions
    ├── types.ts                     # TypeScript shared type declarations
    └── components/                  # UI Sub-components
        ├── Header.tsx               # Studio header with backend health indicators
        ├── SimulatedWebpage.tsx     # In-browser simulated webpage sandbox (Email, Slack, Article)
        ├── ExtensionPopupSimulator.tsx # Pixel-accurate interactive extension popup simulator
        ├── ApiTester.tsx            # Interactive API explorer & cURL generator
        ├── InstallationGuide.tsx    # Step-by-step Chrome installation walkthrough
        ├── FileViewer.tsx           # Interactive source code & directory inspector
        └── DownloadZipButton.tsx    # One-click client-side zip exporter for extension
```

---

## 2. Architecture & Security Model

```text
┌──────────────────────────────────────────────────────────────┐
│ Chrome Extension (Manifest V3)                               │
│ ├─ config.js (Centralized HTTPS backend URL)                 │
│ ├─ content.js (Shadow DOM UI, Selection Detector)            │
│ ├─ popup.js / popup.html (Full Extension Controls)           │
│ └─ background.js (Service Worker & Context Menus)            │
└──────────────────────────────┬───────────────────────────────┘
                               │ HTTPS POST /api/rewrite (JSON)
                               ▼
┌──────────────────────────────────────────────────────────────┐
│ Public HTTPS Backend Server (Render / Railway / Cloud Run)   │
│ ├─ Root Directory: /server                                   │
│ ├─ GET /health  ───>  {"status": "ok"}                       │
│ ├─ POST /api/rewrite                                         │
│ ├─ CORS & Origin Validation (chrome-extension:// support)    │
│ ├─ Rate Limiting (60 requests/minute per IP)                 │
│ ├─ Input Sanitation (1–15,000 characters limit)              │
│ └─ Isolated geminiService.js                                 │
└──────────────────────────────┬───────────────────────────────┘
                               │ Official @google/genai SDK
                               ▼
┌──────────────────────────────────────────────────────────────┐
│ Google Gemini API (gemini-3.6-flash with auto-fallback)      │
│ Private Key: process.env.GEMINI_API_KEY                      │
└──────────────────────────────────────────────────────────────┘
```

> **Zero-Exposure Security Guarantee**: The private Gemini API key is **never** bundled into the Chrome extension package, popup code, or client storage. All AI inference is proxied securely through your HTTPS backend.

---

## 3. Local Development Setup

### Step 1: Install Dependencies
```bash
# Install root project dependencies
npm install
```

### Step 2: Configure Local Environment
Create `.env` in the root directory:
```env
PORT=3000
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

### Step 3: Run Development Server
```bash
npm run dev
```
The server will start on `http://localhost:3000`.

### Step 4: Test Local Backend
```bash
# Health check
curl http://localhost:3000/health

# Rewrite test
curl -X POST http://localhost:3000/api/rewrite \
  -H "Content-Type: application/json" \
  -d '{"text": "this is a example of bad grammer", "mode": "grammar"}'
```

---

## 4. Production Deployment to Render (Step-by-Step)

Follow these exact steps to host your backend on [Render.com](https://render.com) for free:

### Step 1: Push Project to GitHub
```bash
git init
git add .
git commit -m "feat: production ready RewriteAI backend and Chrome extension"
git branch -M main
git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPO_NAME>.git
git push -u origin main
```

### Step 2: Create a New Web Service on Render
1. Log in to your [Render Dashboard](https://dashboard.render.com/).
2. Click **"New +"** and select **"Web Service"**.
3. Choose **"Build and deploy from a Git repository"** and select your `rewrite-ai` repository.

### Step 3: Configure Render Web Service Settings
Fill in the configuration fields:
* **Name**: `rewriteai-backend` (or any unique name, e.g. `rewriteai-api`)
* **Region**: Choose the region closest to your users (e.g. `Oregon (US West)` or `Frankfurt (EU)`)
* **Branch**: `main`
* **Root Directory**: `server` *(Important: sets the build and run context to the backend folder)*
* **Runtime**: `Node`
* **Build Command**: `npm install`
* **Start Command**: `node server.js` (or `npm start`)
* **Instance Type**: `Free`

### Step 4: Add Environment Variables on Render
Scroll down to the **"Environment Variables"** section and add:
* `GEMINI_API_KEY`: `your_actual_gemini_api_key` (Get one from [Google AI Studio](https://aistudio.google.com/app/apikey))
* `NODE_ENV`: `production`
* `ALLOWED_ORIGINS` (optional): Leave blank or specify custom domain names separated by commas.

### Step 5: Deploy & Obtain Your Public HTTPS URL
1. Click **"Create Web Service"**.
2. Wait for Render to install packages and start the server (usually takes 1–2 minutes).
3. Once deployed, Render will provide your public HTTPS URL at the top of the dashboard:
   ```text
   https://rewriteai-backend-xxxx.onrender.com
   ```

### Step 6: Verify Backend Health in Production
Open your browser or terminal to verify:
```bash
curl https://rewriteai-backend-xxxx.onrender.com/health
```
Expected response:
```json
{
  "status": "ok"
}
```

And verify the API rewrite endpoint:
```bash
curl -X POST https://rewriteai-backend-xxxx.onrender.com/api/rewrite \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello world, please check this rewrite.", "mode": "professional"}'
```

---

## 5. Linking Extension to Production Backend

Once your backend is live on Render:

1. Open `extension/config.js`.
2. Update `PRODUCTION_API_URL` with your Render URL:
   ```javascript
   const CONFIG = {
     ENV: 'production',
     PRODUCTION_API_URL: 'https://rewriteai-backend-xxxx.onrender.com',
     DEVELOPMENT_API_URL: 'http://localhost:3000',
     // ...
   };
   ```
3. Save the file.

---

## 6. Testing Extension Locally in Google Chrome

1. Open Google Chrome and go to `chrome://extensions`.
2. Enable **Developer mode** using the toggle switch in the top-right corner.
3. Click the **"Load unpacked"** button in the top-left toolbar.
4. Select the `extension/` directory from your project folder.
5. The **RewriteAI** icon will appear in your Chrome extensions bar.
6. Click the extension icon → Click the **⚙️ Settings** icon → Click **"Test Backend Health"** to verify connection to your live Render backend!

---

## 7. Packaging for Chrome Web Store

To create the final ZIP file for the Chrome Web Store:

### Option A: One-Click Export from the Studio App
1. Open the RewriteAI Web Studio interface in your browser.
2. Click **"Export Extension (ZIP)"** in the top navigation bar.
3. Your browser will download `RewriteAI-Chrome-Extension.zip` containing only the clean extension assets.

### Option B: Manual ZIP Creation
From your terminal:
```bash
# On macOS / Linux:
cd extension
zip -r ../RewriteAI-Chrome-Extension.zip * -x ".*"

# On Windows (PowerShell):
cd extension
Compress-Archive -Path * -DestinationPath ..\RewriteAI-Chrome-Extension.zip -Force
```

### ⚠️ ZIP Integrity Verification:
Ensure your ZIP contains:
- `manifest.json` *(at the root of the ZIP)*
- `config.js`
- `background.js`
- `content.js`
- `content.css`
- `popup.html`
- `popup.js`
- `popup.css`
- `icons/` (`icon16.png`, `icon32.png`, `icon48.png`, `icon128.png`, `icon.svg`)

**Must NOT contain**: `server/`, `.env`, `node_modules/`, or any API keys.

---

## 8. Production Testing Checklist

| # | Test Case | Target / Step | Expected Result | Status |
| :-: | :--- | :--- | :--- | :-: |
| 1 | **Backend Health Check** | `GET /health` on Render | Returns `{"status":"ok"}` with HTTP 200 | [ ] |
| 2 | **API Rewrite Execution** | `POST /api/rewrite` with valid text & mode | Returns `{ "result": "...", "mode": "professional" }` | [ ] |
| 3 | **Input Validation** | `POST /api/rewrite` with empty text `""` | Returns HTTP 400 with `{ "code": "EMPTY_TEXT" }` | [ ] |
| 4 | **Rate Limiting** | Send >60 rapid requests from single IP | Returns HTTP 429 `{ "code": "TOO_MANY_REQUESTS" }` | [ ] |
| 5 | **CORS Security** | Request from `chrome-extension://*` & HTTPS origins | Handled cleanly with preflight OPTIONS 204 | [ ] |
| 6 | **Floating In-Page Trigger** | Highlight text on any public webpage | Floating **✨ Rewrite** badge appears within 150ms | [ ] |
| 7 | **In-Page Replacement** | Rewrite text in `<textarea>` or `<input>` | Replaces selected text in place and dispatches input events | [ ] |
| 8 | **Context Menu & Shortcut** | Right click or <kbd>Ctrl+Shift+R</kbd> | Opens RewriteAI modal directly with selected text | [ ] |
| 9 | **Popup Settings & Themes** | Toggle Light/Dark and test backend health | UI updates immediately and state persists in `chrome.storage.local` | [ ] |
| 10 | **ZIP Package Cleanliness** | Inspect `RewriteAI-Chrome-Extension.zip` | Contains `manifest.json` at root; 0 server files or secrets | [ ] |

---

## 9. Chrome Web Store Publishing Guide

1. Go to the [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole).
2. Click **"New Item"** and upload `RewriteAI-Chrome-Extension.zip`.
3. Fill in store metadata:
   - **Title**: `RewriteAI - AI Grammar & Text Rewriting Assistant`
   - **Summary**: Copy from `store/short-description.txt`
   - **Detailed Description**: Copy from `store/detailed-description.txt`
   - **Category**: `Productivity / Workflow`
   - **Privacy Policy**: Provide URL to your hosted `PRIVACY.md`
   - **Single Purpose**: *"AI-powered text rewriting and grammar correction using Google Gemini."*
   - **Permission Justifications**: Reference `store/permissions-explanation.md`
4. Submit for review!

---

## License
Apache-2.0 © 2026 RewriteAI.
