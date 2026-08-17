import React from 'react';
import { Download, Chrome, CheckCircle2, Key } from 'lucide-react';
import { downloadExtensionZip } from '../utils/packageExtension';

export const InstallationGuide: React.FC = () => {
  return (
    <div id="installation-guide" className="bg-white rounded-3xl border border-[#E5E3DF] p-6 md:p-8 flex flex-col gap-6 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#E5E3DF]">
        <div>
          <div className="flex items-center gap-2">
            <Chrome className="w-5 h-5 text-black" />
            <h2 className="font-serif font-bold text-xl text-[#1A1A1A]">Chrome Extension Installation & Guide</h2>
          </div>
          <p className="text-xs text-[#78716C] mt-1">
            Complete quickstart walkthrough for loading the Manifest V3 extension and testing on any website.
          </p>
        </div>

        <button
          onClick={downloadExtensionZip}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-black hover:bg-[#2A2A2A] text-white text-xs font-bold shadow-xl shadow-black/10 transition-all self-start md:self-auto cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Download Extension (.zip)</span>
        </button>
      </div>

      {/* 4 Step Visual Walkthrough */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Step 1 */}
        <div className="p-5 rounded-2xl bg-[#FAF9F6] border border-[#E5E3DF] flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-black text-white font-bold text-xs flex items-center justify-center">
              1
            </span>
            <h3 className="font-serif font-bold text-sm text-[#1A1A1A]">Download or Unzip the Extension</h3>
          </div>
          <p className="text-xs text-[#4A4A4A] leading-relaxed">
            Click the <strong className="text-[#1A1A1A]">Download Extension (.zip)</strong> button above, or navigate to the <code className="text-black font-mono font-semibold">/extension</code> directory in this project workspace.
          </p>
          <div className="bg-white p-3 rounded-xl border border-[#E5E3DF] text-[11px] font-mono text-[#4A4A4A] leading-relaxed">
            extension/<br/>
            ├── manifest.json<br/>
            ├── background.js<br/>
            ├── content.js & content.css<br/>
            └── popup.html, popup.js, popup.css
          </div>
        </div>

        {/* Step 2 */}
        <div className="p-5 rounded-2xl bg-[#FAF9F6] border border-[#E5E3DF] flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-black text-white font-bold text-xs flex items-center justify-center">
              2
            </span>
            <h3 className="font-serif font-bold text-sm text-[#1A1A1A]">Open chrome://extensions</h3>
          </div>
          <p className="text-xs text-[#4A4A4A] leading-relaxed">
            Open Google Chrome, type <code className="text-black font-mono font-semibold">chrome://extensions</code> in your address bar, and toggle on <strong className="text-[#1A1A1A]">Developer mode</strong> in the top-right corner.
          </p>
          <div className="bg-white p-3 rounded-xl border border-[#E5E3DF] text-[11px] text-[#4A4A4A] flex items-center justify-between">
            <span className="font-medium">Developer mode</span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#F1EFE9] text-[#1A1A1A] border border-[#E5E3DF] font-bold text-[10px] tracking-wider uppercase">
              TOGGLED ON
            </span>
          </div>
        </div>

        {/* Step 3 */}
        <div className="p-5 rounded-2xl bg-[#FAF9F6] border border-[#E5E3DF] flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-black text-white font-bold text-xs flex items-center justify-center">
              3
            </span>
            <h3 className="font-serif font-bold text-sm text-[#1A1A1A]">Click "Load unpacked"</h3>
          </div>
          <p className="text-xs text-[#4A4A4A] leading-relaxed">
            Click the <strong className="text-[#1A1A1A]">Load unpacked</strong> button in the top-left toolbar and select the extracted <code className="text-black font-mono font-semibold">extension</code> folder.
          </p>
          <div className="bg-white p-3 rounded-xl border border-[#E5E3DF] text-[11px] text-[#1A1A1A] font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>RewriteAI icon appears in Chrome toolbar!</span>
          </div>
        </div>

        {/* Step 4 */}
        <div className="p-5 rounded-2xl bg-[#FAF9F6] border border-[#E5E3DF] flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-black text-white font-bold text-xs flex items-center justify-center">
              4
            </span>
            <h3 className="font-serif font-bold text-sm text-[#1A1A1A]">Test on Any Webpage</h3>
          </div>
          <p className="text-xs text-[#4A4A4A] leading-relaxed">
            Select text anywhere on the web, click the floating <strong className="text-black font-semibold">✨ Rewrite</strong> button or press <kbd className="font-mono bg-white border border-[#E5E3DF] px-2 py-0.5 rounded-lg text-[10px]">Ctrl+Shift+R</kbd>, and transform your text!
          </p>
          <div className="bg-white p-3 rounded-xl border border-[#E5E3DF] text-[11px] text-[#4A4A4A] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Supports Gmail, Docs, Notion, Slack, and web forms</span>
          </div>
        </div>
      </div>

      {/* Backend & Security Notes */}
      <div className="p-5 rounded-2xl bg-[#FAF9F6] border border-[#E5E3DF] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <Key className="w-5 h-5 text-black flex-shrink-0" />
          <div className="text-xs">
            <strong className="text-[#1A1A1A] block font-bold text-xs">API Key Security Architecture</strong>
            <span className="text-[#78716C]">
              Your GEMINI_API_KEY is stored securely in server-side environment variables and never exposed to the Chrome Extension bundle or browser DOM.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

