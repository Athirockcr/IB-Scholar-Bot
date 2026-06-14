import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Sparkles, MessageSquare, AlertCircle, Quote, 
  HelpCircle, BookOpen, Trash2, ArrowRight, RefreshCw,
  Mic, Square, Loader
} from 'lucide-react';
import { ChatMessage, IBModuleType } from '../types';
import { SOCRATIC_PROMPTS } from '../data';

interface SocraticChatProps {
  moduleType: IBModuleType;
  moduleColor: string;
  moduleTitle: string;
}

export default function SocraticChat({ moduleType, moduleColor, moduleTitle }: SocraticChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem(`ib_chat_${moduleType}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    return [
      {
        id: 'welcome',
        role: 'assistant',
        content: `Greetings! I am your **IB Scholar Socratic Coach** for your **${moduleTitle}**. \n\nMy purpose is to guide your critical thinking, critique your arguments, and help you structure your writing with the highest academic integrity. \n\nRemember: *I will never write paragraphs or thesis statements for you.* Instead, I am here to help you unpack your research, narrow down your variables, and challenge your assertions. \n\nWhat stage of your ${moduleType.toUpperCase()} journey are we looking at today? Are you brainstorming topics, sharpening your Research Question (RQ), or seeking a socratic review of a draft section?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [showIntegrityNotice, setShowIntegrityNotice] = useState(false);
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    localStorage.setItem(`ib_chat_${moduleType}`, JSON.stringify(messages));
    scrollToBottom();
  }, [messages, moduleType]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          setIsTranscribing(true);
          const base64data = (reader.result as string).split(',')[1];
          try {
            const res = await fetch("/api/transcribe", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ audioBase64: base64data, mimeType: "audio/webm" })
            });
            if (res.ok) {
              const data = await res.json();
              if (data.text) {
                setInputMessage(prev => prev ? prev + " " + data.text : data.text);
              }
            } else {
              throw new Error("Failed to transcribe");
            }
          } catch (err) {
            console.error("Transcription failed:", err);
            alert("Audio transcription failed. Please check your mic and connection.");
          } finally {
            setIsTranscribing(false);
          }
        };
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Mic access denied or error:", err);
      alert("Microphone access is required for Socratic Voice features.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    // Check if user is asking the bot to write for them or violate academic honesty
    const flagwords = [/write my/, /write an essay/, /make a thesis statement for me/, /give me a completed math IA/, /do the calculation for me/, /give me code to paste/, /write a paragraph/, /do my research/];
    const isHonestyViolation = flagwords.some(regex => regex.test(textToSend.toLowerCase()));

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    if (isHonestyViolation) {
      // Socratic trigger for Academic integrity warning
      setTimeout(() => {
        const botResponse: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `### 🛡️ IB Academic Honesty Pivot

It sounds like you are asking me to write text, formulate a complete thesis statement, or generate academic content for your essay directly. Under the core regulations of the **International Baccalaureate (IB) Programme**—and my design principles—I cannot write content, paragraphs, or arguments for your work. 

Doing so would jeopardize your academic standing and compromise your personal engagement scores.

Instead, let's turn this into an active Socratic brainstorming session! To help **you** write this section beautifully, let's explore your own ideas:
1. What is the core argument or point you want this paragraph to communicate?
2. What evidence, real-life examples, or lab data have you gathered so far that supports this claim?
3. How does this point directly link back to your primary Research Question (RQ)?

Share your thoughts on any of these points, and I will help you refine the outline, structure, and critique of your arguments!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, botResponse]);
        setIsLoading(false);
        setShowIntegrityNotice(true);
      }, 700);
      return;
    }

    try {
      // Map existing messages to history payload
      const historyPayload = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          history: historyPayload,
          moduleType: moduleType,
          advancedMode: isAdvancedMode
        })
      });

      if (!res.ok) {
        throw new Error("Chat api failed");
      }

      const data = await res.json();
      
      const botMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMsg]);

    } catch (err) {
      console.error(err);
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: "⚠️ **Connection Note**: I had trouble contacting my academic server. Please ensure the server is successfully running and verify your API keys are loaded.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePromptClick = (promptText: string) => {
    handleSendMessage(promptText);
  };

  const clearChat = () => {
    if (window.confirm("Do you want to clear your current Socratic chat history for this module?")) {
      const defaultMsg: ChatMessage = {
        id: 'welcome',
        role: 'assistant',
        content: `Chat session refreshed. How can I guide you with your **${moduleTitle}** right now? Let's brainstorm or map some core concepts together.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([defaultMsg]);
      setShowIntegrityNotice(false);
    }
  };

  // Helper to format linebreaks and markdown bold/bullets simply
  const renderMessageContent = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      // Basic list elements
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const itemContent = line.replace(/^[-*]\s+/, '');
        return (
          <li key={idx} className="ml-5 list-disc my-1 text-gray-700 leading-relaxed text-sm">
            {renderInlineFormatting(itemContent)}
          </li>
        );
      }
      
      // Numbered lists
      const numberMatch = line.trim().match(/^(\d+)\.\s+(.*)/);
      if (numberMatch) {
        return (
          <li key={idx} className="ml-5 list-decimal my-1 text-gray-700 leading-relaxed text-sm">
            {renderInlineFormatting(numberMatch[2])}
          </li>
        );
      }

      // Headers (e.g. ### or ##)
      if (line.trim().startsWith('###')) {
        return (
          <h4 key={idx} className="text-sm font-semibold text-gray-900 mt-3 mb-1 flex items-center gap-1.5">
            {renderInlineFormatting(line.replace(/^###\s+/, ''))}
          </h4>
        );
      }
      if (line.trim().startsWith('##')) {
        return (
          <h3 key={idx} className="text-base font-semibold text-gray-900 mt-4 mb-2 border-b pb-0.5 border-gray-100">
            {renderInlineFormatting(line.replace(/^##\s+/, ''))}
          </h3>
        );
      }

      // Paragraph
      return (
        <p key={idx} className="my-1.5 leading-relaxed text-sm text-gray-700">
          {renderInlineFormatting(line)}
        </p>
      );
    });
  };

  const renderInlineFormatting = (str: string) => {
    const parts = str.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-semibold text-gray-950">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={index} className="italic text-gray-800">{part.slice(1, -1)}</em>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={index} className="px-1.5 py-0.5 bg-gray-100/90 rounded text-xs font-mono text-red-600">{part.slice(1, -1)}</code>;
      }
      return part;
    });
  };

  return (
    <div className="flex flex-col h-[650px] bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden" id="socratic_chatbot_workspace">
      {/* Mini-Bar Header */}
      <div className={`p-4 bg-gradient-to-r ${moduleColor} text-white flex justify-between items-center`}>
        <div className="flex items-center gap-2.5">
          <BookOpen className="w-5 h-5 text-white/95" />
          <div>
            <h3 className="font-semibold text-sm leading-tight">{moduleTitle} Coach</h3>
            <span className="text-[11px] text-white/85 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
              Socratic Mentoring Active
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 cursor-pointer" title="Enable Advanced AI Reasoning model for deeper critiques">
            <span className="text-[10px] text-white/90 font-bold tracking-wide uppercase">Advanced Mode</span>
            <div className="relative">
              <input type="checkbox" className="sr-only" checked={isAdvancedMode} onChange={(e) => setIsAdvancedMode(e.target.checked)} />
              <div className={`block w-7 h-4 rounded-full transition-colors ${isAdvancedMode ? 'bg-indigo-500' : 'bg-white/20'}`}></div>
              <div className={`absolute left-0.5 top-0.5 bg-white w-3 h-3 rounded-full transition-transform ${isAdvancedMode ? 'translate-x-3' : 'translate-x-0'}`}></div>
            </div>
          </label>
          <button 
            onClick={clearChat}
            className="text-white/80 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-colors"
            title="Reset Socratic Chat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Socratic Academic Integrity Alert */}
      <div className="bg-amber-50 border-b border-amber-100 px-4 py-2.5 flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
        <div className="text-[11px] text-amber-800 leading-relaxed">
          <span className="font-semibold">Academic Integrity Notice:</span> I am here to guide your inquiry using the Socratic method. I will refuse requests to write essays or complete thesis paragraphs directly.
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
        {messages.map((msg) => (
          <div 
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] rounded-2xl p-4 shadow-xs ${
              msg.role === 'user' 
                ? 'bg-zinc-800 text-white rounded-br-none' 
                : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
            }`}>
              <div className="flex items-center gap-1.5 mb-1 text-[10px] uppercase font-mono tracking-wider opacity-60">
                {msg.role === 'user' ? (
                  <span>Student Writer</span>
                ) : (
                  <span className="flex items-center gap-1 text-slate-800 font-bold">
                    <Sparkles className="w-3 h-3 text-amber-500" /> Socratic Mentor
                  </span>
                )}
                <span>•</span>
                <span>{msg.timestamp}</span>
              </div>
              <div className="whitespace-pre-line">
                {msg.role === 'user' ? (
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                ) : (
                  <div className="space-y-1">{renderMessageContent(msg.content)}</div>
                )}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-none p-4 max-w-[80%] shadow-xs flex items-center gap-3">
              <div className="flex space-x-1">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2 h-2 rounded-full bg-violet-500 animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" />
              </div>
              <span className="text-xs font-medium text-gray-500">Formulating Socratic guidance questions...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Recommended Socratic Prompts (only show on fresh or small conversations) */}
      {messages.length < 5 && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Quote className="w-3 h-3" /> Quick Socratic Starters:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {SOCRATIC_PROMPTS.map((sp, idx) => (
              <button
                key={idx}
                onClick={() => handlePromptClick(sp.prompt)}
                disabled={isLoading}
                className="text-left text-xs bg-white hover:bg-zinc-50 border border-gray-200 hover:border-gray-300 text-gray-600 px-2.5 py-1.5 rounded-lg transition-all line-clamp-1 truncate max-w-full"
              >
                {sp.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Tray */}
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage(inputMessage);
        }}
        className="p-3 bg-white border-t border-gray-100 flex gap-2 items-center"
      >
        <button
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isLoading || isTranscribing}
          className={`p-3 rounded-xl transition-all flex-shrink-0 flex items-center justify-center ${
            isRecording 
              ? 'bg-red-500 text-white animate-pulse hover:bg-red-600' 
              : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
          }`}
          title={isRecording ? "Stop Recording" : "Speak to Socratic Mentor"}
        >
          {isTranscribing ? (
            <Loader className="w-4 h-4 animate-spin" />
          ) : isRecording ? (
            <Square className="w-4 h-4 fill-current" />
          ) : (
            <Mic className="w-4 h-4" />
          )}
        </button>
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder={isRecording ? "Listening..." : "Ask about Research Questions, variable control, or structural critique..."}
          disabled={isLoading || isRecording || isTranscribing}
          className="flex-1 bg-gray-50 border border-gray-200 hover:border-gray-300 focus:border-zinc-800 focus:bg-white text-sm px-4 py-3 rounded-xl focus:outline-hidden transition-all disabled:opacity-75"
        />
        <button
          type="submit"
          disabled={isLoading || !inputMessage.trim() || isRecording}
          className="p-3 bg-zinc-800 text-white rounded-xl hover:bg-zinc-900 disabled:bg-gray-100 disabled:text-gray-400 transition-colors flex-shrink-0 flex items-center justify-center"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
