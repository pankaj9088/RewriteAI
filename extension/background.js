/**
 * RewriteAI - Background Service Worker (Manifest V3)
 */

try {
  importScripts('config.js');
} catch (e) {
  console.warn('[RewriteAI] Could not load config.js via importScripts:', e);
}

// Fallback config if config.js is not loaded
const DEFAULT_CONFIG = typeof self.CONFIG !== 'undefined' ? self.CONFIG : {
  API_BASE_URL: 'https://rewriteai-jiff.onrender.com',
  isPlaceholder: () => false,
};

// Initialize context menus and default settings upon installation
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'rewrite-with-rewriteai',
    title: '✨ Rewrite with RewriteAI',
    contexts: ['selection'],
  });

  // Initialize storage defaults
  chrome.storage.local.get(['backendUrl', 'defaultMode', 'theme'], (result) => {
    if (!result.backendUrl) {
      chrome.storage.local.set({ backendUrl: DEFAULT_CONFIG.API_BASE_URL });
    }
    if (!result.defaultMode) {
      chrome.storage.local.set({ defaultMode: 'grammar' });
    }
    if (!result.theme) {
      chrome.storage.local.set({ theme: 'system' });
    }
  });

  console.log('[RewriteAI] Background service worker initialized.');
});

// Helper to detect restricted URLs where content scripts cannot execute
function isRestrictedUrl(url) {
  if (!url) return true;
  const restrictedProtocols = ['chrome:', 'edge:', 'about:', 'chrome-extension:', 'devtools:', 'view-source:'];
  return (
    restrictedProtocols.some((protocol) => url.startsWith(protocol)) ||
    url.startsWith('https://chrome.google.com/webstore') ||
    url.startsWith('https://chromewebstore.google.com')
  );
}

// Safe tab messaging wrapper that handles chrome.runtime.lastError
function safeSendTabMessage(tabId, message, callback) {
  try {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      const lastError = chrome.runtime.lastError; // Accessing clears unhandled error
      if (callback) {
        callback(response, lastError);
      }
    });
  } catch (err) {
    if (callback) {
      callback(null, err);
    }
  }
}

// Handle Context Menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'rewrite-with-rewriteai' && info.selectionText) {
    const selectedText = info.selectionText.trim();

    // Store selection in local storage
    chrome.storage.local.set({
      selectedText,
      timestamp: Date.now(),
      source: 'contextMenu',
    }, () => {
      // Notify active tab content script safely
      if (tab && tab.id && !isRestrictedUrl(tab.url)) {
        safeSendTabMessage(tab.id, {
          action: 'OPEN_REWRITE_MODAL',
          text: selectedText,
        });
      }
    });
  }
});

// Handle Keyboard Shortcuts (commands)
chrome.commands.onCommand.addListener((command) => {
  if (command === 'rewrite-selected-text') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (activeTab && activeTab.id && !isRestrictedUrl(activeTab.url)) {
        safeSendTabMessage(activeTab.id, {
          action: 'TRIGGER_KEYBOARD_REWRITE',
        });
      }
    });
  }
});

// Handle Messages from Content Scripts and Popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'REWRITE_TEXT') {
    handleRewriteRequest(request.payload)
      .then((data) => sendResponse({ success: true, data }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true; // Keep message channel open for async response
  }

  if (request.action === 'CHECK_BACKEND_HEALTH') {
    checkBackendHealth(request.url)
      .then((status) => sendResponse({ success: true, status }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (request.action === 'SAVE_SELECTION') {
    chrome.storage.local.set({
      selectedText: request.text,
      timestamp: Date.now(),
      source: request.source || 'selection',
    }, () => {
      sendResponse({ success: true });
    });
    return true;
  }
});

/**
 * Executes rewrite request to the configured backend API
 */
async function handleRewriteRequest(payload) {
  const settings = await chrome.storage.local.get(['backendUrl']);
  const activeUrl = settings.backendUrl || DEFAULT_CONFIG.API_BASE_URL;

  if (DEFAULT_CONFIG.isPlaceholder(activeUrl)) {
    throw new Error(
      'Backend URL is still set to placeholder. Please deploy your backend to Render and set your HTTPS URL in config.js or extension settings.'
    );
  }

  return await executeRewriteFetch(activeUrl, payload);
}

async function executeRewriteFetch(baseUrl, payload) {
  const cleanUrl = baseUrl.replace(/\/$/, '');
  const endpoint = `${cleanUrl}/api/rewrite`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 35000); // 35-second timeout

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: payload.text,
        mode: payload.mode || 'grammar',
        customInstruction: payload.customInstruction || '',
        targetLanguage: payload.targetLanguage || 'Spanish',
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMessage = `Server responded with status ${response.status}`;
      try {
        const errJson = await response.json();
        errorMessage = errJson.error || errorMessage;
      } catch {
        const errText = await response.text();
        if (errText) errorMessage = errText;
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Rewrite request timed out after 35 seconds. Please check your backend connection.');
    }
    throw err;
  }
}

/**
 * Checks if the backend server is reachable and online
 */
async function checkBackendHealth(customUrl) {
  const settings = await chrome.storage.local.get(['backendUrl']);
  const baseUrl = (customUrl || settings.backendUrl || DEFAULT_CONFIG.API_BASE_URL).replace(/\/$/, '');

  if (DEFAULT_CONFIG.isPlaceholder(baseUrl)) {
    throw new Error('Placeholder URL. Please enter your deployed backend URL.');
  }

  // Try standard /health first, fallback to /api/health
  try {
    const response = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    if (response.ok) {
      return await response.json();
    }
  } catch {
    // try /api/health
  }

  const response = await fetch(`${baseUrl}/api/health`, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Health check failed (HTTP ${response.status})`);
  }

  return await response.json();
}

