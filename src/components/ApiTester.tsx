import React, { useState } from 'react';
import { Terminal, Send, Copy, Check, Clock, ShieldCheck } from 'lucide-react';
import { RewriteMode } from '../types';

export const ApiTester: React.FC = () => {
  const [testText, setTestText] = useState('i want to know when you will send me the project details');
  const [testMode, setTestMode] = useState<RewriteMode>('professional');
  const [customInstruction, setCustomInstruction] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('Spanish');

  const [isLoading, setIsLoading] = useState(false);
  const [responseJson, setResponseJson] = useState<any>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [copiedCurl, setCopiedCurl] = useState(false);

  const curlCommand = `curl -X POST http://localhost:3000/api/rewrite \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(
    {
      text: testText,
      mode: testMode,
      customInstruction: testMode === 'custom' ? customInstruction : undefined,
      targetLanguage: testMode === 'translate' ? targetLanguage : undefined,
    },
    null,
    2
  )}'`;

  const handleExecuteApi = async () => {
    setIsLoading(true);
    setResponseJson(null);
    const start = performance.now();

    try {
      const res = await fetch('/api/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: testText,
          mode: testMode,
          customInstruction: testMode === 'custom' ? customInstruction : '',
          targetLanguage: testMode === 'translate' ? targetLanguage : 'Spanish',
        }),
      });

      const data = await res.json();
      setLatency(Math.round(performance.now() - start));
      setResponseJson(data);
    } catch (err: any) {
      setLatency(Math.round(performance.now() - start));
      setResponseJson({ error: err.message || 'Failed to call backend' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(curlCommand);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  return (
    <div id="api-tester" className="bg-white rounded-3xl border border-[#E5E3DF] p-6 md:p-8 flex flex-col gap-6 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-5 border-b border-[#E5E3DF]">
        <div>
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-black" />
            <h2 className="font-serif font-bold text-xl text-[#1A1A1A]">Backend API Explorer — POST /api/rewrite</h2>
          </div>
          <p className="text-xs text-[#78716C] mt-1">
            Test the Node.js + Express backend service that securely transforms text via Google Gemini models.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold px-3.5 py-1.5 rounded-full bg-[#F1EFE9] border border-[#E5E3DF] text-[#1A1A1A]">
          <ShieldCheck className="w-4 h-4 text-black" />
          <span className="text-[10px] uppercase tracking-wider">Rate Limit: 60 req/min</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Request Builder */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#78716C]">Input Payload ("text")</label>
            <textarea
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              rows={3}
              className="w-full bg-[#FDFCFB] text-[#1A1A1A] font-serif text-sm p-3.5 rounded-2xl border border-[#E5E3DF] focus:border-black focus:ring-1 focus:ring-black outline-none leading-relaxed transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#78716C]">Rewrite Mode ("mode")</label>
              <select
                value={testMode}
                onChange={(e) => setTestMode(e.target.value as RewriteMode)}
                className="w-full bg-white text-[#1A1A1A] font-medium text-xs p-2.5 rounded-xl border border-[#E5E3DF] outline-none focus:border-black"
              >
                <option value="grammar">grammar (Improve Grammar)</option>
                <option value="professional">professional (Professional)</option>
                <option value="friendly">friendly (Friendly)</option>
                <option value="formal">formal (Formal)</option>
                <option value="concise">concise (Concise)</option>
                <option value="expand">expand (Expand)</option>
                <option value="paraphrase">paraphrase (Paraphrase)</option>
                <option value="translate">translate (Translate)</option>
                <option value="custom">custom (Custom Prompt)</option>
              </select>
            </div>

            {testMode === 'translate' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#78716C]">Target Language</label>
                <select
                  value={targetLanguage}
                  onChange={(e) => setTargetLanguage(e.target.value)}
                  className="w-full bg-white text-[#1A1A1A] font-medium text-xs p-2.5 rounded-xl border border-[#E5E3DF] outline-none focus:border-black"
                >
                  <option value="Spanish">Spanish</option>
                  <option value="French">French</option>
                  <option value="German">German</option>
                  <option value="Japanese">Japanese</option>
                  <option value="Chinese (Simplified)">Chinese</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Arabic">Arabic</option>
                </select>
              </div>
            )}

            {testMode === 'custom' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#78716C]">Custom Persona / Prompt</label>
                <input
                  type="text"
                  value={customInstruction}
                  onChange={(e) => setCustomInstruction(e.target.value)}
                  placeholder="e.g. Format as bullet points"
                  className="w-full bg-white text-[#1A1A1A] text-xs p-2.5 rounded-xl border border-[#E5E3DF] outline-none focus:border-black"
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 mt-1">
            <button
              onClick={handleExecuteApi}
              disabled={isLoading || !testText.trim()}
              className="flex-1 py-3 px-5 rounded-2xl bg-black hover:bg-[#2A2A2A] disabled:opacity-50 text-white text-xs font-bold shadow-xl shadow-black/10 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {isLoading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Calling Gemini Engine...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send POST Request</span>
                </>
              )}
            </button>
          </div>

          {/* cURL snippet */}
          <div className="flex flex-col gap-1.5 mt-2">
            <div className="flex items-center justify-between text-[10px] text-[#78716C] font-bold uppercase tracking-[0.2em]">
              <span>cURL Command</span>
              <button
                onClick={handleCopyCurl}
                className="text-[#1A1A1A] hover:underline flex items-center gap-1 font-semibold capitalize cursor-pointer"
              >
                {copiedCurl ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCurl ? 'Copied' : 'Copy cURL'}</span>
              </button>
            </div>
            <pre className="bg-[#FAF9F6] p-3.5 rounded-2xl border border-[#E5E3DF] text-[11px] font-mono text-[#1A1A1A] overflow-x-auto whitespace-pre-wrap leading-relaxed">
              {curlCommand}
            </pre>
          </div>
        </div>

        {/* Right Column: Live Response & Inspection */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#78716C]">Live JSON Response</span>
            {latency !== null && (
              <span className="text-[11px] font-mono font-bold text-[#1A1A1A] flex items-center gap-1">
                <Clock className="w-3 h-3 text-black" />
                <span>{latency} ms</span>
              </span>
            )}
          </div>

          <div className="bg-[#FAF9F6] rounded-2xl border border-[#E5E3DF] p-5 min-h-[320px] flex flex-col justify-between font-mono text-xs overflow-auto">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-[#78716C]">
                <span className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-sans">Processing through Node.js & Gemini...</span>
              </div>
            ) : responseJson ? (
              <pre className="text-[#1A1A1A] font-mono text-xs whitespace-pre-wrap leading-relaxed">
                {JSON.stringify(responseJson, null, 2)}
              </pre>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-[#78716C] font-sans text-xs">
                <Terminal className="w-8 h-8 text-[#A8A29E] mb-2" />
                <span>Click "Send POST Request" to test live execution</span>
              </div>
            )}

            {responseJson && responseJson.result && (
              <div className="mt-4 pt-4 border-t border-[#E5E3DF] font-sans">
                <span className="text-[10px] text-[#78716C] uppercase font-bold tracking-[0.2em] block mb-1.5">
                  Decoded Rewritten Output:
                </span>
                <p className="text-sm text-[#1A1A1A] font-serif italic bg-white p-4 rounded-2xl border border-[#E5E3DF] leading-relaxed">
                  "{responseJson.result}"
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

