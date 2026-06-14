import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  BookOpen, Sparkles, AlertCircle, Quote, HelpCircle, 
  MessageSquare, FileCheck, CheckCircle2, Bookmark, 
  ChevronRight, Compass, Shield, Plus, X, Award, Eye,
  TrendingUp, Link
} from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';
import { IBModuleType, ResearchIdea } from './types';
import { IB_MODULES_INFO, EE_RUBRICS, TOK_GUIDELINES, IA_GUIDELINES_BY_GROUP } from './data';
import SocraticChat from './components/SocraticChat';
import SocraticCritiqueHub from './components/SocraticCritiqueHub';
import StudyPlanner from './components/StudyPlanner';

const velocityData = [
  { day: 'Mon', tasks: 1 },
  { day: 'Tue', tasks: 2 },
  { day: 'Wed', tasks: 1 },
  { day: 'Thu', tasks: 3 },
  { day: 'Fri', tasks: 5 },
  { day: 'Sat', tasks: 4 },
  { day: 'Sun', tasks: 7 },
];

export default function App() {
  const [activeModule, setActiveModule] = useState<IBModuleType>('ee');
  const [activeTab, setActiveTab] = useState<'chat' | 'critique' | 'planner'>('chat');
  
  // Quick Cite State
  const [citeUrl, setCiteUrl] = useState('');
  const [citeStyle, setCiteStyle] = useState<'mla' | 'apa' | 'chicago'>('mla');
  const [citeResult, setCiteResult] = useState('');

  const generateQuickCite = () => {
    if (!citeUrl) return;
    let urlObj;
    try {
      urlObj = new URL(citeUrl.startsWith('http') ? citeUrl : `https://${citeUrl}`);
    } catch (e) {
      setCiteResult("Please enter a valid URL.");
      return;
    }
    const domain = urlObj.hostname.replace('www.', '');
    if (citeStyle === 'mla') {
        setCiteResult(`Author Last, First. "Title of Web Page." ${domain}, Date, ${urlObj.href}.`);
    } else if (citeStyle === 'apa') {
        setCiteResult(`Author, A. A. (Year). Title of web page. ${domain}. ${urlObj.href}`);
    } else {
        setCiteResult(`Author Last, First. "Title of Web Page." ${domain}. ${urlObj.href}.`);
    }
  };
  
  // Socratic action notes loaded from localStorage
  const [socraticNotes, setSocraticNotes] = useState<Array<{ id: string; text: string; done: boolean }>>(() => {
    const saved = localStorage.getItem('ib_socratic_notes');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      { id: '1', text: 'Define independent & dependent variables clearly in the methodology chapter.', done: false },
      { id: '2', text: 'Unpack the semantic meanings of AOK History in the introductory paragraph.', done: false },
      { id: '3', text: 'Confirm the source citations align perfectly with MLA / APA formats.', done: false }
    ];
  });

  // Track checked criteria for each module to show visual progress bars!
  const [checkedCriteria, setCheckedCriteria] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('ib_checked_criteria');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      'ee-0': true,
      'ee-1': false,
      'ee-2': false,
      'ee-3': false,
      'ee-4': false,
      'ia-0': false,
      'ia-1': false,
      'ia-2': false,
      'ia-3': false,
      'tok-0': true,
      'tok-1': false,
      'tok-2': false,
    };
  });

  const [newNoteInput, setNewNoteInput] = useState('');

  // Persist states
  useEffect(() => {
    localStorage.setItem('ib_socratic_notes', JSON.stringify(socraticNotes));
  }, [socraticNotes]);

  useEffect(() => {
    localStorage.setItem('ib_checked_criteria', JSON.stringify(checkedCriteria));
  }, [checkedCriteria]);

  const activeModuleDetails = IB_MODULES_INFO.find(m => m.id === activeModule) || IB_MODULES_INFO[0];

  // Calculate dynamic criteria progress percentages to display beautiful live feedback!
  const getProgressPercentage = (type: IBModuleType) => {
    const prefixes: Record<IBModuleType, string> = { ee: 'ee-', ia: 'ia-', tok: 'tok-' };
    const prefix = prefixes[type];
    const keys = Object.keys(checkedCriteria).filter(k => k.startsWith(prefix));
    if (keys.length === 0) return 0;
    const checkedCount = keys.filter(k => checkedCriteria[k]).length;
    return Math.round((checkedCount / keys.length) * 100);
  };

  const handleToggleCriterion = (key: string) => {
    setCheckedCriteria(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteInput.trim()) return;
    setSocraticNotes(prev => [
      ...prev,
      { id: crypto.randomUUID(), text: newNoteInput.trim(), done: false }
    ]);
    setNewNoteInput('');
  };

  const handleToggleNote = (id: string) => {
    setSocraticNotes(prev => prev.map(n => n.id === id ? { ...n, done: !n.done } : n));
  };

  const handleDeleteNote = (id: string) => {
    setSocraticNotes(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#F8F7F3] text-[#2D312E] flex flex-col md:flex-row overflow-x-hidden font-sans" id="ib_scholar_master_container">
      
      {/* 1. LEFT SIDEBAR (The Natural Tones warm stone aside) */}
      <aside className="w-full md:w-64 bg-[#F1EDE4] border-r border-[#E0DBCF] flex flex-col p-6 flex-shrink-0" id="sidebar_natural_tones">
        
        {/* Logo Section */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-[#7B8E7E] rounded-full flex items-center justify-center text-white shadow-xs">
            <BookOpen className="w-5 h-5 text-[#F8F7F3]" />
          </div>
          <div>
            <h1 className="text-lg font-serif-title font-bold tracking-tight text-[#4A534C] leading-none mb-0.5">Scholar Bot</h1>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#7D7667]">IB Socratic Coach</span>
          </div>
        </div>

        {/* Navigation Tabs (Select current Assignment) */}
        <nav className="space-y-4 mb-6">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[#9A9283] font-bold mb-2 p-1">Active Modules</p>
            <div className="space-y-1.5">
              {IB_MODULES_INFO.map((mod) => {
                const isActive = activeModule === mod.id;
                const progress = getProgressPercentage(mod.id);
                return (
                  <button
                    key={mod.id}
                    onClick={() => {
                      setActiveModule(mod.id);
                    }}
                    className={`nav-btn w-full flex flex-col p-3 rounded-xl border text-left transition-all ${
                      isActive 
                        ? 'bg-white shadow-sm border-[#E0DBCF] ring-1 ring-[#7B8E7E]/10' 
                        : 'bg-transparent border-transparent hover:bg-[#EBE7DD] text-[#7D7667]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <div className={`w-2 h-2 rounded-full ${
                        mod.id === 'ee' ? 'bg-[#A3B18A]' : mod.id === 'ia' ? 'bg-[#7B8E7E]' : 'bg-[#D1C7B1]'
                      }`} />
                      <span className="text-xs font-serif font-bold text-[#4A534C]">{mod.title}</span>
                    </div>
                    <div className="w-full bg-[#E0DBCF] h-1.5 rounded-full overflow-hidden relative">
                      <motion.div 
                        className="h-full bg-[#7B8E7E] rounded-full relative"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                      >
                        {progress > 0 && (
                          <div className="absolute inset-0 bg-white/20 animate-pulse" />
                        )}
                      </motion.div>
                    </div>
                    <span className="text-[9px] text-[#9A9283] mt-1 pr-1">{progress}% Core Criteria Completed</span>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Socratic Mode of Workspace */}
        <div className="mb-6">
          <p className="text-[10px] uppercase tracking-widest text-[#9A9283] font-bold mb-2 p-1">Action Workspace</p>
          <div className="grid grid-cols-3 gap-0.5 bg-[#EBE7DD] p-1 rounded-xl border border-[#E0DBCF]">
            <button
              onClick={() => setActiveTab('chat')}
              className={`py-2 px-0.5 text-center text-[10px] font-bold rounded-lg transition-all ${
                activeTab === 'chat' 
                  ? 'bg-white text-[#2D312E] shadow-xs' 
                  : 'text-[#7D7667] hover:text-[#2D312E]'
              }`}
            >
              Consultant
            </button>
            <button
              onClick={() => setActiveTab('critique')}
              className={`py-2 px-0.5 text-center text-[10px] font-bold rounded-lg transition-all ${
                activeTab === 'critique' 
                  ? 'bg-white text-[#2D312E] shadow-xs' 
                  : 'text-[#7D7667] hover:text-[#2D312E]'
              }`}
            >
              Critique
            </button>
            <button
              onClick={() => setActiveTab('planner')}
              className={`py-2 px-0.5 text-center text-[10px] font-bold rounded-lg transition-all ${
                activeTab === 'planner' 
                  ? 'bg-white text-[#2D312E] shadow-xs' 
                  : 'text-[#7D7667] hover:text-[#2D312E]'
              }`}
            >
              Planner
            </button>
          </div>
        </div>

        {/* IB Official Resource Guides Redirection */}
        <div className="mb-6" id="ib_official_guides_redirection">
          <p className="text-[10px] uppercase tracking-widest text-[#9A9283] font-bold mb-2 p-1 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-[#7B8E7E]" />
            Official Guides
          </p>
          <div className="space-y-1 p-1">
            <a 
              href="https://www.ibo.org/programmes/diploma-programme/curriculum/extended-essay/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group flex items-center justify-between p-2 rounded-lg bg-white/40 hover:bg-white text-[11px] text-gray-700 hover:text-[#4A534C] border border-transparent hover:border-[#E0DBCF]/60 transition-all font-serif font-bold leading-tight"
            >
              <span>Extended Essay Guide</span>
              <ChevronRight className="w-3 h-3 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
            </a>
            <a 
              href="https://www.ibo.org/programmes/diploma-programme/curriculum/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group flex items-center justify-between p-2 rounded-lg bg-white/40 hover:bg-white text-[11px] text-gray-700 hover:text-[#4A534C] border border-transparent hover:border-[#E0DBCF]/60 transition-all font-serif font-bold leading-tight"
            >
              <span>Internal Assessment Guide</span>
              <ChevronRight className="w-3 h-3 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
            </a>
            <a 
              href="https://www.ibo.org/programmes/diploma-programme/curriculum/theory-of-knowledge/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group flex items-center justify-between p-2 rounded-lg bg-white/40 hover:bg-white text-[11px] text-gray-700 hover:text-[#4A534C] border border-transparent hover:border-[#E0DBCF]/60 transition-all font-serif font-bold leading-tight"
            >
              <span>TOK Essay Guide</span>
              <ChevronRight className="w-3 h-3 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>
        </div>

        {/* Academic Integrity Core Box */}
        <div className="mt-auto p-4 bg-[#7B8E7E] rounded-2xl text-white border border-[#5F7062] shadow-xs">
          <div className="flex items-center gap-2 mb-1.5">
            <Shield className="w-4 h-4 text-[#E5D3B3]" />
            <h5 className="text-[11px] font-bold uppercase tracking-wider text-[#E5D3B3]">Honesty Pledge</h5>
          </div>
          <p className="text-[10px] leading-relaxed text-[#F8F7F3] opacity-95">
            Integrity is paramount. I act purely as a mentor and am prohibited from generating essays or custom arguments directly.
          </p>
        </div>

      </aside>

      {/* 2. CENTER PIECE WORKSPACE */}
      <main className="flex-1 flex flex-col p-4 md:p-6 space-y-6" id="center_workspace_layout">
        
        {/* Workspace Active Header */}
        <header className="bg-white/70 backdrop-blur-md border border-[#E0DBCF] p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#9A9283] mb-1">
              <span>Academic Workspace</span>
              <ChevronRight className="w-3 h-3" />
              <span className="font-semibold text-[#7B8E7E]">{activeModuleDetails.title} Mode</span>
            </div>
            <h2 className="text-xl font-serif-title font-bold text-[#4A534C] tracking-tight">
              {activeTab === 'chat' ? 'Socratic Consultation' : activeTab === 'critique' ? 'Academic Draft Critique' : 'Personal Study Planner'}
            </h2>
          </div>

          <div className="flex items-center gap-3 self-stretch sm:self-auto">
            <span className="bg-[#EBE7DD] border border-[#E0DBCF] text-[10px] font-bold text-[#7D7667] px-3 py-1 rounded-full uppercase tracking-wider">
              {activeModuleDetails.wordLimit}
            </span>
            <div className="bg-[#A3B18A]/10 border border-[#A3B18A]/30 text-xs text-[#5F7062] font-semibold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
              <span className="w-1.5 h-1.5 bg-[#7B8E7E] rounded-full animate-pulse" />
              Socratic Guidance
            </div>
          </div>
        </header>

        {/* Criteria Velocity Sparkline */}
        <div className="bg-white border border-[#E0DBCF] rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-shrink-0">
            <h3 className="text-[11px] font-bold text-[#7D7667] uppercase tracking-wider flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5" /> Criteria Velocity</h3>
            <p className="text-xs text-[#9A9283] mt-1">7-Day Progress Speed</p>
          </div>
          <div className="flex-1 h-12 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={velocityData}>
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', fontSize: '10px', borderRadius: '8px', border: '1px solid #E0DBCF', padding: '4px' }}
                  itemStyle={{ color: '#7B8E7E', fontWeight: 'bold' }}
                />
                <Line type="monotone" dataKey="tasks" stroke="#7B8E7E" strokeWidth={3} dot={{ r: 3, fill: '#A3B18A' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Current Module Overview Banner */}
        <div className="bg-[#F1EDE4] border border-[#E0DBCF] rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="space-y-1 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#7B8E7E] border border-[#7B8E7E]/30 px-2 py-0.5 rounded bg-[#7B8E7E]/5">
                {activeModuleDetails.badge}
              </span>
              <h4 className="text-xs font-bold text-[#2D312E]">{activeModuleDetails.title} Essentials</h4>
            </div>
            <p className="text-xs text-[#7D7667] leading-relaxed">
              {activeModuleDetails.description}
            </p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-[#E0DBCF] flex-shrink-0 text-center w-full md:w-36">
            <div className="text-xs font-semibold text-[#7D7667]">Criteria Met</div>
            <div className="text-2xl font-serif-title font-black text-[#7B8E7E]">{getProgressPercentage(activeModule)}%</div>
          </div>
        </div>

        {/* Dynamic View Selector rendering components */}
        {activeTab === 'chat' ? (
          <div className="flex-1">
            <SocraticChat 
              moduleType={activeModule}
              moduleColor={activeModule === 'ee' ? 'from-[#7B8E7E] to-[#5F7062]' : activeModule === 'ia' ? 'from-[#A3B18A] to-[#7B8E7E]' : 'from-[#D1C7B1] to-[#9A9283]'}
              moduleTitle={activeModuleDetails.title}
            />
          </div>
        ) : activeTab === 'critique' ? (
          <div className="flex-1">
            <SocraticCritiqueHub />
          </div>
        ) : (
          <div className="flex-1">
            <StudyPlanner />
          </div>
        )}

      </main>

      {/* 3. RIGHT HAND SIDEBAR (Criteria Checklist & Socratic Notes) */}
      <aside className="w-full md:w-80 bg-[#F1EDE4] border-l border-[#E0DBCF] p-6 flex flex-col space-y-6 flex-shrink-0" id="rubrics_tracker_panel">
        
        {/* Interactive Rubrics Progress Check Block */}
        <div>
          <h3 className="text-xs font-serif-title font-bold uppercase tracking-widest text-[#7D7667] border-b border-[#E0DBCF] pb-2 mb-3.5">
            Rubric Criteria Indicator
          </h3>
          
          <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
            {activeModule === 'ee' && EE_RUBRICS.map((rubric, idx) => {
              const key = `ee-${idx}`;
              const isChecked = !!checkedCriteria[key];
              return (
                <div 
                  key={key} 
                  onClick={() => handleToggleCriterion(key)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex gap-2.5 items-start ${
                    isChecked 
                      ? 'bg-white border-[#A3B18A]/50 text-[#2D312E]' 
                      : 'bg-white/40 border-transparent text-[#7D7667] hover:bg-white/80'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}} // Swapped by div container click
                    className="mt-0.5 rounded text-[#7B8E7E] focus:ring-[#7B8E7E]"
                  />
                  <div>
                    <span className="text-[11px] font-bold block leading-tight text-[#4A534C]">{rubric.criterion}: {rubric.name}</span>
                    <span className="text-[10px] block font-medium opacity-80 leading-snug mt-0.5">{rubric.focus}</span>
                    {isChecked && (
                      <div className="mt-1 text-[9px] text-[#7B8E7E] font-medium italic">
                        ✓ Tips checked
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {activeModule === 'ia' && IA_GUIDELINES_BY_GROUP.map((g, idx) => {
              const key = `ia-${idx}`;
              const isChecked = !!checkedCriteria[key];
              return (
                <div 
                  key={key} 
                  onClick={() => handleToggleCriterion(key)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex gap-2.5 items-start ${
                    isChecked 
                      ? 'bg-white border-[#A3B18A]/50 text-[#2D312E]' 
                      : 'bg-white/40 border-transparent text-[#7D7667] hover:bg-white/80'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                    className="mt-0.5 rounded text-[#7B8E7E] focus:ring-[#7B8E7E]"
                  />
                  <div>
                    <span className="text-[11px] font-bold block leading-tight text-[#4A534C]">{g.group}</span>
                    <span className="text-[10px] block font-medium opacity-80 leading-snug mt-0.5">{g.rubricFocus}</span>
                  </div>
                </div>
              );
            })}

            {activeModule === 'tok' && TOK_GUIDELINES.map((t, idx) => {
              const key = `tok-${idx}`;
              const isChecked = !!checkedCriteria[key];
              return (
                <div 
                  key={key} 
                  onClick={() => handleToggleCriterion(key)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex gap-2.5 items-start ${
                    isChecked 
                      ? 'bg-white border-[#A3B18A]/50 text-[#2D312E]' 
                      : 'bg-white/40 border-transparent text-[#7D7667] hover:bg-white/80'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                    className="mt-0.5 rounded text-[#7B8E7E] focus:ring-[#7B8E7E]"
                  />
                  <div>
                    <span className="text-[11px] font-bold block leading-tight text-[#4A534C]">{t.name}</span>
                    <span className="text-[10px] block font-medium opacity-80 leading-snug mt-0.5">{t.focus}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Advice Scratchpad & Checklist */}
        <div className="flex-1 flex flex-col">
          <h3 className="text-xs font-serif-title font-bold uppercase tracking-widest text-[#7D7667] border-b border-[#E0DBCF] pb-2 mb-3">
            Socratic Scribe Notepad
          </h3>
          <p className="text-[10px] text-[#7D7667] mb-2">Jot down questions or core feedback points derived from the bot:</p>
          
          <form onSubmit={handleAddNote} className="flex gap-1.5 mb-3">
            <input
              type="text"
              value={newNoteInput}
              onChange={(e) => setNewNoteInput(e.target.value)}
              placeholder="e.g. Narrow Bio independent variables"
              className="bg-white border border-[#E0DBCF] rounded-lg px-2.5 py-1.5 text-xs flex-1 focus:outline-hidden focus:ring-1 focus:ring-[#7B8E7E]"
            />
            <button 
              type="submit"
              className="p-1.5 bg-[#7B8E7E] text-white rounded-lg hover:bg-[#5F7062]"
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>

          <div className="space-y-1.5 max-h-48 overflow-y-auto flex-1">
            {socraticNotes.map((note) => (
              <div 
                key={note.id} 
                className="group flex items-center justify-between p-2 rounded-lg bg-white/60 hover:bg-white transition-all text-xs border border-transparent hover:border-[#E0DBCF]/60"
              >
                <div onClick={() => handleToggleNote(note.id)} className="flex items-center gap-2 cursor-pointer flex-1 mr-2 pr-1">
                  <span className={`w-3.5 h-3.5 rounded border border-[#C4BEB1] flex items-center justify-center text-white ${
                    note.done ? 'bg-[#7B8E7E]' : 'bg-transparent'
                  }`}>
                    {note.done && '✓'}
                  </span>
                  <span className={`leading-tight text-[11px] ${note.done ? 'line-through text-[#9A9283]' : 'text-gray-700'}`}>
                    {note.text}
                  </span>
                </div>
                <button 
                  onClick={() => handleDeleteNote(note.id)}
                  className="opacity-0 group-hover:opacity-100 text-[#9A9283] hover:text-red-500 transition-opacity p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {socraticNotes.length === 0 && (
              <div className="text-center py-4 text-[#9A9283] text-xs">
                No active notes. Jot down guidelines!
              </div>
            )}
          </div>
        </div>

        {/* Quick Cite Generator */}
        <div className="bg-[#EBE7DD] rounded-xl p-4 border border-[#E0DBCF] flex flex-col space-y-2">
          <h3 className="text-xs font-serif-title font-bold uppercase tracking-widest text-[#7D7667] flex items-center gap-1.5"><Link className="w-3.5 h-3.5" /> Quick Cite</h3>
          <div className="flex gap-2 items-center">
             <input type="text" placeholder="https://source.com" value={citeUrl} onChange={e => setCiteUrl(e.target.value)} className="w-full bg-white border border-[#E0DBCF] rounded-lg px-2 py-1.5 text-[10px] focus:outline-hidden focus:ring-1 focus:ring-[#7B8E7E]" />
             <select value={citeStyle} onChange={e => setCiteStyle(e.target.value as any)} className="bg-white border border-[#E0DBCF] rounded-lg px-1 py-1.5 text-[10px] focus:outline-hidden">
               <option value="mla">MLA</option>
               <option value="apa">APA</option>
               <option value="chicago">CHI</option>
             </select>
          </div>
          <button onClick={generateQuickCite} className="w-full bg-[#7B8E7E] text-white text-[10px] py-1.5 rounded-lg hover:bg-[#5F7062] transition-colors font-bold uppercase tracking-wider">Generate Cite</button>
          {citeResult && (
             <div className="mt-2 bg-white p-2 border border-[#E0DBCF] rounded text-[10px] text-gray-700 italic break-all">
               {citeResult}
             </div>
          )}
        </div>

        {/* Pro Tip Box aligning perfectly with current module */}
        <div className="bg-white rounded-2xl p-4 border border-[#E0DBCF] shadow-xs">
          <p className="text-[10px] font-bold text-[#7B8E7E] uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Quote className="w-3.5 h-3.5" />
            IB Pro Coach Tip
          </p>
          <p className="text-[11px] italic leading-relaxed text-[#7D7667]">
            {activeModule === 'ee' && '"Remember, your EE is an academic research exploration. Don\'t fret if the data contradicts your hypothesis—evaluating that outcome rigorously unlocks top scores in Criterion C!"'}
            {activeModule === 'ia' && '"The best Science/Math IAs showcase an authentic personal choice for the topic and detailed analysis of uncertainty measurements—be original!"'}
            {activeModule === 'tok' && '"A clear TOK essay starts on Knowledge Questions themselves and never spirals down into a descriptive historical or scientific story—focus on HOW we know."'}
          </p>
        </div>

      </aside>

    </div>
  );
}
