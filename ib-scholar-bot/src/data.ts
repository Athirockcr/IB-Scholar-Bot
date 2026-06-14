import { RubricGuide, IBModuleType } from "./types";

export const IB_MODULES_INFO: Array<{
  id: IBModuleType;
  title: string;
  badge: string;
  description: string;
  wordLimit: string;
  color: string;
  guideQuestions: string[];
}> = [
  {
    id: 'ee',
    title: 'Extended Essay (EE)',
    badge: 'Core Requirement',
    description: 'An independent, self-directed piece of research, finishing with a 4,000-word paper. Requires a sharply focused Research Question (RQ) and extensive critical argument.',
    wordLimit: '4,000 words max',
    color: 'from-amber-500 to-orange-600',
    guideQuestions: [
      "Is my Research Question (RQ) sharp and localized, rather than describing a broad textbook topic?",
      "Which specific IB Subject Guide and syllabus am I aligning my methodology with?",
      "Have I planned out my hours to account for three mandatory reflection sessions (the RPPF) and the Viva Voce?"
    ]
  },
  {
    id: 'ia',
    title: 'Internal Assessment (IA)',
    badge: 'Subject Coursework',
    description: 'A focused investigation completed in each individual subject course. Requirements vary drastically by Group (e.g. Science lab reports, Math mathematical explorations, or History historical essays).',
    wordLimit: 'Typically 12 pages or 1,500 - 2,200 words',
    color: 'from-indigo-500 to-purple-600',
    guideQuestions: [
      "What is my personal engagement? Why did I choose this specific angle?",
      "For Science: Have I isolated my Independent, Dependent, and Controlled variables with exact measurements?",
      "For Math: Is my level of mathematics appropriate for the course grade, demonstrating mathematical rigor and logical structure?"
    ]
  },
  {
    id: 'tok',
    title: 'Theory of Knowledge (TOK) Essay',
    badge: 'Core Requirement',
    description: 'A highly conceptual essay inquiring into the nature of knowing. Centered on 1 of 6 Prescribed Titles, explored through Areas of Knowledge (AOKs) and backed by robust Knowledge Questions.',
    wordLimit: '1,600 words max',
    color: 'from-emerald-500 to-teal-600',
    guideQuestions: [
      "Which of the 6 Prescribed Titles am I exploring? Have I unpacked its key semantic terms?",
      "What core Knowledge Questions (KQs) am I formulating to analyze the title, instead of just telling a real-life story?",
      "Are my two Areas of Knowledge (AOKs) contrasting or complementing each other constructively?"
    ]
  }
];

export const EE_RUBRICS: RubricGuide[] = [
  {
    criterion: "Criterion A",
    name: "Focus and Method (6 Marks)",
    focus: "Research Question, methodology, and sources.",
    tips: [
      "Your RQ must be clearly stated in the introduction, not hidden.",
      "Explain exactly HOW you gathered the data (archives, lab, survey).",
      "Justify why this specific focus allows for a deep analysis."
    ]
  },
  {
    criterion: "Criterion B",
    name: "Knowledge and Understanding (6 Marks)",
    focus: "Subject context, terminology, and literature.",
    tips: [
      "Use subject-specific vocabulary correctly throughout.",
      "Show academic understanding of the background subject guidelines.",
      "Ensure all source extracts are fully cited."
    ]
  },
  {
    criterion: "Criterion C",
    name: "Critical Thinking (12 Marks)",
    focus: "Research, analysis, evaluation, and argumentation.",
    tips: [
      "This is worth the most marks! Don't just summarize; evaluate your sources.",
      "Address alternative viewpoints or counterarguments.",
      "Address errors, uncertainties, or limitations in your analysis."
    ]
  },
  {
    criterion: "Criterion D",
    name: "Presentation (4 Marks)",
    focus: "Structure, layout, fonts, and bibliography.",
    tips: [
      "Check standard fonts (Arial/Times, 12pt, 1.5 or double spaced).",
      "Include a fully cited, consistent bibliography (APA, MLA, Chicago, etc.).",
      "Ensure all pages are numbered and table of contents matches exactly."
    ]
  },
  {
    criterion: "Criterion E",
    name: "Engagement (6 Marks)",
    focus: "Reflections on planning and progress.",
    tips: [
      "Assessed purely from your Reflections on Planning and Progress Form (RPPF).",
      "Show intellectual initiative, personal connection, and creative problem-solving.",
      "Make your three reflections (Initial, Interim, Viva Voce) distinct evolutions of your thinking."
    ]
  }
];

export const TOK_GUIDELINES: RubricGuide[] = [
  {
    criterion: "Core Themes",
    name: "Knowledge and the Knower",
    focus: "Individual perspective, biases, and role of community.",
    tips: [
      "Reflect on how we receive and construct personal knowledge.",
      "Ponder the relationship between truth and belief in your own life."
    ]
  },
  {
    criterion: "Areas of Knowledge",
    name: "AOK Mapping",
    focus: "The Natural Sciences, Human Sciences, History, Mathematics, The Arts.",
    tips: [
      "Do not just outline content: compare experimental frameworks of Physics with critical analyses of History.",
      "Contrast the level of certainty in mathematical proofs with scientific inductive consensus."
    ]
  },
  {
    criterion: "Rubric Focus",
    name: "Knowledge Questions (KQs)",
    focus: "Formulating open-ended, conceptual questions about knowledge.",
    tips: [
      "A KQ is NOT: 'How did the vaccine get manufactured?'",
      "A proper KQ is: 'To what extent does scientific consensus rely on empirical verification?'",
      "Keep KQs general, abstract, and focused on knowledge itself."
    ]
  }
];

export const IA_GUIDELINES_BY_GROUP: Array<{
  group: string;
  subjects: string[];
  tips: string[];
  rubricFocus: string;
}> = [
  {
    group: "Group 4: Sciences",
    subjects: ["Biology", "Chemistry", "Physics", "ESS", "Sports Science"],
    rubricFocus: "Exploration (6), Analysis (6), Evaluation (6), Personal Engagement (2)",
    tips: [
      "Identify a highly personal reason for choosing your RQ.",
      "Cite raw data, calculate percentage uncertainties, and display error bars on all graphs.",
      "Quantitatively compare your experimental results with accepted literature values."
    ]
  },
  {
    group: "Group 5: Mathematics",
    subjects: ["Math AA HL/SL", "Math AI HL/SL"],
    rubricFocus: "Presentation (4), Mathematical Communication (4), Personal Engagement (3), Reflection (3), Use of Mathematics (6)",
    tips: [
      "Explain the mathematics behind your topic. Don't just run software calculators.",
      "Incorporate tables, graphs, equations, and clearly show intermediate algebraic steps.",
      "Reflect throughout: Why did you switch from linear models to polynomial models? What is the real-world limitation?"
    ]
  },
  {
    group: "Group 3: Individuals & Societies",
    subjects: ["Business Management", "Economics", "History", "Geography", "Global Politics"],
    rubricFocus: "Theory analysis, source critique, and methodology validation",
    tips: [
      "For Business: Use key analytical tools (SWOT, PEST, Boston Matrix) directly applied to a real organization's current issue.",
      "For Economics: Apply economic diagrams beautifully. Match text labels with your diagram coordinates perfectly.",
      "For History: Evaluate source reliability specifically using Origin, Purpose, and Content (OPCV analysis)."
    ]
  }
];

export const SOCRATIC_PROMPTS = [
  {
    title: "Narrow My Research Question",
    prompt: "I have a broad topic in mind but I am struggling to focus it into a sharp Research Question (RQ) for my Extended Essay/IA. Can you lead me through a Socratic narrowing exercise?"
  },
  {
    title: "Check Personal Engagement",
    prompt: "How can I demonstrate authentic Personal Engagement in my science lab report without sounding fake or using clichés?"
  },
  {
    title: "Help Unpack TOK Prescribed Title",
    prompt: "I am trying to unpack a Theory of Knowledge (TOK) Prescribed Title. Can we Socratic-brainstorm how to develop suitable knowledge questions from it?"
  },
  {
    title: "Critique My Argument Flow",
    prompt: "I think my third paragraph is drifting away from my core thesis statement. Can you guide me through analyzing my argument structure?"
  }
];
