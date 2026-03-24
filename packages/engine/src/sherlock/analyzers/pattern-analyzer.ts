import type { RawContent, PatternAnalysis, ProfileConfig } from "../types";
import type { LlmAdapter } from "../../adapters/types";

export class PatternAnalyzer {
  constructor(private llm: LlmAdapter) {}

  async analyze(contents: RawContent[], profile: ProfileConfig): Promise<PatternAnalysis> {
    const contentSummary = contents.map((c, i) =>
      `## Conteudo ${i + 1} [${c.type}]\n${c.caption?.substring(0, 400) ?? ""}\n${c.slides ? `Slides: ${c.slides.map((s) => s.text.substring(0, 80)).join(" | ")}` : ""}`
    ).join("\n---\n");

    const result = await this.llm.chat([{
      role: "user",
      content: `Analise ${contents.length} conteudos do perfil ${profile.url} (${profile.platform}).

${contentSummary}

Retorne JSON:
{"profile":"${profile.url}","platform":"${profile.platform}","sampleSize":${contents.length},"executiveSummary":"3-5 frases","hookPatterns":[{"text":"exemplo","engagement":0}],"ctaPatterns":[{"type":"tipo","example":"ex"}],"vocabularySignature":["palavras frequentes"],"toneProfile":"descricao do tom","engagementDrivers":["driver1"],"recommendations":["recomendacao1"]}

APENAS JSON valido.`,
    }]);

    try {
      return JSON.parse(result.output.replace(/```json?\n?/g, "").replace(/```/g, "").trim());
    } catch {
      return {
        profile: profile.url, platform: profile.platform, sampleSize: contents.length,
        executiveSummary: "Analise nao parseada", hookPatterns: [], ctaPatterns: [],
        vocabularySignature: [], toneProfile: "", engagementDrivers: [], recommendations: [],
      };
    }
  }
}
