import { BaseIntegrationAction } from "./base";

export class SalesforceIntegration extends BaseIntegrationAction {
  constructor(connectionId: string) {
    super("salesforce", connectionId);
  }

  async createRecord(sObjectType: string, fields: Record<string, unknown>) {
    return this.request("POST", `/services/data/v59.0/sobjects/${sObjectType}`, fields);
  }

  async updateRecord(sObjectType: string, recordId: string, fields: Record<string, unknown>) {
    return this.request("PATCH", `/services/data/v59.0/sobjects/${sObjectType}/${recordId}`, fields);
  }

  async querySOQL(query: string) {
    return this.request("GET", "/services/data/v59.0/query", undefined, { q: query });
  }

  async describeObject(sObjectType: string) {
    return this.request("GET", `/services/data/v59.0/sobjects/${sObjectType}/describe`);
  }

  async searchSOSL(search: string) {
    return this.request("GET", "/services/data/v59.0/search", undefined, { q: search });
  }
}
