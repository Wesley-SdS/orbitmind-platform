import { BaseIntegrationAction } from "./base";

export class PipedriveIntegration extends BaseIntegrationAction {
  constructor(connectionId: string) {
    super("pipedrive", connectionId);
  }

  async createDeal(title: string, personId?: number, orgId?: number, value?: number) {
    return this.request("POST", "/deals", { title, person_id: personId, org_id: orgId, value });
  }

  async updateDeal(dealId: number, data: Record<string, unknown>) {
    return this.request("PUT", `/deals/${dealId}`, data);
  }

  async createPerson(name: string, email?: string, phone?: string) {
    return this.request("POST", "/persons", {
      name,
      ...(email ? { email: [{ value: email, primary: true }] } : {}),
      ...(phone ? { phone: [{ value: phone, primary: true }] } : {}),
    });
  }

  async listPipelines() {
    return this.request("GET", "/pipelines");
  }

  async listStages(pipelineId: number) {
    return this.request("GET", `/stages`, undefined, { pipeline_id: String(pipelineId) });
  }
}
