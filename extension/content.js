/**
 * RewriteAI - Content Script (Manifest V3)
 * Injected into webpages to handle text selection, floating rewrite button, and in-place replacement.
 */

(function () {
  'use strict';

  // Prevent duplicate injections
  if (window.__REWRITE_AI_INITIALIZED__) return;
  window.__REWRITE_AI_INITIALIZED__ = true;

  let container = null;
  let shadowRoot = null;
  let floatingBtn = null;
  let quickModal = null;
  let selectionTimeout = null;

  let activeSelectionData = {
    text: '',
    range: null,
    targetElement: null,
    selectionStart: 0,
    selectionEnd: 0,
  };

  /**
   * Initializes the isolated Shadow DOM container
   */
  function ensureShadowRoot() {
    if (shadowRoot) return shadowRoot;

    container = document.createElement('div');
    container.id = 'rewriteai-extension-root';
    container.style.position = 'absolute';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100%';
    container.style.pointerEvents = 'none';
    container.style.zIndex = '2147483647';

    const targetParent = document.body || document.documentElement;
    if (targetParent) {
      targetParent.appendChild(container);
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        const p = document.body || document.documentElement;
        if (p && !container.parentNode) {
          p.appendChild(container);
        }
      });
    }

    shadowRoot = container.attachShadow({ mode: 'open' });

    const styleEl = document.createElement('style');
    styleEl.textContent = `
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      }
      .floating-btn {
        position: absolute;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        background: linear-gradient(135deg, #2563eb, #7c3aed);
        color: #ffffff;
        font-size: 13px;
        font-weight: 600;
        border-radius: 20px;
        border: 1px solid rgba(255, 255, 255, 0.25);
        box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35), 0 2px 6px rgba(0, 0, 0, 0.15);
        cursor: pointer;
        pointer-events: auto;
        transition: transform 0.15s ease, box-shadow 0.15s ease;
        user-select: none;
        z-index: 2147483647;
        animation: popIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }
      .floating-btn:hover {
        transform: translateY(-2px) scale(1.03);
        box-shadow: 0 6px 20px rgba(37, 99, 235, 0.45);
        background: linear-gradient(135deg, #1d4ed8, #6d28d9);
      }
      .floating-btn:active {
        transform: scale(0.97);
      }
      .floating-btn svg {
        width: 14px;
        height: 14px;
        fill: currentColor;
      }
      
      .quick-modal {
        position: absolute;
        width: 380px;
        background: #ffffff;
        color: #0f172a;
        border-radius: 14px;
        box-shadow: 0 20px 35px -5px rgba(0, 0, 0, 0.2), 0 10px 15px -5px rgba(0, 0, 0, 0.08);
        border: 1px solid #e2e8f0;
        padding: 16px;
        pointer-events: auto;
        z-index: 2147483647;
        animation: modalFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      }
      @media (prefers-color-scheme: dark) {
        .quick-modal {
          background: #0f172a;
          color: #f8fafc;
          border-color: #334155;
        }
      }
      .modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
        padding-bottom: 8px;
        border-bottom: 1px solid #f1f5f9;
      }
      @media (prefers-color-scheme: dark) {
        .modal-header {
          border-bottom-color: #1e293b;
        }
      }
      .modal-title {
        font-size: 13px;
        font-weight: 700;
        display: flex;
        align-items: center;
        gap: 6px;
        color: #2563eb;
      }
      .modal-close {
        background: transparent;
        border: none;
        color: #64748b;
        cursor: pointer;
        font-size: 18px;
        line-height: 1;
        padding: 2px 6px;
        border-radius: 4px;
      }
      .modal-close:hover {
        background: #f1f5f9;
        color: #0f172a;
      }
      .modes-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 6px;
        margin-bottom: 12px;
      }
      .mode-chip {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        color: #334155;
        font-size: 11px;
        font-weight: 500;
        padding: 6px 8px;
        border-radius: 8px;
        cursor: pointer;
        text-align: center;
        transition: all 0.15s;
        user-select: none;
      }
      @media (prefers-color-scheme: dark) {
        .mode-chip {
          background: #1e293b;
          border-color: #334155;
          color: #cbd5e1;
        }
      }
      .mode-chip:hover, .mode-chip.active {
        background: #eff6ff;
        border-color: #3b82f6;
        color: #1d4ed8;
      }
      @media (prefers-color-scheme: dark) {
        .mode-chip:hover, .mode-chip.active {
          background: #1e3a8a33;
          border-color: #3b82f6;
          color: #60a5fa;
        }
      }
      .custom-input {
        width: 100%;
        padding: 8px 10px;
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        font-size: 12px;
        margin-bottom: 10px;
        outline: none;
        background: #ffffff;
        color: #0f172a;
      }
      @media (prefers-color-scheme: dark) {
        .custom-input {
          background: #1e293b;
          border-color: #334155;
          color: #f8fafc;
        }
      }
      .custom-input:focus {
        border-color: #3b82f6;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
      }
      .action-btn {
        width: 100%;
        padding: 9px;
        background: #2563eb;
        color: #ffffff;
        border: none;
        border-radius: 8px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.15s;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
      }
      .action-btn:hover {
        background: #1d4ed8;
      }
      .action-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .result-box {
        margin-top: 12px;
        padding: 10px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        font-size: 12px;
        line-height: 1.5;
        max-height: 140px;
        overflow-y: auto;
        white-space: pre-wrap;
      }
      @media (prefers-color-scheme: dark) {
        .result-box {
          background: #1e293b;
          border-color: #334155;
          color: #f8fafc;
        }
      }
      .result-actions {
        display: flex;
        gap: 8px;
        margin-top: 10px;
      }
      .btn-secondary {
        flex: 1;
        padding: 7px;
        background: #f1f5f9;
        border: 1px solid #cbd5e1;
        color: #334155;
        font-size: 11px;
        font-weight: 600;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.15s;
      }
      @media (prefers-color-scheme: dark) {
        .btn-secondary {
          background: #1e293b;
          border-color: #334155;
          color: #cbd5e1;
        }
      }
      .btn-secondary:hover {
        background: #e2e8f0;
      }
      .btn-primary-small {
        flex: 1;
        padding: 7px;
        background: #10b981;
        border: 1px solid #059669;
        color: #ffffff;
        font-size: 11px;
        font-weight: 600;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.15s;
      }
      .btn-primary-small:hover {
        background: #059669;
      }
      .toast-msg {
        position: fixed;
        bottom: 24px;
        right: 24px;
        background: #0f172a;
        color: #ffffff;
        padding: 10px 18px;
        border-radius: 10px;
        font-size: 13px;
        font-weight: 500;
        box-shadow: 0 10px 25px rgba(0,0,0,0.25);
        z-index: 2147483647;
        animation: toastIn 0.25s ease-out;
        pointer-events: auto;
      }
      @keyframes popIn {
        from { transform: scale(0.6); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
      @keyframes modalFadeIn {
        from { opacity: 0; transform: translateY(6px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes toastIn {
        from { transform: translateY(16px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
    `;
    shadowRoot.appendChild(styleEl);
    return shadowRoot;
  }

  /**
   * Safe message dispatcher for background communication
   */
  function safeSendMessage(message, callback) {
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage(message, (response) => {
          const lastError = chrome.runtime.lastError;
          if (callback) {
            callback(response, lastError);
          }
        });
      }
    } catch (err) {
      console.warn('[RewriteAI] Safe sendMessage caught:', err);
    }
  }

  /**
   * Display toast notification inside Shadow DOM
   */
  function showToast(message, duration = 2500) {
    const root = ensureShadowRoot();
    const toast = document.createElement('div');
    toast.className = 'toast-msg';
    toast.textContent = message;
    root.appendChild(toast);
    setTimeout(() => {
      toast.style.transition = 'opacity 0.2s';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 200);
    }, duration);
  }

  function removeFloatingBtn() {
    if (floatingBtn) {
      floatingBtn.remove();
      floatingBtn = null;
    }
  }

  function removeQuickModal() {
    if (quickModal) {
      quickModal.remove();
      quickModal = null;
    }
  }

  /**
   * Retrieves highlighted text and bounding box from the DOM or active input/textarea
   */
  function getSelectedTextInfo() {
    const activeEl = document.activeElement;

    // Check textarea or text input
    if (activeEl && (activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'INPUT')) {
      const start = activeEl.selectionStart;
      const end = activeEl.selectionEnd;
      if (typeof start === 'number' && typeof end === 'number' && start !== end) {
        const text = activeEl.value.substring(start, end).trim();
        if (text) {
          const rect = activeEl.getBoundingClientRect();
          return {
            text,
            targetElement: activeEl,
            selectionStart: start,
            selectionEnd: end,
            rect: {
              top: rect.top + window.scrollY,
              bottom: rect.bottom + window.scrollY,
              left: rect.left + window.scrollX,
              right: rect.right + window.scrollX,
            },
          };
        }
      }
    }

    // Standard DOM text selection
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return null;

    const text = selection.toString().trim();
    if (!text) return null;

    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return null;

      return {
        text,
        range: range.cloneRange(),
        targetElement: selection.anchorNode ? (selection.anchorNode.nodeType === 1 ? selection.anchorNode : selection.anchorNode.parentElement) : null,
        rect: {
          top: rect.top + window.scrollY,
          bottom: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
          right: rect.right + window.scrollX,
        },
      };
    }

    return null;
  }

  /**
   * Displays the floating ✨ Rewrite badge
   */
  function showFloatingButton(selectionInfo) {
    const root = ensureShadowRoot();
    removeFloatingBtn();
    activeSelectionData = selectionInfo;

    // Notify extension storage of the latest selection
    safeSendMessage({
      action: 'SAVE_SELECTION',
      text: selectionInfo.text,
      source: 'floatingButton',
    });

    floatingBtn = document.createElement('div');
    floatingBtn.className = 'floating-btn';
    floatingBtn.innerHTML = `
      <svg viewBox="0 0 24 24">
        <path d="M12 2l2.4 7.2h7.6l-6.1 4.5 2.3 7.3-6.2-4.6-6.2 4.6 2.3-7.3-6.1-4.5h7.6z"/>
      </svg>
      <span>Rewrite</span>
    `;

    const topPos = selectionInfo.rect.bottom + 8;
    const leftPos = Math.max(10, Math.min(window.innerWidth - 120, selectionInfo.rect.left));

    floatingBtn.style.top = `${topPos}px`;
    floatingBtn.style.left = `${leftPos}px`;

    floatingBtn.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      e.preventDefault();
    });

    floatingBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      removeFloatingBtn();
      openQuickModal(selectionInfo);
    });

    root.appendChild(floatingBtn);
  }

  /**
   * Opens the in-page quick rewrite dialog
   */
  function openQuickModal(selectionInfo) {
    const root = ensureShadowRoot();
    removeQuickModal();
    removeFloatingBtn();
    activeSelectionData = selectionInfo;

    quickModal = document.createElement('div');
    quickModal.className = 'quick-modal';

    let selectedMode = 'grammar';

    quickModal.innerHTML = `
      <div class="modal-header">
        <div class="modal-title">
          <span>✨ RewriteAI</span>
        </div>
        <button class="modal-close" title="Close">&times;</button>
      </div>

      <div class="modes-grid">
        <div class="mode-chip active" data-mode="grammar">✨ Grammar</div>
        <div class="mode-chip" data-mode="professional">💼 Professional</div>
        <div class="mode-chip" data-mode="friendly">😊 Friendly</div>
        <div class="mode-chip" data-mode="formal">🎩 Formal</div>
        <div class="mode-chip" data-mode="concise">⚡ Concise</div>
        <div class="mode-chip" data-mode="expand">📖 Expand</div>
        <div class="mode-chip" data-mode="paraphrase">🔄 Paraphrase</div>
        <div class="mode-chip" data-mode="translate">🌐 Translate</div>
        <div class="mode-chip" data-mode="custom">🛠️ Custom</div>
      </div>

      <input type="text" class="custom-input" id="custom-prompt" placeholder="e.g. Make it persuasive and bulleted" style="display: none;" />

      <select class="custom-input" id="translate-lang" style="display: none;">
        <option value="Spanish">Spanish</option>
        <option value="French">French</option>
        <option value="German">German</option>
        <option value="Japanese">Japanese</option>
        <option value="Chinese (Simplified)">Chinese</option>
        <option value="Hindi">Hindi</option>
        <option value="Arabic">Arabic</option>
        <option value="Portuguese">Portuguese</option>
        <option value="Italian">Italian</option>
      </select>

      <button class="action-btn" id="generate-btn">
        <span>Rewrite with AI</span>
      </button>

      <div id="result-container" style="display: none;">
        <div class="result-box" id="result-text"></div>
        <div class="result-actions">
          <button class="btn-secondary" id="copy-btn">📋 Copy</button>
          <button class="btn-primary-small" id="replace-btn">✏️ Replace in Page</button>
        </div>
      </div>
    `;

    const topPos = Math.min(window.innerHeight + window.scrollY - 320, selectionInfo.rect.bottom + 8);
    const leftPos = Math.max(10, Math.min(window.innerWidth - 400, selectionInfo.rect.left));
    quickModal.style.top = `${Math.max(window.scrollY + 10, topPos)}px`;
    quickModal.style.left = `${leftPos}px`;

    const chips = quickModal.querySelectorAll('.mode-chip');
    const customPromptInput = quickModal.querySelector('#custom-prompt');
    const translateLangSelect = quickModal.querySelector('#translate-lang');
    const generateBtn = quickModal.querySelector('#generate-btn');
    const resultContainer = quickModal.querySelector('#result-container');
    const resultText = quickModal.querySelector('#result-text');
    const copyBtn = quickModal.querySelector('#copy-btn');
    const replaceBtn = quickModal.querySelector('#replace-btn');
    const closeBtn = quickModal.querySelector('.modal-close');

    chips.forEach((chip) => {
      chip.addEventListener('click', () => {
        chips.forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        selectedMode = chip.dataset.mode;

        customPromptInput.style.display = selectedMode === 'custom' ? 'block' : 'none';
        translateLangSelect.style.display = selectedMode === 'translate' ? 'block' : 'none';
      });
    });

    closeBtn.addEventListener('click', removeQuickModal);

    generateBtn.addEventListener('click', () => {
      generateBtn.disabled = true;
      generateBtn.innerHTML = '<span>Rewriting... ⏳</span>';

      safeSendMessage(
        {
          action: 'REWRITE_TEXT',
          payload: {
            text: selectionInfo.text,
            mode: selectedMode,
            customInstruction: customPromptInput.value,
            targetLanguage: translateLangSelect.value,
          },
        },
        (response, err) => {
          generateBtn.disabled = false;
          generateBtn.innerHTML = '<span>Rewrite with AI</span>';

          if (err || !response || !response.success) {
            const msg = err?.message || response?.error || 'Failed to rewrite text';
            alert(`RewriteAI Error: ${msg}`);
            return;
          }

          const rewritten = response.data.result;
          resultText.textContent = rewritten;
          resultContainer.style.display = 'block';

          copyBtn.onclick = () => {
            navigator.clipboard.writeText(rewritten);
            showToast('📋 Copied to clipboard!');
          };

          replaceBtn.onclick = () => {
            const replaced = replaceSelectedText(selectionInfo, rewritten);
            if (replaced) {
              showToast('✨ Selected text successfully replaced!');
              removeQuickModal();
            } else {
              navigator.clipboard.writeText(rewritten);
              showToast('📋 Text copied (element was read-only)');
            }
          };
        }
      );
    });

    quickModal.addEventListener('mousedown', (e) => e.stopPropagation());
    root.appendChild(quickModal);
  }

  /**
   * Replaces selected text in inputs, textareas, contenteditable elements, or standard DOM ranges
   */
  function replaceSelectedText(selectionInfo, newText) {
    const el = selectionInfo.targetElement || document.activeElement;

    // Case 1: Standard Input or Textarea
    if (el && (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT')) {
      const start = selectionInfo.selectionStart !== undefined ? selectionInfo.selectionStart : el.selectionStart;
      const end = selectionInfo.selectionEnd !== undefined ? selectionInfo.selectionEnd : el.selectionEnd;

      const val = el.value;
      el.value = val.substring(0, start) + newText + val.substring(end);

      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));

      el.focus();
      el.setSelectionRange(start + newText.length, start + newText.length);
      return true;
    }

    // Case 2: ContentEditable elements (Gmail, Notion, Slack, Google Docs web)
    if (el && (el.isContentEditable || el.getAttribute('contenteditable') === 'true' || el.closest('[contenteditable="true"]'))) {
      const editableParent = el.isContentEditable ? el : el.closest('[contenteditable="true"]');
      editableParent.focus();

      const success = document.execCommand('insertText', false, newText);
      if (success) {
        editableParent.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
      }
    }

    // Case 3: Standard DOM Selection Range
    if (selectionInfo.range) {
      try {
        const range = selectionInfo.range;
        range.deleteContents();
        const textNode = document.createTextNode(newText);
        range.insertNode(textNode);

        const sel = window.getSelection();
        if (sel) {
          sel.removeAllRanges();
          const newRange = document.createRange();
          newRange.selectNodeContents(textNode);
          sel.addRange(newRange);
        }
        return true;
      } catch (e) {
        console.warn('[RewriteAI] Range replacement fallback:', e);
      }
    }

    return false;
  }

  function handleSelectionChange() {
    clearTimeout(selectionTimeout);
    selectionTimeout = setTimeout(() => {
      const info = getSelectedTextInfo();
      if (info && info.text.length > 1) {
        showFloatingButton(info);
      } else {
        removeFloatingBtn();
      }
    }, 150);
  }

  document.addEventListener('mouseup', handleSelectionChange);
  document.addEventListener('keyup', (e) => {
    if (e.key === 'Shift' || e.key.startsWith('Arrow')) {
      handleSelectionChange();
    }
  });

  document.addEventListener('mousedown', (e) => {
    if (container && !e.composedPath().includes(container)) {
      removeFloatingBtn();
      removeQuickModal();
    }
  });

  // Message listener from extension background worker or popup
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'OPEN_REWRITE_MODAL') {
        const info = getSelectedTextInfo() || {
          text: request.text || '',
          rect: {
            top: window.scrollY + 100,
            bottom: window.scrollY + 140,
            left: window.innerWidth / 2 - 190,
            right: window.innerWidth / 2 + 190,
          },
        };
        openQuickModal(info);
        sendResponse({ success: true });
        return true;
      }

      if (request.action === 'TRIGGER_KEYBOARD_REWRITE') {
        const info = getSelectedTextInfo();
        if (info) {
          openQuickModal(info);
          sendResponse({ success: true });
        } else {
          showToast('⚠️ Please select text on the page first');
          sendResponse({ success: false });
        }
        return true;
      }

      if (request.action === 'REPLACE_ACTIVE_SELECTION') {
        const replaced = replaceSelectedText(activeSelectionData, request.text);
        if (replaced) {
          showToast('✨ Text replaced in webpage!');
        }
        sendResponse({ success: replaced });
        return true;
      }

      if (request.action === 'GET_PAGE_SELECTION') {
        const info = getSelectedTextInfo();
        sendResponse({ text: info ? info.text : '' });
        return true;
      }
    });
  }

  console.log('[RewriteAI] Content script active and ready.');
})();
