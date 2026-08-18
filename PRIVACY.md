# Privacy & Security Policy for RewriteAI

RewriteAI processes text selected by the user to provide AI-powered grammar correction and tone rewriting via the Google Gemini API. This document outlines our data protection practices and commitments.

---

## 1. Data Collected
* **Selected Text for AI Processing**: Only the specific text snippet that you actively highlight and submit for rewriting is transmitted to the Node.js backend.
* **Local Device Settings**: UI theme (light/dark), selected default rewrite mode, target translation language, and backend server endpoint URL stored in `chrome.storage.local`.
* **Local Rewrite History (Optional)**: If you keep history enabled, your recent rewrite pairs (original and transformed text) are stored exclusively in your browser's local sandbox (`chrome.storage.local`).

---

## 2. Data NOT Collected
* **No Browsing History**: We never monitor, collect, or store URLs, visited domains, or navigation history.
* **No Background Keystroke Logging**: We never record background typing, password entries, form submissions, or unselected text.
* **No Personally Identifiable Information (PII)**: No account signup, email address, IP logging, or advertising IDs.
* **No Telemetry / Third-Party Trackers**: Zero tracking pixels, Google Analytics, or third-party behavioral beacons.
* **No Data Monetization**: We do not sell, rent, or trade your text or data.

---

## 3. Why Selected Text Is Processed
Selected text is processed solely to execute the rewrite mode you select (e.g. improve grammar, make professional, make concise, translate, or apply custom prompts) using the Gemini API.

---

## 4. How the Gemini API Is Used
* The Chrome Extension communicates with an Express backend server.
* The backend server authenticates with the Gemini API using a private server-side `GEMINI_API_KEY`.
* Text is processed securely over encrypted HTTPS connections.
* API keys are never bundled into or accessible by client extensions.

---

## 5. Storage Policy
* All persistent data is restricted to client-side `chrome.storage.local`.
* Backend servers process requests ephemerally in memory and do not persist user text to disks or external databases.

---

## 6. History Policy & User Deletion Rights
* Rewrite history can be reviewed, searched, or completely wiped at any time.
* Clicking "Clear All" in the popup history drawer immediately deletes all stored items.
* Uninstalling the extension automatically removes all stored data.

---

## 7. Security Practices
* **Zero Client-Side Key Exposure**: The Gemini API key remains isolated in backend environment variables.
* **Rate Limiting & Input Validation**: The backend enforces rate limits and max character constraints (15,000 chars) to prevent abuse and denial-of-service.
* **Minimal Extension Permissions**: Only essential Chrome APIs (`activeTab`, `contextMenus`, `storage`, `scripting`, `commands`) are requested.
* **Isolated Shadow DOM**: In-page floating widgets are rendered within a closed Shadow DOM container to prevent styles or scripts from leaking into host webpages.

---

## 8. Contact
For support or questions regarding privacy:
* Project: RewriteAI Assistant
* Support Email: sahpankajkumar690@gmail.com
