/**
 * Image Fetcher Skill
 *
 * Fetches images from multiple sources:
 * 1. Pexels API (primary, free 200 req/hr)
 * 2. Google Images scraping (no key needed)
 * 3. Unsplash API (when user configures UNSPLASH_ACCESS_KEY)
 * 4. Direct URL validation
 */

interface FetchOptions {
  mode: "search" | "screenshot" | "direct";
  query?: string;
  url?: string;
  width?: number;
  height?: number;
}

interface ImageResult {
  url: string;
  alt: string;
  source: string;
  width?: number;
  height?: number;
}

interface FetchResult {
  success: boolean;
  images?: ImageResult[];
  error?: string;
}

export class ImageFetcher {
  private unsplashKey?: string;
  private pexelsKey?: string;

  constructor(unsplashKey?: string, pexelsKey?: string) {
    this.unsplashKey = unsplashKey;
    this.pexelsKey = pexelsKey;
  }

  /** Search images — tries Pexels first, then Google, Unsplash, and Picsum */
  async searchImages(query: string, count = 5): Promise<FetchResult> {
    // 1. Pexels API (most reliable, free 200 req/hr)
    if (this.pexelsKey) {
      const pexelsResult = await this.searchPexels(query, count);
      if (pexelsResult.success && pexelsResult.images?.length) return pexelsResult;
    }

    // 2. Google Images scraping (no key needed)
    const googleResult = await this.searchGoogle(query, count);
    if (googleResult.success && googleResult.images?.length) return googleResult;

    // 3. Unsplash API (if key configured)
    if (this.unsplashKey) {
      const unsplashResult = await this.searchUnsplash(query, count);
      if (unsplashResult.success && unsplashResult.images?.length) return unsplashResult;
    }

    // 4. Picsum fallback (always works, deterministic)
    return {
      success: true,
      images: Array.from({ length: Math.min(count, 3) }, (_, i) => ({
        url: `https://picsum.photos/seed/${encodeURIComponent(query)}-${i}/1080/1080`,
        alt: query,
        source: "picsum",
      })),
    };
  }

  /** Search via Pexels API (requires API key) */
  private async searchPexels(query: string, count: number): Promise<FetchResult> {
    try {
      const res = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${count}&locale=pt-BR`,
        { headers: { Authorization: this.pexelsKey! } },
      );
      if (!res.ok) return { success: false, error: `Pexels returned ${res.status}` };
      const data = (await res.json()) as { photos?: Array<{ src: { large: string }; alt: string }> };
      return {
        success: true,
        images: (data.photos ?? []).map((p) => ({
          url: p.src.large,
          alt: p.alt || query,
          source: "pexels",
        })),
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Erro no Pexels" };
    }
  }

  /** Scrape Google Images — extracts image URLs from search results page */
  private async searchGoogle(query: string, count: number): Promise<FetchResult> {
    try {
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=isch&ijn=0`;
      const res = await fetch(searchUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml",
          "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
        },
      });

      if (!res.ok) return { success: false, error: `Google returned ${res.status}` };

      const html = await res.text();
      const images = this.extractGoogleImages(html, count);

      if (images.length === 0) {
        return { success: false, error: "Nenhuma imagem encontrada no Google" };
      }

      return {
        success: true,
        images: images.map((url) => ({
          url,
          alt: query,
          source: "google",
        })),
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Erro no Google Images" };
    }
  }

  /** Extract image URLs from Google Images HTML */
  private extractGoogleImages(html: string, count: number): string[] {
    const urls: string[] = [];

    // Pattern 1: data-src attributes (thumbnail URLs)
    const dataSrcMatches = html.matchAll(/data-src="(https:\/\/[^"]+)"/g);
    for (const match of dataSrcMatches) {
      if (urls.length >= count) break;
      const url = match[1]!;
      if (url.includes("gstatic.com") || url.includes("encrypted-tbn")) {
        urls.push(url);
      }
    }

    // Pattern 2: Full-size image URLs in JSON data
    if (urls.length < count) {
      const jsonMatches = html.matchAll(/\["(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)",\s*(\d+),\s*(\d+)\]/gi);
      for (const match of jsonMatches) {
        if (urls.length >= count) break;
        const url = match[1]!;
        // Skip Google's own assets and tiny images
        if (!url.includes("google.com") && !url.includes("gstatic.com") && !url.includes("googleapis.com")) {
          urls.push(url);
        }
      }
    }

    // Pattern 3: og:image or direct image links
    if (urls.length < count) {
      const imgMatches = html.matchAll(/https:\/\/[^\s"']+\.(?:jpg|jpeg|png|webp)(?:\?[^\s"']*)?/gi);
      for (const match of imgMatches) {
        if (urls.length >= count) break;
        const url = match[0];
        if (!url.includes("google") && !url.includes("gstatic") && !urls.includes(url)) {
          urls.push(url);
        }
      }
    }

    return urls;
  }

  /** Search via Unsplash API (requires access key) */
  private async searchUnsplash(query: string, count: number): Promise<FetchResult> {
    try {
      const res = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${count}`,
        { headers: { Authorization: `Client-ID ${this.unsplashKey}` } },
      );

      if (!res.ok) return { success: false, error: `Unsplash returned ${res.status}` };

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
      return { success: false, error: error instanceof Error ? error.message : "Erro no Unsplash" };
    }
  }

  /** Fetch image directly from URL — validates it's actually an image */
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
        return { success: false, error: "Screenshot mode requires Playwright (not available in web mode)" };
      default:
        return { success: false, error: "Modo nao suportado" };
    }
  }
}
