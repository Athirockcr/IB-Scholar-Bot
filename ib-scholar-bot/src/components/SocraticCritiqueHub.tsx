import React, { useState, useEffect } from 'react';
import { 
  FileText, Sparkles, AlertTriangle, Play, HelpCircle, 
  BookMarked, ArrowDown, Clipboard, CheckSquare, Save,
  Copy, Check, BookOpen, Download, Printer, Type
} from 'lucide-react';
import { EE_RUBRICS, TOK_GUIDELINES, IA_GUIDELINES_BY_GROUP } from '../data';
import { initAuth, googleSignIn, getAccessToken } from '../lib/auth';

const JARGON_DICT: Record<string, { definition: string; alternative?: string }> = {
  "prove": { definition: "In IB Sciences, hypotheses are never fully 'proven', only supported by evidence.", alternative: "support, corroborate, substantiate" },
  "proves": { definition: "In IB Sciences, hypotheses are never fully 'proven', only supported by evidence.", alternative: "supports, corroborates, substantiates" },
  "epistemology": { definition: "The theory of knowledge, especially with regard to its methods, validity, and scope (Core to TOK)." },
  "methodology": { definition: "A system of methods used in a particular area of study or activity." },
  "empirical": { definition: "Based on, concerned with, or verifiable by observation or experience rather than theory or pure logic." },
  "paradigm": { definition: "A typical example or pattern of something; a model (e.g., Paradigm shift in sciences)." },
  "bias": { definition: "Prejudice in favor or against one thing. Essential to evaluate in History/Sciences." },
  "correlation": { definition: "A mutual relationship or connection between two or more things. IMPORTANT: 'Correlation does not imply causation'." },
  "causation": { definition: "The capacity of one variable to influence another." },
  "synthesis": { definition: "The combination of ideas to form a theory or system. In EE, synthesizing sources is crucial for higher bands." },
  "reliability": { definition: "The degree to which the result of a measurement or calculation can be depended on to be accurate." },
  "validity": { definition: "The quality of being logically or factually sound; soundness or cogency." },
  "shows": { definition: "A bit informal for academic writing.", alternative: "demonstrates, illustrates, reveals, indicates" },
  "says": { definition: "Informal for citing literature.", alternative: "argues, posits, asserts, contends" },
  "good": { definition: "Too vague and informal.", alternative: "effective, significant, beneficial, valid" },
  "bad": { definition: "Too vague and informal.", alternative: "detrimental, flawed, adverse, limited" },
  "a lot": { definition: "Too informal for IB writing.", alternative: "a significant amount, substantially, largely" }
};

export default function SocraticCritiqueHub() {
  const [draftText, setDraftText] = useState('');
  const [critiqueType, setCritiqueType] = useState<'EE' | 'IA' | 'TOK'>('EE');
  const [focusArea, setFocusArea] = useState('Criterion C: Critical Thinking');
  const [subject, setSubject] = useState('Physics HL');
  const [feedback, setFeedback] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [savedCritiques, setSavedCritiques] = useState<Array<{
    id: string;
    text: string;
    type: string;
    feedback: string;
    timestamp: string;
  }>>(() => {
    const saved = localStorage.getItem('saved_critiques');
    return saved ? JSON.parse(saved) : [];
  });

  // Auth setup for Google Docs integration
  const [needsAuth, setNeedsAuth] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => { setIsAuthenticated(true); setNeedsAuth(false); },
      () => { setIsAuthenticated(false); setNeedsAuth(true); }
    );
    return () => unsubscribe();
  }, []);

  const handleImportDocs = async () => {
    try {
      if (!isAuthenticated) {
        setIsImporting(true);
        const authResult = await googleSignIn();
        if (authResult) setIsAuthenticated(true);
      }
      
      const docUrlOrId = window.prompt("Enter Google Docs URL or Document ID to pull your draft:");
      if (!docUrlOrId) {
        setIsImporting(false);
        return;
      }

      // Extract ID
      let docId = docUrlOrId;
      const urlMatch = docUrlOrId.match(/\/d\/(.*?)\//);
      if (urlMatch && urlMatch[1]) {
        docId = urlMatch[1];
      }

      setIsImporting(true);
      const token = await getAccessToken();
      const res = await fetch(`https://docs.googleapis.com/v1/documents/${docId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) setNeedsAuth(true);
        throw new Error("Failed to fetch Google Docs. Check permissions or ID.");
      }
      
      const data = await res.json();
      let extractedText = "";
      if (data.body && data.body.content) {
        data.body.content.forEach((element: any) => {
          if (element.paragraph && element.paragraph.elements) {
            element.paragraph.elements.forEach((el: any) => {
              if (el.textRun && el.textRun.content) {
                extractedText += el.textRun.content;
              }
            });
          }
        });
      }
      setDraftText(extractedText);
      alert("Successfully imported text from Google Docs!");

    } catch (err: any) {
      console.error(err);
      alert(err.message || "Error importing from Google Docs");
    } finally {
      setIsImporting(false);
    }
  };

  // Bibliography & Citation Tool State
  const [activeCitationTab, setActiveCitationTab] = useState<'mla' | 'apa' | 'chicago'>('mla');
  const [bibChecklist, setBibChecklist] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('ib_bib_checklist');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      alphabetical: false,
      doubleSpacing: false,
      noGhostwriting: false,
      citationMatching: false,
      noIAPageTitle: false,
      academicIntegrity: false,
    };
  });

  // Citation generator inputs
  const [citeAuthor, setCiteAuthor] = useState('');
  const [citeTitle, setCiteTitle] = useState('');
  const [citePublisher, setCitePublisher] = useState('');
  const [citeYear, setCiteYear] = useState('');
  const [citeExtra, setCiteExtra] = useState('');
  const [customCitationResult, setCustomCitationResult] = useState('');
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [showJargonHighlight, setShowJargonHighlight] = useState(false);

  // Auto save checklist progress
  useEffect(() => {
    localStorage.setItem('ib_bib_checklist', JSON.stringify(bibChecklist));
  }, [bibChecklist]);

  const handleToggleChecklist = (id: string) => {
    setBibChecklist(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleGenerateCitation = () => {
    const authorVal = citeAuthor.trim() || 'Smith, J.';
    const titleVal = citeTitle.trim() || 'The Socratic Inquiry';
    const pubVal = citePublisher.trim() || 'Oxford University Press';
    const yearVal = citeYear.trim() || '2025';
    const extraVal = citeExtra.trim() || 'https://theoriesofknowledge.org';

    let pattern = '';
    if (activeCitationTab === 'mla') {
      pattern = `${authorVal}. "${titleVal}." ${pubVal}, ${yearVal}. ${extraVal}`;
    } else if (activeCitationTab === 'apa') {
      pattern = `${authorVal} (${yearVal}). ${titleVal}. ${pubVal}. ${extraVal}`;
    } else { // Chicago notes & bib
      pattern = `${authorVal}. ${titleVal}. ${pubVal}, ${yearVal}. ${extraVal}`;
    }
    setCustomCitationResult(pattern);
  };

  const handleCopyCitation = () => {
    if (!customCitationResult) return;
    navigator.clipboard.writeText(customCitationResult);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2000);
  };

  const handleExportPDF = () => {
    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Socratic Critique Report - ${subject}</title>
          <style>
            body { font-family: 'Inter', system-ui, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 40px; }
            h1 { color: #111; border-bottom: 2px solid #eee; padding-bottom: 10px; font-size: 24px; }
            h2 { color: #444; margin-top: 30px; font-size: 18px; }
            .meta { background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 30px; font-size: 14px; }
            .section { margin-bottom: 30px; }
            .draft { background: #f9f9f9; padding: 15px; border-left: 4px solid #7B8E7E; font-size: 14px; white-space: pre-wrap; color: #555;}
            .feedback { background: #fff; padding: 15px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; }
          </style>
        </head>
        <body>
          <h1>Socratic Critique Report - ${critiqueType}</h1>
          <div class="meta">
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Focus Area:</strong> ${focusArea}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="section">
            <h2>Draft Snippet</h2>
            <div class="draft">${draftText || 'No draft provided.'}</div>
          </div>
          
          <div class="section">
            <h2>Socratic Feedback</h2>
            <div class="feedback">${feedback ? feedback.replace(/\\n/g, '<br/>') : 'No feedback generated yet.'}</div>
          </div>
          <script>
            window.onload = () => {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const renderHighlightedText = (text: string) => {
    if (!text) return null;
    
    const words = Object.keys(JARGON_DICT);
    // Sort by length to match longer phrases first
    const sortedWords = words.sort((a, b) => b.length - a.length);
    const regex = new RegExp(`\\b(${sortedWords.join('|')})\\b`, 'gi');
    
    const parts = [];
    let lastIndex = 0;
    
    let match;
    while ((match = regex.exec(text)) !== null) {
      const before = text.substring(lastIndex, match.index);
      const matchedWord = match[0];
      const lowerWord = matchedWord.toLowerCase();
      const jargonInfo = JARGON_DICT[lowerWord];
      
      if (before) parts.push(<span key={`text-${lastIndex}`}>{before}</span>);
      
      parts.push(
        <span key={`jargon-${match.index}`} className="relative group inline-block">
          <span className="bg-amber-100/80 text-amber-900 border-b-2 border-amber-300 font-semibold rounded-sm px-0.5 cursor-help">
            {matchedWord}
          </span>
          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-zinc-800 text-white text-[10px] p-2 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 shadow-xl pointer-events-none">
            <strong className="block text-amber-300 mb-1 capitalize border-b border-white/20 pb-0.5">{matchedWord}</strong>
            <span className="block leading-snug">{jargonInfo?.definition}</span>
            {jargonInfo?.alternative && (
              <span className="block mt-1.5 text-emerald-300 font-medium">
                💡 Try instead: {jargonInfo.alternative}
              </span>
            )}
            <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-800" />
          </span>
        </span>
      );
      
      lastIndex = regex.lastIndex;
    }
    
    const remaining = text.substring(lastIndex);
    if (remaining) parts.push(<span key={`text-${lastIndex}`}>{remaining}</span>);
    
    return parts.length > 0 ? parts : text;
  };

  const getWordCount = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).filter(Boolean).length;
  };

  const getWordCountFeedback = (count: number, type: 'EE' | 'IA' | 'TOK') => {
    if (count === 0) return null;
    
    if (type === 'EE') {
      const max = 4000;
      if (count > max) {
        return {
          status: 'error',
          bg: 'bg-red-50 text-red-800 border-red-200',
          message: `⚠️ CRITICAL: Extended Essay hard limit is 4,000 words. You are currently ${count - max} words OVER. Content past 4,000 words is ignored by IB examiners.`,
          percentage: 100
        };
      }
      if (count < 3000) {
        return {
          status: 'warning',
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
          message: `⚠️ Warning: Your Extended Essay draft/segment is ${count} words. Entire EEs usually span 3,000 to 4,000 words. Make sure you develop deep analytical evaluation (Criterion C).`,
          percentage: (count / max) * 100
        };
      }
      return {
        status: 'success',
        bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        message: `✓ Optimal Extended Essay scope: ${count} words (range: 3,000 - 4,000 words). Your current draft size is aligned beautifully!`,
        percentage: (count / max) * 100
      };
    } else if (type === 'IA') {
      const max = 2200;
      if (count > max) {
        return {
          status: 'error',
          bg: 'bg-red-50 text-red-800 border-red-200',
          message: `⚠️ Warning: Internal Assessments should remain concise (typically 1,200 to 2,000 words, max 2,200 / 12 pages). Your draft is ${count} words.`,
          percentage: 100
        };
      }
      if (count < 1000) {
        return {
          status: 'warning',
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
          message: `⚠️ Notice: Your coursework draft is ${count} words. Science or Humanities IAs are usually between 1,200 and 2,000 words total.`,
          percentage: (count / max) * 100
        };
      }
      return {
        status: 'success',
        bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        message: `✓ Ideal length for coursework: ${count} words (optimal range: 1,200 - 2,200 words).`,
        percentage: (count / max) * 100
      };
    } else { // TOK
      const max = 1600;
      if (count > max) {
        return {
          status: 'error',
          bg: 'bg-red-50 text-red-800 border-red-200',
          message: `⚠️ CRITICAL: Theory of Knowledge Essay has a strict 1,600-word limit. You are ${count - max} words OVER. Anything beyond is omitted.`,
          percentage: 100
        };
      }
      if (count < 1200) {
        return {
          status: 'warning',
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
          message: `⚠️ Alert: TOK Essays under 1,200 words rarely exhibit the necessary structural counterclaims or detailed Area of Knowledge (AOK) analysis.`,
          percentage: (count / max) * 100
        };
      }
      return {
        status: 'success',
        bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        message: `✓ Perfect TOK size: ${count} words. Your argument density falls exactly within the 1,200 - 1,600 sweet spot.`,
        percentage: (count / max) * 100
      };
    }
  };

  const handleCritiqueSubmit = async () => {
    if (!draftText.trim()) return;

    setIsLoading(true);
    setFeedback('');

    try {
      const res = await fetch("/api/critique", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draftText,
          critiqueType,
          focusArea,
          subject
        })
      });

      if (!res.ok) {
        throw new Error("Critique failed");
      }

      const data = await res.json();
      setFeedback(data.text);
    } catch (err) {
      console.error(err);
      setFeedback("⚠️ **Network Error**: Unable to process Socratic Critique. Ensure your backend and Gemini credentials are active.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveCritique = () => {
    if (!draftText || !feedback) return;

    const newSaved = {
      id: crypto.randomUUID(),
      text: draftText.slice(0, 80) + '...',
      type: critiqueType,
      feedback,
      timestamp: new Date().toLocaleDateString()
    };

    const updated = [newSaved, ...savedCritiques];
    setSavedCritiques(updated);
    localStorage.setItem('saved_critiques', JSON.stringify(updated));
    alert("Socratic review saved to your local Academic Notebook!");
  };

  const clearSavedCritiques = () => {
    if (window.confirm("Delete all saved critiques from notebook?")) {
      setSavedCritiques([]);
      localStorage.removeItem('saved_critiques');
    }
  };

  const loadSavedFeedback = (fb: string) => {
    setFeedback(fb);
  };

  // Convert markdown rules to visual blocks
  const renderMarkdownText = (text: string) => {
    return text.split('\n').map((line, index) => {
      if (line.trim().startsWith('###')) {
        return (
          <h4 key={index} className="text-sm font-semibold text-zinc-900 mt-4 mb-2 flex items-center gap-1.5 border-l-4 border-zinc-700 pl-2">
            {line.replace(/^###\s+/, '')}
          </h4>
        );
      }
      if (line.trim().startsWith('##')) {
        return (
          <h3 key={index} className="text-base font-bold text-zinc-950 mt-5 mb-2 border-b border-gray-100 pb-1">
            {line.replace(/^##\s+/, '')}
          </h3>
        );
      }
      if (line.trim().startsWith('1.') || line.trim().match(/^\d+\./)) {
        return (
          <div key={index} className="bg-amber-50/40 hover:bg-amber-50 border border-amber-100/60 p-3 rounded-lg my-2 text-sm text-amber-900 font-medium">
            {line}
          </div>
        );
      }
      if (line.trim().startsWith('-') || line.trim().startsWith('*')) {
        return (
          <li key={index} className="ml-4 list-disc my-1.5 text-xs text-gray-700 leading-relaxed">
            {line.replace(/^[-*]\s+/, '')}
          </li>
        );
      }
      return <p key={index} className="text-xs text-gray-600 leading-relaxed my-2">{line}</p>;
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="socratic_review_critique_hub">
      {/* Left side: Code / Snippet Inputs */}
      <div className="lg:col-span-5 space-y-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-sm text-gray-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-zinc-700" />
              Paste Your Essay / RQ draft
            </h3>
            <button
              onClick={handleImportDocs}
              disabled={isImporting}
              className="text-[10px] flex items-center gap-1.5 font-bold bg-[#E8F0FE] text-blue-800 hover:bg-blue-100 px-2 py-1.5 rounded transition-all disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              {isImporting ? 'Connecting...' : (needsAuth ? 'Sign in & Auto-Import from Docs' : 'Import from Google Docs')}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">IB Assignment</label>
              <select
                value={critiqueType}
                onChange={(e) => {
                  const val = e.target.value as any;
                  setCritiqueType(val);
                  setFocusArea(val === 'EE' ? 'Criterion C: Critical Thinking' : val === 'IA' ? 'Evaluation & Analysis' : 'Knowledge Claims & AOKs');
                }}
                className="w-full bg-gray-50 border border-gray-200 text-xs px-3 py-2 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-zinc-800"
              >
                <option value="EE">Extended Essay (EE)</option>
                <option value="IA">Internal Assessment (IA)</option>
                <option value="TOK">TOK Essay</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Course Subject / Title</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Physics HL or PT Title"
                className="w-full bg-gray-50 border border-gray-200 text-xs px-3 py-2 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-zinc-800"
              />
            </div>
          </div>

          <div className="flex justify-between items-center mb-1">
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Target Criterion / Analysis Focus</label>
            <label className="flex items-center gap-1.5 cursor-pointer bg-[#F8F7F4] border border-gray-150 px-2 py-0.5 rounded" title="Highlight academic jargon and provide definitions/alternatives">
               <input type="checkbox" checked={showJargonHighlight} onChange={e => setShowJargonHighlight(e.target.checked)} className="rounded border-gray-300 text-amber-500 focus:ring-amber-500 w-3 h-3" />
               <span className="text-[9px] font-bold text-gray-600 uppercase flex items-center gap-1"><Type className="w-3 h-3 text-amber-500" /> Jargon Scan</span>
            </label>
          </div>
          <input
            type="text"
            value={focusArea}
            onChange={(e) => setFocusArea(e.target.value)}
            placeholder="e.g. Personal Engagement"
            className="w-full bg-gray-50 border border-gray-200 text-xs px-3 py-2 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-zinc-800 mb-4"
          />

          {showJargonHighlight ? (
            <div className="w-full bg-slate-50 border border-slate-200 text-[13px] p-4 rounded-xl text-slate-800 transition-all h-[200px] overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-inner">
               {draftText ? renderHighlightedText(draftText) : <span className="text-gray-400 italic text-xs">No text provided to scan for jargon.</span>}
            </div>
          ) : (
            <textarea
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              rows={10}
              placeholder="Paste your research question proposals, core variables descriptions, or specific draft paragraphs here..."
              className="w-full bg-zinc-50 border border-gray-200 text-[13px] p-4 rounded-xl font-mono text-gray-800 focus:outline-hidden focus:bg-white focus:ring-1 focus:ring-zinc-800 transition-all placeholder:text-gray-400"
            />
          )}

          {/* Socratic Word Count advisor tool */}
          {draftText.trim() && (
            <div className="mt-3.5 p-3.5 bg-gray-50 rounded-xl border border-gray-150 space-y-2 animate-fadeIn" id="socratic_word_count_panel">
              <div className="flex justify-between items-center text-[11px] font-mono text-gray-500">
                <span className="font-semibold text-zinc-700">Analyzed Word Count: <span className="text-[#7B8E7E] font-bold">{getWordCount(draftText)} words</span></span>
                <span className="font-medium">Target Max: {critiqueType === 'EE' ? '4,000w' : critiqueType === 'IA' ? '2,200w' : '1,600w'}</span>
              </div>
              <div className="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${
                    getWordCountFeedback(getWordCount(draftText), critiqueType)?.status === 'error'
                      ? 'bg-red-500' 
                      : getWordCountFeedback(getWordCount(draftText), critiqueType)?.status === 'warning'
                      ? 'bg-amber-400'
                      : 'bg-[#7B8E7E]'
                  }`}
                  style={{ width: `${Math.min(100, getWordCountFeedback(getWordCount(draftText), critiqueType)?.percentage || 0)}%` }}
                />
              </div>
              {getWordCountFeedback(getWordCount(draftText), critiqueType) && (
                <div className={`p-2.5 rounded-lg border text-[10.5px] leading-snug font-medium transition-colors ${getWordCountFeedback(getWordCount(draftText), critiqueType)?.bg}`}>
                  {getWordCountFeedback(getWordCount(draftText), critiqueType)?.message}
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleCritiqueSubmit}
            disabled={isLoading || !draftText.trim()}
            className="w-full mt-3 bg-zinc-800 hover:bg-zinc-900 text-white text-xs font-semibold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin text-amber-400" />
                Conducting Rubric Analysis...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 text-white" />
                Initiate Socratic Critique
              </>
            )}
          </button>
        </div>

        {/* Saved reviews list */}
        {savedCritiques.length > 0 && (
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-semibold text-xs text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                <BookMarked className="w-4 h-4 text-zinc-500" />
                Academic Notebook ({savedCritiques.length})
              </h4>
              <button 
                onClick={clearSavedCritiques}
                className="text-[10px] text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                Clear Notebook
              </button>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {savedCritiques.map((item) => (
                <div 
                  key={item.id}
                  onClick={() => loadSavedFeedback(item.feedback)}
                  className="p-2.5 bg-gray-50 hover:bg-zinc-100 border border-gray-100 rounded-lg cursor-pointer transition-all flex justify-between items-center"
                >
                  <div className="truncate pr-2">
                    <p className="text-xs font-medium text-gray-800 truncate">{item.text}</p>
                    <span className="text-[9px] text-gray-400 font-mono">{item.type} • {item.timestamp}</span>
                  </div>
                  <span className="text-[9px] bg-zinc-200 text-zinc-700 px-1.5 py-0.5 rounded-sm font-semibold">Load</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Socratic Academic Bibliographies & Citation Panel */}
        <div className="bg-[#F8F7F3] p-5 rounded-2xl border border-[#E0DBCF]/60 space-y-4" id="socratic_bibliography_citation_panel">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#7B8E7E]" />
            <div>
              <h4 className="font-semibold text-xs text-gray-900 uppercase tracking-wider">Bibliography & Citation Companion</h4>
              <p className="text-[10px] text-gray-400">Quick-reference guides and interactive source formatter</p>
            </div>
          </div>

          {/* Checklist */}
          <div className="space-y-1.5 bg-white p-3 rounded-xl border border-gray-150">
            <span className="text-[9.5px] font-bold text-[#7B8E7E] uppercase tracking-wider block mb-1">Bibliography Checklist</span>
            {[
              { id: 'alphabetical', label: 'Alphabetical order: Are all sources ordered by author surname?' },
              { id: 'doubleSpacing', label: 'Consistency: Is the bibliography double-spaced & matching the body?' },
              { id: 'citationMatching', label: 'Cross-Reference: Is every inline citation represented in the bibliography?' },
              { id: 'noIAPageTitle', label: 'IA Layout: No title page for Science IAs, only a strong page-1 header' },
              { id: 'noGhostwriting', label: 'Academic Honesty: Draft fully generated by yourself, verified?' },
            ].map((item) => (
              <label key={item.id} className="flex items-start gap-2 cursor-pointer py-0.5 hover:bg-gray-50/55 rounded p-1 transition-colors">
                <input 
                  type="checkbox"
                  checked={bibChecklist[item.id] || false}
                  onChange={() => handleToggleChecklist(item.id)}
                  className="mt-0.5 rounded border-gray-300 text-[#7B8E7E] focus:ring-[#7B8E7E] w-3 h-3"
                />
                <span className="text-[10px] text-gray-650 leading-snug">{item.label}</span>
              </label>
            ))}
          </div>

          {/* Quick generator */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[9.5px] font-bold text-gray-400 uppercase tracking-wider">Interactive Citation Maker</span>
              <div className="flex gap-1">
                {(['mla', 'apa', 'chicago'] as const).map((style) => (
                  <button
                    key={style}
                    onClick={() => setActiveCitationTab(style)}
                    className={`px-1.5 py-0.5 text-[9px] font-bold rounded transition-all uppercase ${
                      activeCitationTab === style
                        ? 'bg-[#7B8E7E] text-white shadow-xs'
                        : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            {/* Citation Guide Reference Banner depending on choice */}
            <div className="bg-white/70 p-2.5 rounded-lg border border-gray-150 text-[10px] leading-relaxed text-gray-650">
              {activeCitationTab === 'mla' && (
                <>
                  <p className="font-bold text-zinc-800">MLA 9th Style Guide (Literature & Arts)</p>
                  <p className="italic text-gray-500 mt-0.5">Template: Author. "Title." Source, Year, Location.</p>
                  <p className="text-gray-500">Intext syntax: <code className="bg-gray-100 px-1 py-0.2 rounded text-[9px] font-mono">(Smith 42)</code></p>
                </>
              )}
              {activeCitationTab === 'apa' && (
                <>
                  <p className="font-bold text-zinc-800">APA 7th Style Guide (Sciences & Psychology)</p>
                  <p className="italic text-gray-505 mt-0.5">Template: Author (Year). Title. Publisher. Location.</p>
                  <p className="text-gray-500">Intext syntax: <code className="bg-gray-100 px-1 py-0.2 rounded text-[9px] font-mono">(Smith, 2024)</code></p>
                </>
              )}
              {activeCitationTab === 'chicago' && (
                <>
                  <p className="font-bold text-zinc-800">Chicago 17th Guide (History & Social Sciences)</p>
                  <p className="italic text-gray-500 mt-0.5">Template: Author. Title. Publisher, Year. DB/URL.</p>
                  <p className="text-gray-500">Intext syntax: <code className="bg-gray-100 px-1 py-0.2 rounded text-[9px] font-mono">1. John Smith, Title... (Footnote)</code></p>
                </>
              )}
            </div>

            {/* Inputs group */}
            <div className="bg-white p-3 rounded-xl border border-gray-150 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] text-gray-400 block font-medium mb-0.5 font-sans">Author(s)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Smith, J." 
                    value={citeAuthor}
                    onChange={(e) => setCiteAuthor(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-[10px] px-2 py-1 rounded placeholder:text-gray-300 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-gray-400 block font-medium mb-0.5 font-sans">Source Title</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Socratic Theory" 
                    value={citeTitle}
                    onChange={(e) => setCiteTitle(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-[10px] px-2 py-1 rounded placeholder:text-gray-300 focus:outline-hidden"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <div className="col-span-2">
                  <label className="text-[9px] text-gray-400 block font-medium mb-0.5 font-sans">Publisher / Journal</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Oxford Press" 
                    value={citePublisher}
                    onChange={(e) => setCitePublisher(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-[10px] px-2 py-1 rounded placeholder:text-gray-300 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-gray-400 block font-medium mb-0.5 font-sans">Year</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 2025" 
                    value={citeYear}
                    onChange={(e) => setCiteYear(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-[10px] px-2 py-1 rounded placeholder:text-gray-300 focus:outline-hidden"
                  />
                </div>
              </div>
              <div>
                <label className="text-[9px] text-gray-400 block font-medium mb-0.5 font-sans">Pages / URL / DB Link</label>
                <input 
                  type="text" 
                  placeholder="e.g. pp. 12-30 or DOI link" 
                  value={citeExtra}
                  onChange={(e) => setCiteExtra(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-[10px] px-2 py-1 rounded placeholder:text-gray-305 focus:outline-hidden"
                />
              </div>

              <button
                onClick={handleGenerateCitation}
                className="w-full bg-zinc-800 hover:bg-zinc-900 text-white font-semibold text-[10px] py-1.5 rounded-lg transition-all"
              >
                Compile Reference Layout
              </button>

              {/* Generated output copy widget */}
              {customCitationResult && (
                <div className="p-2 bg-[#F1EDE4] rounded-lg border border-[#E0DBCF] flex justify-between items-center gap-2 mt-1.5">
                  <p className="text-[10px] text-gray-700 italic truncate flex-1">{customCitationResult}</p>
                  <button
                    onClick={handleCopyCitation}
                    className="text-[9px] font-bold bg-white text-[#7B8E7E] border border-gray-200 px-2 py-1 rounded hover:bg-gray-50 transition-all flex items-center gap-1 shrink-0"
                  >
                    {copiedSuccess ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copiedSuccess ? 'Copied' : 'Copy'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Socratic Academic Vocabulary Boosters */}
          <div className="bg-white p-3 rounded-xl border border-gray-150 space-y-1.5">
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              <span className="text-[9.5px] font-bold text-zinc-850 uppercase tracking-wider font-sans">Analytical Phrasing Boosters</span>
            </div>
            <p className="text-[9px] text-gray-400 leading-normal">Elevate descriptive prose into critical evaluation using active Socratic academic verbs:</p>
            <div className="grid grid-cols-2 gap-1.5 pt-0.5">
              {[
                { verb: 'Substantiates', def: 'supports with empirical proof' },
                { verb: 'Corroborates', def: 'aligns with cross-evidence' },
                { verb: 'Obfuscates', def: 'clutters/hides critical facts' },
                { verb: 'Demarcates', def: 'clearly defines limits/scope' },
                { verb: 'Undermines', def: 'gradually weakens the validity' },
                { verb: 'Contextualizes', def: 'links claim back to real scope' },
              ].map((v) => (
                <div key={v.verb} className="p-1.5 bg-[#F8F7F4] hover:bg-amber-50/30 rounded border border-gray-100 text-[9px] cursor-pointer transition-all" title={v.def} onClick={() => {
                  if (draftText) {
                    setDraftText(prev => prev + ` [Socratic Note: Consider using "${v.verb.toLowerCase()}" to replace passive descriptors]`);
                  } else {
                    setDraftText(`Using this active verb enhances the analysis as it ${v.verb.toLowerCase()} the research scope...`);
                  }
                }}>
                  <strong className="text-zinc-850 block text-[9.5px] font-bold font-sans">{v.verb}</strong>
                  <span className="text-[8.5px] text-gray-400 leading-tight block mt-0.5">{v.def}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right side: Critique output */}
      <div className="lg:col-span-7 flex flex-col h-full space-y-4">
        {/* Right card output */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex-1 flex flex-col min-h-[400px]">
          <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-zinc-700" />
              <div>
                <h3 className="font-semibold text-sm text-gray-900 leading-none">Guidance Feedback</h3>
                <span className="text-[10px] text-gray-400">Socratic rubrics alignment and criteria notes</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {feedback && (
                <>
                  <button
                    onClick={handleExportPDF}
                    className="text-xs bg-white border border-gray-200 hover:bg-gray-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium text-gray-700 transition"
                    title="Export as Printable PDF"
                  >
                    <Printer className="w-3.5 h-3.5" /> Export PDF
                  </button>
                  <button
                    onClick={handleSaveCritique}
                    className="text-xs bg-gray-50 border border-gray-200 hover:bg-gray-150 px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium text-gray-700 transition"
                  >
                    <Save className="w-3.5 h-3.5" /> Save Notebook
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-1">
            {feedback ? (
              <div className="space-y-2">
                {renderMarkdownText(feedback)}
              </div>
            ) : isLoading ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-20 space-y-4">
                <div className="p-4 bg-indigo-50 rounded-full animate-pulse">
                  <Sparkles className="w-8 h-8 text-indigo-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Reviewing your Academic Snippet...</p>
                  <p className="text-xs text-gray-400 max-w-xs mx-auto mt-1">Measuring indicators against correct IB assessment marks. Remember, we will never rewrite text directly.</p>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-20 text-gray-400">
                <HelpCircle className="w-10 h-10 stroke-1 mb-2 text-gray-300" />
                <p className="text-sm font-medium">No active analysis</p>
                <p className="text-xs max-w-sm mt-1 leading-normal text-gray-400">
                  Paste a section of your IA hypothesis, research question proposals, or TOK claiming paragraphs on the left and start Socratic review to observe diagnostic rubrics guidelines.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic educational guidelines selector helper visual */}
        <div className="bg-zinc-900 text-white rounded-2xl p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <BookMarked className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-300">Quick Rubric Cheat Sheet</h4>
          </div>

          {critiqueType === 'EE' && (
            <div>
              <p className="text-xs text-amber-400 font-medium mb-1.5">Extended Essay Criteria A & C Overview:</p>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-gray-300">
                {EE_RUBRICS.slice(0, 2).map((r, i) => (
                  <li key={i} className="bg-white/5 p-2 rounded-lg border border-white/5">
                    <strong className="text-white block">{r.criterion}: {r.name}</strong>
                    <span className="opacity-80 block text-[9.5px] mt-0.5">{r.focus}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {critiqueType === 'IA' && (
            <div>
              <p className="text-xs text-blue-400 font-medium mb-1.5">Science IA Rubric Breakdown:</p>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-gray-300">
                {IA_GUIDELINES_BY_GROUP.slice(0, 2).map((item, i) => (
                  <li key={i} className="bg-white/5 p-2 rounded-lg border border-white/5">
                    <strong className="text-white block">{item.group}</strong>
                    <span className="opacity-80 block text-[9.5px] mt-0.5">{item.rubricFocus}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {critiqueType === 'TOK' && (
            <div>
              <p className="text-xs text-emerald-400 font-medium mb-1.5">TOK Assessment Tips:</p>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-gray-300">
                {TOK_GUIDELINES.slice(0, 2).map((t, i) => (
                  <li key={i} className="bg-white/5 p-2 rounded-lg border border-white/5">
                    <strong className="text-white block">{t.name}</strong>
                    <span className="opacity-80 block text-[9.5px] mt-0.5">{t.focus}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
