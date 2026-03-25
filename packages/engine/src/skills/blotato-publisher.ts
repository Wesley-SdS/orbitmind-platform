/**
 * Blotato Multi-Platform Publisher
 *
 * Unified publishing across Instagram, LinkedIn, Twitter/X, TikTok, YouTube
 * via Blotato MCP HTTP interface.
 *
 * Requires: Blotato API key (blotato.com)
 * Based on: opensquad-ref/skills/blotato/SKILL.md
 */

const BLOTATO_BASE = "https://app.blotato.com/api/v1";

interface BlotatoPublishOptions {
  apiKey: string;
  platforms: Array<"instagram" | "linkedin" | "twitter" | "tiktok" | "youtube">;
  content: {
    text: string;
    images?: string[];
    video?: string;
    link?: string;
  };
  scheduleAt?: string; // ISO date for scheduling
}

interface BlotatoResult {
  success: boolean;
  postIds?: Record<string, string>;
  error?: string;
}

export class BlotatoPublisher {
  async publish(options: BlotatoPublishOptions): Promise<BlotatoResult> {
    const { apiKey, platforms, content, scheduleAt } = options;

    try {
      const body: Record<string, unknown> = {
        platforms,
        text: content.text,
        media: [],
      };

      if (content.images?.length) {
        body.media = content.images.map((url) => ({ type: "image", url }));
      }
      if (content.video) {
        body.media = [{ type: "video", url: content.video }];
      }
      if (content.link) {
        body.link = content.link;
      }
      if (scheduleAt) {
        body.scheduledAt = scheduleAt;
      }

      const res = await fetch(`${BLOTATO_BASE}/posts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        return { success: false, error: `Blotato API [${res.status}]: ${await res.text()}` };
      }

      const data = (await res.json()) as Record<string, unknown>;
      return {
        success: true,
        postIds: (data.postIds ?? {}) as Record<string, string>,
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Erro desconhecido" };
    }
  }

  async getAccounts(apiKey: string): Promise<{ ok: boolean; accounts?: Array<{ platform: string; name: string }>; error?: string }> {
    try {
      const res = await fetch(`${BLOTATO_BASE}/accounts`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!res.ok) return { ok: false, error: `API error: ${res.status}` };
      const data = (await res.json()) as Record<string, unknown>;
      return { ok: true, accounts: (data.accounts ?? []) as Array<{ platform: string; name: string }> };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Erro" };
    }
  }
}
