import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, CheckSquare, Sparkles, BookOpen, 
  ArrowRight, Plus, HelpCircle, Save, CheckCircle2,
  Play, Pause, RotateCcw, Flame, Coffee, Trophy
} from 'lucide-react';
import { IBModuleType } from '../types';

interface ProjectInput {
  stage: 'brainstorming' | 'outlining' | 'drafting' | 'revising' | 'completed';
  deadline: string;
  subject: string;
}

export default function StudyPlanner() {
  const [stages, setStages] = useState<Record<IBModuleType, ProjectInput>>(() => {
    const saved = localStorage.getItem('ib_study_stages');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    // Default reasonable dates for a junior/senior IB student
    return {
      ee: { stage: 'brainstorming', deadline: '2026-10-15', subject: 'History EE' },
      ia: { stage: 'outlining', deadline: '2026-11-20', subject: 'Chemistry IA' },
      tok: { stage: 'drafting', deadline: '2026-12-05', subject: 'TOK Title 3' }
    };
  });

  const [generatedPlan, setGeneratedPlan] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Focus Deep Work Timer State
  const [timeLeft, setTimeLeft] = useState(1500); // Default 25 mins
  const [totalDuration, setTotalDuration] = useState(1500);
  const [timerActive, setTimerActive] = useState(false);
  const [sessionSubject, setSessionSubject] = useState<'EE' | 'IA' | 'TOK' | 'General'>('EE');
  const [completedSessions, setCompletedSessions] = useState<{ id: string; subject: string; durationMin: number; timestamp: string }[]>(() => {
    const saved = localStorage.getItem('ib_timer_sessions');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      { id: 'sample-1', subject: 'EE', durationMin: 25, timestamp: '10:42 AM' },
      { id: 'sample-2', subject: 'TOK', durationMin: 15, timestamp: 'Yesterday' }
    ];
  });

  useEffect(() => {
    localStorage.setItem('ib_timer_sessions', JSON.stringify(completedSessions));
  }, [completedSessions]);

  useEffect(() => {
    let interval: any = null;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && timerActive) {
      setTimerActive(false);
      const minutesCompleted = Math.round(totalDuration / 60);
      const newSession = {
        id: Math.random().toString(36).substring(2, 9),
        subject: sessionSubject,
        durationMin: minutesCompleted,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setCompletedSessions(prev => [newSession, ...prev]);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive, timeLeft, totalDuration, sessionSubject]);

  const selectDuration = (minutes: number) => {
    setTimerActive(false);
    setTimeLeft(minutes * 60);
    setTotalDuration(minutes * 60);
  };

  const toggleTimer = () => {
    setTimerActive(!timerActive);
  };

  const resetTimer = () => {
    setTimerActive(false);
    setTimeLeft(totalDuration);
  };

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    localStorage.setItem('ib_study_stages', JSON.stringify(stages));
  }, [stages]);

  const handleStageChange = (module: IBModuleType, field: keyof ProjectInput, value: string) => {
    setStages(prev => ({
      ...prev,
      [module]: {
        ...prev[module],
        [field]: value
      }
    }));
  };

  const calculateDefaultTimeline = (module: IBModuleType) => {
    const proj = stages[module];
    const deadlineDate = new Date(proj.deadline);
    if (isNaN(deadlineDate.getTime())) return [];

    const now = new Date();
    const totalMs = deadlineDate.getTime() - now.getTime();
    const totalDays = Math.max(15, Math.ceil(totalMs / (1000 * 60 * 60 * 24)));

    // Distribute time proportionally based on current stage
    // Phase 1: Research & Brainstorm, Phase 2: Detailed Outline, Phase 3: Drafting & Data, Phase 4: Socratic Revision & Formatting
    let relativeWeights = { research: 0.25, outline: 0.2, drafting: 0.35, revising: 0.2 };
    
    if (proj.stage === 'outlining') {
      relativeWeights = { research: 0.05, outline: 0.3, drafting: 0.45, revising: 0.2 };
    } else if (proj.stage === 'drafting') {
      relativeWeights = { research: 0.0, outline: 0.05, drafting: 0.6, revising: 0.35 };
    } else if (proj.stage === 'revising') {
      relativeWeights = { research: 0.0, outline: 0.0, drafting: 0.1, revising: 0.9 };
    }

    const formatDate = (daysFromNow: number) => {
      const d = new Date();
      d.setDate(d.getDate() + daysFromNow);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    let accumulatedDays = 0;
    const timeline = [];

    // Research & Brainstorming
    if (relativeWeights.research > 0) {
      accumulatedDays += Math.round(totalDays * relativeWeights.research);
      timeline.push({
        phase: "Phase 1: Brainstorming & Source Gathering",
        date: formatDate(accumulatedDays),
        description: `Narrow your Research Question (RQ) down. Locate at least 5 secondary peer-reviewed sources or primary datasets. Verify methodology guidelines.`,
        socraticCheckpoint: "Socratic Question: What makes your research angle uniquely yours rather than a copy of existing work?"
      });
    }

    // Detailed Outline
    if (relativeWeights.outline > 0) {
      accumulatedDays += Math.round(totalDays * relativeWeights.outline);
      timeline.push({
        phase: "Phase 2: Structured Argument Mapping",
        date: formatDate(accumulatedDays),
        description: `Map out paragraphs, subheadings, or scientific experimental procedures. Validate your independent and dependent variables.`,
        socraticCheckpoint: "Socratic Question: How does each mapped paragraph explicitly connect back to answering your main Research Question?"
      });
    }

    // Drafting
    if (relativeWeights.drafting > 0) {
      accumulatedDays += Math.round(totalDays * relativeWeights.drafting);
      timeline.push({
        phase: "Phase 3: Deep Drafting & Writing",
        date: formatDate(accumulatedDays),
        description: `Draft the body chapters. Calculate statistical error ranges, outline bibliography entries, translate theory to diagrams.`,
        socraticCheckpoint: "Socratic Question: Are there sections where you tell a descriptive story rather than offering deep, analytical evaluation?"
      });
    }

    // Revising
    if (relativeWeights.revising > 0) {
      accumulatedDays += Math.round(totalDays * relativeWeights.revising);
      timeline.push({
        phase: "Phase 4: Socratic Rubrics Polishing",
        date: formatDate(accumulatedDays),
        description: `Review formatting (1.5 space, normal margins). Audit bibliography. Verify you didn't accidentally include ghostwritten paragraphs.`,
        socraticCheckpoint: "Socratic Question: Prepare for the final supervisor check! What lessons did you learn during research?"
      });
    }

    return timeline;
  };

  const handleConsultGeminiAdvisor = async () => {
    setIsLoading(true);
    setGeneratedPlan('');

    try {
      const promptText = `As index-level IB Scholar Socratic Planner, analyze this workload:
- Extended Essay Subject/Focus: ${stages.ee.subject}, Target: ${stages.ee.deadline}, Stage: ${stages.ee.stage}
- Internal Assessment Subject/Focus: ${stages.ia.subject}, Target: ${stages.ia.deadline}, Stage: ${stages.ia.stage}
- TOK Essay Focus: ${stages.tok.subject}, Target: ${stages.tok.deadline}, Stage: ${stages.tok.stage}

Generate a concise, highly strategic, personalized study plan. 
Include:
1. "Workload Synergy Check": Point out if deadlines clash or require extreme time management.
2. "Stage-by-Stage Advice": Give exact step-by-step tactics to advance each project from its current stage to the next, specifically for their selected subjects.
3. "Critical Socratic Prompts": Highlight 3 powerful questions they should ask themselves over the next month to ensure high marks and authentic academic honesty.

Keep the advice beautifully formatted, direct, and supportive. Under 550 words.`;

      const res = await fetch("/api/critique", {  // Re-use core content engine
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draftText: promptText,
          critiqueType: "Study Plan Advisor",
          focusArea: "Strategic Milestones & Timelines",
          subject: "Unified IB DP Core Portfolio"
        })
      });

      if (!res.ok) {
        throw new Error("Failed generating plan");
      }

      const data = await res.json();
      setGeneratedPlan(data.text);
    } catch (e) {
      console.error(e);
      setGeneratedPlan("⚠️ **Advisor Note**: Unable to reach your mentor advisor server. Please review your environment credentials or fallback to the local scheduler below.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="socratic_study_planner_page">
      {/* Inputs panel */}
      <div className="lg:col-span-5 space-y-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-5">
          <div>
            <h3 className="font-semibold text-sm text-gray-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#7B8E7E]" />
              Deadlines & Milestones Input
            </h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Let’s customize your milestones timeline based on real dates.</p>
          </div>

          {/* Extended Essay settings */}
          <div className="p-3 bg-amber-50/40 rounded-xl border border-amber-100/60 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-serif-title font-bold text-amber-900">Extended Essay (EE)</span>
              <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-mono font-semibold">4,000w</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-gray-500 block mb-1">Focus/Subject</label>
                <input
                  type="text"
                  value={stages.ee.subject}
                  onChange={(e) => handleStageChange('ee', 'subject', e.target.value)}
                  className="w-full bg-white text-xs border border-gray-200 px-2.5 py-1.5 rounded-lg focus:outline-hidden"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 block mb-1">Target Date</label>
                <input
                  type="date"
                  value={stages.ee.deadline}
                  onChange={(e) => handleStageChange('ee', 'deadline', e.target.value)}
                  className="w-full bg-white text-xs border border-gray-200 px-2 py-1.5 rounded-lg focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-gray-500 block mb-1">Current Stage</label>
              <select
                value={stages.ee.stage}
                onChange={(e) => handleStageChange('ee', 'stage', e.target.value)}
                className="w-full bg-white text-xs border border-gray-200 px-2 py-1.5 rounded-lg focus:outline-hidden"
              >
                <option value="brainstorming">Phase 1: Brainstorming (Exploring topics)</option>
                <option value="outlining">Phase 2: Outlining (Mapping sections)</option>
                <option value="drafting">Phase 3: Drafting (Writing core content)</option>
                <option value="revising">Phase 4: Socratic Review (Rubrics check)</option>
                <option value="completed">Completed & Formatted</option>
              </select>
            </div>
          </div>

          {/* Internal Assessment settings */}
          <div className="p-3 bg-indigo-50/40 rounded-xl border border-indigo-100/60 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-serif-title font-bold text-indigo-900">Internal Assessment (IA)</span>
              <span className="text-[9px] bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded font-mono font-semibold">Coursework</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-gray-500 block mb-1">Focus/Subject</label>
                <input
                  type="text"
                  value={stages.ia.subject}
                  onChange={(e) => handleStageChange('ia', 'subject', e.target.value)}
                  className="w-full bg-white text-xs border border-gray-200 px-2.5 py-1.5 rounded-lg focus:outline-hidden"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 block mb-1">Target Date</label>
                <input
                  type="date"
                  value={stages.ia.deadline}
                  onChange={(e) => handleStageChange('ia', 'deadline', e.target.value)}
                  className="w-full bg-white text-xs border border-gray-200 px-2 py-1.5 rounded-lg focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-gray-500 block mb-1">Current Stage</label>
              <select
                value={stages.ia.stage}
                onChange={(e) => handleStageChange('ia', 'stage', e.target.value)}
                className="w-full bg-white text-xs border border-gray-200 px-2 py-1.5 rounded-lg focus:outline-hidden"
              >
                <option value="brainstorming">Phase 1: Brainstorming (Exploration / Personal Eng.)</option>
                <option value="outlining">Phase 2: Outlining (Lab setup / Math variables)</option>
                <option value="drafting">Phase 3: Drafting (Data analysis / Writing)</option>
                <option value="revising">Phase 4: Socratic Review (Evaluation & Error check)</option>
                <option value="completed">Completed & Formatted</option>
              </select>
            </div>
          </div>

          {/* TOK settings */}
          <div className="p-3 bg-emerald-50/40 rounded-xl border border-emerald-100/60 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-serif-title font-bold text-emerald-900">TOK Essay</span>
              <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-mono font-semibold">1,600w</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-gray-500 block mb-1">Prescribed Title Focus</label>
                <input
                  type="text"
                  value={stages.tok.subject}
                  onChange={(e) => handleStageChange('tok', 'subject', e.target.value)}
                  className="w-full bg-white text-xs border border-gray-200 px-2.5 py-1.5 rounded-lg focus:outline-hidden"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 block mb-1">Target Date</label>
                <input
                  type="date"
                  value={stages.tok.deadline}
                  onChange={(e) => handleStageChange('tok', 'deadline', e.target.value)}
                  className="w-full bg-white text-xs border border-gray-200 px-2 py-1.5 rounded-lg focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-gray-500 block mb-1">Current Stage</label>
              <select
                value={stages.tok.stage}
                onChange={(e) => handleStageChange('tok', 'stage', e.target.value)}
                className="w-full bg-white text-xs border border-gray-200 px-2 py-1.5 rounded-lg focus:outline-hidden"
              >
                <option value="brainstorming">Phase 1: Brainstorming (Unpacking Title / choosing AOKs)</option>
                <option value="outlining">Phase 2: Outlining (Developing Knowledge Questions)</option>
                <option value="drafting">Phase 3: Drafting (Inquiring claims & perspectives)</option>
                <option value="revising">Phase 4: Socratic Review (Conceptual drift checking)</option>
                <option value="completed">Completed & Formatted</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleConsultGeminiAdvisor}
            disabled={isLoading}
            className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-900 focus:ring-2 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            {isLoading ? 'Synthesizing Synergies...' : 'Consult Strategic Socratic Plan'}
          </button>
        </div>

        {/* Focused 'Deep Work' Session Timer */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4" id="deep_work_focus_timer">
          <div>
            <h3 className="font-semibold text-sm text-gray-900 flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500 animate-pulse animate-duration-1000" />
              Socratic Focus Hour
            </h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Track uninterrupted research, outlining, or writing sprints.</p>
          </div>

          <div className="bg-[#F8F7F3] rounded-xl p-4 border border-gray-100/80 text-center space-y-3 relative overflow-hidden">
            <div className="flex justify-between items-center px-0.5 mb-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Session Subject</span>
              <div className="flex gap-1">
                {(['EE', 'IA', 'TOK', 'General'] as const).map((sub) => (
                  <button
                    key={sub}
                    onClick={() => setSessionSubject(sub)}
                    className={`px-1.5 py-0.5 text-[9px] font-bold rounded transition-all ${
                      sessionSubject === sub
                        ? 'bg-[#7B8E7E] text-white'
                        : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>

            <div className="py-2.5 relative">
              <div className="text-3xl font-mono font-bold text-zinc-800 tracking-tight flex items-center justify-center gap-1.5">
                {formatTime(timeLeft)}
              </div>
              <p className="text-[10px] text-gray-400 font-medium mt-1">
                {timerActive ? '🔥 Socratic deep work mode is running...' : '⚡ Timer ready'}
              </p>
            </div>

            {/* Quick Presets */}
            <div className="grid grid-cols-4 gap-1">
              {[
                { min: 15, label: '15m Outline' },
                { min: 25, label: '25m Sprint' },
                { min: 50, label: '50m Deep' },
                { min: 5, label: '5m Break' },
              ].map((p) => (
                <button
                  key={p.min}
                  onClick={() => selectDuration(p.min)}
                  className={`py-1 px-0.5 rounded text-[9px] font-semibold border transition-all ${
                    totalDuration === p.min * 60
                      ? 'bg-zinc-800 text-white border-zinc-900'
                      : 'bg-white text-zinc-650 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Timer Controls */}
            <div className="flex gap-1.5 pt-2">
              <button
                onClick={toggleTimer}
                className={`flex-1 py-1.5 rounded-lg text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                  timerActive 
                    ? 'bg-amber-600 hover:bg-amber-700' 
                    : 'bg-[#7B8E7E] hover:bg-[#68786B]'
                }`}
              >
                {timerActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                {timerActive ? 'Pause block' : 'Start Focus'}
              </button>
              <button
                onClick={resetTimer}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-55 transition-all"
                title="Reset Timer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Session History */}
          {completedSessions.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block px-0.5">Completed Sessions Today</span>
              <div className="max-h-24 overflow-y-auto space-y-1 pr-1 border-t border-gray-100/60 pt-1">
                {completedSessions.map((s, idx) => (
                  <div key={s.id || idx} className="flex justify-between items-center p-1.5 rounded-lg bg-zinc-50 border border-gray-100 text-[10px]">
                    <div className="flex items-center gap-1">
                      <Trophy className="w-3 h-3 text-amber-500" />
                      <span className="font-semibold text-zinc-700">{s.subject} Focus Session</span>
                    </div>
                    <div className="flex items-center gap-1 text-zinc-505">
                      <span>{s.durationMin}m</span>
                      <span className="text-[9px] text-[#9A9283] font-mono">({s.timestamp})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right side Output panel */}
      <div className="lg:col-span-7 space-y-4">
        {/* Dynamic Study Plan advisor feedback */}
        {generatedPlan && (
          <div className="bg-[#F1EDE4] border border-[#E0DBCF] rounded-2xl p-6 shadow-xs relative">
            <span className="absolute right-4 top-4 text-[10px] bg-[#7B8E7E] text-white px-2 py-0.5 rounded font-bold uppercase tracking-wider">Advisor Consult</span>
            <h3 className="font-serif-title font-bold text-gray-900 text-base mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-600 animate-pulse" />
              Socratic Advisor Analysis Summary
            </h3>
            <div className="space-y-2 prose prose-zinc max-w-none text-xs text-gray-700 leading-relaxed max-h-72 overflow-y-auto pr-1">
              {generatedPlan.split('\n').map((line, idx) => {
                if (line.trim().startsWith('###')) {
                  return <h4 key={idx} className="font-bold text-zinc-900 text-xs mt-3 mb-1">{line.replace(/^###\s+/, '')}</h4>;
                }
                if (line.trim().startsWith('##')) {
                  return <h3 key={idx} className="font-bold text-zinc-900 text-sm border-b pb-1 mt-4 mb-2">{line.replace(/^##\s+/, '')}</h3>;
                }
                if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
                  return <li key={idx} className="ml-4 list-disc text-gray-700 my-0.5">{line.replace(/^[-*]\s+/, '')}</li>;
                }
                return <p key={idx} className="my-1 text-gray-600">{line}</p>;
              })}
            </div>
          </div>
        )}

        {/* Core dynamic timeline generated locally */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-5">
          <div>
            <h3 className="font-serif-title font-bold text-gray-900 text-sm flex items-center gap-2">
              <Clock className="w-4 a h-4 text-[#7B8E7E]" />
              Calculated Steps Timeline
            </h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Automated chronological timeline for your current stage distributions.</p>
          </div>

          <div className="space-y-4">
            {(['ee', 'ia', 'tok'] as IBModuleType[]).map((mod) => {
              const timeline = calculateDefaultTimeline(mod);
              const metadata = stages[mod];
              return (
                <div key={mod} className="border-l-2 border-[#E0DBCF] pl-4 py-1 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#7B8E7E] -ml-[21px]" />
                    <span className="text-xs font-serif-title font-bold text-[#4A534C] capitalize">{mod.toUpperCase()}: {metadata.subject}</span>
                    <span className="text-[10px] uppercase font-bold text-gray-400">Targeting {metadata.deadline}</span>
                  </div>

                  <div className="space-y-2">
                    {timeline.length > 0 ? (
                      timeline.map((step, i) => (
                        <div key={i} className="bg-[#F8F7F3] p-3 rounded-xl border border-gray-100/60 space-y-1.5">
                          <div className="flex justify-between items-center text-[11px] font-bold text-gray-700">
                            <span>{step.phase}</span>
                            <span className="text-[#7B8E7E] font-mono">{step.date}</span>
                          </div>
                          <p className="text-[10px] text-gray-500 leading-normal">{step.description}</p>
                          <div className="bg-white border-l-2 border-amber-400/80 p-2 text-[9.5px] italic text-[#7D7667] leading-tight">
                            {step.socraticCheckpoint}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="bg-[#F8F7F3] p-3 rounded-xl text-center text-xs text-gray-400">
                        This module is already set to completed! Excellent job. Remember to check formatting.
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
