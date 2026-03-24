const LI_BASE = "https://api.linkedin.com/v2";
const LI_REST = "https://api.linkedin.com/rest";

interface PublishOptions {
  accessToken: string;
  authorUrn: string;
  text: string;
  images?: string[];
  articleUrl?: string;
  visibility?: "PUBLIC" | "CONNECTIONS";
}

interface PublishResult {
  success: boolean;
  postId?: string;
  postUrl?: string;
  error?: string;
}

export class LinkedInPublisher {
  async publishPost(options: PublishOptions): Promise<PublishResult> {
    const { accessToken, authorUrn, text, images, articleUrl, visibility = "PUBLIC" } = options;

    try {
      let mediaAssets: string[] = [];

      if (images?.length) {
        mediaAssets = await Promise.all(
          images.map((url) => this.uploadImage(authorUrn, url, accessToken)),
        );
      }

      const body: Record<string, unknown> = {
        author: authorUrn,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: { text },
            shareMediaCategory: mediaAssets.length ? "IMAGE" : articleUrl ? "ARTICLE" : "NONE",
            ...(mediaAssets.length
              ? { media: mediaAssets.map((asset) => ({ status: "READY", media: asset })) }
              : articleUrl
                ? { media: [{ status: "READY", originalUrl: articleUrl }] }
                : {}),
          },
        },
        visibility: { "com.linkedin.ugc.MemberNetworkVisibility": visibility },
      };

      const res = await fetch(`${LI_BASE}/ugcPosts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "X-Restli-Protocol-Version": "2.0.0",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        return { success: false, error: `LinkedIn API [${res.status}]: ${await res.text()}` };
      }

      const postId = res.headers.get("x-restli-id") || "";
      return { success: true, postId, postUrl: `https://www.linkedin.com/feed/update/${postId}` };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Erro desconhecido" };
    }
  }

  private async uploadImage(authorUrn: string, imageUrl: string, accessToken: string): Promise<string> {
    const registerRes = await fetch(`${LI_REST}/images?action=initializeUpload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "LinkedIn-Version": "202401",
      },
      body: JSON.stringify({ initializeUploadRequest: { owner: authorUrn } }),
    });
    if (!registerRes.ok) throw new Error(`Image register failed: ${await registerRes.text()}`);
    const { value } = await registerRes.json();

    const imageRes = await fetch(imageUrl);
    if (!imageRes.ok) throw new Error(`Failed to download image: ${imageUrl}`);
    const imageBuffer = await imageRes.arrayBuffer();

    const uploadRes = await fetch(value.uploadUrl, {
      method: "PUT",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "image/jpeg" },
      body: imageBuffer,
    });
    if (!uploadRes.ok) throw new Error(`Image upload failed: ${await uploadRes.text()}`);

    return value.image;
  }
}
