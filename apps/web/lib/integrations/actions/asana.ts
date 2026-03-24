import { BaseIntegrationAction } from "./base";

export class AsanaIntegration extends BaseIntegrationAction {
  constructor(connectionId: string) {
    super("asana", connectionId);
  }

  async listWorkspaces() {
    return this.request("GET", "/workspaces");
  }

  async listProjects(workspaceGid: string) {
    return this.request("GET", `/workspaces/${workspaceGid}/projects`);
  }

  async listSections(projectGid: string) {
    return this.request("GET", `/projects/${projectGid}/sections`);
  }

  async createTask(projectGid: string, name: string, notes?: string, sectionGid?: string) {
    return this.request("POST", "/tasks", {
      data: { name, notes, projects: [projectGid], ...(sectionGid ? { memberships: [{ project: projectGid, section: sectionGid }] } : {}) },
    });
  }

  async updateTask(taskGid: string, data: Record<string, unknown>) {
    return this.request("PUT", `/tasks/${taskGid}`, { data });
  }

  async addComment(taskGid: string, text: string) {
    return this.request("POST", `/tasks/${taskGid}/stories`, { data: { text } });
  }
}
