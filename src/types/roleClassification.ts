export interface RoleClassification {
  jobTitle: string;
  category: CategoryName;
  subCategory: string;
  isTechnical: boolean;
  requiresCodingSandbox: boolean;   // TRUE only for engineers/devs/data scientists
  requiresDesignPortfolio: boolean; // TRUE only for UX/UI/visual design roles
  assessmentMethod: 'sandbox' | 'scenario-based' | 'portfolio-critique';
  coreCompetencies: string[];       // What skills to probe in questions
  senioritySignals: string[];       // Words that indicate level (junior/senior/lead)
  toolsToAskAbout: string[];        // Role-specific tools to reference in questions
  industryContext: string;          // 'any' or specific industry
}

export type CategoryName =
  | 'Software Engineering & Development'
  | 'Data Science, ML & AI'
  | 'DevOps, Cloud & Infrastructure'
  | 'QA & Testing'
  | 'Product Management'
  | 'UX/UI Design & Research'
  | 'Marketing & Growth'
  | 'Social Media & Community'
  | 'Sales & Business Development'
  | 'Finance & Accounting'
  | 'Human Resources & People Operations'
  | 'Customer Success & Support'
  | 'Content & Copywriting'
  | 'Operations & Project Management'
  | 'Legal & Compliance'
  | 'Healthcare & Clinical'
  | 'Research & Science'
  | 'Education & Training'
  | 'Creative & Media Production'
  | 'General Business & Administration';
