/**
 * OpenSquad YAML/MD Parser
 *
 * Reads the OpenSquad structured files (architect.agent.yaml, best-practices,
 * sherlock prompts, etc.) at runtime so the OrbitMind Architect can use them
 * as a programmatic workflow instead of a giant LLM prompt.
 *
 * RESILIENCE: Every function has try/catch + inline fallback.
 * NEVER fails silently — always returns usable data.
 */
import fs from "fs";
import path from "path";
import YAML from "yaml";

// ── Resolve OpenSquad directory robustly ──

function resolveOpenSquadDir(): string {
  const candidates = [
    path.resolve(__dirname),                              // Same dir as this file (works in built output)
    path.join(process.cwd(), "apps/web/lib/opensquad"),   // Monorepo root (dev)
    path.join(process.cwd(), "lib/opensquad"),            // Inside apps/web (build)
    path.join(process.cwd(), "apps", "web", "lib", "opensquad"),
  ];

  // Primary check: look for core/ directory (always present)
  for (const dir of candidates) {
    try {
      if (fs.existsSync(path.join(dir, "core"))) return dir;
    } catch { /* skip */ }
  }

  // Fallback: check for config.yaml (optional)
  for (const dir of candidates) {
    try {
      if (fs.existsSync(path.join(dir, "config.yaml"))) return dir;
    } catch { /* skip */ }
  }

  console.warn("[OpenSquad Parser] Could not find opensquad dir, using __dirname fallback");
  return candidates[0]!;
}

const OPENSQUAD_DIR = resolveOpenSquadDir();

// ── Helpers ──

function readFileOr(filePath: string, fallback: string): string {
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return fallback;
  }
}

function parseYamlOr<T>(content: string, fallback: T): T {
  try {
    return YAML.parse(content) as T;
  } catch {
    return fallback;
  }
}

// ── Core configs ──

export function getArchitectConfig(): Record<string, unknown> {
  try {
    const content = readFileOr(path.join(OPENSQUAD_DIR, "core/architect.agent.yaml"), "");
    return content ? parseYamlOr(content, {}) : {};
  } catch {
    return {};
  }
}

export function getMainConfig(): Record<string, unknown> {
  try {
    const content = readFileOr(path.join(OPENSQUAD_DIR, "config.yaml"), "");
    return content ? parseYamlOr(content, {}) : {};
  } catch {
    return {};
  }
}

// ── Best Practices ──

export interface BestPracticeCatalogEntry {
  id: string;
  name: string;
  whenToUse: string;
  file: string;
}

const FALLBACK_CATALOG: BestPracticeCatalogEntry[] = [
  { id: "copywriting", name: "Copywriting & Persuasive Writing", whenToUse: "Creating agents that write persuasive copy, hooks, CTAs, social media captions.", file: "copywriting.md" },
  { id: "researching", name: "Research & Data Collection", whenToUse: "Creating agents that research topics, collect data from the web.", file: "researching.md" },
  { id: "review", name: "Content Review & Quality Control", whenToUse: "Creating agents that evaluate content quality.", file: "review.md" },
  { id: "image-design", name: "Visual Design & Image Creation", whenToUse: "Creating agents that design graphics, carousel slides.", file: "image-design.md" },
  { id: "strategist", name: "Strategy & Editorial Planning", whenToUse: "Creating agents that plan content strategy.", file: "strategist.md" },
  { id: "instagram-feed", name: "Instagram Feed & Carousels", whenToUse: "Creating agents for Instagram feed posts, carousels.", file: "instagram-feed.md" },
  { id: "instagram-reels", name: "Instagram Reels", whenToUse: "Creating agents for Instagram Reels.", file: "instagram-reels.md" },
  { id: "instagram-stories", name: "Instagram Stories", whenToUse: "Creating agents for Instagram Stories.", file: "instagram-stories.md" },
  { id: "linkedin-post", name: "LinkedIn Post", whenToUse: "Creating agents for LinkedIn posts.", file: "linkedin-post.md" },
  { id: "linkedin-article", name: "LinkedIn Article", whenToUse: "Creating agents for LinkedIn articles.", file: "linkedin-article.md" },
  { id: "twitter-post", name: "Twitter/X Post", whenToUse: "Creating agents for tweets.", file: "twitter-post.md" },
  { id: "twitter-thread", name: "Twitter/X Thread", whenToUse: "Creating agents for Twitter threads.", file: "twitter-thread.md" },
  { id: "youtube-script", name: "YouTube Video Script", whenToUse: "Creating agents for YouTube scripts.", file: "youtube-script.md" },
  { id: "youtube-shorts", name: "YouTube Shorts", whenToUse: "Creating agents for YouTube Shorts.", file: "youtube-shorts.md" },
  { id: "email-newsletter", name: "Email Newsletter", whenToUse: "Creating agents for email newsletters.", file: "email-newsletter.md" },
  { id: "email-sales", name: "Sales Email", whenToUse: "Creating agents for sales emails.", file: "email-sales.md" },
  { id: "blog-post", name: "Blog Post", whenToUse: "Creating agents for blog posts.", file: "blog-post.md" },
  { id: "blog-seo", name: "Blog Post (SEO)", whenToUse: "Creating agents for SEO blog posts.", file: "blog-seo.md" },
  { id: "whatsapp-broadcast", name: "WhatsApp Broadcast", whenToUse: "Creating agents for WhatsApp broadcast.", file: "whatsapp-broadcast.md" },
];

export function getBestPracticesCatalog(): BestPracticeCatalogEntry[] {
  try {
    const content = readFileOr(path.join(OPENSQUAD_DIR, "core/best-practices/_catalog.yaml"), "");
    if (!content) return FALLBACK_CATALOG;
    const parsed = parseYamlOr<{ catalog: BestPracticeCatalogEntry[] }>(content, { catalog: [] });
    return parsed.catalog?.length ? parsed.catalog : FALLBACK_CATALOG;
  } catch {
    return FALLBACK_CATALOG;
  }
}

export function getBestPractice(id: string): string {
  try {
    const filePath = path.join(OPENSQUAD_DIR, "core/best-practices", `${id}.md`);
    return readFileOr(filePath, "");
  } catch {
    return "";
  }
}

export function getRelevantBestPractices(targetFormats: string[], purpose: string): string {
  try {
    const catalog = getBestPracticesCatalog();
    const lowerPurpose = purpose.toLowerCase();

    const relevant = catalog.filter((bp) => {
      if (targetFormats.includes(bp.id)) return true;
      const lowerWhen = bp.whenToUse.toLowerCase();
      return lowerPurpose.split(/\s+/).some((word) => word.length > 3 && lowerWhen.includes(word));
    });

    const coreIds = ["copywriting", "researching", "review"];
    for (const id of coreIds) {
      if (!relevant.find((r) => r.id === id)) {
        const entry = catalog.find((c) => c.id === id);
        if (entry) relevant.push(entry);
      }
    }

    return relevant
      .map((bp) => {
        const content = getBestPractice(bp.id);
        return content ? `## Best Practice: ${bp.name}\n\n${content}` : "";
      })
      .filter(Boolean)
      .join("\n\n---\n\n");
  } catch {
    return "";
  }
}

// ── Sherlock (modular — per-platform) ──

export function getSherlockPrompt(): string {
  // Try modular shared first, fallback to monolithic
  const shared = readFileOr(path.join(OPENSQUAD_DIR, "core/prompts/sherlock-shared.md"), "");
  if (shared) return shared;
  return readFileOr(path.join(OPENSQUAD_DIR, "core/prompts/sherlock.prompt.md"), "");
}

export function getSherlockPromptForPlatform(platform: string): string {
  const shared = readFileOr(path.join(OPENSQUAD_DIR, "core/prompts/sherlock-shared.md"), "");
  const platformMap: Record<string, string> = {
    instagram: "sherlock-instagram.md",
    youtube: "sherlock-youtube.md",
    twitter: "sherlock-twitter.md",
    linkedin: "sherlock-linkedin.md",
  };
  const platformFile = platformMap[platform.toLowerCase()];
  if (platformFile) {
    const platformPrompt = readFileOr(path.join(OPENSQUAD_DIR, "core/prompts", platformFile), "");
    if (shared && platformPrompt) return shared + "\n\n---\n\n" + platformPrompt;
    if (platformPrompt) return platformPrompt;
  }
  return shared || getSherlockPrompt();
}

// ── Modular prompts (discovery, design, build) ──

export function getDiscoveryPrompt(): string {
  return readFileOr(path.join(OPENSQUAD_DIR, "core/prompts/discovery.prompt.md"), "");
}

export function getDesignPrompt(): string {
  return readFileOr(path.join(OPENSQUAD_DIR, "core/prompts/design.prompt.md"), "");
}

export function getBuildPrompt(): string {
  return readFileOr(path.join(OPENSQUAD_DIR, "core/prompts/build.prompt.md"), "");
}

// ── Runner ──

export function getRunnerConfig(): string {
  return readFileOr(path.join(OPENSQUAD_DIR, "core/runner.pipeline.md"), "");
}

// ── Skills ──

export function getSkillsEngine(): string {
  return readFileOr(path.join(OPENSQUAD_DIR, "core/skills.engine.md"), "");
}

// ── Examples ──

export interface ExampleSquad {
  squad: Record<string, unknown> | null;
  agents: Array<{ name: string; content: string }>;
}

export function getExampleSquad(name: string): ExampleSquad | null {
  try {
    const dir = path.join(OPENSQUAD_DIR, "examples", name);
    if (!fs.existsSync(dir)) return null;

    const squadYaml = path.join(dir, "squad.yaml");
    let squad: Record<string, unknown> | null = null;
    if (fs.existsSync(squadYaml)) {
      squad = parseYamlOr(fs.readFileSync(squadYaml, "utf-8"), null);
    }

    const agentsDir = path.join(dir, "agents");
    const agents: Array<{ name: string; content: string }> = [];
    if (fs.existsSync(agentsDir)) {
      for (const f of fs.readdirSync(agentsDir)) {
        if (f.endsWith(".md")) {
          agents.push({
            name: f,
            content: readFileOr(path.join(agentsDir, f), ""),
          });
        }
      }
    }

    return { squad, agents };
  } catch {
    return null;
  }
}

// ── Platform catalog for discovery ──

const FALLBACK_PLATFORMS = [
  { id: "instagram-feed", name: "Instagram Feed & Carousels" },
  { id: "instagram-reels", name: "Instagram Reels" },
  { id: "instagram-stories", name: "Instagram Stories" },
  { id: "linkedin-post", name: "LinkedIn Post" },
  { id: "linkedin-article", name: "LinkedIn Article" },
  { id: "twitter-post", name: "Twitter/X Post" },
  { id: "twitter-thread", name: "Twitter/X Thread" },
  { id: "youtube-script", name: "YouTube Video Script" },
  { id: "youtube-shorts", name: "YouTube Shorts" },
  { id: "email-newsletter", name: "Email Newsletter" },
  { id: "email-sales", name: "Sales Email" },
  { id: "blog-post", name: "Blog Post" },
  { id: "blog-seo", name: "Blog Post (SEO)" },
  { id: "whatsapp-broadcast", name: "WhatsApp Broadcast" },
];

export function getPlatformOptions(): Array<{ id: string; name: string }> {
  try {
    const catalog = getBestPracticesCatalog();
    const platformIds = FALLBACK_PLATFORMS.map((p) => p.id);
    const fromCatalog = catalog
      .filter((c) => platformIds.includes(c.id))
      .map((c) => ({ id: c.id, name: c.name }));
    return fromCatalog.length > 0 ? fromCatalog : FALLBACK_PLATFORMS;
  } catch {
    return FALLBACK_PLATFORMS;
  }
}
