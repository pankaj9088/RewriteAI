import React, { useState } from 'react';
import { FileCode, Copy, Check } from 'lucide-react';

const EXTENSION_CODE_FILES = [
  {
    name: 'config.js',
    path: 'extension/config.js',
    language: 'javascript',
    desc: 'Centralized production HTTPS backend configuration and development environment toggle.',
    content: `// extension/config.js
const CONFIG = {
  // 'production' (default for Chrome Web Store) or 'development'
  ENV: 'production',

  // 🚀 REPLACE WITH YOUR DEPLOYED RENDER BACKEND HTTPS URL
  PRODUCTION_API_URL: 'https://YOUR_PUBLIC_BACKEND_URL',

  // Localhost URL for local testing
  DEVELOPMENT_API_URL: 'http://localhost:3000',

  get API_BASE_URL() {
    return this.ENV === 'production' ? this.PRODUCTION_API_URL : this.DEVELOPMENT_API_URL;
  },

  get REWRITE_ENDPOINT() {
    return \`\${this.API_BASE_URL.replace(/\\/$/, '')}/api/rewrite\`;
  },

  get HEALTH_ENDPOINT() {
    return \`\${this.API_BASE_URL.replace(/\\/$/, '')}/health\`;
  },

  isPlaceholder(url) {
    const target = url || this.PRODUCTION_API_URL;
    return target.includes('YOUR_PUBLIC_BACKEND_URL') || target.includes('YOUR-PUBLIC-BACKEND-URL');
  }
};

if (typeof self !== 'undefined') self.CONFIG = CONFIG;
if (typeof window !== 'undefined') window.CONFIG = CONFIG;`,
  },
  {
    name: 'manifest.json',
    path: 'extension/manifest.json',
    language: 'json',
    desc: 'Manifest V3 configuration with minimal permissions (activeTab, contextMenus, storage, scripting, commands).',
    content: `{
  "manifest_version": 3,
  "name": "RewriteAI - AI Grammar & Text Rewriting Assistant",
  "short_name": "RewriteAI",
  "version": "1.0.0",
  "description": "AI-powered grammar correction, tone rewriting, paraphrasing, expansion, and translation with Gemini.",
  "permissions": [
    "contextMenus",
    "storage",
    "activeTab",
    "scripting"
  ],
  "host_permissions": [
    "https://*/*"
  ],
  "background": {
    "service_worker": "background.js"
  },
  "action": {
    "default_popup": "popup.html",
    "default_title": "RewriteAI Assistant",
    "default_icon": {
      "16": "icons/icon16.png",
      "32": "icons/icon32.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"],
      "css": ["content.css"],
      "run_at": "document_end"
    }
  ],
  "commands": {
    "rewrite-selected-text": {
      "suggested_key": {
        "default": "Ctrl+Shift+R",
        "mac": "Command+Shift+R"
      },
      "description": "Rewrite selected text with RewriteAI"
    }
  },
  "icons": {
    "16": "icons/icon16.png",
    "32": "icons/icon32.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}`,
  },
  {
    name: 'server/package.json',
    path: 'server/package.json',
    language: 'json',
    desc: 'Standalone backend package.json configured for cloud hosting deployments (Render, Railway, Fly.io).',
    content: `{
  "name": "rewriteai-backend",
  "version": "1.0.0",
  "description": "Production Express Backend for RewriteAI Chrome Extension powered by Google Gemini",
  "type": "module",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js"
  },
  "dependencies": {
    "@google/genai": "^2.4.0",
    "dotenv": "^17.2.3",
    "express": "^4.21.2"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}`,
  },
  {
    name: 'background.js',
    path: 'extension/background.js',
    language: 'javascript',
    desc: 'Service worker managing context menus, keyboard commands, storage sync, and secure API requests.',
    content: `// Service worker background.js (Manifest V3)
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'rewrite-with-rewriteai',
    title: '✨ Rewrite with RewriteAI',
    contexts: ['selection'],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'rewrite-with-rewriteai' && info.selectionText) {
    chrome.storage.local.set({ selectedText: info.selectionText }, () => {
      chrome.tabs.sendMessage(tab.id, {
        action: 'OPEN_REWRITE_MODAL',
        text: info.selectionText,
      });
    });
  }
});

chrome.commands.onCommand.addListener((command) => {
  if (command === 'rewrite-selected-text') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'TRIGGER_KEYBOARD_REWRITE' });
      }
    });
  }
});`,
  },
  {
    name: 'content.js',
    path: 'extension/content.js',
    language: 'javascript',
    desc: 'Injected script detecting text selection, rendering floating trigger in Shadow DOM, and replacing text.',
    content: `// content.js - Selection Detection & Text Replacement
function replaceSelectedText(selectionInfo, newText) {
  const el = selectionInfo.targetElement || document.activeElement;

  // Case 1: Input / Textarea
  if (el && (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT')) {
    const start = el.selectionStart;
    const end = el.selectionEnd;
    el.value = el.value.substring(0, start) + newText + el.value.substring(end);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }

  // Case 2: ContentEditable
  if (el && el.isContentEditable) {
    document.execCommand('insertText', false, newText);
    return true;
  }
}`,
  },
  {
    name: 'geminiService.js',
    path: 'server/services/geminiService.js',
    language: 'javascript',
    desc: 'Backend service communicating with Google Gemini using the @google/genai SDK with multi-model fallback.',
    content: `import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
});

export async function rewriteText({ text, mode, customInstruction, targetLanguage }) {
  const response = await ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: prompt,
    config: { systemInstruction: system },
  });
  return { result: response.text, mode };
}`,
  },
  {
    name: 'PRIVACY.md',
    path: 'PRIVACY.md',
    language: 'markdown',
    desc: 'Zero-exposure privacy policy, data protection rules, local storage policies, and user deletion rights.',
    content: `# Privacy & Security Policy for RewriteAI

- User-Selected Text: Transmitted securely to your backend for AI transformation only.
- No Browsing Tracking: We never monitor, collect, or store URLs or browsing activity.
- Ephemeral Backend: Server memory holds text strictly during the API request.
- Local Storage: Opt-in history and preferences stored on-device in chrome.storage.local.
- Zero API Key Exposure: GEMINI_API_KEY resides safely on the backend server.`,
  },
  {
    name: 'permissions.md',
    path: 'store/permissions-explanation.md',
    language: 'markdown',
    desc: 'Chrome Web Store minimum permissions justification.',
    content: `# RewriteAI - Chrome Permissions Justification

- activeTab: Read selected text when the user explicitly triggers RewriteAI.
- contextMenus: Right-click context menu entry for selections.
- storage: On-device preference and history persistence via chrome.storage.local.
- scripting: Safe in-page text replacement for inputs and contenteditable editors.
- commands: Global keyboard shortcut (Ctrl+Shift+R).`,
  },
];

export const FileViewer: React.FC = () => {
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  const currentFile = EXTENSION_CODE_FILES[selectedFileIndex];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="file-viewer" className="bg-white rounded-3xl border border-[#E5E3DF] p-6 md:p-8 flex flex-col gap-6 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-5 border-b border-[#E5E3DF]">
        <div>
          <div className="flex items-center gap-2">
            <FileCode className="w-5 h-5 text-black" />
            <h2 className="font-serif font-bold text-xl text-[#1A1A1A]">Extension & Backend Source Explorer</h2>
          </div>
          <p className="text-xs text-[#78716C] mt-1">
            Browse and inspect the source code powering the RewriteAI Chrome Extension and Node.js backend.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* File List */}
        <div className="flex flex-col gap-2 md:col-span-1">
          {EXTENSION_CODE_FILES.map((file, idx) => (
            <button
              key={file.path}
              onClick={() => setSelectedFileIndex(idx)}
              className={`p-3 rounded-2xl text-left text-xs font-semibold flex flex-col gap-0.5 border transition-all cursor-pointer ${
                selectedFileIndex === idx
                  ? 'bg-black text-white border-black shadow-md shadow-black/10'
                  : 'bg-[#FAF9F6] border-[#E5E3DF] text-[#78716C] hover:text-[#1A1A1A] hover:bg-[#F1EFE9]'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5" />
                <span className={`font-mono text-xs font-bold ${selectedFileIndex === idx ? 'text-white' : 'text-[#1A1A1A]'}`}>
                  {file.name}
                </span>
              </div>
              <span className={`text-[10px] font-normal truncate ${selectedFileIndex === idx ? 'text-white/70' : 'text-[#78716C]'}`}>
                {file.path}
              </span>
            </button>
          ))}
        </div>

        {/* Code Content View */}
        <div className="flex flex-col md:col-span-3">
          <div className="flex items-center justify-between bg-[#F1EFE9] px-5 py-3 rounded-t-2xl border border-[#E5E3DF] text-xs">
            <div>
              <span className="font-mono font-bold text-black">{currentFile.path}</span>
              <p className="text-[11px] text-[#78716C] mt-0.5">{currentFile.desc}</p>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-[11px] px-3 py-1.5 rounded-xl bg-white hover:bg-[#FAF9F6] text-[#1A1A1A] font-bold border border-[#E5E3DF] transition-colors cursor-pointer shadow-xs"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-black" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <pre className="bg-[#FAF9F6] p-5 rounded-b-2xl border border-t-0 border-[#E5E3DF] font-mono text-xs text-[#1A1A1A] overflow-x-auto leading-relaxed max-h-[460px]">
            {currentFile.content}
          </pre>
        </div>
      </div>
    </div>
  );
};

