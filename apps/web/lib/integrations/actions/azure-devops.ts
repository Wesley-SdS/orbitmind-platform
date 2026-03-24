import { BaseIntegrationAction } from "./base";

export class AzureDevOpsIntegration extends BaseIntegrationAction {
  constructor(connectionId: string) {
    super("azure-devops", connectionId);
  }

  async listProjects(organization: string) {
    return this.request("GET", `/${organization}/_apis/projects`, undefined, { "api-version": "7.0" });
  }

  async createWorkItem(organization: string, project: string, type: string, title: string, description?: string) {
    return this.request("POST", `/${organization}/${project}/_apis/wit/workitems/$${type}`, [
      { op: "add", path: "/fields/System.Title", value: title },
      ...(description ? [{ op: "add", path: "/fields/System.Description", value: description }] : []),
    ], { "api-version": "7.0" });
  }

  async updateWorkItem(organization: string, id: number, fields: Array<{ path: string; value: unknown }>) {
    return this.request("PATCH", `/${organization}/_apis/wit/workitems/${id}`,
      fields.map((f) => ({ op: "replace", ...f })),
      { "api-version": "7.0" },
    );
  }

  async queryWorkItems(organization: string, project: string, wiql: string) {
    return this.request("POST", `/${organization}/${project}/_apis/wit/wiql`,
      { query: wiql }, { "api-version": "7.0" },
    );
  }
}
