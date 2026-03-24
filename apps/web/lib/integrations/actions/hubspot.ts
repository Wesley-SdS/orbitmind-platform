import { BaseIntegrationAction } from "./base";

export class HubSpotIntegration extends BaseIntegrationAction {
  constructor(connectionId: string) {
    super("hubspot", connectionId);
  }

  async createContact(email: string, properties: Record<string, string>) {
    return this.request("POST", "/crm/v3/objects/contacts", { properties: { email, ...properties } });
  }

  async updateContact(contactId: string, properties: Record<string, string>) {
    return this.request("PATCH", `/crm/v3/objects/contacts/${contactId}`, { properties });
  }

  async createDeal(properties: Record<string, string>) {
    return this.request("POST", "/crm/v3/objects/deals", { properties });
  }

  async updateDeal(dealId: string, properties: Record<string, string>) {
    return this.request("PATCH", `/crm/v3/objects/deals/${dealId}`, { properties });
  }

  async createCompany(properties: Record<string, string>) {
    return this.request("POST", "/crm/v3/objects/companies", { properties });
  }

  async searchContacts(query: string) {
    return this.request("POST", "/crm/v3/objects/contacts/search", {
      query, limit: 50, properties: ["email", "firstname", "lastname"],
    });
  }

  async listPipelines() {
    return this.request("GET", "/crm/v3/pipelines/deals");
  }
}
