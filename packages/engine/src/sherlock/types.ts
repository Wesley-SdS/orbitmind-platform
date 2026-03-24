export interface InvestigationConfig {
  squadId?: string;
  orgId: string;
  profiles: ProfileConfig[];
}

export interface ProfileConfig {
  url: string;
  platform: "instagram" | "youtube" | "twitter" | "linkedin";
  mode: "single_post" | "profile_1" | "profile_5_10";
  maxContents?: number;
}

export interface RawContent {
  id: string;
  platform: string;
  type: string;
  url: string;
  date: string;
  metrics: { likes?: number; comments?: number; views?: number; saves?: number; shares?: number };
  caption?: string;
  slides?: Array<{ index: number; text: string }>;
  transcription?: string;
}

export interface PatternAnalysis {
  profile: string;
  platform: string;
  sampleSize: number;
  executiveSummary: string;
  hookPatterns: Array<{ text: string; engagement: number }>;
  ctaPatterns: Array<{ type: string; example: string }>;
  vocabularySignature: string[];
  toneProfile: string;
  engagementDrivers: string[];
  recommendations: string[];
}

export interface ConsolidatedAnalysis {
  profileCount: number;
  universalPatterns: string[];
  hookTemplates: Array<{ pattern: string; source: string }>;
  ctaTemplates: Array<{ type: string; template: string }>;
  voiceGuidelines: string;
  antiPatterns: string[];
  recommendations: string[];
}

export interface InvestigationResult {
  rawContents: RawContent[];
  patternAnalysis: PatternAnalysis;
}
