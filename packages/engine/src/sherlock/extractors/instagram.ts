import type { ProfileConfig, RawContent } from "../types";

export class InstagramExtractor {
  private page: import("playwright").Page;
  constructor(page: import("playwright").Page) { this.page = page; }

  async extract(profile: ProfileConfig, onProgress?: (msg: string) => void): Promise<RawContent[]> {
    const contents: RawContent[] = [];
    const maxContents = profile.maxContents ?? (profile.mode === "profile_1" ? 1 : 10);

    if (profile.mode === "single_post") {
      const post = await this.extractSinglePost(profile.url);
      if (post) contents.push(post);
      return contents;
    }

    const username = profile.url.match(/instagram\.com\/([^/?]+)/)?.[1] ?? "";
    await this.page.goto(`https://www.instagram.com/${username}/`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await this.page.waitForTimeout(3000);

    // Try to get post links from grid
    const postLinks = await this.page.$$('a[href*="/p/"], a[href*="/reel/"]');
    onProgress?.(`Encontrados ${postLinks.length} posts no grid de @${username}`);

    for (let i = 0; i < Math.min(postLinks.length, maxContents); i++) {
      try {
        onProgress?.(`Extraindo post ${i + 1}/${Math.min(postLinks.length, maxContents)}...`);
        const href = await postLinks[i]!.getAttribute("href");
        if (!href) continue;

        const postUrl = href.startsWith("http") ? href : `https://www.instagram.com${href}`;
        const post = await this.extractSinglePost(postUrl);
        if (post) contents.push(post);
      } catch { /* continue */ }
    }

    return contents;
  }

  private async extractSinglePost(url: string): Promise<RawContent | null> {
    try {
      await this.page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
      await this.page.waitForTimeout(2000);

      const caption = await this.page.$eval(
        'div[class*="Caption"] span, meta[property="og:description"]',
        (el) => el.getAttribute("content") || el.textContent || "",
      ).catch(() => "");

      const isCarousel = !!(await this.page.$('button[aria-label*="Next"], button[aria-label*="Próximo"]'));

      const slides: Array<{ index: number; text: string }> = [];
      if (isCarousel) {
        let idx = 1;
        slides.push({ index: idx, text: await this.getSlideText() });
        for (let s = 0; s < 12; s++) {
          const next = await this.page.$('button[aria-label*="Next"], button[aria-label*="Próximo"]');
          if (!next) break;
          await next.click();
          await this.page.waitForTimeout(600);
          idx++;
          slides.push({ index: idx, text: await this.getSlideText() });
        }
      }

      return {
        id: url.split("/").filter(Boolean).pop() || crypto.randomUUID(),
        platform: "instagram",
        type: isCarousel ? "carousel" : url.includes("/reel/") ? "reel" : "single_image",
        url,
        date: new Date().toISOString().split("T")[0]!,
        metrics: {},
        caption: caption.substring(0, 2000),
        slides: slides.length > 0 ? slides : undefined,
      };
    } catch { return null; }
  }

  private async getSlideText(): Promise<string> {
    return this.page.$eval('img[alt]:not([alt=""])', (el) => el.getAttribute("alt") || "").catch(() => "[Visual]");
  }
}
