import { BaseIntegrationAction } from "./base";

export class GmailIntegration extends BaseIntegrationAction {
  constructor(connectionId: string) {
    super("gmail", connectionId);
  }

  async sendEmail(to: string, subject: string, body: string, isHtml: boolean = false) {
    const mimeType = isHtml ? "text/html" : "text/plain";
    const raw = Buffer.from(
      `To: ${to}\r\nSubject: ${subject}\r\nContent-Type: ${mimeType}; charset=utf-8\r\n\r\n${body}`,
    ).toString("base64url");
    return this.request("POST", "/gmail/v1/users/me/messages/send", { raw });
  }

  async listMessages(query?: string, maxResults: number = 20) {
    const params: Record<string, string> = { maxResults: String(maxResults) };
    if (query) params.q = query;
    return this.request("GET", "/gmail/v1/users/me/messages", undefined, params);
  }

  async readMessage(messageId: string) {
    return this.request("GET", `/gmail/v1/users/me/messages/${messageId}`, undefined, { format: "full" });
  }

  async createDraft(to: string, subject: string, body: string) {
    const raw = Buffer.from(
      `To: ${to}\r\nSubject: ${subject}\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n${body}`,
    ).toString("base64url");
    return this.request("POST", "/gmail/v1/users/me/drafts", { message: { raw } });
  }

  async listLabels() {
    return this.request("GET", "/gmail/v1/users/me/labels");
  }

  async searchMessages(query: string) {
    return this.listMessages(query, 50);
  }
}
