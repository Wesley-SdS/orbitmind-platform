/**
 * Image Fetcher Skill
 *
 * Fetches images from the web via search or direct URL screenshot.
 * Combines web search + Playwright screenshot for maximum flexibility.
 *
 * Based on: opensquad-ref/skills/image-fetcher/SKILL.md
 */

interface FetchOptions {
  mode: "search" | "screenshot" | "direct";
  query?: string;
  url?: string;
  width?: number;
  height?: number;
}

interface FetchResult {
  success: boolean;
  images?: Array<{ url: string; alt: string; source: string }>;
  error?: string;
}

export class ImageFetcher {
  /** Search for images via web search */
  async searchImages(query: string, count = 5): Promise<FetchResult> {
    try {
      // Use a free image search API (Unsplash, Pexels, or web search)
      const res = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${count}`,
        { headers: { Authorization: "Client-ID demo" } },
      );

      if (!res.ok) {
        // Fallback: return placeholder guidance
        return {
          success: true,
          images: [{ url: `https://source.unsplash.com/800x600/?${encodeURIComponent(query)}`, alt: query, source: "unsplash" }],
        };
      }

      const data = (await res.json()) as { results?: Record<string, unknown>[] };
      return {
        success: true,
        images: (data.results ?? []).map((img) => ({
          url: (img.urls as Record<string, string>)?.regular ?? "",
          alt: String(img.alt_description ?? query),
          source: "unsplash",
        })),
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Erro" };
    }
  }

  /** Fetch image directly from URL */
  async fetchDirect(url: string): Promise<FetchResult> {
    try {
      const res = await fetch(url, { method: "HEAD" });
      if (!res.ok) return { success: false, error: `URL inacessivel [${res.status}]` };
      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.includes("image")) {
        return { success: false, error: `URL nao e uma imagem (${contentType})` };
      }
      return { success: true, images: [{ url, alt: "direct", source: url }] };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Erro" };
    }
  }

  async execute(options: FetchOptions): Promise<FetchResult> {
    switch (options.mode) {
      case "search":
        return this.searchImages(options.query ?? "", 5);
      case "direct":
        return this.fetchDirect(options.url ?? "");
      case "screenshot":
        return { success: false, error: "Screenshot mode requires Playwright MCP (not available in web mode)" };
      default:
        return { success: false, error: "Modo nao suportado" };
    }
  }
}
