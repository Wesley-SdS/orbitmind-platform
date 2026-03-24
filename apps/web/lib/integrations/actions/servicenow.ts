import { BaseIntegrationAction } from "./base";

export class ServiceNowIntegration extends BaseIntegrationAction {
  constructor(connectionId: string) {
    super("servicenow", connectionId);
  }

  async createIncident(shortDescription: string, description?: string, urgency?: number) {
    return this.request("POST", "/api/now/table/incident", {
      short_description: shortDescription, description, urgency: urgency ?? 2,
    });
  }

  async createChangeRequest(shortDescription: string, description?: string) {
    return this.request("POST", "/api/now/table/change_request", {
      short_description: shortDescription, description,
    });
  }
}
