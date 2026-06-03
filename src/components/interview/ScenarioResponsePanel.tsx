'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ScenarioResponsePanelProps {
  category: string;
  competencies: string[];
  tools: string[];
}

const DEFAULT_SCENARIOS: Record<string, { title: string; prompt: string }> = {
  'Product Management': {
    title: 'Feature Prioritization & Launch Strategy',
    prompt: 'Your engineering team is split between launching a high-demand analytics feature or addressing a large backlog of technical debt. Outline how you would prioritize these, align stakeholders, and measure success.'
  },
  'UX/UI Design & Research': {
    title: 'User Onboarding Drop-off Critique',
    prompt: 'Our product analytics show a 45% drop-off at the signup page. Draft an immediate UX intervention plan, including user research methods and success metrics.'
  },
  'Marketing & Growth': {
    title: 'Growth Campaign Strategy & Budgeting',
    prompt: 'Design a launch campaign for SkilledCore\'s new developer tools with a $15,000 budget. Outline target channels, messaging strategy, and key metrics.'
  },
  'Social Media & Community': {
    title: 'Crisis Management & Brand Engagement',
    prompt: 'A post about platform downtime is gaining viral negative traction. Draft a crisis communication response and a strategy to rebuild community trust.'
  },
  'Sales & Business Development': {
    title: 'Enterprise Pitch & Pipeline Strategy',
    prompt: 'Outline your sales strategy to pitch SkilledCore to a tech enterprise with 500+ developers, detailing your discovery questions and handling pricing objections.'
  },
  'Finance & Accounting': {
    title: 'Revenue Leakage & Audit Plan',
    prompt: 'A discrepancies audit reveals unresolved billing anomalies. Design a reconciliation plan and standard operating procedures to prevent future leakage.'
  },
  'Human Resources & People Operations': {
    title: 'Scaling Tech Culture & Onboarding',
    prompt: 'Create a scalable remote employee onboarding framework that preserves company culture and accelerates developer time-to-first-commit.'
  },
  'Customer Success & Support': {
    title: 'Enterprise Account Renewal Playbook',
    prompt: 'A major enterprise customer is showing declining product usage ahead of renewal. Outline your success playbook to re-engage them and secure renewal.'
  },
  'Content & Copywriting': {
    title: 'Editorial Strategy & SEO Copy',
    prompt: 'Draft a content marketing campaign plan to drive organic signups. Detail the content pillars, SEO strategy, and write a sample opening paragraph.'
  },
  'Operations & Project Management': {
    title: 'Operational Bottleneck Elimination',
    prompt: 'A cross-functional product release is delayed due to communication gaps. Design a project recovery framework to get the launch back on track.'
  },
  'Legal & Compliance': {
    title: 'Data Privacy Regulation Alignment',
    prompt: 'Draft an compliance response plan for aligning our developer telemetry systems with strict regional data processing directives.'
  },
  'Healthcare & Clinical': {
    title: 'Clinical Telehealth Platform Onboarding',
    prompt: 'Design a compliance and user training strategy for doctors adopting a new digital health recording system.'
  },
  'Research & Science': {
    title: 'Research Methodology & Grant Application',
    prompt: 'Outline a scientific research methodology for evaluating the impact of sandboxed dev environments on developer performance.'
  },
  'Education & Training': {
    title: 'Technical Curriculum Design Plan',
    prompt: 'Design a syllabus structure for a 4-week coding bootcamp module on prompt engineering and LLM integrations.'
  },
  'Creative & Media Production': {
    title: 'Brand Identity Design System Spec',
    prompt: 'Develop a creative brief for refreshing the platform\'s video and graphic identity, outlining visual assets, tone guide, and delivery timeline.'
  },
  'General Business & Administration': {
    title: 'Standard Operating Procedure Optimization',
    prompt: 'Analyze a complex administrative workflow (like billing approvals) and design an optimized, automated SOP to reduce processing delays.'
  }
};

export function ScenarioResponsePanel({ category, competencies, tools }: ScenarioResponsePanelProps) {
  const [response, setResponse] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const scenario = DEFAULT_SCENARIOS[category] || DEFAULT_SCENARIOS['General Business & Administration'];

  const handleSubmit = () => {
    if (!response.trim() || response.length < 50) {
      toast.error('Response too short. Please provide a detailed response (at least 50 characters).');
      return;
    }
    setIsSubmitted(true);
    toast.success('Scenario response submitted successfully!');
  };

  return (
    <div className="flex flex-col bg-bg-card border border-border-default rounded-2xl h-full p-6 text-text-body space-y-6 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-text-brand">
          Scenario Challenge
        </span>
        <h3 className="text-base font-bold text-text-heading">
          {scenario.title}
        </h3>
      </div>

      {/* Description */}
      <div className="bg-bg-secondary-panel border border-border-default rounded-xl p-4 space-y-3">
        <p className="text-xs text-text-secondary leading-relaxed">
          {scenario.prompt}
        </p>

        {/* Competencies & Tools tags */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-border-subtle/50">
          {competencies.map((comp, idx) => (
            <span key={idx} className="px-2 py-0.5 rounded bg-sc-purple-50 border border-sc-purple-200 text-[10px] font-bold text-sc-purple-700">
              {comp}
            </span>
          ))}
          {tools.map((tool, idx) => (
            <span key={idx} className="px-2 py-0.5 rounded bg-sc-gray-100 border border-border-default text-[10px] font-bold text-text-body">
              {tool}
            </span>
          ))}
        </div>
      </div>

      {/* Textarea */}
      <div className="flex-1 flex flex-col min-h-[220px] relative">
        {isSubmitted ? (
          <div className="flex-1 border border-border-success/30 bg-bg-success rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-text-success" />
            <h4 className="text-sm font-bold text-text-success">Response Submitted</h4>
            <p className="text-xs text-text-secondary max-w-sm leading-relaxed">
              Your response has been saved and will be analyzed by the interviewer to evaluate your domain expertise.
            </p>
          </div>
        ) : (
          <>
            <textarea
              className="flex-1 w-full bg-bg-input border border-border-input rounded-xl p-4 text-xs text-text-body placeholder:text-text-placeholder focus:border-border-focus focus:outline-none resize-none leading-relaxed transition-all"
              placeholder="Write your approach here. Be specific about what you would do, what tools you would use, and how you would measure success..."
              value={response}
              onChange={(e) => setResponse(e.target.value)}
            />
            {/* Character count & Submit button container */}
            <div className="flex items-center justify-between mt-3 shrink-0">
              <span className="text-[10px] text-text-secondary">
                {response.length} characters
              </span>
              <Button
                onClick={handleSubmit}
                disabled={!response.trim() || response.length < 50}
                className="bg-btn-primary-bg hover:bg-btn-primary-bg-hover text-white px-5 py-2 h-9 text-xs font-bold rounded-lg border-none shadow-md shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Response
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
