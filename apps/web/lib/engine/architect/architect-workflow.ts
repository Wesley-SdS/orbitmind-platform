/**
 * Architect Structured Workflow
 *
 * Implements the squad creation flow inspired by OpenSquad (synced 2026-03-30):
 * Discovery (6 questions) → Investigation → Research → Extraction → Design → Build → Validate
 *
 * Changes from OpenSquad sync (68 commits):
 * - Performance mode REMOVED → always agile/lean (1-2 tasks per agent)
 * - Discovery: 6 questions (was 7), natural language, no perf mode
 * - Skills: auto-detected from purpose + platforms
 * - Sherlock: loads per-platform instead of monolithic
 * - Research: 4 searches (was 3)
 * - Design: uses OpenSquad design.prompt.md as reference + fallback
 *
 * RESILIENCE: Every phase has try/catch with user-visible error messages.
 * FEEDBACK: Never >10s without a visible message in chat.
 */
import { createAdapter } from "@orbitmind/engine";
import type { ProviderConfig } from "@orbitmind/engine";
import { ARCHITECT_AGENT } from "./architect-agent";
import type { ArchitectConversationState } from "./architect-state";
import {
  getRelevantBestPractices,
  getExampleSquad,
  getSherlockPromptForPlatform,
  getBestPractice,
  getDesignPrompt,
} from "@/lib/opensquad/parser";

// ── Types ──

type SendMessageFn = (squadId: string, content: string) => Promise<void>;
type SendMessageWithMetaFn = (squadId: string, content: string, metadata: Record<string, unknown>) => Promise<void>;

export interface WorkflowContext {
  state: ArchitectConversationState;
  squadId: string;
  orgId: string;
  providerConfig: ProviderConfig;
  companyPrompt: string;
  sendMessage: SendMessageFn;
  sendMessageWithMeta: SendMessageWithMetaFn;
}

// ── Helpers ──

async function withProgress<T>(ctx: WorkflowContext, message: string, fn: () => Promise<T>): Promise<T> {
  await ctx.sendMessage(ctx.squadId, message);
  const start = Date.now();
  const interval = setInterval(async () => {
    const sec = Math.floor((Date.now() - start) / 1000);
    try { await ctx.sendMessage(ctx.squadId, `⏳ Ainda processando... (${sec}s)`); } catch { /* */ }
  }, 20000);
  try { return await fn(); } finally { clearInterval(interval); }
}

/** Skill display names + icons for user-facing messages */
const SKILL_DISPLAY: Record<string, { label: string; icon: string }> = {
  web_search: { label: "Pesquisa na Web", icon: "🔍" },
  web_fetch: { label: "Leitura de Páginas", icon: "🌐" },
  instagram_publisher: { label: "Publicação no Instagram", icon: "📸" },
  image_fetcher: { label: "Busca de Imagens", icon: "🖼️" },
  linkedin_publisher: { label: "Publicação no LinkedIn", icon: "💼" },
  blotato_publisher: { label: "Publicação Social", icon: "📢" },
  canva_designer: { label: "Design Gráfico", icon: "🎨" },
  apify_scraper: { label: "Análise de Concorrentes", icon: "📊" },
};

function formatSkillsDisplay(skills: string[]): string {
  return skills
    .map((s) => {
      const info = SKILL_DISPLAY[s];
      return info ? `${info.icon} ${info.label}` : s;
    })
    .join("\n");
}

/** Auto-detect skills from purpose + platforms (OpenSquad: no longer asks) */
function autoDetectSkills(purpose: string, platforms: string[]): string[] {
  const skills = new Set(["web_search", "web_fetch"]);
  const lower = purpose.toLowerCase();

  if (platforms.some((p) => p.includes("instagram"))) { skills.add("instagram_publisher"); skills.add("image_fetcher"); }
  if (platforms.some((p) => p.includes("linkedin"))) skills.add("linkedin_publisher");
  if (platforms.some((p) => /twitter|youtube|tiktok/.test(p))) skills.add("blotato_publisher");
  if (lower.includes("design") || lower.includes("visual") || lower.includes("imagem")) skills.add("canva_designer");
  if (lower.includes("pesquis") || lower.includes("scrap") || lower.includes("concorren")) skills.add("apify_scraper");

  return [...skills];
}

// ══════════════════════════════════════════════════════════
// PHASE 1: DISCOVERY — agentico (LLM decide a proxima pergunta)
// O LLM extrai info da resposta e gera a proxima pergunta adequada
// ao tipo de squad (dev, marketing, suporte, etc.). Quando ja tem
// contexto suficiente, ele marca complete:true e seguimos para
// investigation/research.
// ══════════════════════════════════════════════════════════

const MAX_DISCOVERY_TURNS = 8;
const MIN_DISCOVERY_TURNS = 4;

interface DiscoveryDecision {
  extracted?: {
    purpose?: string;
    audience?: string;
    tonePreference?: string;
    contentPillars?: string[];
    targetPlatforms?: string[];
    targetFormats?: string[];
    references?: string[];
    squadKind?: ArchitectConversationState["discovery"]["squadKind"];
  };
  complete?: boolean;
  nextQuestion?: string;
}

function applyExtracted(
  state: ArchitectConversationState,
  ex: DiscoveryDecision["extracted"] | undefined,
): void {
  if (!ex) return;
  const d = state.discovery;
  if (ex.purpose) { d.purpose = ex.purpose; d.nicho = ex.purpose; }
  if (ex.audience) d.audience = ex.audience;
  if (ex.tonePreference) d.tonePreference = ex.tonePreference;
  if (ex.contentPillars?.length) d.contentPillars = ex.contentPillars;
  if (ex.targetPlatforms?.length) d.targetPlatforms = ex.targetPlatforms;
  if (ex.targetFormats?.length) d.targetFormats = ex.targetFormats;
  if (ex.references?.length) d.references = ex.references;
  if (ex.squadKind) d.squadKind = ex.squadKind;
}

function buildDiscoveryStateSummary(state: ArchitectConversationState): string {
  const d = state.discovery;
  const lines: string[] = [];
  if (d.squadKind) lines.push(`squadKind: ${d.squadKind}`);
  if (d.purpose) lines.push(`purpose: ${d.purpose}`);
  if (d.audience) lines.push(`audience: ${d.audience}`);
  if (d.tonePreference) lines.push(`tonePreference: ${d.tonePreference}`);
  if (d.contentPillars?.length) lines.push(`contentPillars: ${d.contentPillars.join(", ")}`);
  if (d.targetPlatforms?.length) lines.push(`targetPlatforms: ${d.targetPlatforms.join(", ")}`);
  if (d.targetFormats?.length) lines.push(`targetFormats: ${d.targetFormats.join(", ")}`);
  if (d.references?.length) lines.push(`references: ${d.references.join(", ")}`);
  return lines.length ? lines.join("\n") : "(vazio)";
}

function parseDiscoveryDecision(raw: string): DiscoveryDecision {
  const m = raw.match(/\{[\s\S]*\}/);
  if (!m) return {};
  try {
    const parsed = JSON.parse(m[0]) as DiscoveryDecision;
    return parsed;
  } catch {
    return {};
  }
}

async function decideNextDiscoveryStep(
  ctx: WorkflowContext,
  userMessage: string,
): Promise<DiscoveryDecision> {
  const { state, providerConfig, companyPrompt } = ctx;
  const adapter = createAdapter(
    { name: ARCHITECT_AGENT.name, role: ARCHITECT_AGENT.role, config: {} },
    providerConfig,
  );

  const history = (state.discovery.qaHistory ?? [])
    .map((qa, i) => `Pergunta ${i + 1}: ${qa.q}\nResposta: ${qa.a}`)
    .join("\n\n") || "(ainda sem perguntas)";

  const stateSummary = buildDiscoveryStateSummary(state);
  const turnsDone = state.discovery.qaHistory?.length ?? 0;
  const remaining = Math.max(0, MAX_DISCOVERY_TURNS - turnsDone);
  const minLeft = Math.max(0, MIN_DISCOVERY_TURNS - turnsDone);

  const prompt = `Voce e o Arquiteto do OrbitMind, conduzindo um discovery para criar um squad de IA.

OBJETIVO
Coletar contexto suficiente para projetar o squad. As perguntas DEVEM ser adequadas ao tipo de squad (dev team, agencia de conteudo, suporte SaaS, vendas, ops/dados etc.). Nao force perguntas de marketing num squad de desenvolvimento, e vice-versa.

CONTEXTO DA EMPRESA
${companyPrompt || "(sem dados ainda)"}

ESTADO ATUAL DO DISCOVERY
${stateSummary}

HISTORICO DA CONVERSA
${history}

ULTIMA RESPOSTA DO USUARIO
${userMessage || "(primeira mensagem do fluxo)"}

REGRAS
1. Identifique squadKind logo na primeira oportunidade: "content" | "dev" | "support" | "sales" | "ops" | "data" | "other".
2. Extraia tudo que conseguir da ultima resposta e do historico para preencher purpose, audience, tonePreference, contentPillars (3-5 itens), targetPlatforms, targetFormats, references (URLs).
3. Para squad de "dev", "ops" e "data", NAO pergunte sobre tom de voz ou plataformas de publicacao. Foque em stack tecnica, ambiente de execucao, integracoes (Git/CI/issue tracker), criterios de qualidade.
4. Para "content"/"sales", as perguntas tradicionais (audiencia, tom, pilares, plataformas) fazem sentido.
5. Faca UMA pergunta por vez, curta e objetiva. Pode oferecer opcoes numeradas se ajudar a responder rapido.
6. Voce ja fez ${turnsDone} perguntas (limite ${MAX_DISCOVERY_TURNS}). Restam ${remaining} turnos. ${minLeft > 0 ? `Faca pelo menos mais ${minLeft} pergunta(s).` : "Voce JA pode marcar complete:true se tiver contexto bom."}
7. Marque complete:true APENAS quando tiver no minimo: purpose claro + audience/contexto + (para content: tom + 1+ pilar/plataforma).
8. Se complete:true, pode (mas nao precisa) preencher nextQuestion com uma pergunta opcional sobre referencias/URLs antes de seguir.

FORMATO DE SAIDA (JSON unico, sem markdown, sem comentarios)
{
  "extracted": {
    "purpose": "string | omit",
    "audience": "string | omit",
    "tonePreference": "string | omit",
    "contentPillars": ["..."],
    "targetPlatforms": ["..."],
    "targetFormats": ["..."],
    "references": ["https://..."],
    "squadKind": "content|dev|support|sales|ops|data|other"
  },
  "complete": false,
  "nextQuestion": "string com a proxima pergunta (markdown ok). Omita se complete:true e nao precisa de mais info."
}

Retorne APENAS o JSON valido.`;

  const r = await adapter.chat([{ role: "user", content: prompt }]);
  return parseDiscoveryDecision(r.output);
}

async function transitionFromDiscovery(ctx: WorkflowContext): Promise<void> {
  const { state, squadId } = ctx;
  state.discovery.performanceMode = "high";

  const detectedSkills = autoDetectSkills(
    state.discovery.purpose || "",
    state.discovery.targetFormats || [],
  );
  state.discovery.customRequirements = detectedSkills.join(",");

  const summary = buildDiscoverySummary(state);
  await ctx.sendMessage(squadId,
    summary + `\n\n⚡ **Capacidades detectadas**\n\n${formatSkillsDisplay(detectedSkills)}`);

  if (state.discovery.references && state.discovery.references.length > 0) {
    state.phase = "investigation";
    await ctx.sendMessage(squadId,
      `🔍 **Investigando ${state.discovery.references.length} perfil(is) (~30s cada)...**\nEnquanto isso, vou pesquisar sobre o domínio.`);
    try { await handleInvestigationPhase(ctx); } catch (e) {
      console.error("[Architect] Post-discovery error:", e);
      await ctx.sendMessage(squadId, "⚠️ Erro no processamento. Tente \"criar squad\" novamente.");
      state.phase = "idle";
    }
  } else {
    state.phase = "research";
    await ctx.sendMessage(squadId, "🔎 **Iniciando pesquisa de mercado (~1-2 minutos)...**");
    try { await handleResearchPhase(ctx); } catch (e) {
      console.error("[Architect] Post-discovery error:", e);
      await ctx.sendMessage(squadId, "⚠️ Erro no processamento. Tente \"criar squad\" novamente.");
      state.phase = "idle";
    }
  }
}

export async function handleStructuredDiscovery(ctx: WorkflowContext, userMessage: string): Promise<void> {
  const { state, squadId } = ctx;
  if (!state.discovery.qaHistory) state.discovery.qaHistory = [];
  const isFirstTurn = state.discoveryStep === 0 && state.discovery.qaHistory.length === 0;

  // Salva resposta no historico (exceto a 1a chamada que e a intencao inicial — guardada como Q0)
  if (!isFirstTurn) {
    const lastQ = state.discovery.qaHistory[state.discovery.qaHistory.length - 1];
    if (lastQ && !lastQ.a) {
      lastQ.a = userMessage;
    } else {
      state.discovery.qaHistory.push({ q: "(intencao inicial)", a: userMessage });
    }
  } else if (userMessage.trim()) {
    state.discovery.qaHistory.push({ q: "(intencao inicial)", a: userMessage });
  }

  state.discoveryStep++;

  // URLs detectadas em qualquer turno entram em references automaticamente
  const urls = extractUrls(userMessage);
  if (urls.length) state.discovery.references = [...new Set([...(state.discovery.references ?? []), ...urls])];

  try {
    let decision: DiscoveryDecision;
    try {
      decision = await decideNextDiscoveryStep(ctx, userMessage);
    } catch (e) {
      console.error("[Architect] Discovery LLM call falhou:", e);
      // Fallback minimo: pergunta simples baseada no que falta
      decision = {
        extracted: state.discovery.purpose ? {} : { purpose: userMessage.trim() },
        complete: false,
        nextQuestion: state.discovery.purpose
          ? "Qual o publico ou ambiente alvo desse squad?"
          : "O que esse squad deve fazer? Descreva o resultado final que voce quer.",
      };
    }

    applyExtracted(state, decision.extracted);

    const turnsDone = state.discovery.qaHistory.length;
    const reachedCap = turnsDone >= MAX_DISCOVERY_TURNS;
    const hasMinimum = !!state.discovery.purpose;
    const shouldComplete = (decision.complete && hasMinimum) || (reachedCap && hasMinimum);

    if (shouldComplete) {
      await transitionFromDiscovery(ctx);
      return;
    }

    const nextQ = decision.nextQuestion?.trim()
      || (hasMinimum
        ? "Tem alguma referencia (URL de perfil/repo/site) que possa servir de modelo? Ou digite **pular**."
        : "O que esse squad deve fazer? Descreva o resultado final que voce quer.");

    state.discovery.qaHistory.push({ q: nextQ, a: "" });
    await ctx.sendMessage(squadId, nextQ);
  } catch (err) {
    console.error("[Architect] Discovery error:", err);
    await ctx.sendMessage(squadId, "⚠️ Tive um problema agora. Pode reformular ou digitar **pular** para seguir com o que ja temos.");
  }
}

// ══════════════════════════════════════════════════════════
// PHASE 1.5: INVESTIGATION (modular Sherlock per-platform)
// ══════════════════════════════════════════════════════════

async function handleInvestigationPhase(ctx: WorkflowContext): Promise<void> {
  const { state, squadId, providerConfig } = ctx;
  const refs = state.discovery.references || [];
  if (!state.researchData) state.researchData = {};

  try {
    if (refs.length === 0) { state.phase = "research"; await handleResearchPhase(ctx); return; }

    const adapter = createAdapter({ name: "Sherlock", role: "Profile Investigator", config: {} }, providerConfig);
    const results: string[] = [];

    for (const url of refs) {
      const platform = detectPlatform(url);
      await ctx.sendMessage(squadId, `📱 Analisando ${platform}: ${url}...`);
      try {
        // Load platform-specific Sherlock (not monolithic)
        const prompt = getSherlockPromptForPlatform(platform);
        const r = await adapter.chat([{ role: "user",
          content: `${prompt}\n\n---\n\nInvestigate: ${url}\nExtract: content patterns, voice/tone, engagement, themes, success factors.\nReturn structured analysis.` }]);
        results.push(`### ${platform}: ${url}\n\n${r.output}`);
      } catch { results.push(`### ${platform}: ${url}\n\nFalhou — continuando.`); }
    }

    state.researchData.sherlockResults = results.join("\n\n---\n\n");
    state.researchData.consolidatedAnalysis = state.researchData.sherlockResults;
    await ctx.sendMessage(squadId, `✅ **Investigação concluída!** ${results.length} perfil(is) analisado(s).`);
  } catch (e) {
    console.error("[Architect] Investigation:", e);
    await ctx.sendMessage(squadId, "⚠️ Investigação parcial, continuando com pesquisa...");
  }

  state.phase = "research";
  await handleResearchPhase(ctx);
}

// ══════════════════════════════════════════════════════════
// PHASE 2: RESEARCH (4 web searches — granular messages)
// ══════════════════════════════════════════════════════════

export async function handleResearchPhase(ctx: WorkflowContext): Promise<void> {
  const { state, squadId } = ctx;
  if (!state.researchData) state.researchData = {};
  const nicho = state.discovery.nicho || state.discovery.purpose || "";

  try {
    const { webSearch } = await import("@orbitmind/engine");
    const searches = [
      { label: `frameworks e melhores práticas para "${nicho}"`, q: `${nicho} melhores práticas framework` },
      { label: `anti-patterns e erros comuns em "${nicho}"`, q: `${nicho} erros comuns evitar` },
      { label: "critérios de qualidade e benchmarks", q: `${nicho} critérios qualidade` },
      { label: "vocabulário e exemplos de sucesso", q: `${nicho} exemplos sucesso vocabulário profissional` },
    ];

    const allResults: Array<{ title: string; snippet: string }> = [];
    for (let i = 0; i < searches.length; i++) {
      await ctx.sendMessage(squadId, `🔍 **Pesquisando (${i + 1}/${searches.length}):** ${searches[i]!.label}...`);
      const r = await webSearch(searches[i]!.q, 5).catch(() => []);
      allResults.push(...r);
    }

    state.researchData.webSearchResults = allResults.map((r) => `- **${r.title}**: ${r.snippet}`);
    await ctx.sendMessage(squadId,
      `📊 **Pesquisa concluída!** ${allResults.length} fontes sobre "${nicho}".\n\n⚙️ Extraindo conhecimento operacional...`);
  } catch {
    state.researchData.webSearchResults = [];
    await ctx.sendMessage(squadId, "📊 Pesquisa concluída. Avançando...");
  }

  state.phase = "extraction";
  await handleExtractionPhase(ctx);
}

// ══════════════════════════════════════════════════════════
// PHASE 3: EXTRACTION
// ══════════════════════════════════════════════════════════

async function handleExtractionPhase(ctx: WorkflowContext): Promise<void> {
  const { state, squadId, providerConfig } = ctx;
  if (!state.extractionData) state.extractionData = {};

  try {
    const targetFormats = state.discovery.targetFormats || [];
    const purpose = state.discovery.purpose || "";
    const bpContent = getRelevantBestPractices(targetFormats, purpose);
    state.extractionData.bestPracticesContent = bpContent;

    const researchBrief = state.researchData?.webSearchResults?.join("\n") || "";
    const sherlockAnalysis = state.researchData?.consolidatedAnalysis || "";

    const adapter = createAdapter({ name: "Extractor", role: "Knowledge Extractor", config: {} }, providerConfig);

    const result = await withProgress(ctx,
      "⚙️ Gerando framework operacional, anti-patterns e critérios de qualidade...",
      () => adapter.chat([{ role: "user",
        content: `Baseado na pesquisa, gere artifacts operacionais para "${purpose}".

PESQUISA WEB:\n${researchBrief}
${sherlockAnalysis ? `\nANÁLISE DE PERFIS:\n${sherlockAnalysis}` : ""}
MELHORES PRÁTICAS:\n${bpContent.substring(0, 3000)}

Gere em JSON:
{"operationalFramework":"...","outputExamples":"...","antiPatterns":"...","voiceGuidance":"...","qualityCriteria":"..."}
Retorne APENAS o JSON válido.` }]),
    );

    // O LLM as vezes retorna campos aninhados (objeto/array). Forca string sempre.
    const toStr = (v: unknown): string => {
      if (v == null) return "";
      if (typeof v === "string") return v;
      try { return JSON.stringify(v); } catch { return String(v); }
    };
    try {
      const m = result.output.match(/\{[\s\S]*\}/);
      if (m) {
        const p = JSON.parse(m[0]);
        state.extractionData.operationalFramework = toStr(p.operationalFramework);
        state.extractionData.outputExamples = toStr(p.outputExamples);
        state.extractionData.antiPatterns = toStr(p.antiPatterns);
        state.extractionData.voiceGuidance = toStr(p.voiceGuidance);
        state.extractionData.qualityCriteria = toStr(p.qualityCriteria);
      }
    } catch { state.extractionData.operationalFramework = result.output; }
  } catch (e) {
    console.error("[Architect] Extraction:", e);
    await ctx.sendMessage(squadId, "⚠️ Extração parcial — continuando...");
  }

  await ctx.sendMessage(squadId, "✅ **Conhecimento extraído!** Projetando o squad...");
  state.phase = "design-review";
  await handleDesignPhase(ctx);
}

// ══════════════════════════════════════════════════════════
// PHASE 4: DESIGN — robust with fallback
// Uses OpenSquad design.prompt.md as reference
// ══════════════════════════════════════════════════════════

export async function handleDesignPhase(ctx: WorkflowContext): Promise<void> {
  const { state, squadId, providerConfig, companyPrompt } = ctx;

  // Load OpenSquad design prompt as reference
  const designRef = getDesignPrompt().substring(0, 1500);
  const exampleSquad = getExampleSquad("instagram-carrossel");
  const exampleAgent = exampleSquad?.agents?.[0]?.content?.substring(0, 400) || "";

  const adapter = createAdapter({ name: ARCHITECT_AGENT.name, role: ARCHITECT_AGENT.role, config: {} }, providerConfig);

  const discoveryCtx = `
PROPÓSITO: ${state.discovery.purpose}
PÚBLICO: ${state.discovery.audience}
TOM: ${state.discovery.tonePreference}
PILARES: ${state.discovery.contentPillars?.join(", ")}
PLATAFORMAS: ${state.discovery.targetPlatforms?.join(", ") || "N/A"}
FORMATOS: ${state.discovery.targetFormats?.join(", ") || "N/A"}`;

  const extractionCtx = state.extractionData ? `
FRAMEWORK: ${state.extractionData.operationalFramework?.substring(0, 400) || "N/A"}
ANTI-PATTERNS: ${state.extractionData.antiPatterns?.substring(0, 250) || "N/A"}
VOICE: ${state.extractionData.voiceGuidance?.substring(0, 250) || "N/A"}` : "";

  const detectedSkills = autoDetectSkills(state.discovery.purpose || "", state.discovery.targetFormats || []);

  try {
    const result = await withProgress(ctx, "🎨 Projetando agentes e pipeline (~30s)...",
      () => adapter.chat([{ role: "user",
        content: `${ARCHITECT_AGENT.systemPrompt}
${companyPrompt}

FASE 4 — Design. Pesquisa e extração já feitas.

${discoveryCtx}
${extractionCtx}

DESIGN PHILOSOPHY (OpenSquad — agile):
- Squads são SEMPRE lean: 1-2 tasks por agente máximo
- Um creator agent (não um por plataforma)
- Review single-pass
- Otimização embutida na task de criação
- YAGNI — nunca criar agentes desnecessários

${designRef ? `\nREFERÊNCIA DO OPENSQUAD:\n${designRef}` : ""}
${exampleAgent ? `\nEXEMPLO AGENTE:\n${exampleAgent}` : ""}

REGRAS:
- Naming: aliteração em PT-BR (ex: Pedro Pesquisa, Clara Conteúdo, Rafa Revisão)
- Todo squad TEM Reviewer
- Checkpoints em pontos de decisão
- Content approval ANTES de publish

Monte o design JSON:

\`\`\`json:squad-design
{"ready":true,"name":"...","code":"...","description":"...","icon":"emoji","performanceMode":"high","agents":[{"id":"kebab","name":"Nome Aliterativo","role":"...","icon":"emoji","modelTier":"powerful","execution":"inline","description":"1 frase","persona":{"role":"...","identity":"...","communicationStyle":"..."},"principles":["..."],"voiceGuidance":{"alwaysUse":["..."],"neverUse":["..."],"toneRules":["..."]},"qualityCriteria":["..."],"antiPatterns":["..."],"outputFormat":"..."}],"pipeline":[{"step":1,"name":"...","type":"agent|checkpoint","agentId":"id"}],"skills":${JSON.stringify(detectedSkills)},"contentBrief":{"nicho":"${state.discovery.nicho || ""}","targetPlatforms":${JSON.stringify(state.discovery.targetPlatforms || [])},"tonePreferences":["${state.discovery.tonePreference || ""}"],"contentPillars":${JSON.stringify(state.discovery.contentPillars || [])},"audience":"${state.discovery.audience || ""}","referenceProfiles":${JSON.stringify(state.discovery.references || [])},"language":"pt-BR"}}
\`\`\`

Apresente visualmente e pergunte: "Tudo certo? Ou quer ajustar algo?"` }]),
    );

    const { extractDesignJson, stripJsonFromOutput } = await import("./architect-json");
    let design = extractDesignJson(result.output);

    if (!design) {
      // Retry with simpler prompt
      await ctx.sendMessage(squadId, "⏳ Refinando design...");
      const retry = await adapter.chat([{ role: "user",
        content: `Gere APENAS um JSON válido para squad de "${state.discovery.purpose}" com 3-4 agentes lean. Formato:\n{"ready":true,"name":"...","code":"...","description":"...","icon":"...","performanceMode":"high","agents":[{"id":"...","name":"...","role":"...","icon":"...","modelTier":"powerful","execution":"inline","description":"..."}],"pipeline":[{"step":1,"name":"...","type":"checkpoint"}],"skills":${JSON.stringify(detectedSkills)}}` }]);
      design = extractDesignJson(retry.output);
    }

    if (!design) {
      // Ultimate fallback — generate design programmatically
      design = generateFallbackDesign(state, detectedSkills);
      await ctx.sendMessage(squadId, "📋 Usando design padrão baseado no seu propósito.");
    }

    // Enrich with extraction data
    if (!design.domainKnowledge && state.extractionData) {
      design.domainKnowledge = {
        researchBrief: state.researchData?.webSearchResults?.join("\n") || "",
        domainFramework: state.extractionData.operationalFramework || "",
        qualityCriteria: state.extractionData.qualityCriteria || "",
        outputExamples: state.extractionData.outputExamples || "",
        antiPatterns: state.extractionData.antiPatterns || "",
      };
    }

    state.proposedDesign = design;
    state.phase = "naming";

    // Ask for name FIRST, then show design after user picks a name
    await ctx.sendMessage(squadId, "✨ Gerando sugestões de nome...");
    const nameResult = await adapter.chat([{ role: "user",
      content: `Sugira 3 nomes criativos curtos em português para squad "${design.description}".\nAgentes: ${design.agents.map((a) => a.name).join(", ")}\n\nFormato:\n**Como quer chamar esse squad?**\n\n1. **Nome 1**\n2. **Nome 2**\n3. **Nome 3**\n\nEscolha uma ou digite o nome que preferir!` }]);
    state.nameSuggestions = [...nameResult.output.matchAll(/\d+\.\s+\*\*(.+?)\*\*/g)].map((m) => m[1]!);
    await ctx.sendMessage(squadId, nameResult.output);
  } catch (err) {
    console.error("[Architect] Design error:", err);
    // Fallback — never leave user stuck. Ask name first.
    const fb = generateFallbackDesign(state, detectedSkills);
    state.proposedDesign = fb;
    state.phase = "naming";
    state.nameSuggestions = [fb.name];
    await ctx.sendMessage(squadId, `**Como quer chamar esse squad?**\n\n1. **${fb.name}**\n\nDigite o nome que preferir!`);
  }
}

function generateFallbackDesign(state: ArchitectConversationState, skills: string[]): NonNullable<ArchitectConversationState["proposedDesign"]> {
  const purpose = state.discovery.purpose || "Squad";
  const shortName = purpose.split(/\s+/).slice(0, 4).join(" ");
  const code = shortName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return {
    name: shortName, code, description: purpose, icon: "🚀", performanceMode: "high",
    agents: [
      { id: "pesquisador", name: "Pedro Pesquisa", role: "Researcher", icon: "🔍", modelTier: "powerful", execution: "subagent", description: "Pesquisa tendências e dados relevantes" },
      { id: "criador", name: "Clara Criação", role: "Creator", icon: "✍️", modelTier: "powerful", execution: "inline", description: "Cria conteúdo otimizado para as plataformas" },
      { id: "revisor", name: "Roberto Revisão", role: "Reviewer", icon: "✅", modelTier: "powerful", execution: "inline", description: "Revisa qualidade e consistência" },
    ],
    pipeline: [
      { step: 1, name: "Briefing", type: "checkpoint-input" },
      { step: 2, name: "Pesquisa", type: "agent", agentId: "pesquisador" },
      { step: 3, name: "Seleção de Pauta", type: "checkpoint-select" },
      { step: 4, name: "Criação", type: "agent", agentId: "criador" },
      { step: 5, name: "Aprovação", type: "checkpoint-approve" },
      { step: 6, name: "Revisão", type: "agent", agentId: "revisor" },
      { step: 7, name: "Aprovação Final", type: "checkpoint-approve" },
    ],
    skills,
    contentBrief: {
      nicho: state.discovery.nicho || "", targetPlatforms: state.discovery.targetPlatforms || [],
      tonePreferences: [state.discovery.tonePreference || ""], contentPillars: state.discovery.contentPillars || [],
      audience: state.discovery.audience || "", referenceProfiles: state.discovery.references || [], language: "pt-BR",
    },
  };
}

// ══════════════════════════════════════════════════════════
// PHASE 5: BUILD (generate rich agent definitions — 120+ lines)
// ══════════════════════════════════════════════════════════

export async function handleBuildPhase(ctx: WorkflowContext): Promise<void> {
  const { state, squadId, providerConfig } = ctx;
  const design = state.proposedDesign;
  if (!design) { state.phase = "idle"; await ctx.sendMessage(squadId, "Sem design pronto."); return; }

  await ctx.sendMessage(squadId, `🏗️ **Construindo squad "${design.name}" com ${design.agents.length} agentes (~2-3 min)...**`);
  if (!state.buildData) state.buildData = {};
  const generated: Array<{ name: string; role: string; content: string }> = [];

  const adapter = createAdapter({ name: "AgentBuilder", role: "Agent Definition Generator", config: {} }, providerConfig);
  const bpSample = (state.discovery.targetFormats || []).slice(0, 2).map((f) => getBestPractice(f)).filter(Boolean).join("\n\n").substring(0, 600);
  const exampleAgent = getExampleSquad("instagram-carrossel")?.agents?.[0]?.content?.substring(0, 500) || "";

  for (const ag of design.agents) {
    try {
      const r = await withProgress(ctx, `🤖 Gerando **${ag.name}** (120+ linhas)...`,
        () => adapter.chat([{ role: "user",
          content: `Gere a definição COMPLETA do agente. MÍNIMO 120 linhas. Seções obrigatórias:

# ${ag.name}

## Role Expansion (4+ responsabilidades)
## Calibration (tom: ${state.discovery.tonePreference || "profissional"}, formato, comprimento)
## Voice Guidance (AMOSTRA REAL de output: 5-10 linhas)
## Tone Rules (6+ regras com exemplos)
## Additional Principles (6+ princípios do nicho)
## Anti-Patterns (5+ com exemplos concretos)
## Quality Criteria (5+ critérios com checkbox)
## Veto Conditions (3+ condições que invalidam)

CONTEXTO: ${ag.name} (${ag.role}) — ${ag.description}
Squad: ${state.discovery.purpose} | Público: ${state.discovery.audience}
${state.extractionData?.operationalFramework ? `\nFRAMEWORK:\n${state.extractionData.operationalFramework.substring(0, 400)}` : ""}
${state.extractionData?.antiPatterns ? `\nANTI-PATTERNS:\n${state.extractionData.antiPatterns.substring(0, 250)}` : ""}
${bpSample ? `\nBEST PRACTICES:\n${bpSample}` : ""}
${exampleAgent ? `\nEXEMPLO REAL:\n${exampleAgent}` : ""}` }]),
      );
      generated.push({ name: ag.name, role: ag.role, content: r.output });
    } catch (e) {
      console.error(`[Architect] Agent ${ag.name}:`, e);
      await ctx.sendMessage(squadId, `⚠️ ${ag.name}: usando config básica...`);
      generated.push({ name: ag.name, role: ag.role,
        content: `# ${ag.name}\n\n## Role Expansion\n${ag.description}\n\n## Calibration\nTom: ${state.discovery.tonePreference}\n\n## Voice Guidance\nSeguir tom definido.\n\n## Tone Rules\n1. Consistência\n2. Linguagem do público\n\n## Additional Principles\n1. Qualidade\n2. Foco no público\n\n## Anti-Patterns\n1. Sem jargão\n\n## Quality Criteria\n- [ ] Alinhado ao propósito\n\n## Veto Conditions\n1. Fora do tom` });
    }
  }

  state.buildData.generatedAgents = generated;
  await ctx.sendMessage(squadId, "💾 **Salvando squad...**");
  state.phase = "validate";
  await handleValidatePhase(ctx);
}

// ══════════════════════════════════════════════════════════
// PHASE 6: VALIDATE (quality gates — visual report)
// ══════════════════════════════════════════════════════════

export async function handleValidatePhase(ctx: WorkflowContext): Promise<void> {
  const { state, squadId } = ctx;
  const design = state.proposedDesign;
  if (!design || !state.buildData?.generatedAgents) { state.phase = "idle"; return; }

  const agents = state.buildData.generatedAgents;
  const gates: Array<{ gate: string; agent?: string; passed: boolean; details: string; lines?: number }> = [];
  const reqSections = ["Role Expansion", "Voice Guidance", "Anti-Patterns", "Quality Criteria"];
  let totalLines = 0;

  for (const a of agents) {
    const lines = a.content.split("\n").length; totalLines += lines;
    const missing = reqSections.filter((s) => !a.content.includes(s));
    const ok = lines >= 80 && missing.length <= 1;
    gates.push({ gate: "Agent Completeness", agent: a.name, passed: ok, lines,
      details: ok ? `${lines} linhas, seções OK` : `${lines} linhas${missing.length ? `, faltam: ${missing.join(", ")}` : ""}` });
  }

  const steps = design.pipeline?.length || 0;
  const hasCp = design.pipeline?.some((s) => s.type?.includes("checkpoint"));
  gates.push({ gate: "Pipeline Coherence", passed: steps >= 3 && !!hasCp,
    details: `${steps} steps, ${hasCp ? "✅ checkpoints" : "❌ sem checkpoints"}` });

  const hasRev = design.agents.some((a) => /review|revis|quality/i.test(a.role) || /review|revis/i.test(a.name));
  gates.push({ gate: "Reviewer Agent", passed: hasRev, details: hasRev ? "Presente" : "Ausente" });

  const hasPub = design.agents.some((a) => /publish|publica/i.test(a.role));
  const hasGate = !hasPub || design.pipeline?.some((s, i) => {
    const nx = design.pipeline?.[i + 1]; if (!nx) return false;
    const na = design.agents.find((a) => a.id === nx.agentId);
    return s.type?.includes("checkpoint") && na && /publish|publica/i.test(na.role);
  });
  gates.push({ gate: "Content Approval", passed: !!hasGate, details: hasPub ? (hasGate ? "Checkpoint OK" : "Falta") : "N/A" });

  state.buildData.validationResults = gates;
  const allOk = gates.every((g) => g.passed);
  const pc = gates.filter((g) => g.passed).length;

  let r = "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n📋 **QUALITY REPORT**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
  r += `**${pc}/${gates.length}** gates passed ${allOk ? "✅" : "⚠️"}\n\n`;
  const ag = gates.filter((g) => g.gate === "Agent Completeness");
  if (ag.length) { r += `**Agent Completeness** ${ag.every((g) => g.passed) ? "✅" : "❌"}\n`; ag.forEach((g) => r += `  ${g.passed ? "✅" : "❌"} ${g.agent}: ${g.details}\n`); r += "\n"; }
  gates.filter((g) => g.gate !== "Agent Completeness").forEach((g) => r += `**${g.gate}** ${g.passed ? "✅" : "❌"}: ${g.details}\n`);
  r += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n📊 **Resumo:** 🤖 ${agents.length} agentes (${totalLines} linhas) · ⚡ ${steps} steps · 🛡️ ${design.skills?.length || 0} skills\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  r += allOk ? "🎉 **Todas as validações passaram!**" : "⚠️ Alguns gates não passaram. Você pode editar depois.";

  state.phase = "idle";
  await ctx.sendMessage(squadId, r);
}

// ── Helpers ──

function buildDiscoverySummary(state: ArchitectConversationState): string {
  const d = state.discovery;
  return [
    "📋 **Resumo do Discovery**\n",
    `**Propósito:** ${d.purpose || "N/A"}`,
    `**Público:** ${d.audience || "N/A"}`,
    `**Tom:** ${d.tonePreference || "N/A"}`,
    `**Pilares:** ${d.contentPillars?.join(", ") || "N/A"}`,
    d.targetPlatforms?.length ? `**Plataformas:** ${d.targetPlatforms.join(", ")}` : null,
  ].filter(Boolean).join("\n");
}

function extractUrls(text: string): string[] { return text.match(/https?:\/\/[^\s,)]+/g) || []; }

function detectPlatform(url: string): string {
  if (url.includes("instagram.com")) return "instagram";
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  if (url.includes("x.com") || url.includes("twitter.com")) return "twitter";
  if (url.includes("linkedin.com")) return "linkedin";
  return "web";
}
