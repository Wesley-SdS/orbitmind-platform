import { BaseIntegrationAction } from "./base";

export class OneDriveIntegration extends BaseIntegrationAction {
  constructor(connectionId: string) {
    super("onedrive", connectionId);
  }

  async listFiles(folderId?: string) {
    const path = folderId ? `/me/drive/items/${folderId}/children` : "/me/drive/root/children";
    return this.request("GET", path);
  }

  async readFile(itemId: string) {
    return this.request("GET", `/me/drive/items/${itemId}/content`);
  }

  async uploadFile(parentFolderId: string, fileName: string, content: string) {
    return this.request("PUT", `/me/drive/items/${parentFolderId}:/${fileName}:/content`, content);
  }

  async createFolder(parentFolderId: string, name: string) {
    return this.request("POST", `/me/drive/items/${parentFolderId}/children`, {
      name, folder: {}, "@microsoft.graph.conflictBehavior": "rename",
    });
  }

  async shareFile(itemId: string, email: string, type: "view" | "edit" = "view") {
    return this.request("POST", `/me/drive/items/${itemId}/invite`, {
      recipients: [{ email }],
      roles: [type === "edit" ? "write" : "read"],
      requireSignIn: true,
    });
  }
}
