import { InstagramPublisher } from "./instagram-publisher";
import { LinkedInPublisher } from "./linkedin-publisher";
import { ApifyScraper } from "./apify-scraper";
import { BlotatoPublisher } from "./blotato-publisher";
import { CanvaDesigner } from "./canva-designer";
import { ImageFetcher } from "./image-fetcher";

export interface SkillConfigField {
  key: string;
  label: string;
  type: "text" | "password" | "url";
  placeholder: string;
  helpText: string;
}

export interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: "api" | "script" | "prompt" | "mcp";
  platform?: string;
  category: "publishing" | "scraping" | "design" | "research" | "analysis";
  requiredConfig: SkillConfigField[];
  testConnection?: (config: Record<string, string>) => Promise<{ ok: boolean; detail?: string }>;
  execute: (config: Record<string, string>, params: Record<string, unknown>) => Promise<unknown>;
}

export const SKILL_REGISTRY: SkillDefinition[] = [
  // ─── Publishing ───
  {
    id: "instagram-publisher",
    name: "Instagram Publisher",
    description: "Publica posts e carrosseis no Instagram via Graph API",
    icon: "📸",
    type: "api",
    platform: "instagram",
    category: "publishing",
    requiredConfig: [
      { key: "INSTAGRAM_USER_ID", label: "Instagram User ID", type: "text", placeholder: "17841400123456789", helpText: "Graph API Explorer > /me/accounts > /{page-id}?fields=instagram_business_account" },
      { key: "INSTAGRAM_ACCESS_TOKEN", label: "Access Token (longa duracao)", type: "password", placeholder: "EAAG...", helpText: "developers.facebook.com > Graph API Explorer > instagram_content_publish" },
    ],
    testConnection: async (config) => {
      try {
        const res = await fetch(`https://graph.facebook.com/v21.0/${config.INSTAGRAM_USER_ID}?fields=username,followers_count&access_token=${config.INSTAGRAM_ACCESS_TOKEN}`);
        if (!res.ok) return { ok: false, detail: `API error: ${res.status}` };
        const data = await res.json();
        return { ok: true, detail: `@${data.username} (${data.followers_count} seguidores)` };
      } catch (e) { return { ok: false, detail: e instanceof Error ? e.message : "Erro" }; }
    },
    execute: async (config, params) => {
      const pub = new InstagramPublisher();
      return pub.publishCarousel({ accessToken: config.INSTAGRAM_ACCESS_TOKEN!, userId: config.INSTAGRAM_USER_ID!, images: params.images as string[], caption: params.caption as string, dryRun: params.dryRun as boolean });
    },
  },
  {
    id: "linkedin-publisher",
    name: "LinkedIn Publisher",
    description: "Publica posts no LinkedIn com texto, imagens e artigos",
    icon: "💼",
    type: "api",
    platform: "linkedin",
    category: "publishing",
    requiredConfig: [
      { key: "LINKEDIN_ACCESS_TOKEN", label: "Access Token", type: "password", placeholder: "AQV...", helpText: "linkedin.com/developers > Criar App > OAuth 2.0" },
      { key: "LINKEDIN_AUTHOR_URN", label: "Author URN", type: "text", placeholder: "urn:li:person:ABC123", helpText: "GET /v2/userinfo com access token > sub field" },
    ],
    testConnection: async (config) => {
      try {
        const res = await fetch("https://api.linkedin.com/v2/userinfo", { headers: { Authorization: `Bearer ${config.LINKEDIN_ACCESS_TOKEN}` } });
        if (!res.ok) return { ok: false, detail: `API error: ${res.status}` };
        const data = await res.json();
        return { ok: true, detail: `${data.name} (${data.email})` };
      } catch (e) { return { ok: false, detail: e instanceof Error ? e.message : "Erro" }; }
    },
    execute: async (config, params) => {
      const pub = new LinkedInPublisher();
      return pub.publishPost({ accessToken: config.LINKEDIN_ACCESS_TOKEN!, authorUrn: config.LINKEDIN_AUTHOR_URN!, text: params.text as string, images: params.images as string[], articleUrl: params.articleUrl as string });
    },
  },
  {
    id: "blotato-publisher",
    name: "Blotato Multi-Platform",
    description: "Publica em Instagram, LinkedIn, Twitter, TikTok e YouTube de uma vez",
    icon: "🌐",
    type: "api",
    category: "publishing",
    requiredConfig: [
      { key: "BLOTATO_API_KEY", label: "Blotato API Key", type: "password", placeholder: "bl_...", helpText: "app.blotato.com > Settings > API Keys" },
    ],
    testConnection: async (config) => {
      try {
        const pub = new BlotatoPublisher();
        const result = await pub.getAccounts(config.BLOTATO_API_KEY!);
        if (!result.ok) return { ok: false, detail: result.error };
        return { ok: true, detail: `${result.accounts?.length ?? 0} contas conectadas` };
      } catch (e) { return { ok: false, detail: e instanceof Error ? e.message : "Erro" }; }
    },
    execute: async (config, params) => {
      const pub = new BlotatoPublisher();
      return pub.publish({ apiKey: config.BLOTATO_API_KEY!, platforms: params.platforms as ("instagram" | "linkedin" | "twitter" | "tiktok" | "youtube")[], content: params.content as { text: string; images?: string[] }, scheduleAt: params.scheduleAt as string });
    },
  },

  // ─── Design ───
  {
    id: "canva-designer",
    name: "Canva Designer",
    description: "Cria designs profissionais usando templates Canva, autofill e exportacao",
    icon: "🎨",
    type: "api",
    category: "design",
    requiredConfig: [
      { key: "CANVA_ACCESS_TOKEN", label: "Canva Access Token", type: "password", placeholder: "CAT_...", helpText: "canva.com/developers > Create App > OAuth" },
    ],
    testConnection: async (config) => {
      try {
        const res = await fetch("https://api.canva.com/rest/v1/users/me", { headers: { Authorization: `Bearer ${config.CANVA_ACCESS_TOKEN}` } });
        if (!res.ok) return { ok: false, detail: `API error: ${res.status}` };
        const data = await res.json();
        return { ok: true, detail: `${data.display_name ?? "Conectado"}` };
      } catch (e) { return { ok: false, detail: e instanceof Error ? e.message : "Erro" }; }
    },
    execute: async (config, params) => {
      const designer = new CanvaDesigner();
      return designer.execute({ accessToken: config.CANVA_ACCESS_TOKEN!, ...params as { action: "create" | "search" | "export" | "autofill" } });
    },
  },

  // ─── Scraping / Research ───
  {
    id: "apify-scraper",
    name: "Apify Web Scraper",
    description: "Scraping avancado de sites, Instagram, YouTube, Twitter e TikTok",
    icon: "🕷️",
    type: "api",
    category: "scraping",
    requiredConfig: [
      { key: "APIFY_API_TOKEN", label: "Apify API Token", type: "password", placeholder: "apify_api_...", helpText: "console.apify.com > Settings > Integrations > API Token" },
    ],
    testConnection: async (config) => {
      try {
        const res = await fetch(`https://api.apify.com/v2/users/me?token=${config.APIFY_API_TOKEN}`);
        if (!res.ok) return { ok: false, detail: `API error: ${res.status}` };
        const data = await res.json();
        return { ok: true, detail: `${data.data?.username ?? "Conectado"}` };
      } catch (e) { return { ok: false, detail: e instanceof Error ? e.message : "Erro" }; }
    },
    execute: async (config, params) => {
      const scraper = new ApifyScraper();
      return scraper.runActor({ apiToken: config.APIFY_API_TOKEN!, actorId: params.actorId as string, input: params.input as Record<string, unknown> });
    },
  },
  {
    id: "image-fetcher",
    name: "Image Fetcher",
    description: "Busca imagens na web por pesquisa ou URL direta",
    icon: "🖼️",
    type: "api",
    category: "research",
    requiredConfig: [],
    execute: async (_config, params) => {
      const fetcher = new ImageFetcher();
      return fetcher.execute(params as { mode: "search" | "screenshot" | "direct"; query?: string; url?: string });
    },
  },
];

export function getSkillById(skillId: string): SkillDefinition | undefined {
  return SKILL_REGISTRY.find((s) => s.id === skillId);
}

export function getSkillsByCategory(category: string): SkillDefinition[] {
  return SKILL_REGISTRY.filter((s) => s.category === category);
}
