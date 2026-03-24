import { BaseIntegrationAction } from "./base";

export class BrevoIntegration extends BaseIntegrationAction {
  constructor(connectionId: string) {
    super("brevo", connectionId);
  }

  async sendEmail(to: string, from: string, subject: string, htmlContent: string) {
    return this.request("POST", "/v3/smtp/email", {
      sender: { email: from },
      to: [{ email: to }],
      subject,
      htmlContent,
    });
  }

  async createCampaign(name: string, subject: string, htmlContent: string, listIds: number[]) {
    return this.request("POST", "/v3/emailCampaigns", {
      name, subject, htmlContent,
      recipients: { listIds },
      sender: { email: "noreply@orbitmind.dev", name: "OrbitMind" },
    });
  }

  async addContact(email: string, attributes?: Record<string, unknown>, listIds?: number[]) {
    return this.request("POST", "/v3/contacts", { email, attributes, listIds });
  }

  async listContacts() {
    return this.request("GET", "/v3/contacts", undefined, { limit: "50" });
  }
}
