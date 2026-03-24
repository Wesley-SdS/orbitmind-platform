import type { ProfileConfig, RawContent } from "../types";

export class YouTubeExtractor {
  private page: import("playwright").Page;
  constructor(page: import("playwright").Page) { this.page = page; }

  async extract(profile: ProfileConfig, onProgress?: (msg: string) => void): Promise<RawContent[]> {
    const contents: RawContent[] = [];
    const maxContents = profile.maxContents ?? 5;

    await this.page.goto(profile.url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await this.page.waitForTimeout(3000);

    // Navigate to videos tab if on channel page
    const videosTab = await this.page.$('a[href*="/videos"], tp-yt-paper-tab:has-text("Videos")');
    if (videosTab) { await videosTab.click(); await this.page.waitForTimeout(2000); }

    const videoLinks = await this.page.$$('a#video-title-link, a[href*="/watch?v="]');
    onProgress?.(`Encontrados ${videoLinks.length} videos`);

    for (let i = 0; i < Math.min(videoLinks.length, maxContents); i++) {
      try {
        const href = await videoLinks[i]!.getAttribute("href");
        const title = await videoLinks[i]!.getAttribute("title") || await videoLinks[i]!.textContent() || "";
        if (!href) continue;

        const videoUrl = href.startsWith("http") ? href : `https://www.youtube.com${href}`;
        contents.push({
          id: href.match(/v=([^&]+)/)?.[1] || crypto.randomUUID(),
          platform: "youtube",
          type: "video",
          url: videoUrl,
          date: new Date().toISOString().split("T")[0]!,
          metrics: {},
          caption: title.substring(0, 500),
        });
        onProgress?.(`Video ${i + 1}: ${title.substring(0, 50)}`);
      } catch { /* continue */ }
    }

    return contents;
  }
}
