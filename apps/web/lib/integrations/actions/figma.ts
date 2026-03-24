import { BaseIntegrationAction } from "./base";

export class FigmaIntegration extends BaseIntegrationAction {
  constructor(connectionId: string) {
    super("figma", connectionId);
  }

  async getFile(fileKey: string) {
    return this.request("GET", `/v1/files/${fileKey}`);
  }

  async getImages(fileKey: string, nodeIds: string[], format: "jpg" | "png" | "svg" | "pdf" = "png") {
    return this.request("GET", `/v1/images/${fileKey}`, undefined, {
      ids: nodeIds.join(","), format,
    });
  }

  async getComments(fileKey: string) {
    return this.request("GET", `/v1/files/${fileKey}/comments`);
  }

  async getComponents(fileKey: string) {
    return this.request("GET", `/v1/files/${fileKey}/components`);
  }

  async exportAssets(fileKey: string, nodeIds: string[], scale: number = 2) {
    return this.request("GET", `/v1/images/${fileKey}`, undefined, {
      ids: nodeIds.join(","), scale: String(scale), format: "png",
    });
  }
}
