/**
 * Apify Web Scraper Skill
 *
 * Runs pre-built Apify Actors for web scraping:
 * - Instagram profile/post scraping
 * - YouTube video/channel scraping
 * - Twitter/X profile scraping
 * - TikTok scraping
 * - Generic website scraping
 *
 * Requires: Apify API token (free tier available)
 * Based on: opensquad-ref/skills/apify/SKILL.md
 */

const APIFY_BASE = "https://api.apify.com/v2";

interface ScrapeOptions {
  apiToken: string;
  actorId: string;
  input: Record<string, unknown>;
  timeoutMs?: number;
}

interface ScrapeResult {
  success: boolean;
  data?: Record<string, unknown>[];
  error?: string;
  itemCount?: number;
}

export class ApifyScraper {
  async runActor(options: ScrapeOptions): Promise<ScrapeResult> {
    const { apiToken, actorId, input, timeoutMs = 120000 } = options;

    try {
      // Start actor run
      const startRes = await fetch(`${APIFY_BASE}/acts/${actorId}/runs?token=${apiToken}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!startRes.ok) {
        return { success: false, error: `Failed to start actor [${startRes.status}]: ${await startRes.text()}` };
      }

      const { data: runData } = (await startRes.json()) as { data: { id: string } };
      const runId = runData.id;

      // Poll until complete
      const deadline = Date.now() + timeoutMs;
      while (Date.now() < deadline) {
        const statusRes = await fetch(`${APIFY_BASE}/actor-runs/${runId}?token=${apiToken}`);
        if (!statusRes.ok) break;
        const { data: status } = (await statusRes.json()) as { data: { status: string; defaultDatasetId: string } };

        if (status.status === "SUCCEEDED") {
          // Fetch results
          const datasetId = status.defaultDatasetId;
          const itemsRes = await fetch(`${APIFY_BASE}/datasets/${datasetId}/items?token=${apiToken}&limit=100`);
          if (!itemsRes.ok) return { success: false, error: "Failed to fetch results" };
          const items = (await itemsRes.json()) as Record<string, unknown>[];
          return { success: true, data: items, itemCount: items.length };
        }

        if (status.status === "FAILED" || status.status === "ABORTED") {
          return { success: false, error: `Actor run ${status.status}` };
        }

        await new Promise((r) => setTimeout(r, 5000));
      }

      return { success: false, error: "Actor run timed out" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Erro desconhecido" };
    }
  }

  /** Scrape Instagram profile posts */
  async scrapeInstagramProfile(apiToken: string, username: string, maxPosts = 10): Promise<ScrapeResult> {
    return this.runActor({
      apiToken,
      actorId: "apify/instagram-scraper",
      input: { directUrls: [`https://www.instagram.com/${username}/`], resultsLimit: maxPosts, resultsType: "posts" },
    });
  }

  /** Scrape YouTube channel videos */
  async scrapeYouTubeChannel(apiToken: string, channelUrl: string, maxVideos = 10): Promise<ScrapeResult> {
    return this.runActor({
      apiToken,
      actorId: "bernardo/youtube-scraper",
      input: { startUrls: [{ url: channelUrl }], maxResults: maxVideos },
    });
  }

  /** Scrape Twitter/X profile */
  async scrapeTwitterProfile(apiToken: string, username: string, maxTweets = 20): Promise<ScrapeResult> {
    return this.runActor({
      apiToken,
      actorId: "apidojo/tweet-scraper",
      input: { handle: [username], maxTweets, mode: "profile" },
    });
  }

  /** Generic website scrape */
  async scrapeWebsite(apiToken: string, url: string): Promise<ScrapeResult> {
    return this.runActor({
      apiToken,
      actorId: "apify/web-scraper",
      input: { startUrls: [{ url }], maxPagesPerCrawl: 5 },
    });
  }
}
