import { BaseIntegrationAction } from "./base";

export class AirtableIntegration extends BaseIntegrationAction {
  constructor(connectionId: string) {
    super("airtable", connectionId);
  }

  async listBases() {
    return this.request("GET", "/v0/meta/bases");
  }

  async listTables(baseId: string) {
    return this.request("GET", `/v0/meta/bases/${baseId}/tables`);
  }

  async listRecords(baseId: string, tableId: string, maxRecords: number = 100) {
    return this.request("GET", `/v0/${baseId}/${tableId}`, undefined, { maxRecords: String(maxRecords) });
  }

  async createRecord(baseId: string, tableId: string, fields: Record<string, unknown>) {
    return this.request("POST", `/v0/${baseId}/${tableId}`, { fields });
  }

  async updateRecord(baseId: string, tableId: string, recordId: string, fields: Record<string, unknown>) {
    return this.request("PATCH", `/v0/${baseId}/${tableId}/${recordId}`, { fields });
  }

  async deleteRecord(baseId: string, tableId: string, recordId: string) {
    return this.request("DELETE", `/v0/${baseId}/${tableId}/${recordId}`);
  }
}
