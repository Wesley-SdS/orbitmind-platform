import type { ProfileConfig, RawContent } from "../types";

export class TwitterExtractor {
  private page: import("playwright").Page;
  constructor(page: import("playwright").Page) { this.page = page; }

  async extract(profile: ProfileConfig, onProgress?: (msg: string) => void): Promise<RawContent[]> {
    const contents: RawContent[] = [];
    const maxContents = profile.maxContents ?? 10;

    await this.page.goto(profile.url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await this.page.waitForTimeout(3000);

    const tweets = await this.page.$$('article[data-testid="tweet"]');
    onProgress?.(`Encontrados ${tweets.length} tweets`);

    for (let i = 0; i < Math.min(tweets.length, maxContents); i++) {
      try {
        const text = await tweets[i]!.$eval('[data-testid="tweetText"]', (el) => el.textContent || "").catch(() => "");
        if (!text) continue;

        contents.push({
          id: crypto.randomUUID(),
          platform: "twitter",
          type: text.length > 280 ? "thread" : "tweet",
          url: profile.url,
          date: new Date().toISOString().split("T")[0]!,
          metrics: {},
          caption: text.substring(0, 2000),
        });
        onProgress?.(`Tweet ${i + 1}: ${text.substring(0, 50)}...`);
      } catch { /* continue */ }
    }

    return contents;
  }
}
