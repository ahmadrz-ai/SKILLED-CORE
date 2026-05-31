'use client';

import { useState, useEffect } from 'react';
import {
  Sparkles,
  Pencil,
  Plus,
  Trash2,
  Download,
  X,
  FileText,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { getProfileForResume } from '@/app/actions/resumeExport';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SocialLink {
  label: string;
  url: string;
}

interface JobEntry {
  title: string;
  company: string;
  location?: string;
  startDate: string;
  endDate: string;
  bullets: string[];
}

interface EduEntry {
  degree: string;
  institution: string;
  location?: string;
  startYear: string;
  endYear: string;
  honors?: string;
}

interface ProjectEntry {
  name: string;
  description: string;
  technologies: string[];
  url?: string;
}

interface GeneratedResume {
  name: string;
  headline: string;
  location: string;
  email: string;
  phone: string;
  summary: string;
  socials: SocialLink[];
  experience: JobEntry[];
  education: EduEntry[];
  skills: string[];
  projects: ProjectEntry[];
  aiInterviewScore: string | null;
  verifiedBadges: string[];
}

interface ResumeExportModalProps {
  onClose: () => void;
}

export default function ResumeExportModal({ onClose }: ResumeExportModalProps) {
  const [resumeData, setResumeData] = useState<GeneratedResume | null>(null);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [includeAIInterview, setIncludeAIInterview] = useState(true);
  
  // State for adding skills
  const [newSkill, setNewSkill] = useState('');
  
  // Backups of badge items inclusion
  const [includedBadges, setIncludedBadges] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function initResume() {
      try {
        setIsGenerating(true);
        // 1. Fetch raw profile data
        const rawProfile = await getProfileForResume();

        // 2. Feed to Llama-4 Maverick route
        const response = await fetch('/api/resume-export/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(rawProfile),
        });

        if (!response.ok) {
          throw new Error('AI Content generation failed');
        }

        const data = await response.json();
        setResumeData(data);

        // Pre-populate badges inclusion map
        if (data.verifiedBadges) {
          const map: Record<string, boolean> = {};
          data.verifiedBadges.forEach((b: string) => {
            map[b] = true;
          });
          setIncludedBadges(map);
        }
      } catch (error: any) {
        console.error('Failed to generate resume content:', error);
        toast.error('Failed to generate professional resume content.');
        onClose();
      } finally {
        setIsGenerating(false);
      }
    }
    initResume();
  }, [onClose]);

  if (isGenerating) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-bg-modal border border-border-modal rounded-2xl p-8 max-w-md w-full flex flex-col items-center justify-center gap-5 shadow-modal text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-full bg-sc-purple-50 flex items-center justify-center animate-pulse">
            <Sparkles className="w-8 h-8 text-sc-purple-600" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-text-heading">Generating your resume...</h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              Llama-4 AI is parsing and optimizing your profile data. This takes 10–15 seconds.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!resumeData) return null;

  // Handle section edits
  const handleUpdateField = (field: keyof GeneratedResume, value: any) => {
    setResumeData((prev) => {
      if (!prev) return null;
      return { ...prev, [field]: value };
    });
  };

  const handleUpdateSocial = (index: number, key: keyof SocialLink, value: string) => {
    const updated = [...resumeData.socials];
    updated[index] = { ...updated[index], [key]: value };
    handleUpdateField('socials', updated);
  };

  const handleAddSocial = () => {
    const updated = [...resumeData.socials, { label: 'LinkedIn', url: '' }];
    handleUpdateField('socials', updated);
  };

  const handleRemoveSocial = (index: number) => {
    const updated = resumeData.socials.filter((_, i) => i !== index);
    handleUpdateField('socials', updated);
  };

  const handleUpdateJob = (index: number, key: keyof JobEntry, value: any) => {
    const updated = [...resumeData.experience];
    updated[index] = { ...updated[index], [key]: value };
    handleUpdateField('experience', updated);
  };

  const handleAddJob = () => {
    const updated = [
      ...resumeData.experience,
      {
        title: 'New Position',
        company: 'New Company',
        startDate: 'Month Year',
        endDate: 'Present',
        bullets: ['Accomplished milestone 1'],
      },
    ];
    handleUpdateField('experience', updated);
  };

  const handleRemoveJob = (index: number) => {
    const updated = resumeData.experience.filter((_, i) => i !== index);
    handleUpdateField('experience', updated);
  };

  const handleUpdateEdu = (index: number, key: keyof EduEntry, value: any) => {
    const updated = [...resumeData.education];
    updated[index] = { ...updated[index], [key]: value };
    handleUpdateField('education', updated);
  };

  const handleAddEdu = () => {
    const updated = [
      ...resumeData.education,
      {
        degree: "Bachelor's Degree",
        institution: 'Institution Name',
        startYear: '2020',
        endYear: '2024',
      },
    ];
    handleUpdateField('education', updated);
  };

  const handleRemoveEdu = (index: number) => {
    const updated = resumeData.education.filter((_, i) => i !== index);
    handleUpdateField('education', updated);
  };

  const handleUpdateProject = (index: number, key: keyof ProjectEntry, value: any) => {
    const updated = [...resumeData.projects];
    updated[index] = { ...updated[index], [key]: value };
    handleUpdateField('projects', updated);
  };

  const handleAddProject = () => {
    const updated = [
      ...resumeData.projects,
      {
        name: 'New Project',
        description: 'Describe the engineering challenge and outcome.',
        technologies: ['React'],
      },
    ];
    handleUpdateField('projects', updated);
  };

  const handleRemoveProject = (index: number) => {
    const updated = resumeData.projects.filter((_, i) => i !== index);
    handleUpdateField('projects', updated);
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      // Filter out disabled parts
      const payload = {
        ...resumeData,
        aiInterviewScore: includeAIInterview ? resumeData.aiInterviewScore : null,
        verifiedBadges: resumeData.verifiedBadges.filter((b) => includedBadges[b]),
      };

      const response = await fetch('/api/resume-export/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resumeData: payload }),
      });

      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${resumeData.name.replace(/\s+/g, '_')}_SkilledCore_Resume.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Resume downloaded successfully.');
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to generate PDF download.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-bg-modal border border-border-modal rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-modal animate-in zoom-in-95 duration-200">
        
        {/* Modal Sticky Header */}
        <header className="sticky top-0 px-6 py-4 bg-bg-modal border-b border-border-subtle rounded-t-2xl flex items-start justify-between z-10">
          <div className="flex gap-3 items-center">
            <div className="w-9 h-9 rounded-lg bg-sc-purple-50 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-sc-purple-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-heading">Your AI-Generated Resume</h3>
              <p className="text-xs text-text-secondary">Review and customize before downloading.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-bg-sidebar-hover text-text-secondary hover:text-text-heading transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        {/* Scrollable Modal Body */}
        <main className="flex-1 overflow-y-auto px-6 py-5 space-y-5 bg-bg-modal">
          
          {/* SECTION 1 — Header / Contact */}
          <div className="relative bg-bg-secondary-panel rounded-xl p-4 border border-border-subtle">
            <button
              onClick={() => setEditingSection(editingSection === 'contact' ? null : 'contact')}
              className="absolute top-3 right-3 w-7 h-7 rounded-md flex items-center justify-center text-text-tertiary hover:text-sc-purple-600 hover:bg-sc-purple-50 transition-colors"
              title="Edit Contact details"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-3">
              Contact Details
            </p>

            {editingSection !== 'contact' ? (
              <div className="space-y-1.5">
                <h4 className="text-base font-bold text-text-heading">{resumeData.name}</h4>
                <p className="text-sm font-medium text-sc-purple-600">{resumeData.headline}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-secondary mt-1">
                  {resumeData.location && <span>📍 {resumeData.location}</span>}
                  {resumeData.email && <span>✉ {resumeData.email}</span>}
                  {resumeData.phone && <span>📞 {resumeData.phone}</span>}
                </div>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[10px] font-bold text-text-secondary uppercase">Full Name</Label>
                    <Input value={resumeData.name} onChange={(e) => handleUpdateField('name', e.target.value)} className="h-9 mt-1 bg-bg-input" />
                  </div>
                  <div>
                    <Label className="text-[10px] font-bold text-text-secondary uppercase">Professional Title</Label>
                    <Input value={resumeData.headline} onChange={(e) => handleUpdateField('headline', e.target.value)} className="h-9 mt-1 bg-bg-input" />
                  </div>
                  <div>
                    <Label className="text-[10px] font-bold text-text-secondary uppercase">Location</Label>
                    <Input value={resumeData.location} onChange={(e) => handleUpdateField('location', e.target.value)} className="h-9 mt-1 bg-bg-input" />
                  </div>
                  <div>
                    <Label className="text-[10px] font-bold text-text-secondary uppercase">Email Address</Label>
                    <Input value={resumeData.email} onChange={(e) => handleUpdateField('email', e.target.value)} className="h-9 mt-1 bg-bg-input" />
                  </div>
                  <div>
                    <Label className="text-[10px] font-bold text-text-secondary uppercase">Phone Number</Label>
                    <Input value={resumeData.phone} onChange={(e) => handleUpdateField('phone', e.target.value)} className="h-9 mt-1 bg-bg-input" />
                  </div>
                </div>
                <button onClick={() => setEditingSection(null)} className="self-end text-xs font-semibold text-sc-purple-600 hover:underline">
                  Done editing
                </button>
              </div>
            )}
          </div>

          {/* SECTION 2 — Professional Summary */}
          <div className="relative bg-bg-secondary-panel rounded-xl p-4 border border-border-subtle">
            <button
              onClick={() => setEditingSection(editingSection === 'summary' ? null : 'summary')}
              className="absolute top-3 right-3 w-7 h-7 rounded-md flex items-center justify-center text-text-tertiary hover:text-sc-purple-600 hover:bg-sc-purple-50 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-3">
              Professional Summary
            </p>

            {editingSection !== 'summary' ? (
              <p className="text-sm text-text-body leading-relaxed">{resumeData.summary}</p>
            ) : (
              <div className="space-y-3">
                <textarea
                  value={resumeData.summary}
                  onChange={(e) => handleUpdateField('summary', e.target.value)}
                  className="w-full bg-bg-input border border-border-default rounded-xl p-3 text-sm text-text-body focus:outline-none focus:ring-1 focus:ring-sc-purple-600 min-h-[90px]"
                />
                <button onClick={() => setEditingSection(null)} className="self-end text-xs font-semibold text-sc-purple-600 hover:underline block">
                  Done editing
                </button>
              </div>
            )}
          </div>

          {/* SECTION 3 — Social Links */}
          <div className="relative bg-bg-secondary-panel rounded-xl p-4 border border-border-subtle">
            <button
              onClick={() => setEditingSection(editingSection === 'socials' ? null : 'socials')}
              className="absolute top-3 right-3 w-7 h-7 rounded-md flex items-center justify-center text-text-tertiary hover:text-sc-purple-600 hover:bg-sc-purple-50 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-3">
              Social Profiles
            </p>

            {editingSection !== 'socials' ? (
              <div className="flex flex-wrap gap-2">
                {resumeData.socials?.map((social, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1.5 bg-sc-purple-50 text-sc-purple-700 border border-sc-purple-200 px-2.5 py-1 rounded-md text-xs font-semibold"
                  >
                    <FileText className="w-3 h-3" />
                    {social.label}: {social.url}
                  </span>
                ))}
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                {resumeData.socials?.map((social, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Input
                      value={social.label}
                      onChange={(e) => handleUpdateSocial(index, 'label', e.target.value)}
                      placeholder="Label (e.g. GitHub)"
                      className="h-9 w-28 bg-bg-input"
                    />
                    <Input
                      value={social.url}
                      onChange={(e) => handleUpdateSocial(index, 'url', e.target.value)}
                      placeholder="URL path"
                      className="h-9 flex-1 bg-bg-input"
                    />
                    <button
                      onClick={() => handleRemoveSocial(index)}
                      className="text-text-error hover:bg-sc-red-50 p-2 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <div className="flex justify-between items-center mt-2">
                  <Button variant="outline" size="sm" onClick={handleAddSocial} className="h-8 text-xs flex gap-1 items-center">
                    <Plus className="w-3.5 h-3.5" /> Add Link
                  </Button>
                  <button onClick={() => setEditingSection(null)} className="text-xs font-semibold text-sc-purple-600 hover:underline">
                    Done editing
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 4 — Experience */}
          <div className="relative bg-bg-secondary-panel rounded-xl p-4 border border-border-subtle">
            <button
              onClick={() => setEditingSection(editingSection === 'experience' ? null : 'experience')}
              className="absolute top-3 right-3 w-7 h-7 rounded-md flex items-center justify-center text-text-tertiary hover:text-sc-purple-600 hover:bg-sc-purple-50 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-3">
              Professional Experience
            </p>

            {editingSection !== 'experience' ? (
              <div className="space-y-4">
                {resumeData.experience.map((job, idx) => (
                  <div key={idx} className="border-b border-border-subtle/70 pb-3 last:border-b-0 last:pb-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="font-semibold text-sm text-text-heading">{job.company}</h5>
                        <p className="text-xs text-sc-purple-600 italic mt-0.5">{job.title}</p>
                      </div>
                      <span className="text-xs font-medium text-text-secondary">{job.startDate} – {job.endDate}</span>
                    </div>
                    <ul className="list-disc list-inside text-xs text-text-secondary mt-2 space-y-1 pl-1">
                      {job.bullets?.map((b, bIdx) => (
                        <li key={bIdx} className="leading-relaxed">{b}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-5 pt-2">
                {resumeData.experience.map((job, idx) => (
                  <div key={idx} className="border border-border-default rounded-xl p-3.5 space-y-3 bg-bg-card relative">
                    <button
                      onClick={() => handleRemoveJob(idx)}
                      className="absolute top-2.5 right-2.5 text-text-error hover:bg-sc-red-50 p-1.5 rounded-lg"
                      title="Remove experience entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-8">
                      <div>
                        <Label className="text-[10px] font-bold uppercase">Company</Label>
                        <Input value={job.company} onChange={(e) => handleUpdateJob(idx, 'company', e.target.value)} className="h-8 mt-1 bg-bg-input" />
                      </div>
                      <div>
                        <Label className="text-[10px] font-bold uppercase">Role Title</Label>
                        <Input value={job.title} onChange={(e) => handleUpdateJob(idx, 'title', e.target.value)} className="h-8 mt-1 bg-bg-input" />
                      </div>
                      <div>
                        <Label className="text-[10px] font-bold uppercase">Start Date</Label>
                        <Input value={job.startDate} onChange={(e) => handleUpdateJob(idx, 'startDate', e.target.value)} className="h-8 mt-1 bg-bg-input" />
                      </div>
                      <div>
                        <Label className="text-[10px] font-bold uppercase">End Date</Label>
                        <Input value={job.endDate} onChange={(e) => handleUpdateJob(idx, 'endDate', e.target.value)} className="h-8 mt-1 bg-bg-input" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase">Achievement Bullet Points (one per line)</Label>
                      <textarea
                        value={job.bullets?.join('\n') || ''}
                        onChange={(e) => handleUpdateJob(idx, 'bullets', e.target.value.split('\n'))}
                        className="w-full bg-bg-input border border-border-default rounded-lg p-2 text-xs focus:outline-none min-h-[70px] leading-relaxed"
                        placeholder="Bullet 1&#10;Bullet 2"
                      />
                    </div>
                  </div>
                ))}
                
                <div className="flex justify-between items-center mt-2">
                  <Button variant="outline" size="sm" onClick={handleAddJob} className="h-8 text-xs flex gap-1 items-center">
                    <Plus className="w-3.5 h-3.5" /> Add Experience
                  </Button>
                  <button onClick={() => setEditingSection(null)} className="text-xs font-semibold text-sc-purple-600 hover:underline">
                    Done editing
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 5 — Education */}
          <div className="relative bg-bg-secondary-panel rounded-xl p-4 border border-border-subtle">
            <button
              onClick={() => setEditingSection(editingSection === 'education' ? null : 'education')}
              className="absolute top-3 right-3 w-7 h-7 rounded-md flex items-center justify-center text-text-tertiary hover:text-sc-purple-600 hover:bg-sc-purple-50 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-3">
              Education
            </p>

            {editingSection !== 'education' ? (
              <div className="space-y-3">
                {resumeData.education.map((edu, idx) => (
                  <div key={idx} className="flex justify-between items-start text-xs text-text-secondary leading-relaxed">
                    <div>
                      <h5 className="font-semibold text-sm text-text-heading">{edu.institution}</h5>
                      <p className="text-xs text-sc-purple-600 mt-0.5">{edu.degree}{edu.honors ? ` (${edu.honors})` : ''}</p>
                    </div>
                    <span className="font-medium">{edu.startYear} – {edu.endYear}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                {resumeData.education.map((edu, idx) => (
                  <div key={idx} className="border border-border-default rounded-xl p-3.5 space-y-3 bg-bg-card relative">
                    <button
                      onClick={() => handleRemoveEdu(idx)}
                      className="absolute top-2.5 right-2.5 text-text-error hover:bg-sc-red-50 p-1.5 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-8">
                      <div>
                        <Label className="text-[10px] font-bold uppercase">Institution</Label>
                        <Input value={edu.institution} onChange={(e) => handleUpdateEdu(idx, 'institution', e.target.value)} className="h-8 mt-1 bg-bg-input" />
                      </div>
                      <div>
                        <Label className="text-[10px] font-bold uppercase">Degree / Course</Label>
                        <Input value={edu.degree} onChange={(e) => handleUpdateEdu(idx, 'degree', e.target.value)} className="h-8 mt-1 bg-bg-input" />
                      </div>
                      <div>
                        <Label className="text-[10px] font-bold uppercase">Start Year</Label>
                        <Input value={edu.startYear} onChange={(e) => handleUpdateEdu(idx, 'startYear', e.target.value)} className="h-8 mt-1 bg-bg-input" />
                      </div>
                      <div>
                        <Label className="text-[10px] font-bold uppercase">End / Graduation Year</Label>
                        <Input value={edu.endYear} onChange={(e) => handleUpdateEdu(idx, 'endYear', e.target.value)} className="h-8 mt-1 bg-bg-input" />
                      </div>
                      <div className="sm:col-span-2">
                        <Label className="text-[10px] font-bold uppercase">GPA / Distinction Honors</Label>
                        <Input value={edu.honors || ''} onChange={(e) => handleUpdateEdu(idx, 'honors', e.target.value)} className="h-8 mt-1 bg-bg-input" />
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="flex justify-between items-center mt-2">
                  <Button variant="outline" size="sm" onClick={handleAddEdu} className="h-8 text-xs flex gap-1 items-center">
                    <Plus className="w-3.5 h-3.5" /> Add Education
                  </Button>
                  <button onClick={() => setEditingSection(null)} className="text-xs font-semibold text-sc-purple-600 hover:underline">
                    Done editing
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 6 — Skills */}
          <div className="relative bg-bg-secondary-panel rounded-xl p-4 border border-border-subtle">
            <button
              onClick={() => setEditingSection(editingSection === 'skills' ? null : 'skills')}
              className="absolute top-3 right-3 w-7 h-7 rounded-md flex items-center justify-center text-text-tertiary hover:text-sc-purple-600 hover:bg-sc-purple-50 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-3">
              Core Skills
            </p>

            {editingSection !== 'skills' ? (
              <div className="flex flex-wrap gap-1.5">
                {resumeData.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex px-2.5 py-1 bg-sc-purple-50 text-sc-purple-700 border border-sc-purple-200 rounded-md text-xs font-semibold"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <div className="space-y-3 pt-1">
                <div className="flex flex-wrap gap-2 p-3 bg-bg-card border border-border-default rounded-xl min-h-[60px]">
                  {resumeData.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-sc-purple-50 text-sc-purple-700 border border-sc-purple-200 rounded-md text-xs font-semibold"
                    >
                      {skill}
                      <button
                        onClick={() => {
                          const updated = resumeData.skills.filter((_, i) => i !== idx);
                          handleUpdateField('skills', updated);
                        }}
                        className="text-sc-purple-400 hover:text-sc-purple-700 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Input
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newSkill.trim()) {
                        e.preventDefault();
                        if (!resumeData.skills.includes(newSkill.trim())) {
                          handleUpdateField('skills', [...resumeData.skills, newSkill.trim()]);
                        }
                        setNewSkill('');
                      }
                    }}
                    placeholder="Type skill and press Enter to add"
                    className="h-9 bg-bg-input"
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      if (newSkill.trim() && !resumeData.skills.includes(newSkill.trim())) {
                        handleUpdateField('skills', [...resumeData.skills, newSkill.trim()]);
                        setNewSkill('');
                      }
                    }}
                    className="bg-sc-purple-600 hover:bg-sc-purple-700 text-white font-bold text-xs"
                  >
                    Add
                  </Button>
                </div>
                
                <div className="flex justify-end">
                  <button onClick={() => setEditingSection(null)} className="text-xs font-semibold text-sc-purple-600 hover:underline">
                    Done editing
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 7 — Projects */}
          <div className="relative bg-bg-secondary-panel rounded-xl p-4 border border-border-subtle">
            <button
              onClick={() => setEditingSection(editingSection === 'projects' ? null : 'projects')}
              className="absolute top-3 right-3 w-7 h-7 rounded-md flex items-center justify-center text-text-tertiary hover:text-sc-purple-600 hover:bg-sc-purple-50 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-3">
              Projects & Portfolios
            </p>

            {editingSection !== 'projects' ? (
              <div className="space-y-4">
                {resumeData.projects.map((project, idx) => (
                  <div key={idx} className="border-b border-border-subtle/70 pb-3 last:border-b-0 last:pb-0 text-xs text-text-secondary leading-relaxed">
                    <div className="flex justify-between items-center mb-1">
                      <h5 className="font-semibold text-sm text-text-heading">{project.name}</h5>
                      {project.url && (
                        <a href={project.url} target="_blank" rel="noreferrer" className="text-sc-purple-600 font-semibold hover:underline">
                          Visit Project
                        </a>
                      )}
                    </div>
                    <p className="text-text-body mb-2 leading-relaxed">{project.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {project.technologies?.map((tech, techIdx) => (
                        <span key={techIdx} className="bg-bg-sidebar px-2 py-0.5 border border-border-default rounded text-[10px] text-text-secondary font-medium">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                {resumeData.projects.map((project, idx) => (
                  <div key={idx} className="border border-border-default rounded-xl p-3.5 space-y-3 bg-bg-card relative">
                    <button
                      onClick={() => handleRemoveProject(idx)}
                      className="absolute top-2.5 right-2.5 text-text-error hover:bg-sc-red-50 p-1.5 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-8">
                      <div>
                        <Label className="text-[10px] font-bold uppercase">Project Name</Label>
                        <Input value={project.name} onChange={(e) => handleUpdateProject(idx, 'name', e.target.value)} className="h-8 mt-1 bg-bg-input" />
                      </div>
                      <div>
                        <Label className="text-[10px] font-bold uppercase">Project URL</Label>
                        <Input value={project.url || ''} onChange={(e) => handleUpdateProject(idx, 'url', e.target.value)} className="h-8 mt-1 bg-bg-input" />
                      </div>
                      <div className="sm:col-span-2">
                        <Label className="text-[10px] font-bold uppercase">Technologies (comma separated)</Label>
                        <Input
                          value={project.technologies?.join(', ') || ''}
                          onChange={(e) => handleUpdateProject(idx, 'technologies', e.target.value.split(',').map((t) => t.trim()))}
                          className="h-8 mt-1 bg-bg-input"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <Label className="text-[10px] font-bold uppercase">Project Description</Label>
                        <textarea
                          value={project.description}
                          onChange={(e) => handleUpdateProject(idx, 'description', e.target.value)}
                          className="w-full bg-bg-input border border-border-default rounded-lg p-2.5 text-xs focus:outline-none min-h-[60px] leading-relaxed mt-1"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="flex justify-between items-center mt-2">
                  <Button variant="outline" size="sm" onClick={handleAddProject} className="h-8 text-xs flex gap-1 items-center">
                    <Plus className="w-3.5 h-3.5" /> Add Project
                  </Button>
                  <button onClick={() => setEditingSection(null)} className="text-xs font-semibold text-sc-purple-600 hover:underline">
                    Done editing
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 8 — AI Interview Score */}
          {resumeData.aiInterviewScore && (
            <div className="relative bg-bg-secondary-panel rounded-xl p-4 border border-border-subtle">
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <span className="text-xs font-medium text-text-secondary">Include in Resume</span>
                <input
                  type="checkbox"
                  checked={includeAIInterview}
                  onChange={(e) => setIncludeAIInterview(e.target.checked)}
                  className="w-4 h-4 rounded border-border-default text-sc-purple-600 focus:ring-sc-purple-600 accent-sc-purple-600 cursor-pointer"
                />
              </div>
              <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-3">
                AI Interview Sourcing Assessment
              </p>

              <div className={`p-3 border rounded-xl flex flex-col gap-2 ${includeAIInterview ? 'bg-sc-purple-50/30 border-sc-purple-200' : 'bg-bg-sidebar border-border-default opacity-50'}`}>
                <h5 className="text-xs font-bold text-sc-purple-700 flex items-center gap-1.5">
                  🛡 Verified by SkilledCore AI Interview
                </h5>
                <p className="text-xs text-text-body leading-relaxed">{resumeData.aiInterviewScore}</p>
              </div>
            </div>
          )}

          {/* SECTION 9 — Verified Badges */}
          {resumeData.verifiedBadges && resumeData.verifiedBadges.length > 0 && (
            <div className="relative bg-bg-secondary-panel rounded-xl p-4 border border-border-subtle">
              <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-3">
                Verified Skill Credentials
              </p>

              <div className="flex flex-wrap gap-2.5">
                {resumeData.verifiedBadges.map((badge, idx) => {
                  const active = includedBadges[badge] ?? false;
                  return (
                    <button
                      key={idx}
                      onClick={() => setIncludedBadges(prev => ({ ...prev, [badge]: !active }))}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 border rounded-lg text-xs font-semibold transition-all ${
                        active
                          ? 'bg-sc-purple-50 text-sc-purple-700 border-sc-purple-200'
                          : 'bg-bg-sidebar border-border-default opacity-40 hover:opacity-75'
                      }`}
                    >
                      <span>🛡 {badge}</span>
                      {active && <Check className="w-3.5 h-3.5 text-sc-purple-600" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

        </main>

        {/* Modal Sticky Footer */}
        <footer className="sticky bottom-0 px-6 py-4 bg-bg-secondary-panel border-t border-border-subtle rounded-b-2xl flex items-center justify-between z-10">
          <div className="flex items-center gap-1.5 text-xs text-text-tertiary font-medium">
            <FileText className="w-3.5 h-3.5 text-text-secondary" />
            <span>PDF • SkilledCore Template</span>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isDownloading}
              className="h-9 px-4 text-xs font-bold border-border-default hover:bg-bg-sidebar-hover text-text-body rounded-lg"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDownload}
              disabled={isDownloading}
              className="h-9 px-5 text-xs font-bold bg-sc-purple-600 hover:bg-sc-purple-700 text-white rounded-lg flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              {isDownloading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Download PDF
                </>
              )}
            </Button>
          </div>
        </footer>

      </div>
    </div>
  );
}
