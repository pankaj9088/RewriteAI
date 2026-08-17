# Privacy Policy for RewriteAI Chrome Extension

Last updated: August 17, 2026

RewriteAI ("we", "our", or "the extension") is committed to protecting your privacy. This Privacy Policy details our practices regarding data handling, text processing, and security.

---

## 1. Data Collection & Processing Principles

### What Data We Collect
* **User-Selected Text**: When you explicitly select text and click "Rewrite", choose a context menu action, or press the keyboard shortcut, the selected text is transmitted to your configured backend server for the sole purpose of AI transformation.
* **Locally Stored User Preferences**: Theme preferences (dark/light), selected default mode, and custom backend endpoint URLs are saved locally in `chrome.storage.local`.
* **Optional Rewrite History**: If history is enabled, recent transformation pairs (original text, rewritten text, timestamp, mode) are stored strictly on your local device in `chrome.storage.local`.

### What Data We DO NOT Collect
* **No Browsing History**: We never monitor, log, or track your browsing activity, page navigation, or visited URLs.
* **No Keystroke Logging**: We do not record background typing or unselected text.
* **No Personal Identity Tracking**: We do not collect names, email addresses, IP addresses, advertising IDs, or payment details.
* **No Third-Party Analytics / Trackers**: The extension contains zero third-party analytics trackers, telemetry scripts, or behavioral cookies.
* **No Data Selling**: We never sell, rent, monetize, or broker your text or personal data to any third parties or advertisers.

---

## 2. Gemini AI Processing & Security

* **Isolated Backend Proxy**: Text rewriting requests are sent from the extension directly to your self-hosted or managed Node.js backend.
* **Zero Client-Side Key Exposure**: The Gemini API key is securely stored in backend environment variables and is never exposed to the Chrome extension bundle or browser inspect tools.
* **Ephemerality**: Text sent to the backend is held in server memory only during the active Gemini API call duration (typically 300–800ms) and is immediately discarded. The server does not maintain databases of user text.

---

## 3. Storage & User Deletion Rights

* All stored data resides strictly in your browser's `chrome.storage.local`.
* **Clearing History**: You can purge all saved rewrite history at any time with a single click via the "Clear All" button in the extension popup.
* **Extension Removal**: Uninstalling RewriteAI completely and immediately purges all local storage and preferences from your browser.

---

## 4. Permissions Justification

* **`activeTab`**: Enables reading the highlighted text selection in the currently active tab when invoked.
* **`contextMenus`**: Allows providing a right-click "✨ Rewrite with RewriteAI" menu option.
* **`storage`**: Saves your local UI theme, mode preferences, and optional local history on your device.
* **`scripting`**: Injects the in-page floating rewrite button and handles safe text replacement in input/contenteditable fields.
* **`commands`**: Registers the `Ctrl + Shift + R` keyboard shortcut for fast access.

---

## 5. Contact & Inquiries

For questions, bug reports, or privacy inquiries regarding RewriteAI:
* Project Homepage: https://ai.studio
* Email Contact: support@rewriteai.local
