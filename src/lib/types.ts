export type DemoPathId = "quick_win" | "portfolio" | "production";

export type EffortLevel = "Low" | "Medium" | "High";

export type ApiFit = "Strong" | "Good" | "Experimental";

export type SampleApp = {
  title: string;
  description: string;
  why: string;
};

export type ArchitectureNotes = {
  apis: string[];
  reasoning: string;
};

export type RepoXray = {
  framework: string;
  language: string;
  repoType: string;
  detectedFeatures: string[];
  setupQuality: string;
  deployReadiness: string;
};

export type ApiMatch = {
  api: string;
  fit: ApiFit;
  score: number;
  reasoning: string;
};

export type Blueprint = {
  userFlow: string;
  frontend: string;
  backend: string;
  openaiLayer: string;
  storage: string;
  deployment: string;
};

export type BeforeAfter = {
  currentRepo: string;
  openaiEnhanced: string;
};

export type StarterFile = {
  path: string;
  purpose: string;
  snippet: string;
};

export type StarterPack = {
  files: StarterFile[];
  envVars: string[];
  installCommands: string[];
  implementationSteps: string[];
};

export type MiniPreview = {
  title: string;
  screenType: string;
  primaryAction: string;
  panels: string[];
};

export type Presentation = {
  title: string;
  problem: string;
  demoIdea: string;
  architecture: string;
  buildSteps: string[];
  deployPlan: string[];
};

export type DemoPath = {
  id: DemoPathId;
  label: string;
  summary: string;
  sampleApp: SampleApp;
  effort: EffortLevel;
  wowFactor: number;
  apiFit: ApiFit;
  tutorialOutline: string[];
  architectureNotes: ArchitectureNotes;
  deployChecklist: string[];
  blueprint: Blueprint;
  beforeAfter: BeforeAfter;
  starterPack: StarterPack;
  miniPreview: MiniPreview;
  presentation: Presentation;
};

export type DemoGeneration = {
  repoXray: RepoXray;
  demoPaths: DemoPath[];
  selectedPath: DemoPathId;
  apiMatch: ApiMatch[];
  sampleApp: SampleApp;
  tutorialOutline: string[];
  architectureNotes: ArchitectureNotes;
  deployChecklist: string[];
};

export type GenerationRow = DemoGeneration & {
  id: string;
  created_at: string;
  repo_url: string | null;
  readme_snippet: string;
};

export type AnalyzeRequest = {
  readmeText: string;
  repoUrl?: string | null;
  preferredPath?: DemoPathId;
  openaiApiKey?: string;
  model?: string;
  noSave?: boolean;
};

export type RateLimitInfo = {
  limit: number;
  remaining: number;
  resetAt: string;
};

export type ApiError = {
  error: string;
};
