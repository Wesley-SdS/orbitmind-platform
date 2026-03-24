import type { PatternAnalysis, ConsolidatedAnalysis } from "../types";
import type { LlmAdapter } from "../../adapters/types";

export class Consolidator {
  constructor(private llm: LlmAdapter) {}

  async consolidate(analyses: PatternAnalysis[]): Promise<ConsolidatedAnalysis> {
    const summary = analyses.map((a) =>
      `## ${a.profile} (${a.platform})\n${a.executiveSummary}\nHooks: ${a.hookPatterns.map((h) => h.text).join(", ")}\nTone: ${a.toneProfile}\nDrivers: ${a.engagementDrivers.join(", ")}`
    ).join("\n\n");

    const result = await this.llm.chat([{
      role: "user",
      content: `Consolide as analises de ${analyses.length} perfis:

${summary}

Retorne JSON:
{"profileCount":${analyses.length},"universalPatterns":["padrao1"],"hookTemplates":[{"pattern":"template","source":"perfil"}],"ctaTemplates":[{"type":"tipo","template":"ex"}],"voiceGuidelines":"guia de voz","antiPatterns":["anti1"],"recommendations":["rec1"]}

APENAS JSON valido.`,
    }]);

    try {
      return JSON.parse(result.output.replace(/```json?\n?/g, "").replace(/```/g, "").trim());
    } catch {
      return {
        profileCount: analyses.length, universalPatterns: [], hookTemplates: [],
        ctaTemplates: [], voiceGuidelines: "", antiPatterns: [], recommendations: [],
      };
    }
  }
}
