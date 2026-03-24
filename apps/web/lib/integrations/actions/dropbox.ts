import { BaseIntegrationAction } from "./base";

export class DropboxIntegration extends BaseIntegrationAction {
  constructor(connectionId: string) {
    super("dropbox", connectionId);
  }

  async listFiles(path: string = "") {
    return this.request("POST", "/2/files/list_folder", { path: path || "", limit: 100 });
  }

  async readFile(path: string) {
    return this.request("POST", "/2/files/download", { path });
  }

  async uploadFile(path: string, content: string) {
    return this.request("POST", "/2/files/upload", { path, content, mode: "overwrite" });
  }

  async createFolder(path: string) {
    return this.request("POST", "/2/files/create_folder_v2", { path });
  }

  async shareLink(path: string) {
    return this.request("POST", "/2/sharing/create_shared_link_with_settings", {
      path, settings: { requested_visibility: "public" },
    });
  }
}
