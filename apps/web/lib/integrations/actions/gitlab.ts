import { BaseIntegrationAction } from "./base";

export class GitLabIntegration extends BaseIntegrationAction {
  constructor(connectionId: string) {
    super("gitlab", connectionId);
  }

  async listProjects() {
    return this.request<Array<{ id: number; name: string; path_with_namespace: string }>>(
      "GET", "/projects", undefined, { membership: "true", per_page: "100" },
    );
  }

  async createIssue(projectId: number, title: string, description?: string) {
    return this.request("POST", `/projects/${projectId}/issues`, { title, description });
  }

  async createMR(projectId: number, title: string, sourceBranch: string, targetBranch: string, description?: string) {
    return this.request("POST", `/projects/${projectId}/merge_requests`, {
      title, source_branch: sourceBranch, target_branch: targetBranch, description,
    });
  }

  async commentOnMR(projectId: number, mrIid: number, body: string) {
    return this.request("POST", `/projects/${projectId}/merge_requests/${mrIid}/notes`, { body });
  }

  async addFile(projectId: number, filePath: string, content: string, branch: string, commitMessage: string) {
    return this.request("POST", `/projects/${projectId}/repository/files/${encodeURIComponent(filePath)}`, {
      branch, content, commit_message: commitMessage,
    });
  }
}
