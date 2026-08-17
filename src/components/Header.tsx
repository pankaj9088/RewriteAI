import React, { useState } from 'react';
import { Download, Layers, Terminal, BookOpen, FileCode, Check, RefreshCw } from 'lucide-react';
import { downloadExtensionZip } from '../utils/packageExtension';

interface HeaderProps {
  activeTab: 'simulator' | 'api' | 'guide' | 'files';
  setActiveTab: (tab: 'simulator' | 'api' | 'guide' | 'files') => void;
  backendOnline: boolean;
  onPingBackend?: () => Promise<void>;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, backendOnline, onPingBackend }) => {
  const [isPinging, setIsPinging] = useState(false);
  const [pingMessage, setPingMessage] = useState<string | null>(null);

  const handleDownload = async () => {
    try {
      await downloadExtensionZip();
    } catch (e) {
      console.error('Download error:', e);
      alert('Could not generate ZIP automatically. The extension files are ready in the /extension folder!');
    }
  };

  const handleHealthCheckClick = async () => {
    setIsPinging(true);
    const start = performance.now();
    try {
      const res = await fetch('/api/health');
      const latency = Math.round(performance.now() - start);
      if (res.ok) {
        setPingMessage(`Node.js + Gemini Backend Healthy (${latency}ms)`);
      } else {
        setPingMessage(`Backend status: ${res.status}`);
      }
    } catch {
      setPingMessage('Could not reach backend server');
    } finally {
      setIsPinging(false);
      setTimeout(() => setPingMessage(null), 3000);
    }
  };

  return (
    <header id="main-header" className="bg-white border-b border-[#E5E3DF] sticky top-0 z-40 px-4 lg:px-8 py-3.5 shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <button
            onClick={() => setActiveTab('simulator')}
            className="flex items-center gap-2.5 text-left group cursor-pointer"
            title="Go to Extension Simulator"
          >
            <div className="w-8 h-8 rounded-lg overflow-hidden shadow-sm transition-all group-hover:scale-105 flex items-center justify-center bg-black">
              <img
                src="/extension/icons/icon48.png"
                alt="RewriteAI Extension Icon"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-serif text-xl tracking-tight text-[#1A1A1A] group-hover:text-black">
                  Rewrite<span className="font-sans font-bold text-[10px] ml-1 text-[#78716C] uppercase tracking-[0.2em]">Studio</span>
                </h1>
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTab('files');
                  }}
                  className="text-[9px] uppercase font-bold tracking-[0.2em] px-2 py-0.5 rounded-full bg-[#F1EFE9] hover:bg-black hover:text-white border border-[#E5E3DF] text-[#78716C] transition-colors cursor-pointer"
                  title="View manifest.json in File Explorer"
                >
                  V3 Manifest
                </span>
              </div>
              <p className="text-[11px] text-[#78716C] hidden sm:block">Editorial AI Grammar & Rewriting Extension</p>
            </div>
          </button>

          {/* Health indicator on mobile */}
          <button
            onClick={handleHealthCheckClick}
            className="flex md:hidden items-center gap-2 bg-[#F1EFE9] hover:bg-[#E5E3DF] px-3 py-1 rounded-full border border-[#E5E3DF] transition-colors cursor-pointer"
            title="Click to test backend connection"
          >
            <div className={`w-1.5 h-1.5 rounded-full ${backendOnline ? 'bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-rose-500'}`} />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#4A4A4A]">
              {isPinging ? 'Pinging...' : backendOnline ? 'Gemini Active' : 'Connecting'}
            </span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-[#F1EFE9] p-1 rounded-2xl border border-[#E5E3DF] text-xs overflow-x-auto max-w-full">
          <button
            id="tab-simulator"
            onClick={() => setActiveTab('simulator')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap text-xs cursor-pointer ${
              activeTab === 'simulator'
                ? 'bg-black text-white shadow-md shadow-black/10'
                : 'text-[#57534E] hover:text-[#1A1A1A] hover:bg-[#E5E3DF]/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Interactive Simulator</span>
          </button>

          <button
            id="tab-api"
            onClick={() => setActiveTab('api')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap text-xs cursor-pointer ${
              activeTab === 'api'
                ? 'bg-black text-white shadow-md shadow-black/10'
                : 'text-[#57534E] hover:text-[#1A1A1A] hover:bg-[#E5E3DF]/60'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>API & cURL Tester</span>
          </button>

          <button
            id="tab-guide"
            onClick={() => setActiveTab('guide')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap text-xs cursor-pointer ${
              activeTab === 'guide'
                ? 'bg-black text-white shadow-md shadow-black/10'
                : 'text-[#57534E] hover:text-[#1A1A1A] hover:bg-[#E5E3DF]/60'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Chrome Setup Guide</span>
          </button>

          <button
            id="tab-files"
            onClick={() => setActiveTab('files')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap text-xs cursor-pointer ${
              activeTab === 'files'
                ? 'bg-black text-white shadow-md shadow-black/10'
                : 'text-[#57534E] hover:text-[#1A1A1A] hover:bg-[#E5E3DF]/60'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Extension Files</span>
          </button>
        </div>

        {/* Backend status & Download Extension button */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={handleHealthCheckClick}
            className="flex items-center gap-2 bg-[#F1EFE9] hover:bg-[#E5E3DF] px-3.5 py-1.5 rounded-full border border-[#E5E3DF] transition-all cursor-pointer group"
            title="Click to check backend status & latency"
          >
            <div className={`w-2 h-2 rounded-full ${backendOnline ? 'bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-rose-500'} ${isPinging ? 'animate-ping' : ''}`} />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#4A4A4A]">
              {isPinging ? 'Pinging...' : backendOnline ? 'Gemini API Active' : 'Connecting...'}
            </span>
            <RefreshCw className={`w-3 h-3 text-[#78716C] group-hover:text-[#1A1A1A] ${isPinging ? 'animate-spin' : ''}`} />
          </button>

          <button
            id="download-zip-btn"
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black hover:bg-[#2A2A2A] text-white text-xs font-bold shadow-md shadow-black/10 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            title="Download complete extension ready to load in chrome://extensions"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Extension (.zip)</span>
          </button>
        </div>
      </div>

      {/* Ping Toast */}
      {pingMessage && (
        <div className="fixed top-16 right-6 z-50 bg-black text-white px-4 py-2 rounded-2xl text-xs font-bold shadow-2xl flex items-center gap-2 border border-white/20 animate-in fade-in slide-in-from-top-2">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>{pingMessage}</span>
        </div>
      )}
    </header>
  );
};

