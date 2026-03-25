/**
 * Canva Design Integration
 *
 * Create designs, search templates, autofill with brand assets, export images.
 * Uses Canva Connect API.
 *
 * Requires: Canva API key + OAuth
 * Based on: opensquad-ref/skills/canva/SKILL.md
 */

const CANVA_BASE = "https://api.canva.com/rest/v1";

interface CanvaDesignOptions {
  accessToken: string;
  action: "create" | "search" | "export" | "autofill";
  templateId?: string;
  title?: string;
  searchQuery?: string;
  designId?: string;
  brandData?: Record<string, string>;
  exportFormat?: "png" | "jpg" | "pdf";
}

interface CanvaResult {
  success: boolean;
  designId?: string;
  exportUrl?: string;
  templates?: Array<{ id: string; title: string; thumbnail: string }>;
  error?: string;
}

export class CanvaDesigner {
  async execute(options: CanvaDesignOptions): Promise<CanvaResult> {
    const { accessToken } = options;

    try {
      switch (options.action) {
        case "search":
          return this.searchTemplates(accessToken, options.searchQuery ?? "");

        case "create":
          return this.createDesign(accessToken, options.templateId, options.title ?? "Untitled");

        case "autofill":
          return this.autofillDesign(accessToken, options.designId!, options.brandData ?? {});

        case "export":
          return this.exportDesign(accessToken, options.designId!, options.exportFormat ?? "png");

        default:
          return { success: false, error: "Acao nao suportada" };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Erro desconhecido" };
    }
  }

  private async searchTemplates(token: string, query: string): Promise<CanvaResult> {
    const params = new URLSearchParams({ query, limit: "20" });
    const res = await fetch(`${CANVA_BASE}/brand-templates?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return { success: false, error: `Search failed [${res.status}]` };
    const data = (await res.json()) as Record<string, unknown>;
    return {
      success: true,
      templates: ((data.items ?? []) as Array<{ id: string; title: string; thumbnail: string }>).map((t) => ({
        id: t.id, title: t.title, thumbnail: t.thumbnail,
      })),
    };
  }

  private async createDesign(token: string, templateId: string | undefined, title: string): Promise<CanvaResult> {
    const body: Record<string, unknown> = { title };
    if (templateId) body.brand_template_id = templateId;

    const res = await fetch(`${CANVA_BASE}/designs`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return { success: false, error: `Create failed [${res.status}]` };
    const data = (await res.json()) as { design?: { id: string } };
    return { success: true, designId: data.design?.id };
  }

  private async autofillDesign(token: string, designId: string, brandData: Record<string, string>): Promise<CanvaResult> {
    const res = await fetch(`${CANVA_BASE}/autofills`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ brand_template_id: designId, data: brandData }),
    });
    if (!res.ok) return { success: false, error: `Autofill failed [${res.status}]` };
    const data = (await res.json()) as { job?: { result?: { design?: { id: string } } } };
    return { success: true, designId: data.job?.result?.design?.id };
  }

  private async exportDesign(token: string, designId: string, format: string): Promise<CanvaResult> {
    const res = await fetch(`${CANVA_BASE}/exports`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ design_id: designId, format: { type: format } }),
    });
    if (!res.ok) return { success: false, error: `Export failed [${res.status}]` };
    const data = (await res.json()) as { job?: { id: string } };

    // Poll for export completion
    const jobId = data.job?.id;
    if (!jobId) return { success: false, error: "No export job created" };

    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      const pollRes = await fetch(`${CANVA_BASE}/exports/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!pollRes.ok) continue;
      const pollData = (await pollRes.json()) as { job?: { status: string; result?: { url: string } } };
      if (pollData.job?.status === "success") {
        return { success: true, exportUrl: pollData.job.result?.url };
      }
      if (pollData.job?.status === "failed") {
        return { success: false, error: "Export failed" };
      }
    }

    return { success: false, error: "Export timed out" };
  }
}
