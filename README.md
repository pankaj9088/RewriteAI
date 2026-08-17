# ✨ RewriteAI — AI-Powered Chrome Extension & Production Backend

<div align="center">

![RewriteAI Banner](extension/icons/icon128.png)

**RewriteAI** is a privacy-focused, AI-powered writing, grammar correction, and tone rewriting assistant. Built on **Chrome Extension Manifest V3**, powered by **Google Gemini** (with multi-engine OpenRouter support), and backed by an **Express.js** production service hosted on **Render**.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Manifest V3](https://img.shields.io/badge/Chrome-Manifest%20V3-brightgreen.svg)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Backend: Live](https://img.shields.io/badge/Backend-Render%20Live-success)](https://rewriteai-jiff.onrender.com/health)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-green.svg)](https://nodejs.org/)

[Live Backend Health](https://rewriteai-jiff.onrender.com/health) • [Privacy Policy](PRIVACY.md) • [Chrome Web Store Asset Guide](store/detailed-description.txt)

</div>

---

## 🚀 Features

* **⚡ Instant In-Page Trigger**: Select any text on any webpage to reveal the floating **✨ Rewrite** badge.
* **💼 9 Specialized Rewriting Modes**:
  1. **Improve Grammar**: Fixes spelling, punctuation, syntax, and phrasing mistakes while preserving voice.
  2. **Professional**: Elevates drafts into diplomatic, executive-ready communication.
  3. **Friendly**: Warms up messages to be approachable, positive, and conversational.
  4. **Formal**: Polished vocabulary for academic papers, legal notices, and official letters.
  5. **Concise**: Cuts filler and redundancy for direct, punchy sentences.
  6. **Expand**: Elaborates ideas with richer context, details, and smoother flow.
  7. **Paraphrase**: Provides fresh vocabulary and alternate sentence structures.
  8. **Translate**: Fast and fluent translations into Spanish, French, German, Japanese, and more.
  9. **Custom Prompt**: Transform text with custom persona instructions.
* **🔄 In-Place Replacement**: Replaces selected text directly inside `<textarea>`, `<input>`, and `contenteditable` editors (Gmail, Notion, Slack, Docs) with automatic clipboard fallback.
* **⌨️ Global Shortcut**: Press <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>R</kbd> (or <kbd>Cmd</kbd> + <kbd>Shift</kbd> + <kbd>R</kbd> on macOS) to instantly rewrite highlighted text.
* **🖱️ Right-Click Context Menu**: Select text → right-click → **"✨ Rewrite with RewriteAI"**.
* **🌓 Dark & Light Mode**: Seamless theme switching that respects system preferences.
* **🔒 Zero-Exposure Security**: Your private Gemini/OpenRouter API key remains securely on the backend server—never exposed to browser extensions or client inspect tools.

---

## 🏗️ Architecture

```text
┌──────────────────────────────────────────────────────────────┐
│ Chrome Extension (Manifest V3)                               │
│ ├─ config.js (Points to live Render HTTPS backend)           │
│ ├─ content.js (Shadow DOM UI, Selection Detector)            │
│ ├─ popup.js / popup.html (Full Extension Controls)           │
│ └─ background.js (Service Worker & Context Menus)            │
└──────────────────────────────┬───────────────────────────────┘
                               │ HTTPS POST /api/rewrite (JSON)
                               ▼
┌──────────────────────────────────────────────────────────────┐
│ Public HTTPS Backend Server (Render.com)                     │
│ ├─ URL: https://rewriteai-jiff.onrender.com                  │
│ ├─ GET /health  ───>  {"status": "ok"}                       │
│ ├─ POST /api/rewrite                                         │
│ ├─ Origin & CORS Validation (chrome-extension:// support)    │
│ ├─ Rate Limiting (60 requests/minute per IP)                 │
│ ├─ Input Validation (15,000 characters limit)                │
│ └─ Dual-Engine Gemini & OpenRouter Adapter                   │
└──────────────────────────────┬───────────────────────────────┘
                               │ Private Key Auth (Server-side)
                               ▼
┌──────────────────────────────────────────────────────────────┐
│ Google Gemini API / OpenRouter AI Gateway                    │
│ Key: process.env.GEMINI_API_KEY (Server Environment Only)     │
└──────────────────────────────────────────────────────────────┘
```

---

## 📁 Repository Structure

```text
rewriteai/
├── extension/                       # Chrome Extension (Manifest V3 - Production)
│   ├── manifest.json                # Manifest configuration with minimal permissions
│   ├── config.js                    # Production HTTPS endpoint configuration
│   ├── background.js                # Service worker (context menus, shortcuts, API proxy)
│   ├── content.js                   # Selection listener, Shadow DOM widget, in-page editor
│   ├── content.css                  # Content script styles
│   ├── popup.html                   # Extension popup interface
│   ├── popup.js                     # Popup state logic, history, settings, dark mode
│   ├── popup.css                    # Modern Editorial styling (light/dark themes)
│   └── icons/                       # Extension icon set (16x16, 32x32, 48x48, 128x128 PNG)
│
├── server/                          # Backend Express Service (Deployable to Render)
│   ├── package.json                 # Standalone backend package file
│   ├── server.js                    # Express app & standalone startup listener
│   ├── controllers/
│   │   └── rewriteController.js     # Orchestrates AI rewrites & token calculations
│   ├── middleware/
│   │   ├── corsMiddleware.js        # Strict CORS filtering for extensions and domains
│   │   ├── rateLimiter.js           # IP-based rate limiting (60 requests/min)
│   │   ├── requestValidator.js      # Input length validation (15,000 chars) & mode sanitation
│   │   └── errorHandler.js          # Privacy-safe error handling without exposing secrets
│   ├── routes/
│   │   └── rewrite.js               # POST /api/rewrite route handler
│   └── services/
│       └── geminiService.js         # Dual-engine Google Gen AI & OpenRouter SDK integration
│
├── store/                           # Chrome Web Store submission package
│   ├── short-description.txt        # Concise store tagline
│   ├── detailed-description.txt     # Complete store listing markdown
│   ├── privacy-policy.md            # Privacy policy for users
│   └── permissions-explanation.md   # Justification of requested permissions
│
├── RewriteAI-Chrome-Extension.zip   # Ready-to-publish Web Store bundle
├── LICENSE                          # MIT License
├── PRIVACY.md                       # Comprehensive privacy documentation
└── README.md                        # Documentation & setup guide
```

---

## 📥 Download and Install RewriteAI

1. Download `RewriteAI-Chrome-Extension.zip` from GitHub Releases or the repository root.
2. Extract the ZIP file to a folder on your computer.
3. Open Google Chrome and navigate to: `chrome://extensions`
4. Enable **Developer mode** using the toggle switch in the top-right corner.
5. Click the **"Load unpacked"** button in the top-left toolbar.
6. Select the extracted extension folder (containing `manifest.json`).
7. Pin **RewriteAI** to your Chrome toolbar for easy access.
8. Select any text on any webpage and click the floating **✨ Rewrite** badge (or press <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>R</kbd>).

---

## 🔧 Troubleshooting

### 1. Backend Connection Failure
* **Symptom**: The extension status dot is gray/red, or it shows *"Backend Offline"*.
* **Solution**:
  - The production backend is hosted on Render Free Tier (`https://rewriteai-jiff.onrender.com`). If the server was idle, Render automatically spins it down. The first request may take ~30–50 seconds to wake up.
  - Visit [`https://rewriteai-jiff.onrender.com/health`](https://rewriteai-jiff.onrender.com/health) directly in your browser. Once it returns `{"status":"ok"}`, the server is active.
  - In the extension popup, click **⚙️ Settings** → **"Test Backend Health"** to refresh connection status.

### 2. Extension Errors or Unresponsive UI
* **Symptom**: The popup doesn't open or actions fail to trigger.
* **Solution**:
  - Go to `chrome://extensions`.
  - Look for an **"Errors"** button on the RewriteAI card. If present, click it to see details.
  - Click the **🔄 Reload icon** on the RewriteAI extension card to restart the background service worker.

### 3. Reloading the Extension after Updates
* Whenever files or configurations are updated:
  1. Open `chrome://extensions`.
  2. Locate **RewriteAI**.
  3. Click the circular **Reload (🔄)** icon on the card.
  4. Refresh any open webpages so the content script re-injects.

### 4. Restricted Chrome Pages
* **Important Note**: Google Chrome strictly prevents all browser extensions from running content scripts on:
  - `chrome://` internal pages (e.g. `chrome://extensions`, `chrome://settings`, `chrome://newtab`)
  - `edge://` or `about:blank` system tabs
  - The official **Chrome Web Store** (`chromewebstore.google.com`)
* On these restricted pages, the floating button cannot be injected. Simply test the extension on any regular public website (e.g. `wikipedia.org`, `github.com`, `google.com`, or any email/blog).

---

The extension is already pre-configured to connect to the live production backend (`https://rewriteai-jiff.onrender.com`). If you wish to run your own local development server:

1. Navigate to the `server/` directory:
   ```bash
   cd server
   ```
2. Copy the environment template:
   ```bash
   cp .env.example .env
   ```
3. Add your Gemini or OpenRouter key in `server/.env`:
   ```env
   PORT=3000
   GEMINI_API_KEY=your_actual_api_key_here
   NODE_ENV=development
   ```
4. Install dependencies and start the server:
   ```bash
   npm install
   npm start
   ```
5. Test the local backend:
   ```bash
   # Health check
   curl http://localhost:3000/health

   # Rewrite test
   curl -X POST http://localhost:3000/api/rewrite \
     -H "Content-Type: application/json" \
     -d '{"text": "this is an example of bad grammer", "mode": "grammar"}'
   ```

---

## ☁️ Production Deployment on Render

The backend is configured as a standalone service ready for [Render](https://render.com):

| Setting | Value |
|---|---|
| **Root Directory** | `server` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Environment Variables** | `GEMINI_API_KEY`, `NODE_ENV=production` |

Live Health Endpoint:
```bash
curl https://rewriteai-jiff.onrender.com/health
```
Response:
```json
{
  "status": "ok"
}
```

---

## 📦 Packaging for Chrome Web Store

The ready-to-upload ZIP package is generated directly from the `extension/` folder:

**Windows (PowerShell):**
```powershell
Compress-Archive -Path "extension\*" -DestinationPath "RewriteAI-Chrome-Extension.zip" -Force
```

**macOS / Linux:**
```bash
cd extension && zip -r ../RewriteAI-Chrome-Extension.zip * -x ".*"
```

The resulting `RewriteAI-Chrome-Extension.zip` has `manifest.json` at the root and contains zero secrets or backend files.

---

## 🔒 Privacy & Security

* **No Browsing History**: We never monitor, log, or track your browsing activity, page navigation, or visited URLs.
* **No Keystroke Logging**: The extension only reads text that you explicitly select and submit for rewriting.
* **Zero Client-Side Key Exposure**: API keys are never bundled in extension files or stored in client storage.
* **Ephemeral Processing**: Text sent to the backend is held in memory only for the duration of the API call and immediately discarded.
* **Local Storage**: User preferences (theme, default mode, optional rewrite history) reside strictly in `chrome.storage.local`.

Read our full [Privacy Policy](PRIVACY.md).

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.
