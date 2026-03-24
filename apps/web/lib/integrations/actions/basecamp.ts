import { BaseIntegrationAction } from "./base";

export class BasecampIntegration extends BaseIntegrationAction {
  constructor(connectionId: string) {
    super("basecamp", connectionId);
  }

  async listProjects(accountId: string) {
    return this.request("GET", `/${accountId}/projects.json`);
  }

  async listTodoSets(accountId: string, projectId: string) {
    return this.request("GET", `/${accountId}/buckets/${projectId}/todosets.json`);
  }

  async createTodo(accountId: string, projectId: string, todoListId: string, content: string, description?: string) {
    return this.request("POST", `/${accountId}/buckets/${projectId}/todolists/${todoListId}/todos.json`, {
      content, description,
    });
  }

  async createMessage(accountId: string, projectId: string, messageBoardId: string, subject: string, content: string) {
    return this.request("POST", `/${accountId}/buckets/${projectId}/message_boards/${messageBoardId}/messages.json`, {
      subject, content,
    });
  }
}
