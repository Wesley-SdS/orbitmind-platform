import { BaseIntegrationAction } from "./base";

export class GitHubIntegration extends BaseIntegrationAction {
  constructor(connectionId: string) {
    super("github", connectionId);
  }

  async listRepos() {
    return this.request<Array<{ full_name: string; name: string; private: boolean }>>(
      "GET", "/user/repos", undefined, { per_page: "100", sort: "updated" },
    );
  }

  async createIssue(owner: string, repo: string, title: string, body?: string, labels?: string[]) {
    return this.request("POST", `/repos/${owner}/${repo}/issues`, { title, body, labels });
  }

  async createPR(owner: string, repo: string, title: string, head: string, base: string, body?: string) {
    return this.request("POST", `/repos/${owner}/${repo}/pulls`, { title, head, base, body });
  }

  async commentOnPR(owner: string, repo: string, pullNumber: number, body: string) {
    return this.request("POST", `/repos/${owner}/${repo}/issues/${pullNumber}/comments`, { body });
  }

  async listBranches(owner: string, repo: string) {
    return this.request<Array<{ name: string }>>("GET", `/repos/${owner}/${repo}/branches`);
  }

  async createBranch(owner: string, repo: string, branchName: string, sha: string) {
    return this.request("POST", `/repos/${owner}/${repo}/git/refs`, {
      ref: `refs/heads/${branchName}`, sha,
    });
  }

  async getFile(owner: string, repo: string, path: string, ref?: string) {
    const params: Record<string, string> = {};
    if (ref) params.ref = ref;
    return this.request("GET", `/repos/${owner}/${repo}/contents/${path}`, undefined, params);
  }

  async createOrUpdateFile(owner: string, repo: string, path: string, content: string, message: string, sha?: string) {
    const encoded = Buffer.from(content).toString("base64");
    return this.request("PUT", `/repos/${owner}/${repo}/contents/${path}`, {
      message, content: encoded, sha,
    });
  }

  async mergePR(owner: string, repo: string, pullNumber: number, mergeMethod?: "merge" | "squash" | "rebase") {
    return this.request("PUT", `/repos/${owner}/${repo}/pulls/${pullNumber}/merge`, {
      merge_method: mergeMethod ?? "squash",
    });
  }

  async closePR(owner: string, repo: string, pullNumber: number) {
    return this.request("PATCH", `/repos/${owner}/${repo}/pulls/${pullNumber}`, { state: "closed" });
  }

  async addLabels(owner: string, repo: string, issueNumber: number, labels: string[]) {
    return this.request("POST", `/repos/${owner}/${repo}/issues/${issueNumber}/labels`, { labels });
  }

  async createWebhook(owner: string, repo: string, url: string, events: string[]) {
    return this.request("POST", `/repos/${owner}/${repo}/hooks`, {
      config: { url, content_type: "json" },
      events,
      active: true,
    });
  }
}
