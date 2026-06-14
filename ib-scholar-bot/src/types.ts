export type IBModuleType = 'ee' | 'ia' | 'tok';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isCritique?: boolean;
}

export interface ResearchIdea {
  id: string;
  type: IBModuleType;
  title: string;
  subject: string;
  researchQuestion: string;
  notes: string;
  completedSteps: string[]; // e.g. "brainstorm", "rq_refined", "outline", "integrity_passed"
  timestamp: string;
}

export interface RubricGuide {
  criterion: string;
  name: string;
  focus: string;
  tips: string[];
}
