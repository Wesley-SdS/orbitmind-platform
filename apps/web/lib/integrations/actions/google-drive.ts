import { BaseIntegrationAction } from "./base";

export class GoogleDriveIntegration extends BaseIntegrationAction {
  constructor(connectionId: string) {
    super("google-drive", connectionId);
  }

  async listFiles(folderId?: string, pageSize: number = 50) {
    const q = folderId ? `'${folderId}' in parents and trashed=false` : "trashed=false";
    return this.request("GET", "/drive/v3/files", undefined, { q, pageSize: String(pageSize), fields: "files(id,name,mimeType,modifiedTime)" });
  }

  async readFile(fileId: string) {
    return this.request("GET", `/drive/v3/files/${fileId}`, undefined, { alt: "media" });
  }

  async createFile(name: string, mimeType: string, folderId?: string) {
    return this.request("POST", "/drive/v3/files", {
      name, mimeType, ...(folderId ? { parents: [folderId] } : {}),
    });
  }

  async updateFile(fileId: string, content: string) {
    return this.request("PATCH", `/upload/drive/v3/files/${fileId}`, content);
  }

  async createFolder(name: string, parentId?: string) {
    return this.request("POST", "/drive/v3/files", {
      name, mimeType: "application/vnd.google-apps.folder",
      ...(parentId ? { parents: [parentId] } : {}),
    });
  }

  async shareFile(fileId: string, email: string, role: "reader" | "writer" | "commenter" = "reader") {
    return this.request("POST", `/drive/v3/files/${fileId}/permissions`, {
      type: "user", role, emailAddress: email,
    });
  }

  async exportFile(fileId: string, mimeType: string) {
    return this.request("GET", `/drive/v3/files/${fileId}/export`, undefined, { mimeType });
  }
}
