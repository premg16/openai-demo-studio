export type SampleApp = {
  title: string;
  description: string;
  why: string;
};

export type ArchitectureNotes = {
  apis: string[];
  reasoning: string;
};

export type DemoGeneration = {
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
};

export type ApiError = {
  error: string;
};
