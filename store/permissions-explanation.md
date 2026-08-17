# RewriteAI - Chrome Permissions Justification

This document details why each permission declared in `manifest.json` is strictly necessary to provide the core functionality of RewriteAI, ensuring compliance with Chrome Web Store Minimal Permissions policies.

---

### Declared Extension Permissions

| Permission | Technical Requirement & Purpose |
| :--- | :--- |
| **`activeTab`** | Required to detect text selected by the user on the currently active webpage when the user presses `Ctrl + Shift + R` or clicks the extension action icon. Does not grant background access to other tabs. |
| **`contextMenus`** | Required to register the "✨ Rewrite with RewriteAI" item in Chrome's right-click context menu for highlighted text. |
| **`storage`** | Required to persist user preferences locally on the user's machine using `chrome.storage.local` (theme setting, default mode, backend URL, and optional recent rewrite history). |
| **`scripting`** | Required to support in-page text replacement in textareas, input fields, and contenteditable containers (such as Gmail, Notion, and Slack) without modifying unrelated page structures. |
| **`commands`** | Required to bind and listen to the user-configurable global shortcut `Ctrl + Shift + R` / `Cmd + Shift + R`. |

---

### Host Permissions Policy

```json
"host_permissions": [
  "https://*/*"
]
```

* **Purpose**: Allows the background service worker and extension popup to send text rewriting requests to the public HTTPS backend (e.g., `https://your-render-service.onrender.com/api/rewrite`). The `https://*/*` scope is the minimum required to cover any hosted backend URL the user may configure, while restricting all traffic to HTTPS only (no plain HTTP in production).
* **Content Scripts**: Content script matches specify `<all_urls>` solely to listen for text selection events and display the in-page floating rewrite button near highlighted text. No remote code or third-party tracking scripts are ever loaded.
* **No HTTP in Production**: The extension configuration (`config.js`) enforces `PRODUCTION_API_URL` as an HTTPS URL. The `http://localhost:3000` development URL is used only during local development and is never active in the published Chrome Web Store build.

