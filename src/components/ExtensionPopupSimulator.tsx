import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  RotateCw,
  Clock,
  Settings,
  Trash2,
  CornerDownLeft,
  Zap,
  ExternalLink,
  Info,
  Server,
  Key,
} from 'lucide-react';
import { RewriteMode, RewriteModeConfig, HistoryItem, RewriteResponseData } from '../types';

const REWRITE_MODES: RewriteModeConfig[] = [
  {
    id: 'grammar',
    name: 'Improve Grammar',
    shortDesc: 'Fix typos & syntax',
    icon: '✨',
    examplePrompt: 'Fix spelling, punctuation, and grammatical mistakes.',
  },
  {
    id: 'professional',
    name: 'Professional',
    shortDesc: 'Polished workplace tone',
    icon: '💼',
    examplePrompt: 'Elevate into clear, courteous business language.',
  },
  {
    id: 'friendly',
    name: 'Friendly',
    shortDesc: 'Warm & conversational',
    icon: '👋',
    examplePrompt: 'Make it warm, approachable, and engaging.',
  },
  {
    id: 'formal',
    name: 'Formal',
    shortDesc: 'Academic & refined',
    icon: '⚖️',
    examplePrompt: 'Rewrite with sophisticated and formal vocabulary.',
  },
  {
    id: 'concise',
    name: 'Concise',
    shortDesc: 'Cut fluff & filler',
    icon: '✂️',
    examplePrompt: 'Remove redundant phrases and deliver punchy sentences.',
  },
  {
    id: 'expand',
    name: 'Expand',
    shortDesc: 'Elaborate & add depth',
    icon: '📖',
    examplePrompt: 'Enrich context with comprehensive phrasing.',
  },
  {
    id: 'paraphrase',
    name: 'Paraphrase',
    shortDesc: 'Alternative wording',
    icon: '🔄',
    examplePrompt: 'Express identical meaning with alternative wording.',
  },
  {
    id: 'translate',
    name: 'Translate',
    shortDesc: 'Convert language',
    icon: '🌐',
    examplePrompt: 'Translate accurately into the chosen language.',
  },
  {
    id: 'custom',
    name: 'Custom Rewrite',
    shortDesc: 'Your persona / prompt',
    icon: '🛠️',
    examplePrompt: 'Apply any custom prompt or formatting guidelines.',
  },
];

const SAMPLE_TEXT_CYCLER = [
  'i want to know when you will send me the project details',
  'hey team can you review the draft asap cause the client wants it today',
  'the software is very fast and efficient however there are few issues with safari browser',
  'please find attached our revised research paper on generative neural models',
];

interface ExtensionPopupSimulatorProps {
  externalSelectedText?: string;
  onReplaceInWebpage?: (newText: string) => void;
  onOpenGuide?: () => void;
  onOpenApi?: () => void;
}

export const ExtensionPopupSimulator: React.FC<ExtensionPopupSimulatorProps> = ({
  externalSelectedText,
  onReplaceInWebpage,
  onOpenGuide,
  onOpenApi,
}) => {
  const [inputText, setInputText] = useState(
    'i want to know when you will send me the project details'
  );
  const [selectedMode, setSelectedMode] = useState<RewriteMode>('professional');
  const [customInstruction, setCustomInstruction] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('Spanish');
  const [selectedModel, setSelectedModel] = useState('gemini-3.6-flash');

  const [isLoading, setIsLoading] = useState(false);
  const [rewriteResult, setRewriteResult] = useState<RewriteResponseData | null>({
    result: 'I would like to know when you will be able to send me the project details.',
    mode: 'professional',
    model: 'gemini-3.6-flash',
    stats: {
      originalLength: 56,
      resultLength: 76,
      originalWords: 12,
      resultWords: 14,
      durationMs: 340,
    },
  });

  const [copied, setCopied] = useState(false);
  const [replaced, setReplaced] = useState(false);
  const [activeDrawer, setActiveDrawer] = useState<'none' | 'history' | 'settings'>('none');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([
    {
      id: '1',
      originalText: 'i want to know when you will send me the project details',
      rewrittenText: 'I would like to know when you will be able to send me the project details.',
      mode: 'professional',
      timestamp: Date.now() - 1000 * 60 * 5,
      durationMs: 340,
    },
  ]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Sync when user passes text from simulated webpage
  useEffect(() => {
    if (externalSelectedText && externalSelectedText.trim()) {
      setInputText(externalSelectedText.trim());
      showToast('Text loaded into Extension Popup!');
    }
  }, [externalSelectedText]);

  const handleRewrite = async () => {
    if (!inputText.trim() || isLoading) return;

    setIsLoading(true);
    setCopied(false);
    setReplaced(false);

    try {
      const response = await fetch('/api/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText.trim(),
          mode: selectedMode,
          customInstruction: customInstruction.trim(),
          targetLanguage,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Rewrite request failed' }));
        throw new Error(errorData.error || `Server responded with status ${response.status}`);
      }

      const data: RewriteResponseData = await response.json();
      setRewriteResult(data);

      // Add to local history
      const newHistoryItem: HistoryItem = {
        id: Date.now().toString(),
        originalText: inputText.trim(),
        rewrittenText: data.result,
        mode: selectedMode,
        timestamp: Date.now(),
        durationMs: data.stats?.durationMs,
      };
      setHistory((prev) => [newHistoryItem, ...prev.slice(0, 19)]);
    } catch (err: any) {
      alert(`RewriteAI Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!rewriteResult?.result) return;
    await navigator.clipboard.writeText(rewriteResult.result);
    setCopied(true);
    showToast('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReplace = () => {
    if (!rewriteResult?.result) return;
    if (onReplaceInWebpage) {
      onReplaceInWebpage(rewriteResult.result);
    }
    setReplaced(true);
    showToast('Replaced text on webpage!');
    setTimeout(() => setReplaced(false), 2000);
  };

  const cycleSampleText = () => {
    const currentIndex = SAMPLE_TEXT_CYCLER.indexOf(inputText);
    const nextIndex = (currentIndex + 1) % SAMPLE_TEXT_CYCLER.length;
    setInputText(SAMPLE_TEXT_CYCLER[nextIndex]);
    showToast('Loaded sample text');
  };

  const wordCount = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;
  const charCount = inputText.length;

  return (
    <div className="w-full max-w-[440px] mx-auto bg-white border border-[#E5E3DF] rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col relative text-[#1A1A1A]">
      {/* Extension Simulator Top Frame Badge */}
      <div className="bg-[#FAF9F6] px-5 py-2.5 border-b border-[#E5E3DF] flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-[#78716C]">
        <button
          onClick={onOpenGuide}
          className="flex items-center gap-2 hover:text-black transition-colors cursor-pointer"
          title="Click to view Chrome Extension setup guide"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
          <span>Chrome Extension Popup</span>
        </button>
        <button
          onClick={() => {
            navigator.clipboard.writeText('Ctrl+Shift+R');
            showToast('Simulated shortcut triggered: Ctrl + Shift + R');
          }}
          className="font-mono text-[10px] text-[#A8A29E] hover:text-black font-medium hover:underline cursor-pointer flex items-center gap-1"
          title="Click to simulate shortcut activation"
        >
          <Zap className="w-2.5 h-2.5 text-black" />
          <span>Ctrl + Shift + R</span>
        </button>
      </div>

      {/* Extension Header */}
      <header className="px-5 py-3.5 border-b border-[#E5E3DF] flex items-center justify-between bg-white sticky top-0 z-20">
        <button
          onClick={() => {
            setInputText('i want to know when you will send me the project details');
            setSelectedMode('professional');
            showToast('Extension reset to default state');
          }}
          className="flex items-center gap-2.5 text-left group cursor-pointer"
          title="Click to reset popup"
        >
          <div className="w-7 h-7 rounded-lg overflow-hidden shadow-sm transition-transform group-hover:scale-105 flex items-center justify-center bg-black">
            <img
              src="/extension/icons/icon32.png"
              alt="RewriteAI Logo"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <div className="font-serif font-bold text-sm text-[#1A1A1A] tracking-tight leading-tight group-hover:text-black">
              RewriteStudio
            </div>
            <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#78716C]">
              Gemini Assistant
            </div>
          </div>
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveDrawer(activeDrawer === 'history' ? 'none' : 'history')}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              activeDrawer === 'history' ? 'bg-black text-white' : 'text-[#78716C] hover:bg-[#F1EFE9] hover:text-[#1A1A1A]'
            }`}
            title="History"
          >
            <Clock className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveDrawer(activeDrawer === 'settings' ? 'none' : 'settings')}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              activeDrawer === 'settings' ? 'bg-black text-white' : 'text-[#78716C] hover:bg-[#F1EFE9] hover:text-[#1A1A1A]'
            }`}
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Body */}
      <div className="p-5 flex flex-col gap-4 max-h-[580px] overflow-y-auto">
        {/* Input Section */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[10px] text-[#78716C] font-bold uppercase tracking-[0.2em]">
            <span>Detected Selection</span>
            <div className="flex items-center gap-2 font-normal text-[#A8A29E] tracking-normal">
              <button
                onClick={() => showToast(`${charCount} characters, ${wordCount} words`)}
                className="hover:text-black hover:underline cursor-pointer"
              >
                <span>{charCount} chars</span> • <span>{wordCount} words</span>
              </button>
              <button
                onClick={() => {
                  setInputText('');
                  showToast('Input cleared');
                }}
                className="text-[#1A1A1A] font-medium hover:underline capitalize cursor-pointer ml-1"
              >
                Clear
              </button>
            </div>
          </div>
          <div className="relative">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type or select text on webpage..."
              rows={3}
              className="w-full bg-[#FDFCFB] text-[#1A1A1A] font-serif text-sm p-4 rounded-2xl border border-[#E5E3DF] focus:border-black focus:ring-1 focus:ring-black outline-none leading-relaxed resize-none transition-all placeholder:text-[#A8A29E] placeholder:font-sans"
            />
            <button
              onClick={cycleSampleText}
              className="absolute top-2.5 right-3 text-[9px] px-2 py-0.5 bg-[#F1EFE9] hover:bg-black hover:text-white rounded uppercase font-bold text-[#78716C] tracking-wider transition-colors cursor-pointer"
              title="Click to cycle sample text presets"
            >
              Cycle Sample
            </button>
          </div>
        </div>

        {/* 9 Rewrite Modes Grid */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] text-[#78716C] font-bold uppercase tracking-[0.2em]">Rewrite Modes</span>
          <div className="grid grid-cols-3 gap-1.5">
            {REWRITE_MODES.map((mode) => {
              const isSelected = selectedMode === mode.id;
              return (
                <button
                  key={mode.id}
                  onClick={() => {
                    setSelectedMode(mode.id);
                  }}
                  className={`flex flex-col items-start p-2.5 rounded-2xl text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-black text-white shadow-xl shadow-black/10'
                      : 'bg-[#FAF9F6] border border-transparent hover:border-[#E5E3DF] hover:bg-[#F1EFE9] text-[#1A1A1A]'
                  }`}
                >
                  <span className="text-base mb-1">{mode.icon}</span>
                  <span className={`text-[11px] font-semibold leading-tight ${isSelected ? 'text-white' : 'text-[#1A1A1A]'}`}>
                    {mode.name}
                  </span>
                  <span className={`text-[9px] leading-tight mt-0.5 ${isSelected ? 'text-white/60' : 'text-[#78716C]'}`}>
                    {mode.shortDesc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Conditional Field: Translate Target Language */}
        {selectedMode === 'translate' && (
          <div className="flex flex-col gap-1.5 bg-[#FAF9F6] p-3 rounded-2xl border border-[#E5E3DF]">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#78716C]">Target Language</label>
            <select
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              className="w-full bg-white text-[#1A1A1A] text-xs p-2.5 rounded-xl border border-[#E5E3DF] outline-none focus:border-black font-medium cursor-pointer"
            >
              <option value="Spanish">Spanish (Español)</option>
              <option value="French">French (Français)</option>
              <option value="German">German (Deutsch)</option>
              <option value="Japanese">Japanese (日本語)</option>
              <option value="Chinese (Simplified)">Chinese (简体中文)</option>
              <option value="Hindi">Hindi (हिन्दी)</option>
              <option value="Arabic">Arabic (العربية)</option>
              <option value="Portuguese">Portuguese (Português)</option>
              <option value="Italian">Italian (Italiano)</option>
            </select>
          </div>
        )}

        {/* Conditional Field: Custom Persona / Rewrite Instructions */}
        {selectedMode === 'custom' && (
          <div className="flex flex-col gap-1.5 bg-[#FAF9F6] p-3 rounded-2xl border border-[#E5E3DF]">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#78716C]">Custom Persona / Prompt</label>
            <input
              type="text"
              value={customInstruction}
              onChange={(e) => setCustomInstruction(e.target.value)}
              placeholder="e.g. Write like an editor at The New Yorker..."
              className="w-full bg-white text-[#1A1A1A] text-xs p-2.5 rounded-xl border border-[#E5E3DF] outline-none focus:border-black"
            />
          </div>
        )}

        {/* Generate Action Button */}
        <button
          onClick={handleRewrite}
          disabled={isLoading || !inputText.trim()}
          className="w-full py-3 px-4 rounded-2xl bg-black hover:bg-[#2A2A2A] text-white font-bold text-xs shadow-xl shadow-black/15 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isLoading ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Transforming with Gemini...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 fill-current" />
              <span>Generate Transformation</span>
            </>
          )}
        </button>

        {/* AI Transformation Result Section */}
        {rewriteResult && (
          <div className="flex flex-col gap-2 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#1A1A1A]">AI Transformation</span>
                <button
                  onClick={() => showToast(`Mode: ${rewriteResult.mode}`)}
                  className="text-[9px] px-2 py-0.5 rounded-full bg-[#F1EFE9] hover:bg-black hover:text-white border border-[#E5E3DF] text-[#1A1A1A] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  {rewriteResult.mode}
                </button>
              </div>
              {rewriteResult.stats && (
                <button
                  onClick={() =>
                    showToast(
                      `Latency: ${rewriteResult.stats?.durationMs}ms | Words: ${rewriteResult.stats?.resultWords}`
                    )
                  }
                  className="flex items-center gap-1.5 hover:text-black transition-colors cursor-pointer"
                  title="Click to view latency info"
                >
                  <span className="w-1.5 h-1.5 bg-black rounded-full animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#78716C]">
                    {(rewriteResult.stats.durationMs / 1000).toFixed(1)}s
                  </span>
                </button>
              )}
            </div>

            {/* Editorial Transformation Card */}
            <div className="bg-white border-2 border-black rounded-3xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.06)] relative flex flex-col gap-3">
              <div className="font-serif text-base leading-relaxed italic text-[#1A1A1A]">
                "{rewriteResult.result}"
              </div>

              {/* Action Buttons Toolbar */}
              <div className="flex items-center gap-2 pt-2 border-t border-[#E5E3DF]/60">
                <button
                  onClick={handleCopy}
                  className={`flex-1 py-2.5 px-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all border cursor-pointer ${
                    copied
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                      : 'bg-[#F8F7F4] hover:bg-[#F1EFE9] text-[#1A1A1A] border-[#E5E3DF]'
                  }`}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>

                <button
                  onClick={handleReplace}
                  className={`flex-1 py-2.5 px-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xl shadow-black/15 cursor-pointer ${
                    replaced
                      ? 'bg-emerald-600 text-white'
                      : 'bg-black hover:bg-[#2A2A2A] text-white'
                  }`}
                  title="Replace selected text on webpage"
                >
                  <CornerDownLeft className="w-3.5 h-3.5" />
                  <span>{replaced ? 'Replaced!' : 'Replace Selection'}</span>
                </button>

                <button
                  onClick={handleRewrite}
                  disabled={isLoading}
                  className="p-2.5 rounded-2xl bg-[#F8F7F4] hover:bg-[#F1EFE9] border border-[#E5E3DF] text-[#1A1A1A] transition-colors cursor-pointer"
                  title="Regenerate"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* History Drawer */}
      {activeDrawer === 'history' && (
        <div className="absolute inset-x-0 top-[56px] bottom-0 bg-white z-30 p-5 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 border-t border-[#E5E3DF] overflow-y-auto">
          <div className="flex items-center justify-between border-b border-[#E5E3DF] pb-3">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#1A1A1A]">Rewrite History</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setHistory([]);
                  showToast('History cleared');
                }}
                className="text-[11px] text-rose-600 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear</span>
              </button>
              <button
                onClick={() => setActiveDrawer('none')}
                className="text-[#78716C] hover:text-[#1A1A1A] text-base font-bold px-1 cursor-pointer"
              >
                &times;
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {history.length === 0 ? (
              <div className="text-center py-10 text-xs text-[#78716C]">No rewrite history yet.</div>
            ) : (
              history.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setInputText(item.originalText);
                    setSelectedMode(item.mode);
                    setRewriteResult({
                      result: item.rewrittenText,
                      mode: item.mode,
                      model: 'gemini-3.6-flash',
                    });
                    setActiveDrawer('none');
                    showToast('History item restored to editor');
                  }}
                  className="p-3 rounded-2xl bg-[#FAF9F6] hover:bg-[#F1EFE9] border border-[#E5E3DF] text-left cursor-pointer transition-colors flex flex-col gap-1 w-full"
                >
                  <div className="flex items-center justify-between text-[10px] text-[#78716C] w-full">
                    <span className="font-bold text-black uppercase tracking-wider">{item.mode}</span>
                    <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-xs text-[#1A1A1A] font-serif italic line-clamp-2 leading-relaxed">
                    "{item.rewrittenText}"
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Settings Drawer */}
      {activeDrawer === 'settings' && (
        <div className="absolute inset-x-0 top-[56px] bottom-0 bg-white z-30 p-5 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 border-t border-[#E5E3DF] overflow-y-auto">
          <div className="flex items-center justify-between border-b border-[#E5E3DF] pb-3">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#1A1A1A]">Extension Settings</span>
            <button onClick={() => setActiveDrawer('none')} className="text-[#78716C] hover:text-[#1A1A1A] text-base font-bold px-1 cursor-pointer">
              &times;
            </button>
          </div>

          <div className="flex flex-col gap-4 text-xs">
            <div className="flex flex-col gap-1.5">
              <label className="text-[#1A1A1A] font-bold text-[11px] uppercase tracking-wider flex items-center justify-between">
                <span>Backend Endpoint</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText('http://localhost:3000');
                    showToast('Copied endpoint: http://localhost:3000');
                  }}
                  className="text-[10px] text-[#78716C] hover:text-black hover:underline cursor-pointer"
                >
                  Copy URL
                </button>
              </label>
              <input
                type="text"
                value="http://localhost:3000"
                readOnly
                className="w-full bg-[#FAF9F6] text-[#4A4A4A] p-2.5 rounded-xl border border-[#E5E3DF] font-mono text-[11px]"
              />
              <span className="text-[10px] text-[#78716C]">Proxies Gemini API calls safely on port 3000.</span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[#1A1A1A] font-bold text-[11px] uppercase tracking-wider">Model Engine</label>
              <select
                value={selectedModel}
                onChange={(e) => {
                  setSelectedModel(e.target.value);
                  showToast(`Selected model: ${e.target.value}`);
                }}
                className="w-full p-2.5 rounded-xl bg-[#FAF9F6] border border-[#E5E3DF] text-[11px] text-[#1A1A1A] font-mono outline-none cursor-pointer"
              >
                <option value="gemini-3.6-flash">gemini-3.6-flash (Stable Fast)</option>
                <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Ultra Fast)</option>
                <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview (Complex Reasoning)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[#1A1A1A] font-bold text-[11px] uppercase tracking-wider">Default Keyboard Shortcut</label>
              <button
                onClick={() => {
                  navigator.clipboard.writeText('Ctrl+Shift+R');
                  showToast('Shortcut copied: Ctrl + Shift + R');
                }}
                className="flex items-center gap-1 font-mono text-[11px] text-[#1A1A1A] cursor-pointer hover:opacity-80 text-left"
                title="Click to copy shortcut"
              >
                <kbd className="px-2 py-1 rounded-lg bg-[#FAF9F6] border border-[#E5E3DF] shadow-xs">Ctrl</kbd> +
                <kbd className="px-2 py-1 rounded-lg bg-[#FAF9F6] border border-[#E5E3DF] shadow-xs">Shift</kbd> +
                <kbd className="px-2 py-1 rounded-lg bg-[#FAF9F6] border border-[#E5E3DF] shadow-xs">R</kbd>
              </button>
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-[#E5E3DF]">
              <button
                onClick={() => {
                  setActiveDrawer('none');
                  if (onOpenApi) onOpenApi();
                }}
                className="p-2.5 rounded-xl bg-[#FAF9F6] hover:bg-[#F1EFE9] border border-[#E5E3DF] text-[#1A1A1A] font-semibold text-xs flex items-center justify-between cursor-pointer"
              >
                <span>Test API in Explorer</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  setActiveDrawer('none');
                  if (onOpenGuide) onOpenGuide();
                }}
                className="p-2.5 rounded-xl bg-[#FAF9F6] hover:bg-[#F1EFE9] border border-[#E5E3DF] text-[#1A1A1A] font-semibold text-xs flex items-center justify-between cursor-pointer"
              >
                <span>Chrome Installation Guide</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Internal Mini Toast */}
      {toastMessage && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 bg-black text-white px-3.5 py-1.5 rounded-2xl text-[11px] font-bold shadow-2xl flex items-center gap-1.5 border border-white/20 whitespace-nowrap animate-in fade-in">
          <Check className="w-3 h-3 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

