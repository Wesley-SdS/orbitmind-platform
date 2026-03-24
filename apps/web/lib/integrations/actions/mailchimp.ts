import { BaseIntegrationAction } from "./base";

export class MailchimpIntegration extends BaseIntegrationAction {
  constructor(connectionId: string) {
    super("mailchimp", connectionId);
  }

  async listAudiences() {
    return this.request("GET", "/3.0/lists");
  }

  async addSubscriber(listId: string, email: string, mergeFields?: Record<string, string>) {
    return this.request("POST", `/3.0/lists/${listId}/members`, {
      email_address: email, status: "subscribed", merge_fields: mergeFields,
    });
  }

  async createCampaign(listId: string, subject: string, fromName: string, replyTo: string) {
    return this.request("POST", "/3.0/campaigns", {
      type: "regular",
      recipients: { list_id: listId },
      settings: { subject_line: subject, from_name: fromName, reply_to: replyTo },
    });
  }

  async sendCampaign(campaignId: string) {
    return this.request("POST", `/3.0/campaigns/${campaignId}/actions/send`);
  }

  async getReport(campaignId: string) {
    return this.request("GET", `/3.0/reports/${campaignId}`);
  }
}
