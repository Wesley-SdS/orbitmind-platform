import { BaseIntegrationAction } from "./base";

export class ClickUpIntegration extends BaseIntegrationAction {
  constructor(connectionId: string) {
    super("clickup", connectionId);
  }

  async listSpaces(teamId: string) {
    return this.request("GET", `/team/${teamId}/space`);
  }

  async listFolders(spaceId: string) {
    return this.request("GET", `/space/${spaceId}/folder`);
  }

  async listLists(folderId: string) {
    return this.request("GET", `/folder/${folderId}/list`);
  }

  async createTask(listId: string, name: string, description?: string, priority?: number) {
    return this.request("POST", `/list/${listId}/task`, { name, description, priority });
  }

  async updateTask(taskId: string, data: Record<string, unknown>) {
    return this.request("PUT", `/task/${taskId}`, data);
  }
}
