import { BaseIntegrationAction } from "./base";

export class SendGridIntegration extends BaseIntegrationAction {
  constructor(connectionId: string) {
    super("sendgrid", connectionId);
  }

  async sendEmail(to: string, from: string, subject: string, content: string, isHtml: boolean = false) {
    return this.request("POST", "/v3/mail/send", {
      personalizations: [{ to: [{ email: to }] }],
      from: { email: from },
      subject,
      content: [{ type: isHtml ? "text/html" : "text/plain", value: content }],
    });
  }

  async createTemplate(name: string, generation: "dynamic" | "legacy" = "dynamic") {
    return this.request("POST", "/v3/templates", { name, generation });
  }

  async listTemplates() {
    return this.request("GET", "/v3/templates", undefined, { generations: "dynamic" });
  }

  async getStats(startDate: string, endDate?: string) {
    const params: Record<string, string> = { start_date: startDate };
    if (endDate) params.end_date = endDate;
    return this.request("GET", "/v3/stats", undefined, params);
  }
}
