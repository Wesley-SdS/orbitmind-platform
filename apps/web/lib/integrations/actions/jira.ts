import { BaseIntegrationAction } from "./base";

export class JiraIntegration extends BaseIntegrationAction {
  constructor(connectionId: string) {
    super("jira", connectionId);
  }

  async listProjects() {
    return this.request<Array<{ id: string; key: string; name: string }>>("GET", "/rest/api/3/project");
  }

  async createIssue(projectKey: string, summary: string, issueType: string = "Task", description?: string) {
    return this.request("POST", "/rest/api/3/issue", {
      fields: {
        project: { key: projectKey },
        summary,
        issuetype: { name: issueType },
        ...(description ? { description: { type: "doc", version: 1, content: [{ type: "paragraph", content: [{ type: "text", text: description }] }] } } : {}),
      },
    });
  }

  async updateIssue(issueKey: string, fields: Record<string, unknown>) {
    return this.request("PUT", `/rest/api/3/issue/${issueKey}`, { fields });
  }

  async getIssue(issueKey: string) {
    return this.request("GET", `/rest/api/3/issue/${issueKey}`);
  }

  async transitionIssue(issueKey: string, transitionId: string) {
    return this.request("POST", `/rest/api/3/issue/${issueKey}/transitions`, {
      transition: { id: transitionId },
    });
  }

  async searchJQL(jql: string, maxResults: number = 50) {
    return this.request("POST", "/rest/api/3/search", { jql, maxResults });
  }

  async addComment(issueKey: string, body: string) {
    return this.request("POST", `/rest/api/3/issue/${issueKey}/comment`, {
      body: { type: "doc", version: 1, content: [{ type: "paragraph", content: [{ type: "text", text: body }] }] },
    });
  }
}
