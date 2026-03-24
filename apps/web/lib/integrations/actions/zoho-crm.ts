import { BaseIntegrationAction } from "./base";

export class ZohoCRMIntegration extends BaseIntegrationAction {
  constructor(connectionId: string) {
    super("zoho-crm", connectionId);
  }

  async createRecord(module: string, data: Record<string, unknown>) {
    return this.request("POST", `/crm/v5/${module}`, { data: [data] });
  }

  async updateRecord(module: string, recordId: string, data: Record<string, unknown>) {
    return this.request("PUT", `/crm/v5/${module}/${recordId}`, { data: [data] });
  }

  async searchRecords(module: string, criteria: string) {
    return this.request("GET", `/crm/v5/${module}/search`, undefined, { criteria });
  }

  async listModules() {
    return this.request("GET", "/crm/v5/settings/modules");
  }
}
