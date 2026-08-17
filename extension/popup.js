/**
 * RewriteAI - Extension Popup Script
 */

document.addEventListener('DOMContentLoaded', async () => {
  // DOM Elements
  const appContainer = document.getElementById('app');
  const sourceText = document.getElementById('source-text');
  const charCount = document.getElementById('char-count');
  const wordCount = document.getElementById('word-count');
  const pasteBtn = document.getElementById('paste-btn');
  const clearBtn = document.getElementById('clear-btn');
  
  const modesContainer = document.getElementById('modes-container');
  const modeCards = document.querySelectorAll('.mode-card');
  const translateField = document.getElementById('translate-field');
  const targetLanguage = document.getElementById('target-language');
  const customField = document.getElementById('custom-field');
  const customInstruction = document.getElementById('custom-instruction');

  const generateBtn = document.getElementById('generate-btn');
  const resultSection = document.getElementById('result-section');
  const resultModeBadge = document.getElementById('result-mode-badge');
  const resultStats = document.getElementById('result-stats');
  const resultContent = document.getElementById('result-content');
  const loadingOverlay = document.getElementById('loading-overlay');

  const copyResultBtn = document.getElementById('copy-result-btn');
  const replacePageBtn = document.getElementById('replace-page-btn');
  const regenerateBtn = document.getElementById('regenerate-btn');

  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const historyToggleBtn = document.getElementById('history-toggle-btn');
  const settingsToggleBtn = document.getElementById('settings-toggle-btn');
  const statusIndicator = document.getElementById('status-indicator');

  const historyDrawer = document.getElementById('history-drawer');
  const historyList = document.getElementById('history-list');
  const clearHistoryBtn = document.getElementById('clear-history-btn');
  const closeHistoryBtn = document.getElementById('close-history-btn');

  const settingsDrawer = document.getElementById('settings-drawer');
  const backendUrlInput = document.getElementById('backend-url-input');
  const testConnectionBtn = document.getElementById('test-connection-btn');
  const presetLocalBtn = document.getElementById('preset-local-btn');
  const presetCloudBtn = document.getElementById('preset-cloud-btn');
  const healthTestResult = document.getElementById('health-test-result');
  const closeSettingsBtn = document.getElementById('close-settings-btn');

  const popupToast = document.getElementById('popup-toast');

  let currentMode = 'grammar';
  let isGenerating = false;
  let lastRewriteData = null;

  // 1. Load initial settings and theme
  const appConfig = (typeof window.CONFIG !== 'undefined') ? window.CONFIG : {
    PRODUCTION_API_URL: 'https://YOUR_PUBLIC_BACKEND_URL',
    DEVELOPMENT_API_URL: 'http://localhost:3000',
    API_BASE_URL: 'https://YOUR_PUBLIC_BACKEND_URL',
    isPlaceholder: (url) => !url || url.includes('YOUR_PUBLIC_BACKEND_URL') || url.includes('YOUR-PUBLIC-BACKEND-URL'),
  };

  const stored = await getStorage(['theme', 'backendUrl', 'defaultMode', 'selectedText', 'rewriteHistory']);
  
  // Theme initialization
  const initialTheme = stored.theme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  applyTheme(initialTheme);

  // Backend URL initialization from config / storage
  let initialBackendUrl = stored.backendUrl;
  if (!initialBackendUrl) {
    initialBackendUrl = appConfig.API_BASE_URL;
    chrome.storage.local.set({ backendUrl: initialBackendUrl });
  }
  backendUrlInput.value = initialBackendUrl;

  // Default mode
  if (stored.defaultMode) {
    selectMode(stored.defaultMode);
  }

  // Load selected text if present from content script or context menu
  if (stored.selectedText && stored.selectedText.trim()) {
    sourceText.value = stored.selectedText.trim();
    updateTextStats();
  } else {
    // Try querying active tab directly for selection
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'GET_PAGE_SELECTION' }, (response) => {
          if (response && response.text && response.text.trim()) {
            sourceText.value = response.text.trim();
            updateTextStats();
          }
        });
      }
    });
  }

  // Initial health check
  checkHealth(backendUrlInput.value);

  // 2. Text input event listeners
  sourceText.addEventListener('input', updateTextStats);

  pasteBtn.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        sourceText.value = text;
        updateTextStats();
        showToast('📋 Pasted from clipboard');
      }
    } catch (e) {
      showToast('⚠️ Could not read clipboard');
    }
  });

  clearBtn.addEventListener('click', () => {
    sourceText.value = '';
    updateTextStats();
    resultSection.style.display = 'none';
  });

  // 3. Mode selector
  modeCards.forEach((card) => {
    card.addEventListener('click', () => {
      const mode = card.dataset.mode;
      selectMode(mode);
    });
  });

  function selectMode(mode) {
    currentMode = mode;
    modeCards.forEach((c) => {
      if (c.dataset.mode === mode) {
        c.classList.add('active');
      } else {
        c.classList.remove('active');
      }
    });

    translateField.style.display = mode === 'translate' ? 'flex' : 'none';
    customField.style.display = mode === 'custom' ? 'flex' : 'none';
  }

  // 4. Generate rewrite handler
  generateBtn.addEventListener('click', performRewrite);
  regenerateBtn.addEventListener('click', performRewrite);

  // Keyboard shortcut Ctrl+Enter / Cmd+Enter
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      performRewrite();
    }
  });

  async function performRewrite() {
    const text = sourceText.value.trim();
    if (!text) {
      showToast('⚠️ Please enter or select text to rewrite');
      sourceText.focus();
      return;
    }

    if (isGenerating) return;
    isGenerating = true;

    // Show loading state
    resultSection.style.display = 'flex';
    loadingOverlay.style.display = 'flex';
    generateBtn.disabled = true;
    generateBtn.querySelector('.btn-text').textContent = 'Rewriting...';

    const payload = {
      text,
      mode: currentMode,
      customInstruction: customInstruction.value.trim(),
      targetLanguage: targetLanguage.value,
    };

    try {
      // Send request through background service worker
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
          {
            action: 'REWRITE_TEXT',
            payload,
          },
          (res) => {
            if (chrome.runtime.lastError) {
              return reject(new Error(chrome.runtime.lastError.message));
            }
            resolve(res);
          }
        );
      });

      if (!response || !response.success) {
        throw new Error(response?.error || 'Failed to generate rewritten text.');
      }

      const data = response.data;
      lastRewriteData = data;

      // Update UI with rewritten result
      resultContent.textContent = data.result;
      resultModeBadge.textContent = formatModeLabel(data.mode);

      if (data.stats) {
        const diffWords = data.stats.resultWords - data.stats.originalWords;
        const diffSign = diffWords >= 0 ? `+${diffWords}` : `${diffWords}`;
        resultStats.textContent = `${diffSign} words (${data.stats.resultWords} total) • ${data.stats.durationMs || 0}ms`;
      } else {
        resultStats.textContent = `${data.result.split(/\s+/).filter(Boolean).length} words`;
      }

      // Save to history
      saveToHistory({
        original: text,
        result: data.result,
        mode: currentMode,
        timestamp: Date.now(),
      });

      showToast('✨ Rewrite complete!');
    } catch (err) {
      console.error('[RewriteAI Popup Error]', err);
      const isFetchErr = err.message.toLowerCase().includes('failed to fetch') || err.message.toLowerCase().includes('network');
      
      let errorHelp = `⚠️ Error: ${err.message}\n\n`;
      if (isFetchErr) {
        errorHelp += `Could not reach backend at ${backendUrlInput.value}.\n\n💡 Fix Options:\n1. If running locally, start server: npm run dev\n2. Click ⚙️ (top-right) and switch to Applet Cloud URL.`;
      } else {
        errorHelp += `Please check your backend logs and ensure GEMINI_API_KEY is configured.`;
      }

      resultContent.textContent = errorHelp;
      showToast('❌ Rewrite failed');
    } finally {
      loadingOverlay.style.display = 'none';
      generateBtn.disabled = false;
      generateBtn.querySelector('.btn-text').textContent = 'Generate Rewrite';
      isGenerating = false;
    }
  }

  // 5. Copy & Replace Actions
  copyResultBtn.addEventListener('click', async () => {
    const text = resultContent.textContent;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      copyResultBtn.classList.add('copied');
      copyResultBtn.querySelector('.tool-btn-label').textContent = 'Copied!';
      showToast('📋 Copied to clipboard!');
      setTimeout(() => {
        copyResultBtn.classList.remove('copied');
        copyResultBtn.querySelector('.tool-btn-label').textContent = 'Copy';
      }, 2000);
    } catch (err) {
      showToast('⚠️ Failed to copy');
    }
  });

  replacePageBtn.addEventListener('click', () => {
    const text = resultContent.textContent;
    if (!text) return;

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(
          tabs[0].id,
          { action: 'REPLACE_ACTIVE_SELECTION', text },
          (response) => {
            if (response && response.success) {
              showToast('✨ Text replaced on webpage!');
            } else {
              navigator.clipboard.writeText(text);
              showToast('📋 Text copied (element was read-only)');
            }
          }
        );
      }
    });
  });

  // 6. Drawers & Navigation
  themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
    chrome.storage.local.set({ theme: newTheme });
  });

  historyToggleBtn.addEventListener('click', () => {
    settingsDrawer.style.display = 'none';
    if (historyDrawer.style.display === 'none') {
      renderHistory();
      historyDrawer.style.display = 'flex';
    } else {
      historyDrawer.style.display = 'none';
    }
  });

  closeHistoryBtn.addEventListener('click', () => {
    historyDrawer.style.display = 'none';
  });

  clearHistoryBtn.addEventListener('click', () => {
    chrome.storage.local.set({ rewriteHistory: [] }, () => {
      renderHistory();
      showToast('🗑️ History cleared');
    });
  });

  function openSettings() {
    historyDrawer.style.display = 'none';
    settingsDrawer.style.display = 'flex';
  }

  statusIndicator.addEventListener('click', openSettings);

  settingsToggleBtn.addEventListener('click', () => {
    historyDrawer.style.display = 'none';
    settingsDrawer.style.display = settingsDrawer.style.display === 'none' ? 'flex' : 'none';
  });

  closeSettingsBtn.addEventListener('click', () => {
    settingsDrawer.style.display = 'none';
  });

  backendUrlInput.addEventListener('change', () => {
    const url = backendUrlInput.value.trim().replace(/\/$/, '');
    chrome.storage.local.set({ backendUrl: url });
    checkHealth(url);
    showToast('💾 Backend URL updated');
  });

  if (presetLocalBtn) {
    presetLocalBtn.addEventListener('click', () => {
      const localUrl = appConfig.DEVELOPMENT_API_URL || 'http://localhost:3000';
      backendUrlInput.value = localUrl;
      chrome.storage.local.set({ backendUrl: localUrl });
      checkHealth(localUrl);
      showToast('Set to Localhost (3000)');
    });
  }

  if (presetCloudBtn) {
    presetCloudBtn.addEventListener('click', () => {
      const prodUrl = appConfig.PRODUCTION_API_URL || 'https://YOUR_PUBLIC_BACKEND_URL';
      backendUrlInput.value = prodUrl;
      chrome.storage.local.set({ backendUrl: prodUrl });
      checkHealth(prodUrl);
      showToast('Set to Production HTTPS');
    });
  }

  testConnectionBtn.addEventListener('click', () => {
    checkHealth(backendUrlInput.value.trim());
  });

  // Helpers
  function updateTextStats() {
    const text = sourceText.value;
    const chars = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;

    charCount.textContent = `${chars} char${chars === 1 ? '' : 's'}`;
    wordCount.textContent = `${words} word${words === 1 ? '' : 's'}`;
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
  }

  async function checkHealth(url) {
    healthTestResult.textContent = 'Testing...';
    healthTestResult.className = 'health-status';

    try {
      const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: 'CHECK_BACKEND_HEALTH', url }, resolve);
      });

      if (response && response.success) {
        statusIndicator.className = 'backend-indicator online';
        statusIndicator.title = `Backend: Online (${url})`;
        healthTestResult.textContent = '✓ Connected & Online';
        healthTestResult.className = 'health-status ok';
      } else {
        throw new Error(response?.error || 'Offline');
      }
    } catch (err) {
      statusIndicator.className = 'backend-indicator offline';
      statusIndicator.title = `Backend: Offline (${err.message}) - Click to configure`;
      healthTestResult.textContent = `✗ Offline (${err.message})`;
      healthTestResult.className = 'health-status err';
    }
  }

  async function saveToHistory(item) {
    const { rewriteHistory = [] } = await getStorage(['rewriteHistory']);
    const updated = [item, ...rewriteHistory.slice(0, 19)]; // Keep latest 20
    chrome.storage.local.set({ rewriteHistory: updated });
  }

  async function renderHistory() {
    const { rewriteHistory = [] } = await getStorage(['rewriteHistory']);
    historyList.innerHTML = '';

    if (rewriteHistory.length === 0) {
      historyList.innerHTML = '<div class="empty-state">No rewrite history yet.</div>';
      return;
    }

    rewriteHistory.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'history-card';
      const timeStr = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      card.innerHTML = `
        <div class="history-card-header">
          <span class="history-mode">${item.mode}</span>
          <span>${timeStr}</span>
        </div>
        <div class="history-preview">${escapeHtml(item.result)}</div>
      `;
      card.addEventListener('click', () => {
        sourceText.value = item.original;
        updateTextStats();
        selectMode(item.mode);
        resultContent.textContent = item.result;
        resultModeBadge.textContent = formatModeLabel(item.mode);
        resultSection.style.display = 'flex';
        historyDrawer.style.display = 'none';
        showToast('Restored from history');
      });
      historyList.appendChild(card);
    });
  }

  function formatModeLabel(mode) {
    const labels = {
      grammar: 'Grammar Improved',
      professional: 'Professional',
      friendly: 'Friendly',
      formal: 'Formal',
      concise: 'Concise',
      expand: 'Expanded',
      paraphrase: 'Paraphrased',
      translate: 'Translated',
      custom: 'Custom Rewrite',
    };
    return labels[mode] || mode;
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function showToast(msg, duration = 2200) {
    popupToast.textContent = msg;
    popupToast.classList.add('show');
    setTimeout(() => {
      popupToast.classList.remove('show');
    }, duration);
  }

  function getStorage(keys) {
    return new Promise((resolve) => {
      chrome.storage.local.get(keys, resolve);
    });
  }
});
