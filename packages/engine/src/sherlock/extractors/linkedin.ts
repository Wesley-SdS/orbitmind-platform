import type { ProfileConfig, RawContent } from "../types";

export class LinkedInExtractor {
  private page: import("playwright").Page;
  constructor(page: import("playwright").Page) { this.page = page; }

  async extract(profile: ProfileConfig, onProgress?: (msg: string) => void): Promise<RawContent[]> {
    const contents: RawContent[] = [];
    const maxContents = profile.maxContents ?? 5;

    await this.page.goto(profile.url + "/recent-activity/all/", { waitUntil: "domcontentloaded", timeout: 30000 });
    await this.page.waitForTimeout(3000);

    const posts = await this.page.$$('div.feed-shared-update-v2');
    onProgress?.(`Encontrados ${posts.length} posts no LinkedIn`);

    for (let i = 0; i < Math.min(posts.length, maxContents); i++) {
      try {
        // Expand "see more"
        const seeMore = await posts[i]!.$('button:has-text("see more"), button:has-text("ver mais")');
        if (seeMore) { await seeMore.click(); await this.page.waitForTimeout(500); }

        const text = await posts[i]!.$eval('.feed-shared-text, .break-words', (el) => el.textContent || "").catch(() => "");
        if (!text) continue;

        contents.push({
          id: crypto.randomUUID(),
          platform: "linkedin",
          type: text.length > 1000 ? "article" : "post",
          url: profile.url,
          date: new Date().toISOString().split("T")[0]!,
          metrics: {},
          caption: text.substring(0, 3000),
        });
        onProgress?.(`Post ${i + 1}: ${text.substring(0, 50)}...`);
      } catch { /* continue */ }
    }

    return contents;
  }
}
