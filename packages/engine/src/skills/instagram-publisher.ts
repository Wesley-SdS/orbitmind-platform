const IG_BASE = "https://graph.facebook.com/v21.0";

interface PublishOptions {
  accessToken: string;
  userId: string;
  images: string[];
  caption: string;
  dryRun?: boolean;
}

interface PublishResult {
  success: boolean;
  postId?: string;
  permalink?: string;
  error?: string;
}

export class InstagramPublisher {
  async publishCarousel(options: PublishOptions): Promise<PublishResult> {
    const { accessToken, userId, images, caption, dryRun } = options;

    if (images.length < 1 || images.length > 10) {
      return { success: false, error: `Instagram suporta 1-10 imagens (recebeu ${images.length})` };
    }
    if (caption.length > 2200) {
      return { success: false, error: `Caption excede 2200 caracteres (tem ${caption.length})` };
    }

    try {
      if (images.length === 1) {
        return this.publishSingle(userId, images[0]!, caption, accessToken, dryRun);
      }

      const childIds = await Promise.all(
        images.map((url) => this.createChild(userId, url, accessToken)),
      );

      await Promise.all(childIds.map((id) => this.poll(id, accessToken)));

      const carouselId = await this.createCarousel(userId, childIds, caption, accessToken);
      await this.poll(carouselId, accessToken);

      if (dryRun) return { success: true, postId: carouselId, permalink: "(dry run)" };

      const postId = await this.publish(userId, carouselId, accessToken);
      const permalink = await this.getPermalink(postId, accessToken);
      return { success: true, postId, permalink: permalink ?? undefined };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Erro desconhecido" };
    }
  }

  private async createChild(userId: string, imageUrl: string, token: string): Promise<string> {
    const params = new URLSearchParams({ image_url: imageUrl, is_carousel_item: "true", access_token: token });
    const res = await fetch(`${IG_BASE}/${userId}/media?${params}`, { method: "POST" });
    if (!res.ok) throw new Error(`createChild failed [${res.status}]: ${await res.text()}`);
    return ((await res.json()) as { id: string }).id;
  }

  private async poll(containerId: string, token: string, timeoutMs = 60000): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const params = new URLSearchParams({ fields: "status_code", access_token: token });
      const res = await fetch(`${IG_BASE}/${containerId}?${params}`);
      if (!res.ok) throw new Error(`Poll failed [${res.status}]`);
      const { status_code } = (await res.json()) as { status_code: string };
      if (status_code === "FINISHED") return;
      if (status_code === "ERROR") throw new Error(`Container ${containerId} ERROR`);
      await new Promise((r) => setTimeout(r, 3000));
    }
    throw new Error(`Container ${containerId} timeout`);
  }

  private async createCarousel(userId: string, childIds: string[], caption: string, token: string): Promise<string> {
    const params = new URLSearchParams({ media_type: "CAROUSEL", children: childIds.join(","), caption, access_token: token });
    const res = await fetch(`${IG_BASE}/${userId}/media?${params}`, { method: "POST" });
    if (!res.ok) throw new Error(`createCarousel failed [${res.status}]: ${await res.text()}`);
    return ((await res.json()) as { id: string }).id;
  }

  private async publish(userId: string, containerId: string, token: string): Promise<string> {
    const params = new URLSearchParams({ creation_id: containerId, access_token: token });
    const res = await fetch(`${IG_BASE}/${userId}/media_publish?${params}`, { method: "POST" });
    if (!res.ok) throw new Error(`publish failed [${res.status}]: ${await res.text()}`);
    return ((await res.json()) as { id: string }).id;
  }

  private async getPermalink(mediaId: string, token: string): Promise<string | null> {
    const params = new URLSearchParams({ fields: "permalink", access_token: token });
    const res = await fetch(`${IG_BASE}/${mediaId}?${params}`);
    if (!res.ok) return null;
    return ((await res.json()) as { permalink?: string }).permalink ?? null;
  }

  private async publishSingle(userId: string, imageUrl: string, caption: string, token: string, dryRun?: boolean): Promise<PublishResult> {
    const params = new URLSearchParams({ image_url: imageUrl, caption, access_token: token });
    const res = await fetch(`${IG_BASE}/${userId}/media?${params}`, { method: "POST" });
    if (!res.ok) throw new Error(`createMedia failed [${res.status}]: ${await res.text()}`);
    const { id: containerId } = (await res.json()) as { id: string };
    await this.poll(containerId, token);
    if (dryRun) return { success: true, postId: containerId, permalink: "(dry run)" };
    const postId = await this.publish(userId, containerId, token);
    const permalink = await this.getPermalink(postId, token);
    return { success: true, postId, permalink: permalink ?? undefined };
  }
}
