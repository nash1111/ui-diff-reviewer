export interface CLIOptions {
  url1?: string;
  url2?: string;
  file1?: string;
  file2?: string;
  json?: boolean;
  puppeteer?: boolean;
  model?: string;
}

export interface FetchResult {
  html: string;
  source: string;
}

export interface DiffResult {
  diffs: any[];
  count: number;
  summary: string;
}

export interface AIEvaluation {
  summary: string;
  change_types: string[];
  impacted_sections: string[];
  likely_intent: string;
}

export interface ComparisonResult {
  source1: string;
  source2: string;
  diff: DiffResult;
  aiEvaluation: AIEvaluation;
}
