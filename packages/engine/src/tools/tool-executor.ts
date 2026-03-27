import type { ToolDefinition, ToolCall, ToolResult } from "../adapters/types";
import { SKILL_REGISTRY, type SkillDefinition } from "../skills/skill-registry";

/**
 * Converts skills from the registry into ToolDefinitions for the LLM.
 */
export function skillsToTools(skillIds: string[]): ToolDefinition[] {
  const tools: ToolDefinition[] = [];

  for (const skillId of skillIds) {
    const skill = SKILL_REGISTRY.find(s => s.id === skillId);
    if (!skill) continue;
    tools.push(skillToTool(skill));
  }

  // Always include built-in tools
  tools.push({
    name: "web_search",
    description: "Pesquisar na web por informações atualizadas. Use para encontrar dados, tendências, notícias ou qualquer informação externa.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Termo de busca" },
      },
      required: ["query"],
    },
  });

  tools.push({
    name: "web_fetch",
    description: "Buscar o conteúdo de uma URL específica.",
    parameters: {
      type: "object",
      properties: {
        url: { type: "string", description: "URL para buscar" },
      },
      required: ["url"],
    },
  });

  return tools;
}

function skillToTool(skill: SkillDefinition): ToolDefinition {
  // Build JSON Schema from the skill's purpose
  const properties: Record<string, unknown> = {};
  const required: string[] = [];

  switch (skill.id) {
    case "image-fetcher":
      return {
        name: "image_search",
        description: "Buscar imagens na web por termo de pesquisa. Retorna URLs de imagens relevantes.",
        parameters: {
          type: "object",
          properties: {
            query: { type: "string", description: "Termo de busca para imagens" },
          },
          required: ["query"],
        },
      };

    case "instagram-publisher":
      return {
        name: "instagram_publish",
        description: "Publicar post ou carrossel no Instagram. Requer imagens e legenda.",
        parameters: {
          type: "object",
          properties: {
            caption: { type: "string", description: "Legenda do post" },
            images: { type: "array", items: { type: "string" }, description: "URLs das imagens" },
          },
          required: ["caption", "images"],
        },
      };

    case "linkedin-publisher":
      return {
        name: "linkedin_publish",
        description: "Publicar post no LinkedIn com texto e opcionalmente imagens.",
        parameters: {
          type: "object",
          properties: {
            text: { type: "string", description: "Texto do post" },
            images: { type: "array", items: { type: "string" }, description: "URLs das imagens (opcional)" },
          },
          required: ["text"],
        },
      };

    case "canva-designer":
      return {
        name: "canva_design",
        description: "Criar design profissional usando o Canva. Pode buscar templates, criar designs e exportar.",
        parameters: {
          type: "object",
          properties: {
            action: { type: "string", enum: ["search", "create", "export"], description: "Ação a executar" },
            searchQuery: { type: "string", description: "Busca de template (para action=search)" },
            templateId: { type: "string", description: "ID do template (para action=create)" },
            title: { type: "string", description: "Título do design" },
          },
          required: ["action"],
        },
      };

    case "apify-scraper":
      return {
        name: "web_scrape",
        description: "Fazer scraping avançado de sites, perfis de Instagram, YouTube, Twitter.",
        parameters: {
          type: "object",
          properties: {
            target: { type: "string", description: "URL ou identificador do alvo" },
            platform: { type: "string", enum: ["website", "instagram", "youtube", "twitter"], description: "Plataforma alvo" },
          },
          required: ["target", "platform"],
        },
      };

    case "blotato-publisher":
      return {
        name: "blotato_publish",
        description: "Publicar em múltiplas redes sociais ao mesmo tempo (Instagram, LinkedIn, Twitter, TikTok, YouTube).",
        parameters: {
          type: "object",
          properties: {
            text: { type: "string", description: "Texto do post" },
            platforms: { type: "array", items: { type: "string" }, description: "Redes para publicar" },
            images: { type: "array", items: { type: "string" }, description: "URLs das imagens" },
          },
          required: ["text", "platforms"],
        },
      };

    default:
      return {
        name: skill.id.replace(/-/g, "_"),
        description: skill.description,
        parameters: { type: "object", properties, required },
      };
  }
}

/**
 * Executes a tool call by routing to the appropriate skill.
 * Returns the result as a string for the LLM.
 */
export async function executeToolCall(
  call: ToolCall,
  skillConfigs: Record<string, Record<string, string>>,
): Promise<ToolResult> {
  try {
    const result = await routeToolCall(call, skillConfigs);
    return {
      toolCallId: call.id,
      content: typeof result === "string" ? result : JSON.stringify(result, null, 2),
    };
  } catch (error) {
    return {
      toolCallId: call.id,
      content: `Erro ao executar ${call.name}: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
    };
  }
}

async function routeToolCall(
  call: ToolCall,
  skillConfigs: Record<string, Record<string, string>>,
): Promise<unknown> {
  const args = call.arguments;

  switch (call.name) {
    case "web_search": {
      return { results: `[Resultados de busca para: "${args.query}"]`, note: "Web search não implementado neste ambiente. Use o conteúdo disponível." };
    }

    case "web_fetch": {
      try {
        const res = await fetch(args.url as string, { headers: { "User-Agent": "OrbitMind/1.0" } });
        const text = await res.text();
        return { url: args.url, content: text.substring(0, 5000) };
      } catch (e) {
        return { error: `Falha ao buscar ${args.url}: ${e instanceof Error ? e.message : "erro"}` };
      }
    }

    case "image_search": {
      const { ImageFetcher } = await import("../skills/image-fetcher");
      const fetcher = new ImageFetcher();
      return fetcher.execute({ mode: "search", query: args.query as string });
    }

    case "instagram_publish": {
      const config = skillConfigs["instagram-publisher"];
      if (!config?.INSTAGRAM_ACCESS_TOKEN) return { error: "Instagram não configurado. Configure em Settings > Integrações." };
      const { InstagramPublisher } = await import("../skills/instagram-publisher");
      const pub = new InstagramPublisher();
      return pub.publishCarousel({
        accessToken: config.INSTAGRAM_ACCESS_TOKEN,
        userId: config.INSTAGRAM_USER_ID ?? "",
        images: args.images as string[],
        caption: args.caption as string,
      });
    }

    case "linkedin_publish": {
      const config = skillConfigs["linkedin-publisher"];
      if (!config?.LINKEDIN_ACCESS_TOKEN) return { error: "LinkedIn não configurado. Configure em Settings > Integrações." };
      const { LinkedInPublisher } = await import("../skills/linkedin-publisher");
      const pub = new LinkedInPublisher();
      return pub.publishPost({
        accessToken: config.LINKEDIN_ACCESS_TOKEN,
        authorUrn: config.LINKEDIN_AUTHOR_URN ?? "",
        text: args.text as string,
        images: args.images as string[],
      });
    }

    case "canva_design": {
      const config = skillConfigs["canva-designer"];
      if (!config?.CANVA_ACCESS_TOKEN) return { error: "Canva não configurado." };
      const { CanvaDesigner } = await import("../skills/canva-designer");
      const designer = new CanvaDesigner();
      return designer.execute({
        accessToken: config.CANVA_ACCESS_TOKEN,
        action: args.action as "create" | "search" | "export",
        searchQuery: args.searchQuery as string,
        templateId: args.templateId as string,
        title: args.title as string,
      });
    }

    case "web_scrape": {
      const config = skillConfigs["apify-scraper"];
      if (!config?.APIFY_API_TOKEN) return { error: "Apify não configurado." };
      const { ApifyScraper } = await import("../skills/apify-scraper");
      const scraper = new ApifyScraper();
      const platform = args.platform as string;
      const target = args.target as string;
      if (platform === "instagram") return scraper.scrapeInstagramProfile(config.APIFY_API_TOKEN, target);
      if (platform === "youtube") return scraper.scrapeYouTubeChannel(config.APIFY_API_TOKEN, target);
      if (platform === "twitter") return scraper.scrapeTwitterProfile(config.APIFY_API_TOKEN, target);
      return scraper.scrapeWebsite(config.APIFY_API_TOKEN, target);
    }

    case "blotato_publish": {
      const config = skillConfigs["blotato-publisher"];
      if (!config?.BLOTATO_API_KEY) return { error: "Blotato não configurado." };
      const { BlotatoPublisher } = await import("../skills/blotato-publisher");
      const pub = new BlotatoPublisher();
      return pub.publish({
        apiKey: config.BLOTATO_API_KEY,
        platforms: args.platforms as ("instagram" | "linkedin" | "twitter" | "tiktok" | "youtube")[],
        content: { text: args.text as string, images: args.images as string[] },
      });
    }

    default:
      return { error: `Tool "${call.name}" não reconhecida.` };
  }
}
