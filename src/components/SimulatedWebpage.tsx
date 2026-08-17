import React, { useState, useRef } from 'react';
import {
  Mail,
  Sparkles,
  Send,
  Copy,
  Check,
  MousePointer,
  RotateCcw,
  MessageSquare,
  Globe,
  FileText,
  MessageCircle,
  Star,
  ChevronDown,
  User,
  ExternalLink,
} from 'lucide-react';
import { RewriteMode } from '../types';

interface SimulatedWebpageProps {
  onSelectForPopup: (text: string) => void;
  onQuickRewrite: (text: string, mode: RewriteMode, customInstruction?: string) => Promise<string>;
  onOpenTab?: (tab: 'simulator' | 'api' | 'guide' | 'files') => void;
}

type WebpageScenario = 'email' | 'chat' | 'article' | 'review';

export const SimulatedWebpage: React.FC<SimulatedWebpageProps> = ({
  onSelectForPopup,
  onQuickRewrite,
  onOpenTab,
}) => {
  const [activeScenario, setActiveScenario] = useState<WebpageScenario>('email');

  // Simulated email composer fields
  const [recipient, setRecipient] = useState('managing-editor@publishing.org');
  const [showRecipientDropdown, setShowRecipientDropdown] = useState(false);
  const [emailSubject, setEmailSubject] = useState('Project status update & timeline delivery');
  const [emailBody, setEmailBody] = useState(
    'i want to know when you will send me the project details. we need it urgent because the client is asking for progress and we cant start without the designs.'
  );

  // Simulated Slack chat
  const [chatMessage, setChatMessage] = useState(
    'hey @team can everyone please check the staging server cause some links are broken and we gotta ship today'
  );

  // Simulated Article / Notion draft
  const [articleContent, setArticleContent] = useState(
    'the research shows that cognitive focus improves significantly when workers take periodic breaks throughout the afternoon. however many employees does not follow this recommendation.'
  );

  // Simulated web review box
  const [feedbackText, setFeedbackText] = useState(
    'the application is great but there is some bugs when clicking the button on mobile screens and it lag sometimes.'
  );

  // Floating trigger button state
  const [floatingPos, setFloatingPos] = useState<{ top: number; left: number } | null>(null);
  const [selectedText, setSelectedText] = useState('');
  const [selectedSource, setSelectedSource] = useState<'body' | 'chat' | 'article' | 'feedback' | null>(null);
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null);

  // Quick in-page popover state
  const [showQuickModal, setShowQuickModal] = useState(false);
  const [quickMode, setQuickMode] = useState<RewriteMode>('grammar');
  const [isRewriting, setIsRewriting] = useState(false);
  const [quickResult, setQuickResult] = useState<string | null>(null);
  const [copiedToast, setCopiedToast] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const bodyTextareaRef = useRef<HTMLTextAreaElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const articleTextareaRef = useRef<HTMLTextAreaElement>(null);
  const feedbackInputRef = useRef<HTMLTextAreaElement>(null);

  const triggerToast = (msg: string) => {
    setCopiedToast(msg);
    setTimeout(() => setCopiedToast(null), 2500);
  };

  // Selection detection handler
  const handleSelection = (source: 'body' | 'chat' | 'article' | 'feedback', el?: HTMLTextAreaElement | null) => {
    setTimeout(() => {
      if (el) {
        const start = el.selectionStart;
        const end = el.selectionEnd;
        if (start !== undefined && end !== undefined && start !== end) {
          const text = el.value.substring(start, end).trim();
          if (text.length > 1 && containerRef.current) {
            const rect = el.getBoundingClientRect();
            const containerRect = containerRef.current.getBoundingClientRect();

            setSelectedText(text);
            setSelectedSource(source);
            setSelectionRange({ start, end });
            setFloatingPos({
              top: rect.top - containerRect.top + 45,
              left: Math.min(containerRect.width - 140, Math.max(20, rect.left - containerRect.left + 30)),
            });
            setShowQuickModal(false);
            return;
          }
        }
      }

      // Check standard window selection
      const sel = window.getSelection();
      if (sel && !sel.isCollapsed && containerRef.current) {
        const text = sel.toString().trim();
        if (text.length > 1) {
          const range = sel.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          const containerRect = containerRef.current.getBoundingClientRect();

          setSelectedText(text);
          setSelectedSource(source);
          setSelectionRange(null);
          setFloatingPos({
            top: rect.bottom - containerRect.top + 8,
            left: Math.min(containerRect.width - 140, Math.max(10, rect.left - containerRect.left)),
          });
          setShowQuickModal(false);
          return;
        }
      }

      if (!showQuickModal) {
        setFloatingPos(null);
      }
    }, 50);
  };

  // Click on a sample sentence to select it automatically!
  const selectSentence = (text: string, source: 'body' | 'chat' | 'article' | 'feedback') => {
    setSelectedText(text);
    setSelectedSource(source);
    if (containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      setFloatingPos({
        top: 220,
        left: Math.min(containerRect.width - 140, 60),
      });
      setShowQuickModal(true);
    }
  };

  const handleExecuteQuickRewrite = async (mode: RewriteMode) => {
    if (!selectedText) return;
    setIsRewriting(true);
    setQuickMode(mode);
    try {
      const result = await onQuickRewrite(selectedText, mode);
      setQuickResult(result);
    } catch (err: any) {
      alert(`Error: ${err.message || 'Could not rewrite'}`);
    } finally {
      setIsRewriting(false);
    }
  };

  const handleReplaceInPage = () => {
    if (!quickResult) return;

    if (selectedSource === 'body' && bodyTextareaRef.current) {
      if (selectionRange) {
        const before = emailBody.substring(0, selectionRange.start);
        const after = emailBody.substring(selectionRange.end);
        setEmailBody(before + quickResult + after);
      } else {
        setEmailBody(emailBody.replace(selectedText, quickResult));
      }
    } else if (selectedSource === 'chat' && chatInputRef.current) {
      if (selectionRange) {
        const before = chatMessage.substring(0, selectionRange.start);
        const after = chatMessage.substring(selectionRange.end);
        setChatMessage(before + quickResult + after);
      } else {
        setChatMessage(chatMessage.replace(selectedText, quickResult));
      }
    } else if (selectedSource === 'article' && articleTextareaRef.current) {
      if (selectionRange) {
        const before = articleContent.substring(0, selectionRange.start);
        const after = articleContent.substring(selectionRange.end);
        setArticleContent(before + quickResult + after);
      } else {
        setArticleContent(articleContent.replace(selectedText, quickResult));
      }
    } else if (selectedSource === 'feedback' && feedbackInputRef.current) {
      if (selectionRange) {
        const before = feedbackText.substring(0, selectionRange.start);
        const after = feedbackText.substring(selectionRange.end);
        setFeedbackText(before + quickResult + after);
      } else {
        setFeedbackText(feedbackText.replace(selectedText, quickResult));
      }
    } else {
      setEmailBody(quickResult);
    }

    triggerToast('Text replaced directly in page element!');
    setShowQuickModal(false);
    setFloatingPos(null);
    setQuickResult(null);
  };

  const handleSend = () => {
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setSentSuccess(true);
      triggerToast('Message submitted successfully!');
      setTimeout(() => setSentSuccess(false), 3000);
    }, 800);
  };

  const resetSandbox = () => {
    setEmailBody('i want to know when you will send me the project details. we need it urgent because the client is asking for progress and we cant start without the designs.');
    setChatMessage('hey @team can everyone please check the staging server cause some links are broken and we gotta ship today');
    setArticleContent('the research shows that cognitive focus improves significantly when workers take periodic breaks throughout the afternoon. however many employees does not follow this recommendation.');
    setFeedbackText('the application is great but there is some bugs when clicking the button on mobile screens and it lag sometimes.');
    setEmailSubject('Project status update & timeline delivery');
    setShowQuickModal(false);
    setFloatingPos(null);
    triggerToast('Sandbox content reset to defaults');
  };

  const urls: Record<WebpageScenario, string> = {
    email: 'https://workspace-mail.internal/compose?id=9482',
    chat: 'https://app.slack.com/client/T0482/C0384-general',
    article: 'https://medium.com/draft/ai-editorial-workflow',
    review: 'https://trustpilot.com/evaluate/rewrite-ai',
  };

  return (
    <div id="simulated-webpage" ref={containerRef} className="relative bg-white rounded-3xl border border-[#E5E3DF] p-6 flex flex-col gap-5 shadow-sm">
      {/* Browser Bar Mockup */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5E3DF] text-xs">
        <div className="flex items-center gap-3">
          {/* Clickable Window Control Dots */}
          <div className="flex gap-1.5 items-center">
            <button
              onClick={resetSandbox}
              title="Click red dot to Reset sandbox state"
              className="w-3 h-3 rounded-full bg-rose-400 hover:bg-rose-500 transition-transform hover:scale-125 cursor-pointer"
            />
            <button
              onClick={() => triggerToast('Sandbox view toggled')}
              title="Click yellow dot to toggle view"
              className="w-3 h-3 rounded-full bg-amber-400 hover:bg-amber-500 transition-transform hover:scale-125 cursor-pointer"
            />
            <button
              onClick={() => {
                selectSentence('i want to know when you will send me the project details.', 'body');
                triggerToast('Sample text selected & ready to rewrite!');
              }}
              title="Click green dot to auto-select sample text"
              className="w-3 h-3 rounded-full bg-emerald-400 hover:bg-emerald-500 transition-transform hover:scale-125 cursor-pointer"
            />
          </div>

          {/* Scenario Tabs inside browser bar */}
          <div className="flex items-center gap-1 bg-[#F1EFE9] p-0.5 rounded-xl border border-[#E5E3DF]">
            <button
              onClick={() => setActiveScenario('email')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeScenario === 'email' ? 'bg-white text-black shadow-xs' : 'text-[#78716C] hover:text-black'
              }`}
            >
              <Mail className="w-3 h-3" />
              <span>Mail</span>
            </button>
            <button
              onClick={() => setActiveScenario('chat')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeScenario === 'chat' ? 'bg-white text-black shadow-xs' : 'text-[#78716C] hover:text-black'
              }`}
            >
              <MessageCircle className="w-3 h-3" />
              <span>Slack</span>
            </button>
            <button
              onClick={() => setActiveScenario('article')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeScenario === 'article' ? 'bg-white text-black shadow-xs' : 'text-[#78716C] hover:text-black'
              }`}
            >
              <FileText className="w-3 h-3" />
              <span>Article</span>
            </button>
            <button
              onClick={() => setActiveScenario('review')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeScenario === 'review' ? 'bg-white text-black shadow-xs' : 'text-[#78716C] hover:text-black'
              }`}
            >
              <Star className="w-3 h-3" />
              <span>Review</span>
            </button>
          </div>
        </div>

        {/* Clickable Address Bar URL */}
        <button
          onClick={() => {
            navigator.clipboard.writeText(urls[activeScenario]);
            triggerToast(`Copied URL: ${urls[activeScenario]}`);
          }}
          className="flex items-center gap-2 bg-[#F8F7F4] hover:bg-[#F1EFE9] px-3.5 py-1 rounded-full border border-[#E5E3DF] text-[#78716C] hover:text-black text-[11px] font-mono transition-colors cursor-pointer text-left truncate"
          title="Click to copy current simulated URL"
        >
          <Globe className="w-3 h-3 text-black shrink-0" />
          <span className="truncate">{urls[activeScenario]}</span>
        </button>
      </div>

      {/* Quick Interactive Sentence Selector Pills */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <span className="text-[#78716C] text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-1">
          <MousePointer className="w-3 h-3 text-black" />
          <span>Click to Rewrite:</span>
        </span>
        <button
          onClick={() => selectSentence('i want to know when you will send me the project details.', 'body')}
          className="px-2.5 py-1 rounded-xl bg-[#FAF9F6] hover:bg-black hover:text-white text-[#1A1A1A] border border-[#E5E3DF] text-[11px] font-medium transition-all cursor-pointer truncate max-w-[200px]"
          title="Click to test rewriting this phrase"
        >
          "i want to know when..."
        </button>
        <button
          onClick={() => selectSentence('we need it urgent because the client is asking for progress', 'body')}
          className="px-2.5 py-1 rounded-xl bg-[#FAF9F6] hover:bg-black hover:text-white text-[#1A1A1A] border border-[#E5E3DF] text-[11px] font-medium transition-all cursor-pointer truncate max-w-[200px]"
          title="Click to test rewriting this phrase"
        >
          "we need it urgent..."
        </button>
        <button
          onClick={() => selectSentence('the application is great but there is some bugs', 'feedback')}
          className="px-2.5 py-1 rounded-xl bg-[#FAF9F6] hover:bg-black hover:text-white text-[#1A1A1A] border border-[#E5E3DF] text-[11px] font-medium transition-all cursor-pointer truncate max-w-[200px]"
          title="Click to test rewriting this phrase"
        >
          "application is great but..."
        </button>
      </div>

      {/* Scenario 1: Email Composer */}
      {activeScenario === 'email' && (
        <div className="bg-[#FDFCFB] rounded-2xl border border-[#E5E3DF] p-5 shadow-xs flex flex-col gap-3.5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-[#E5E3DF] pb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#1A1A1A] tracking-tight uppercase">
              <Mail className="w-4 h-4 text-black" />
              <span>Workspace Mail Composer</span>
            </div>
            <button
              onClick={() => {
                if (bodyTextareaRef.current) {
                  bodyTextareaRef.current.select();
                  handleSelection('body', bodyTextareaRef.current);
                }
              }}
              className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-[#F1EFE9] hover:bg-black hover:text-white border border-[#E5E3DF] text-[#78716C] transition-colors cursor-pointer"
              title="Click to select all text in email draft"
            >
              Select All Body Text
            </button>
          </div>

          <div className="flex flex-col gap-2.5">
            {/* Recipient Field with Clickable Dropdown */}
            <div className="relative">
              <div className="flex items-center justify-between text-xs text-[#78716C] border-b border-[#E5E3DF]/70 pb-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[#1A1A1A] uppercase tracking-wider text-[10px]">To:</span>
                  <button
                    onClick={() => setShowRecipientDropdown(!showRecipientDropdown)}
                    className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-[#FAF9F6] hover:bg-[#F1EFE9] border border-[#E5E3DF] text-[#1A1A1A] font-medium text-xs cursor-pointer"
                  >
                    <User className="w-3 h-3 text-black" />
                    <span>{recipient}</span>
                    <ChevronDown className="w-3 h-3 text-[#78716C]" />
                  </button>
                </div>
                <span className="text-[10px] text-[#A8A29E]">CC / BCC</span>
              </div>

              {showRecipientDropdown && (
                <div className="absolute top-8 left-6 z-20 bg-white border border-[#E5E3DF] rounded-2xl shadow-xl p-1.5 flex flex-col gap-1 w-64 text-xs">
                  <button
                    onClick={() => {
                      setRecipient('managing-editor@publishing.org');
                      setShowRecipientDropdown(false);
                    }}
                    className="p-2 rounded-xl text-left hover:bg-[#F1EFE9] font-medium cursor-pointer"
                  >
                    Managing Editor (Publishing)
                  </button>
                  <button
                    onClick={() => {
                      setRecipient('sarah.lin@corporate-client.com');
                      setShowRecipientDropdown(false);
                    }}
                    className="p-2 rounded-xl text-left hover:bg-[#F1EFE9] font-medium cursor-pointer"
                  >
                    Sarah Lin (Enterprise Client)
                  </button>
                  <button
                    onClick={() => {
                      setRecipient('team-leads@engineering.org');
                      setShowRecipientDropdown(false);
                    }}
                    className="p-2 rounded-xl text-left hover:bg-[#F1EFE9] font-medium cursor-pointer"
                  >
                    Engineering Team Leads
                  </button>
                </div>
              )}
            </div>

            {/* Subject Field with Clickable Suggestions */}
            <div className="flex flex-col gap-1 text-xs text-[#78716C] border-b border-[#E5E3DF]/70 pb-1.5">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#1A1A1A] uppercase tracking-wider text-[10px]">Subject:</span>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="bg-transparent text-[#1A1A1A] text-xs outline-none w-full font-medium"
                />
              </div>
              <div className="flex items-center gap-1 text-[10px] mt-0.5">
                <span className="text-[#A8A29E]">Suggested:</span>
                <button
                  onClick={() => setEmailSubject('Urgent: Project Delivery Status Update')}
                  className="hover:underline text-[#78716C] hover:text-black cursor-pointer"
                >
                  "Urgent Delivery"
                </button>
                <span>•</span>
                <button
                  onClick={() => setEmailSubject('Q3 Deliverables & Sprint Timeline')}
                  className="hover:underline text-[#78716C] hover:text-black cursor-pointer"
                >
                  "Q3 Deliverables"
                </button>
              </div>
            </div>

            {/* Email Body */}
            <div className="relative mt-1">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#78716C]">
                  Select text below to trigger floating rewrite button
                </label>
                <button
                  onClick={() => triggerToast(`${emailBody.length} characters, ${emailBody.split(/\s+/).length} words`)}
                  className="text-[10px] text-[#A8A29E] hover:text-black hover:underline cursor-pointer"
                >
                  {emailBody.length} characters
                </button>
              </div>
              <textarea
                ref={bodyTextareaRef}
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                onSelect={() => handleSelection('body', bodyTextareaRef.current)}
                onMouseUp={() => handleSelection('body', bodyTextareaRef.current)}
                onKeyUp={() => handleSelection('body', bodyTextareaRef.current)}
                rows={4}
                className="w-full bg-white text-[#1A1A1A] font-serif text-base p-4 rounded-2xl border border-[#E5E3DF] focus:border-black focus:ring-1 focus:ring-black outline-none leading-relaxed transition-colors selection:bg-black selection:text-white"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSend}
                  disabled={isSending}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black hover:bg-[#2A2A2A] text-white text-xs font-bold shadow-md shadow-black/10 transition-all cursor-pointer"
                >
                  {isSending ? (
                    <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : sentSuccess ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Send className="w-3 h-3" />
                  )}
                  <span>{isSending ? 'Sending...' : sentSuccess ? 'Sent!' : 'Send Mail'}</span>
                </button>
                <button
                  onClick={resetSandbox}
                  className="p-2 rounded-xl hover:bg-[#F1EFE9] text-[#78716C] hover:text-[#1A1A1A] transition-colors cursor-pointer border border-transparent hover:border-[#E5E3DF]"
                  title="Reset email draft"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                onClick={() => onSelectForPopup(emailBody)}
                className="text-xs text-[#78716C] hover:text-black font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Send to Extension Popup</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scenario 2: Slack / Chat */}
      {activeScenario === 'chat' && (
        <div className="bg-[#FDFCFB] rounded-2xl border border-[#E5E3DF] p-5 shadow-xs flex flex-col gap-3.5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-[#E5E3DF] pb-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-[#1A1A1A] uppercase tracking-tight">
              <MessageCircle className="w-4 h-4 text-black" />
              <span>#general • Team Workspace Chat</span>
            </div>
            <span className="text-[10px] font-mono text-[#78716C]">42 members online</span>
          </div>

          <div className="flex flex-col gap-2">
            <div className="bg-white p-3.5 rounded-2xl border border-[#E5E3DF] text-xs text-[#4A4A4A]">
              <strong className="text-[#1A1A1A] block mb-1">Alex (Product Lead) 10:14 AM</strong>
              <p>Has anyone reviewed the staging release before we go live?</p>
            </div>

            <div className="relative mt-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#78716C] block mb-1">
                Your Chat Reply (Select text to rewrite with Friendly / Casual mode):
              </label>
              <textarea
                ref={chatInputRef}
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onSelect={() => handleSelection('chat', chatInputRef.current)}
                onMouseUp={() => handleSelection('chat', chatInputRef.current)}
                onKeyUp={() => handleSelection('chat', chatInputRef.current)}
                rows={3}
                className="w-full bg-white text-[#1A1A1A] font-sans text-xs p-3.5 rounded-xl border border-[#E5E3DF] outline-none focus:border-black selection:bg-black selection:text-white leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={handleSend}
                disabled={isSending}
                className="px-4 py-2 rounded-xl bg-black hover:bg-[#2A2A2A] text-white text-xs font-bold shadow-md shadow-black/10 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Send className="w-3 h-3" />
                <span>{sentSuccess ? 'Posted!' : 'Post to #general'}</span>
              </button>
              <button
                onClick={() => onSelectForPopup(chatMessage)}
                className="text-xs text-[#78716C] hover:text-black font-semibold hover:underline cursor-pointer"
              >
                Open in Popup &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scenario 3: Article / Blog Post */}
      {activeScenario === 'article' && (
        <div className="bg-[#FDFCFB] rounded-2xl border border-[#E5E3DF] p-5 shadow-xs flex flex-col gap-3.5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-[#E5E3DF] pb-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-[#1A1A1A] uppercase tracking-tight">
              <FileText className="w-4 h-4 text-black" />
              <span>Editorial Publication Draft</span>
            </div>
            <span className="text-[10px] uppercase font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              Needs Polish
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#78716C]">
              Article Body (Select any phrasing to refine to Formal / Academic tone):
            </label>
            <textarea
              ref={articleTextareaRef}
              value={articleContent}
              onChange={(e) => setArticleContent(e.target.value)}
              onSelect={() => handleSelection('article', articleTextareaRef.current)}
              onMouseUp={() => handleSelection('article', articleTextareaRef.current)}
              onKeyUp={() => handleSelection('article', articleTextareaRef.current)}
              rows={4}
              className="w-full bg-white text-[#1A1A1A] font-serif text-base p-4 rounded-2xl border border-[#E5E3DF] outline-none focus:border-black selection:bg-black selection:text-white leading-relaxed"
            />

            <div className="flex items-center justify-between pt-1">
              <button
                onClick={() => triggerToast('Draft auto-saved!')}
                className="px-4 py-2 rounded-xl bg-black hover:bg-[#2A2A2A] text-white text-xs font-bold shadow-md shadow-black/10 transition-all cursor-pointer"
              >
                Save Article Draft
              </button>
              <button
                onClick={() => onSelectForPopup(articleContent)}
                className="text-xs text-[#78716C] hover:text-black font-semibold hover:underline cursor-pointer"
              >
                Send to Extension Popup &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scenario 4: E-Commerce Review */}
      {activeScenario === 'review' && (
        <div className="bg-[#FDFCFB] rounded-2xl border border-[#E5E3DF] p-5 shadow-xs flex flex-col gap-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-[#E5E3DF] pb-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#1A1A1A] uppercase tracking-tight">
              <Star className="w-4 h-4 text-black" />
              <span>Customer Review / Feedback Form</span>
            </div>
            <div className="flex items-center gap-1 text-amber-500">
              <Star className="w-3.5 h-3.5 fill-current" />
              <Star className="w-3.5 h-3.5 fill-current" />
              <Star className="w-3.5 h-3.5 fill-current" />
              <Star className="w-3.5 h-3.5 fill-current" />
              <Star className="w-3.5 h-3.5 text-[#E5E3DF]" />
            </div>
          </div>
          <textarea
            ref={feedbackInputRef}
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            onSelect={() => handleSelection('feedback', feedbackInputRef.current)}
            onMouseUp={() => handleSelection('feedback', feedbackInputRef.current)}
            onKeyUp={() => handleSelection('feedback', feedbackInputRef.current)}
            rows={3}
            className="w-full bg-white text-[#1A1A1A] font-serif text-sm p-3.5 rounded-xl border border-[#E5E3DF] outline-none focus:border-black selection:bg-black selection:text-white leading-relaxed"
          />
          <div className="flex items-center justify-between">
            <button
              onClick={handleSend}
              className="px-4 py-2 rounded-xl bg-black hover:bg-[#2A2A2A] text-white text-xs font-bold shadow-md shadow-black/10 transition-all cursor-pointer"
            >
              {sentSuccess ? 'Review Submitted!' : 'Submit Review'}
            </button>
            <button
              onClick={() => onSelectForPopup(feedbackText)}
              className="text-xs text-[#78716C] hover:text-black font-semibold hover:underline cursor-pointer"
            >
              Open in Extension Popup &rarr;
            </button>
          </div>
        </div>
      )}

      {/* FLOATING "✨ Rewrite" BUTTON */}
      {floatingPos && !showQuickModal && (
        <div
          style={{ top: `${floatingPos.top}px`, left: `${floatingPos.left}px` }}
          className="absolute z-30 transition-all duration-150 animate-in fade-in zoom-in-95"
        >
          <button
            id="floating-rewrite-btn"
            onClick={() => setShowQuickModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-black text-white text-xs font-bold shadow-xl shadow-black/25 border-2 border-white transition-transform active:scale-95 cursor-pointer hover:scale-105 hover:bg-[#2A2A2A]"
          >
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            <span>Rewrite</span>
          </button>
        </div>
      )}

      {/* IN-PAGE FLOATING QUICK REWRITE MODAL */}
      {floatingPos && showQuickModal && (
        <div
          style={{ top: `${floatingPos.top}px`, left: `${Math.min(floatingPos.left, 240)}px` }}
          className="absolute z-40 w-80 md:w-96 bg-white text-[#1A1A1A] rounded-3xl border-2 border-black shadow-2xl p-5 flex flex-col gap-3.5 animate-in fade-in slide-in-from-top-2"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#E5E3DF] pb-2.5">
            <div className="flex items-center gap-2 text-xs font-serif font-bold text-[#1A1A1A]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>RewriteStudio Floating Menu</span>
            </div>
            <button
              onClick={() => {
                setShowQuickModal(false);
                setFloatingPos(null);
                setQuickResult(null);
              }}
              className="text-[#78716C] hover:text-[#1A1A1A] text-lg font-bold px-1 rounded-md hover:bg-[#F1EFE9] cursor-pointer"
            >
              &times;
            </button>
          </div>

          {/* Selected Text Preview */}
          <div className="bg-[#FAF9F6] p-3 rounded-2xl border border-[#E5E3DF] text-xs font-serif italic text-[#4A4A4A] line-clamp-2">
            "{selectedText}"
          </div>

          {/* Quick Mode Buttons */}
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={() => handleExecuteQuickRewrite('grammar')}
              disabled={isRewriting}
              className={`p-2 rounded-xl text-[11px] font-semibold text-center border transition-all cursor-pointer ${
                quickMode === 'grammar' ? 'bg-black text-white border-black shadow-md shadow-black/10' : 'bg-[#FAF9F6] border-[#E5E3DF] text-[#1A1A1A] hover:bg-[#F1EFE9]'
              }`}
            >
              ✨ Grammar
            </button>
            <button
              onClick={() => handleExecuteQuickRewrite('professional')}
              disabled={isRewriting}
              className={`p-2 rounded-xl text-[11px] font-semibold text-center border transition-all cursor-pointer ${
                quickMode === 'professional' ? 'bg-black text-white border-black shadow-md shadow-black/10' : 'bg-[#FAF9F6] border-[#E5E3DF] text-[#1A1A1A] hover:bg-[#F1EFE9]'
              }`}
            >
              💼 Professional
            </button>
            <button
              onClick={() => handleExecuteQuickRewrite('friendly')}
              disabled={isRewriting}
              className={`p-2 rounded-xl text-[11px] font-semibold text-center border transition-all cursor-pointer ${
                quickMode === 'friendly' ? 'bg-black text-white border-black shadow-md shadow-black/10' : 'bg-[#FAF9F6] border-[#E5E3DF] text-[#1A1A1A] hover:bg-[#F1EFE9]'
              }`}
            >
              👋 Friendly
            </button>
            <button
              onClick={() => handleExecuteQuickRewrite('formal')}
              disabled={isRewriting}
              className={`p-2 rounded-xl text-[11px] font-semibold text-center border transition-all cursor-pointer ${
                quickMode === 'formal' ? 'bg-black text-white border-black shadow-md shadow-black/10' : 'bg-[#FAF9F6] border-[#E5E3DF] text-[#1A1A1A] hover:bg-[#F1EFE9]'
              }`}
            >
              ⚖️ Formal
            </button>
            <button
              onClick={() => handleExecuteQuickRewrite('concise')}
              disabled={isRewriting}
              className={`p-2 rounded-xl text-[11px] font-semibold text-center border transition-all cursor-pointer ${
                quickMode === 'concise' ? 'bg-black text-white border-black shadow-md shadow-black/10' : 'bg-[#FAF9F6] border-[#E5E3DF] text-[#1A1A1A] hover:bg-[#F1EFE9]'
              }`}
            >
              ✂️ Concise
            </button>
            <button
              onClick={() => handleExecuteQuickRewrite('paraphrase')}
              disabled={isRewriting}
              className={`p-2 rounded-xl text-[11px] font-semibold text-center border transition-all cursor-pointer ${
                quickMode === 'paraphrase' ? 'bg-black text-white border-black shadow-md shadow-black/10' : 'bg-[#FAF9F6] border-[#E5E3DF] text-[#1A1A1A] hover:bg-[#F1EFE9]'
              }`}
            >
              🔄 Paraphrase
            </button>
          </div>

          {/* Result area */}
          {isRewriting && (
            <div className="flex items-center justify-center gap-2 py-4 text-xs text-[#1A1A1A] font-semibold bg-[#FAF9F6] rounded-2xl border border-[#E5E3DF]">
              <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              <span>Gemini is transforming text...</span>
            </div>
          )}

          {quickResult && !isRewriting && (
            <div className="flex flex-col gap-2.5">
              <div className="bg-[#FAF9F6] p-3.5 rounded-2xl border border-[#E5E3DF] text-xs font-serif italic text-[#1A1A1A] leading-relaxed max-h-36 overflow-y-auto">
                "{quickResult}"
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleReplaceInPage}
                  className="flex-1 py-2 px-3 rounded-xl bg-black hover:bg-[#2A2A2A] text-white text-xs font-bold shadow-md shadow-black/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Replace in Page</span>
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(quickResult);
                    triggerToast('Copied rewritten text to clipboard!');
                  }}
                  className="py-2 px-3 rounded-xl bg-[#F8F7F4] hover:bg-[#F1EFE9] text-[#1A1A1A] text-xs font-bold border border-[#E5E3DF] transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center text-[10px] text-[#78716C] pt-2 border-t border-[#E5E3DF]">
            <span>Need more tools?</span>
            <button
              onClick={() => {
                onSelectForPopup(selectedText);
                setShowQuickModal(false);
              }}
              className="text-[#1A1A1A] hover:underline font-bold cursor-pointer"
            >
              Open in Extension Popup &rarr;
            </button>
          </div>
        </div>
      )}

      {/* Copy/Feedback Toast */}
      {copiedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-black text-white border border-[#E5E3DF] px-4 py-2.5 rounded-2xl text-xs font-bold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{copiedToast}</span>
        </div>
      )}
    </div>
  );
};
