import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { SimulatedWebpage } from './components/SimulatedWebpage';
import { ExtensionPopupSimulator } from './components/ExtensionPopupSimulator';
import { ApiTester } from './components/ApiTester';
import { InstallationGuide } from './components/InstallationGuide';
import { FileViewer } from './components/FileViewer';
import { RewriteMode } from './types';
import { Sparkles, Shield, Cpu, Zap, Download, BookOpen, Check, ExternalLink, Info } from 'lucide-react';
import { downloadExtensionZip } from './utils/packageExtension';

export function App() {
  const [activeTab, setActiveTab] = useState<'simulator' | 'api' | 'guide' | 'files'>('simulator');
  const [backendOnline, setBackendOnline] = useState(true);
  const [selectedTextForPopup, setSelectedTextForPopup] = useState('');
  const [replacedTextFromPopup, setReplacedTextFromPopup] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showArchModal, setShowArchModal] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Check health of the backend
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch('/api/health');
        if (res.ok) {
          setBackendOnline(true);
        } else {
          setBackendOnline(false);
        }
      } catch {
        setBackendOnline(false);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  // Quick rewrite handler for in-page popover in simulated webpage
  const handleQuickRewrite = async (
    text: string,
    mode: RewriteMode,
    customInstruction?: string
  ): Promise<string> => {
    const response = await fetch('/api/rewrite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        mode,
        customInstruction: customInstruction || '',
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({ error: 'Rewrite request failed' }));
      throw new Error(errData.error || 'Server error');
    }

    const data = await response.json();
    return data.result;
  };

  const handleCopyShortcut = () => {
    navigator.clipboard.writeText('Ctrl+Shift+R');
    showToast('Shortcut copied: Ctrl + Shift + R');
  };

  return (
    <div className="min-h-screen bg-[#F8F7F4] text-[#1A1A1A] flex flex-col font-sans selection:bg-black selection:text-white">
      {/* Top Application Header */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} backendOnline={backendOnline} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-6">
        {/* Banner / Overview Card */}
        <section id="hero-banner" className="bg-white border border-[#E5E3DF] rounded-3xl p-6 md:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 shadow-sm relative overflow-hidden">
          <div className="flex flex-col gap-2.5 max-w-2xl z-10">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setActiveTab('guide')}
                className="px-3 py-1 rounded-full bg-[#F1EFE9] hover:bg-black hover:text-white border border-[#E5E3DF] text-[#1A1A1A] text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-1.5 transition-all cursor-pointer group"
                title="View Manifest V3 Architecture in Setup Guide"
              >
                <Sparkles className="w-3 h-3 text-black group-hover:text-white" />
                <span>RewriteAI Pro • Manifest V3</span>
              </button>
              <button
                onClick={() => setActiveTab('api')}
                className="text-xs text-[#78716C] hover:text-[#1A1A1A] hover:underline cursor-pointer flex items-center gap-1"
                title="Test Google Gemini endpoint"
              >
                <span>Google Gemini Powered</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
            <h2 className="text-2xl md:text-3xl font-serif tracking-tight text-[#1A1A1A]">
              Intelligent Editorial Rewriting & Grammar Assistant
            </h2>
            <p className="text-xs md:text-sm text-[#4A4A4A] leading-relaxed">
              Select text on any webpage or editable field to instantly correct grammar, refine tone to professional or friendly, make concise, paraphrase, or translate into 9+ languages with precision.
            </p>

            <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-[#78716C]">
              <button
                onClick={() => setShowArchModal(true)}
                className="flex items-center gap-1.5 hover:text-[#1A1A1A] bg-[#FAF9F6] hover:bg-[#F1EFE9] px-2.5 py-1 rounded-xl border border-[#E5E3DF] transition-colors cursor-pointer"
                title="Learn about zero-exposure API security"
              >
                <Shield className="w-3.5 h-3.5 text-black" />
                <span className="font-medium">Zero-Exposure Server Security</span>
              </button>

              <button
                onClick={() => setActiveTab('api')}
                className="flex items-center gap-1.5 hover:text-[#1A1A1A] bg-[#FAF9F6] hover:bg-[#F1EFE9] px-2.5 py-1 rounded-xl border border-[#E5E3DF] transition-colors cursor-pointer"
                title="Open API & cURL Tester"
              >
                <Cpu className="w-3.5 h-3.5 text-black" />
                <span className="font-medium">Gemini API Engine</span>
              </button>

              <button
                onClick={handleCopyShortcut}
                className="flex items-center gap-1.5 hover:text-[#1A1A1A] bg-[#FAF9F6] hover:bg-[#F1EFE9] px-2.5 py-1 rounded-xl border border-[#E5E3DF] transition-colors cursor-pointer"
                title="Click to copy shortcut"
              >
                <Zap className="w-3.5 h-3.5 text-black" />
                <span className="font-mono text-[11px] font-bold">Ctrl + Shift + R</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 z-10 w-full lg:w-auto">
            <button
              id="cta-download-btn"
              onClick={downloadExtensionZip}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-black hover:bg-[#2A2A2A] text-white text-xs font-bold shadow-xl shadow-black/10 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Extension (.zip)</span>
            </button>
            <button
              onClick={() => setActiveTab('guide')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#F8F7F4] hover:bg-[#F1EFE9] text-[#1A1A1A] border border-[#E5E3DF] text-xs font-bold transition-all text-center cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>Setup Walkthrough</span>
            </button>
          </div>
        </section>

        {/* Tab 1: Interactive Simulator (Side-by-side Simulated Webpage + Extension Popup) */}
        {activeTab === 'simulator' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Webpage Sandbox with text selection & in-page floating rewrite button */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <SimulatedWebpage
                onSelectForPopup={(text) => setSelectedTextForPopup(text)}
                onQuickRewrite={handleQuickRewrite}
                onOpenTab={(tab) => setActiveTab(tab)}
              />
            </div>

            {/* Right: Authentic Chrome Extension Popup Simulator */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <ExtensionPopupSimulator
                externalSelectedText={selectedTextForPopup}
                onReplaceInWebpage={(newText) => setReplacedTextFromPopup(newText)}
                onOpenGuide={() => setActiveTab('guide')}
                onOpenApi={() => setActiveTab('api')}
              />
            </div>
          </div>
        )}

        {/* Tab 2: Backend API & cURL Tester */}
        {activeTab === 'api' && <ApiTester onOpenGuide={() => setActiveTab('guide')} />}

        {/* Tab 3: Installation & Verification Guide */}
        {activeTab === 'guide' && (
          <InstallationGuide
            onOpenSimulator={() => setActiveTab('simulator')}
            onOpenFiles={() => setActiveTab('files')}
          />
        )}

        {/* Tab 4: Extension & Backend Source Code Explorer */}
        {activeTab === 'files' && <FileViewer />}
      </main>

      {/* Security & Architecture Info Modal */}
      {showArchModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#E5E3DF] p-6 md:p-8 max-w-lg w-full shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#E5E3DF] pb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-black" />
                <h3 className="font-serif font-bold text-lg text-[#1A1A1A]">Zero-Exposure Security Architecture</h3>
              </div>
              <button
                onClick={() => setShowArchModal(false)}
                className="text-[#78716C] hover:text-[#1A1A1A] text-xl font-bold px-1 rounded-md hover:bg-[#F1EFE9] cursor-pointer"
              >
                &times;
              </button>
            </div>
            <div className="text-xs text-[#4A4A4A] leading-relaxed flex flex-col gap-2.5">
              <p>
                <strong>1. Server-Side Key Containment:</strong> Your <code>GEMINI_API_KEY</code> is never shipped inside the Chrome Extension client bundle or browser extension background storage.
              </p>
              <p>
                <strong>2. Node.js + Express Proxy:</strong> All text transformation requests flow through your secure local/hosted backend proxy on port 3000 at <code>POST /api/rewrite</code>.
              </p>
              <p>
                <strong>3. Sanitized Payloads & Rate Limiting:</strong> Payloads are validated and rate-limited to 60 requests per minute with automatic model fallbacks.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E3DF]">
              <button
                onClick={() => {
                  setShowArchModal(false);
                  setActiveTab('files');
                }}
                className="px-4 py-2 rounded-xl bg-[#FAF9F6] hover:bg-[#F1EFE9] text-[#1A1A1A] border border-[#E5E3DF] text-xs font-bold transition-colors cursor-pointer"
              >
                View Backend Code
              </button>
              <button
                onClick={() => setShowArchModal(false)}
                className="px-4 py-2 rounded-xl bg-black hover:bg-[#2A2A2A] text-white text-xs font-bold shadow-md shadow-black/10 transition-colors cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-black text-white px-4 py-2.5 rounded-2xl text-xs font-bold shadow-2xl flex items-center gap-2 border border-white/20 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-[#F1EFE9] border-t border-[#E5E3DF] py-4 px-6 md:px-8 text-xs text-[#78716C] mt-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold uppercase tracking-widest text-[#78716C]">
            <button
              onClick={handleCopyShortcut}
              className="hover:text-[#1A1A1A] cursor-pointer hover:underline"
              title="Click to copy shortcut"
            >
              Shortcut: Ctrl + Shift + R
            </button>
            <span>•</span>
            <button
              onClick={() => setActiveTab('api')}
              className="hover:text-[#1A1A1A] cursor-pointer hover:underline"
              title="Open Backend API Explorer"
            >
              Node.js Backend Connected
            </button>
          </div>
          <button
            onClick={() => setActiveTab('files')}
            className="text-[11px] font-serif italic text-[#78716C] hover:text-[#1A1A1A] cursor-pointer hover:underline"
            title="Browse Source Files"
          >
            RewriteAI Studio Pro v1.0.0
          </button>
        </div>
      </footer>
    </div>
  );
}
export default App;

