"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Code,
  Terminal,
  Search,
  Users,
  CheckCircle2,
  ArrowRight,
  Brain,
  Cpu,
  UserCheck,
  BarChart3,
  Sparkles,
  Layers
} from "lucide-react";

const TABS = [
  {
    id: "interview",
    label: "AI Interview",
    icon: Brain,
    description: "Evaluate technical capability and real-time problem solving.",
  },
  {
    id: "search",
    label: "AI Talent Search",
    icon: Search,
    description: "Scan verified candidate evaluations with simple search queries.",
  },
  {
    id: "ats",
    label: "AI Smart ATS",
    icon: Users,
    description: "Pipeline automation that ranks talent by verified capability.",
  },
  {
    id: "sandbox",
    label: "Execution Sandbox",
    icon: Terminal,
    description: "Verify technical skills securely through real-time logic checks.",
  }
];

export function ServiceShowcase() {
  const [activeTab, setActiveTab] = useState("interview");
  const [demoState, setDemoState] = useState(0);

  // Auto loop/simulation states
  useEffect(() => {
    const timer = setInterval(() => {
      setDemoState((prev) => (prev + 1) % 4);
    }, 4500);
    return () => clearInterval(timer);
  }, [activeTab]);

  // Reset demoState when tab changes
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setDemoState(0);
  };

  return (
    <section id="platform" className="py-24" style={{ backgroundColor: "#FFFFFF" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-semibold mb-4 mx-auto"
            style={{ background: "#EDE9FE", border: "1px solid #DDD6FE", color: "#6D28D9" }}
          >
            <Sparkles className="w-4 h-4 text-violet-600" />
            Active Platform Showcase
          </div>
          <h2
            className="text-3xl md:text-5xl font-black mb-6 tracking-tight"
            style={{ letterSpacing: "-0.03em", color: "#1E1B4B" }}
          >
            How SkilledCore{" "}
            <span style={{ background: "linear-gradient(135deg, #5B35D5, #4A28C9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Replaces the Screening Loop
            </span>
          </h2>
          <p className="text-lg md:text-xl font-medium max-w-2xl mx-auto" style={{ color: "#64748B" }}>
            An interactive, hands-on look at our platform. Click through the tabs below to witness the AI in action.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap justify-center gap-2 mb-12 max-w-4xl mx-auto p-1.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2.5 px-5 py-3.5 rounded-xl text-sm font-bold transition-all duration-350 shrink-0 ${
                  isActive
                    ? "bg-white shadow-sm border border-indigo-100"
                    : "hover:bg-slate-100/70 border border-transparent"
                }`}
                style={{ color: isActive ? "#4A28C9" : "#475569" }}
              >
                <Icon className={`w-4.5 h-4.5 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Visual Showcase Panel */}
        <div 
          className="relative min-h-[600px] border border-slate-200/90 rounded-3xl p-6 md:p-10 shadow-xl overflow-hidden transition-all duration-500"
          style={{ background: "linear-gradient(170deg, #FAFAFE 0%, #FFFFFF 100%)" }}
        >
          {/* Subtle decoration lines */}
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-50/40 rounded-full blur-3xl pointer-events-none -z-10" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-50/40 rounded-full blur-3xl pointer-events-none -z-10" />

          <AnimatePresence mode="wait">
            {activeTab === "interview" && (
              <motion.div
                key="interview-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.35 }}
                className="grid lg:grid-cols-12 gap-8 items-stretch"
              >
                {/* Chat Panel */}
                <div className="lg:col-span-7 flex flex-col justify-between bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm min-h-[480px]">
                  <div>
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Live AI Interview Session</span>
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-full">
                        Candidate: Alex M.
                      </span>
                    </div>

                    {/* Messages Container */}
                    <div className="space-y-4">
                      {/* AI Question */}
                      <div className="flex gap-3 max-w-[85%]">
                        <div className="w-8 h-8 rounded-lg bg-indigo-650 flex items-center justify-center text-white font-bold shrink-0 shadow-md">
                          AI
                        </div>
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl rounded-tl-none p-3.5 text-sm text-slate-700 leading-relaxed shadow-sm">
                          <p className="font-semibold text-slate-900 mb-1">SkilledCore AI Interviewer</p>
                          Let's discuss list rollbacks. If a user deletes an item from a list, how do you recover if the API request fails?
                        </div>
                      </div>

                      {/* Candidate Answer */}
                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.8 }}
                        className="flex gap-3 max-w-[85%] ml-auto justify-end"
                      >
                        <div className="bg-indigo-600 text-white rounded-2xl rounded-tr-none p-3.5 text-sm leading-relaxed shadow-lg shadow-indigo-100/50">
                          <p className="font-semibold text-indigo-100 mb-1">Alex M. (Candidate)</p>
                          I update the local list immediately. Before calling the API, I copy the item. If the request fails, I catch the error, re-insert the copied item to restore the list, and alert the user.
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold shrink-0 border border-indigo-200">
                          A
                        </div>
                      </motion.div>

                      {/* AI Assessment */}
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: demoState >= 1 ? 1 : 0.08, y: 0 }}
                        className="flex gap-3 max-w-[85%]"
                      >
                        <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white font-bold shrink-0 shadow-md">
                          AI
                        </div>
                        <div className="bg-purple-50/50 border border-purple-100 rounded-2xl rounded-tl-none p-3.5 text-sm text-slate-700 leading-relaxed">
                          <div className="flex items-center gap-2 font-bold text-purple-900 mb-1 text-xs">
                            <Sparkles className="w-3.5 h-3.5 text-purple-600 animate-spin" />
                            REAL-TIME EVALUATION
                          </div>
                          <p className="text-xs text-purple-950 font-medium">
                            Candidate demonstrated clear knowledge of state rollbacks, catch blocks, and user feedback logic. Match score: <span className="font-bold text-purple-700">96%</span>.
                          </p>
                        </div>
                      </motion.div>
                    </div>
                  </div>

                  {/* Status Bar */}
                  <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-semibold">
                    <span className="flex items-center gap-1.5"><Code className="w-4 h-4" /> Live sandbox session active</span>
                    <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Automated rubric check complete</span>
                  </div>
                </div>

                {/* Scorecard Panel */}
                <div className="lg:col-span-5 flex flex-col justify-between bg-white border border-slate-200/90 text-slate-800 rounded-2xl p-6 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/40 rounded-full blur-2xl pointer-events-none" />
                  
                  <div>
                    <h3 className="text-lg font-bold mb-1 flex items-center gap-2 text-slate-900">
                      <BarChart3 className="w-5 h-5 text-indigo-600" />
                      Rubric Profile Generated
                    </h3>
                    <p className="text-xs text-slate-450 mb-6 font-semibold">Verified via active sandboxed tests</p>

                    {/* Progress bars */}
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-xs font-bold mb-1.5">
                          <span className="text-slate-700">Technical Aptitude</span>
                          <span className="text-indigo-600">96 / 100</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: "96%" }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-full bg-indigo-600 rounded-full" 
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-bold mb-1.5">
                          <span className="text-slate-700">System Architecture</span>
                          <span className="text-purple-600">92 / 100</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: "92%" }}
                            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                            className="h-full bg-purple-600 rounded-full" 
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-bold mb-1.5">
                          <span className="text-slate-700">Problem Solving Speed</span>
                          <span className="text-emerald-600">88 / 100</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: "88%" }}
                            transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
                            className="h-full bg-emerald-600 rounded-full" 
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 bg-indigo-50/50 border border-indigo-150 rounded-xl p-4 text-xs space-y-2">
                      <p className="font-bold text-indigo-950">AI Evaluation Chain:</p>
                      <ul className="space-y-1.5 text-slate-650 list-disc list-inside font-medium">
                        <li>Candidate successfully resolved logical edge cases</li>
                        <li>Clean, documented coding standards verified</li>
                        <li>Exhibited structured system architecture planning</li>
                      </ul>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100">
                    <button className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all duration-200 shadow-sm flex items-center justify-center gap-2 text-xs cursor-pointer">
                      Export Verified Scorecard <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "search" && (
              <motion.div
                key="search-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.35 }}
                className="space-y-8"
              >
                {/* Search Bar Input */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center gap-3">
                  <div className="flex items-center gap-3 w-full border border-slate-100 rounded-xl px-4 py-3 bg-slate-50">
                    <Search className="w-5 h-5 text-indigo-500 shrink-0" />
                    <div className="text-sm font-semibold text-slate-700 overflow-hidden text-ellipsis whitespace-nowrap">
                      {demoState === 0 && "Find a Senior Next.js fullstack developer who has built highly responsive code sandboxes..."}
                      {demoState === 1 && "Looking for distributed systems builders with strong Redis caching and cluster locks..."}
                      {demoState >= 2 && "Find React engineers with proven record in optimistic UI updates and fast time-to-interact..."}
                    </div>
                  </div>
                  <button className="w-full md:w-auto px-6 py-3.5 bg-indigo-600 text-white font-bold rounded-xl text-xs hover:bg-indigo-700 transition-all duration-200 shadow-md shrink-0 flex items-center justify-center gap-2 cursor-pointer">
                    <Sparkles className="w-4 h-4" />
                    AI Search
                  </button>
                </div>

                {/* AI Reasoning and Results */}
                <div className="grid lg:grid-cols-12 gap-8 items-stretch">
                  {/* Left Column: AI Reasoning Chain */}
                  <div className="lg:col-span-4 bg-white border border-slate-200/90 text-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 font-bold text-indigo-600 text-xs uppercase tracking-wider mb-6">
                        <Cpu className="w-4 h-4 text-indigo-600 animate-spin" />
                        AI Sourcing Engine
                      </div>

                      <div className="space-y-4">
                        <div className="flex gap-2.5">
                          <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-bold text-slate-800">Search Parameter Analysis</p>
                            <p className="text-[11px] text-slate-500 font-medium">Identified Next.js, sandboxes, frontend.</p>
                          </div>
                        </div>

                        <div className="flex gap-2.5">
                          <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-bold text-slate-800">Scanning Candidate Profiles</p>
                            <p className="text-[11px] text-slate-500 font-medium">Verified completed automated sandbox suites.</p>
                          </div>
                        </div>

                        <div className="flex gap-2.5">
                          <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-bold text-slate-800">Employer Privacy Shield</p>
                            <p className="text-[11px] text-slate-500 font-medium">Active screening protocol. Fully secure.</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 bg-indigo-50/50 border border-indigo-150 rounded-xl p-4 text-xs">
                      <div className="flex items-center justify-between text-indigo-950 font-bold mb-1">
                        <span>Target Match Pool</span>
                        <span>3 Candidates</span>
                      </div>
                      <p className="text-[11px] text-slate-600 font-medium">Matching with average execution score &gt; 92%</p>
                    </div>
                  </div>

                  {/* Right Column: Matched Candidate Cards */}
                  <div className="lg:col-span-8 space-y-4">
                    {/* Candidate 1 */}
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:border-indigo-400 transition-all duration-350 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="max-w-[70%]">
                        <div className="flex items-center gap-2.5 mb-1.5">
                          <h4 className="font-bold text-slate-900">Sarah J.</h4>
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-black rounded">
                            98% Match
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mb-3 font-semibold">5+ Yrs Exp • Senior React / Next.js Architect</p>
                        <p className="text-xs text-slate-600 leading-relaxed font-medium">
                          <span className="font-bold text-slate-800">AI Synthesized Reasoning:</span> Sarah completed our advanced algorithmic screening in 14 minutes with a perfect score. High logic planning and zero redundancy detected.
                        </p>
                      </div>
                      <button className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-xs hover:bg-indigo-750 transition-all duration-200 whitespace-nowrap self-start md:self-center shadow-sm cursor-pointer">
                        Request Profile
                      </button>
                    </div>

                    {/* Candidate 2 */}
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:border-indigo-350 transition-all duration-350 flex flex-col md:flex-row md:items-center justify-between gap-4 opacity-85">
                      <div className="max-w-[70%]">
                        <div className="flex items-center gap-2.5 mb-1.5">
                          <h4 className="font-bold text-slate-900">David K.</h4>
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-black rounded">
                            94% Match
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mb-3 font-semibold">3 Yrs Exp • Fullstack Engineer</p>
                        <p className="text-xs text-slate-600 leading-relaxed font-medium">
                          <span className="font-bold text-slate-800">AI Synthesized Reasoning:</span> David demonstrated high capability in concurrency control sandboxes. Caching layer optimization score: 95%.
                        </p>
                      </div>
                      <button className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-xs hover:bg-indigo-750 transition-all duration-200 whitespace-nowrap self-start md:self-center shadow-sm cursor-pointer">
                        Request Profile
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "ats" && (
              <motion.div
                key="ats-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.35 }}
                className="space-y-8"
              >
                {/* Kanban Headers & Toggle */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <div>
                    <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
                      <Layers className="w-5 h-5 text-indigo-500" />
                      AI Applicant Pipeline Tracking
                    </h3>
                    <p className="text-xs text-slate-400 font-semibold mt-0.5">Automated screening & custom rubrics categorization</p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-bold text-slate-500">AI Active Smart-Sorting</span>
                    <button className="px-3.5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-150 hover:bg-indigo-700 transition-all cursor-pointer">
                      Trigger Smart Sort
                    </button>
                  </div>
                </div>

                {/* Kanban Board columns */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Applied */}
                  <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 mb-4">
                      <span className="text-xs font-bold text-slate-600">Applied (3)</span>
                      <span className="w-2 h-2 rounded-full bg-slate-400" />
                    </div>
                    <div className="space-y-3">
                      <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-xs">
                        <p className="text-xs font-bold text-slate-900">Aris V.</p>
                        <p className="text-[10px] text-slate-400 mb-2 font-semibold">Systems Dev • 4Y Exp</p>
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded font-medium">Pending Sandbox</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* AI Screened */}
                  <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 mb-4">
                      <span className="text-xs font-bold text-slate-600">AI Screened (2)</span>
                      <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    </div>
                    <div className="space-y-3">
                      <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-xs">
                        <p className="text-xs font-bold text-slate-900">Ray L.</p>
                        <p className="text-[10px] text-slate-400 mb-2 font-semibold">Frontend Eng • 3Y Exp</p>
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] px-1.5 py-0.5 bg-indigo-50 text-indigo-700 font-bold rounded">AI Screen Pass</span>
                          <span className="text-[10px] font-bold text-indigo-600">88% Match</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sandbox Verified */}
                  <div className="bg-indigo-50/40 border border-indigo-150 rounded-2xl p-4">
                    <div className="flex items-center justify-between pb-3 border-b border-indigo-100 mb-4">
                      <span className="text-xs font-bold text-indigo-750">Sandbox Verified (2)</span>
                      <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                    </div>
                    <div className="space-y-3">
                      <motion.div 
                        whileHover={{ scale: 1.02 }}
                        className="bg-white border-2 border-indigo-500/80 p-3.5 rounded-xl shadow-md cursor-pointer"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-black text-slate-900">Sarah J.</p>
                          <CheckCircle2 className="w-4.5 h-4.5 text-indigo-600" />
                        </div>
                        <p className="text-[10px] text-slate-400 mb-2.5 font-semibold">Next.js Lead • 5Y Exp</p>
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 font-black rounded border border-emerald-100">
                            Verified Master (98)
                          </span>
                          <span className="font-bold text-indigo-600">Fast Track</span>
                        </div>
                      </motion.div>
                    </div>
                  </div>

                  {/* Offer Stage */}
                  <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 mb-4">
                      <span className="text-xs font-bold text-slate-600">Offer Stage (1)</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    </div>
                    <div className="space-y-3">
                      <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-xs">
                        <p className="text-xs font-bold text-slate-900">Elena R.</p>
                        <p className="text-[10px] text-slate-400 mb-2 font-semibold">Backend Eng • 6Y Exp</p>
                        <div className="flex justify-between items-center text-[9px]">
                          <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded">Negotiations</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "sandbox" && (
              <motion.div
                key="sandbox-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.35 }}
                className="grid lg:grid-cols-12 gap-8 items-stretch"
              >
                {/* Terminal Panel */}
                <div className="lg:col-span-8 flex flex-col justify-between bg-slate-50 text-slate-850 font-mono rounded-2xl p-6 shadow-sm border border-slate-200 min-h-[480px]">
                  <div>
                    <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-400" />
                        <div className="w-3 h-3 rounded-full bg-yellow-400" />
                        <div className="w-3 h-3 rounded-full bg-green-400" />
                        <span className="text-[11px] text-slate-650 ml-2 font-bold">verification-runner v2.4.0</span>
                      </div>
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-150">
                        status: active_sourcing
                      </span>
                    </div>

                    {/* Console log outputs */}
                    <div className="space-y-2 text-xs leading-relaxed">
                      <p className="text-indigo-700 font-bold">$ run-verification-suite --profile=candidate</p>
                      <p className="text-slate-600 font-medium">&gt; skilledcore-verification-suite@1.0.0 start</p>
                      <p className="text-slate-650 font-medium">&gt; running automated skill checks...</p>
                      
                      <div className="pl-4 mt-2 space-y-1.5 font-bold">
                        <p className="text-emerald-700 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          ✓ test_1: Technical logic validation (12ms)
                        </p>
                        <p className="text-emerald-700 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          ✓ test_2: Structured code standards check (8ms)
                        </p>
                        <p className="text-emerald-700 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          ✓ test_3: Algorithmic time-complexity rating (14ms)
                        </p>
                      </div>

                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: demoState >= 1 ? 1 : 0.05 }}
                        className="mt-4 border-t border-slate-200 pt-3 text-[11px] text-slate-600 space-y-1"
                      >
                        <p className="text-indigo-700 font-bold">{" >> SYSTEM SKILL VERIFICATION COMPLETED"}</p>
                        <p className="font-medium text-slate-700">Code Quality Rating: High (10/10 verified standard)</p>
                        <p className="font-medium text-slate-700">Overall Score: 98/100 verified execution</p>
                      </motion.div>
                    </div>
                  </div>

                  <div className="mt-8 pt-4 border-t border-slate-200 text-xs text-slate-600 flex justify-between items-center font-bold">
                    <span>Secure Sandbox Environment</span>
                    <span className="text-indigo-650">Verification: Completed</span>
                  </div>
                </div>

                {/* Metric Summary Panel */}
                <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="font-black text-slate-900 text-base mb-1 flex items-center gap-2">
                      <UserCheck className="w-5 h-5 text-indigo-600" />
                      Verification Badge
                    </h3>
                    <p className="text-xs text-slate-400 font-semibold mb-6">Earned public verified status on SkilledCore</p>

                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-6 text-center">
                      <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold mx-auto mb-3 shadow-md">
                        SC
                      </div>
                      <h4 className="font-bold text-indigo-900 text-xs uppercase tracking-wider mb-0.5">Verified System Builder</h4>
                      <p className="text-[10px] text-indigo-650 font-semibold">React & Frontend Optimization</p>
                    </div>

                    <div className="space-y-3.5 text-xs text-slate-600">
                      <div className="flex justify-between pb-2.5 border-b border-slate-100">
                        <span className="font-semibold text-slate-700">Completion Time</span>
                        <span className="font-bold text-slate-900">14m 32s</span>
                      </div>
                      <div className="flex justify-between pb-2.5 border-b border-slate-100">
                        <span className="font-semibold text-slate-700">Global Percentile</span>
                        <span className="font-bold text-emerald-600">Top 2.4%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold text-slate-700">Code Quality Badge</span>
                        <span className="font-bold text-slate-900">Level 3</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-4 border-t border-slate-100">
                    <button className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl text-xs hover:bg-indigo-700 transition-all duration-200 shadow-md cursor-pointer">
                      Share Verified Trace Profile
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </section>
  );
}
