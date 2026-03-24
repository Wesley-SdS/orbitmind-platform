import { BaseIntegrationAction } from "./base";

export class LinearIntegration extends BaseIntegrationAction {
  constructor(connectionId: string) {
    super("linear", connectionId);
  }

  async listTeams() {
    return this.request("POST", "/graphql", {
      query: `{ teams { nodes { id name key } } }`,
    });
  }

  async listProjects(teamId?: string) {
    const filter = teamId ? `(filter: { teams: { id: { eq: "${teamId}" } } })` : "";
    return this.request("POST", "/graphql", {
      query: `{ projects${filter} { nodes { id name state } } }`,
    });
  }

  async createIssue(teamId: string, title: string, description?: string, priority?: number) {
    return this.request("POST", "/graphql", {
      query: `mutation { issueCreate(input: { teamId: "${teamId}", title: "${title}", description: ${JSON.stringify(description ?? "")}, priority: ${priority ?? 0} }) { success issue { id identifier url } } }`,
    });
  }

  async updateIssue(issueId: string, input: Record<string, unknown>) {
    const inputStr = JSON.stringify(input);
    return this.request("POST", "/graphql", {
      query: `mutation { issueUpdate(id: "${issueId}", input: ${inputStr}) { success issue { id identifier } } }`,
    });
  }

  async searchIssues(query: string) {
    return this.request("POST", "/graphql", {
      query: `{ issueSearch(query: "${query}") { nodes { id identifier title state { name } } } }`,
    });
  }
}
