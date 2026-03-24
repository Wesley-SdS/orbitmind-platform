import type { InvestigationConfig, ProfileConfig, InvestigationResult, PatternAnalysis, ConsolidatedAnalysis } from "./types";
import { InstagramExtractor } from "./extractors/instagram";
import { YouTubeExtractor } from "./extractors/youtube";
import { TwitterExtractor } from "./extractors/twitter";
import { LinkedInExtractor } from "./extractors/linkedin";
import { PatternAnalyzer } from "./analyzers/pattern-analyzer";
import { Consolidator } from "./analyzers/consolidator";
import type { LlmAdapter } from "../adapters/types";

export class SherlockInvestigator {
  constructor(private config: InvestigationConfig, private llm: LlmAdapter) {}

  async investigate(onProgress?: (msg: string) => void): Promise<{
    results: Map<string, InvestigationResult>;
    consolidated: ConsolidatedAnalysis | null;
  }> {
    const { chromium } = await import("playwright");
    onProgress?.("Iniciando browser headless...");
    const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });

    const results = new Map<string, InvestigationResult>();
    const allAnalyses: PatternAnalysis[] = [];

    try {
      for (const profile of this.config.profiles) {
        onProgress?.(`Investigando ${profile.url}...`);
        const page = await browser.newPage();

        try {
          const extractor = this.getExtractor(profile, page);
          const rawContents = await extractor.extract(profile, onProgress);
          onProgress?.(`Extraidos ${rawContents.length} conteudos de ${profile.url}`);

          onProgress?.(`Analisando padroes de ${profile.url}...`);
          const analyzer = new PatternAnalyzer(this.llm);
          const analysis = await analyzer.analyze(rawContents, profile);

          results.set(profile.url, { rawContents, patternAnalysis: analysis });
          allAnalyses.push(analysis);
        } catch (error) {
          onProgress?.(`Erro em ${profile.url}: ${error instanceof Error ? error.message : "Erro"}`);
        } finally {
          await page.close();
        }
      }

      let consolidated: ConsolidatedAnalysis | null = null;
      if (allAnalyses.length > 1) {
        onProgress?.("Consolidando analises...");
        consolidated = await new Consolidator(this.llm).consolidate(allAnalyses);
      }

      return { results, consolidated };
    } finally {
      await browser.close();
    }
  }

  private getExtractor(profile: ProfileConfig, page: import("playwright").Page) {
    switch (profile.platform) {
      case "instagram": return new InstagramExtractor(page);
      case "youtube": return new YouTubeExtractor(page);
      case "twitter": return new TwitterExtractor(page);
      case "linkedin": return new LinkedInExtractor(page);
      default: throw new Error(`Plataforma nao suportada: ${profile.platform}`);
    }
  }

  static detectPlatform(url: string): ProfileConfig["platform"] | null {
    if (url.includes("instagram.com")) return "instagram";
    if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
    if (url.includes("x.com") || url.includes("twitter.com")) return "twitter";
    if (url.includes("linkedin.com")) return "linkedin";
    return null;
  }
}
