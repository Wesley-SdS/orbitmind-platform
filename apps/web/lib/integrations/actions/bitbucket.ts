import { BaseIntegrationAction } from "./base";

export class BitbucketIntegration extends BaseIntegrationAction {
  constructor(connectionId: string) {
    super("bitbucket", connectionId);
  }

  async listRepos(workspace: string) {
    return this.request("GET", `/repositories/${workspace}`, undefined, { pagelen: "100" });
  }

  async createIssue(workspace: string, repoSlug: string, title: string, content?: string) {
    return this.request("POST", `/repositories/${workspace}/${repoSlug}/issues`, {
      title, content: content ? { raw: content } : undefined,
    });
  }

  async createPR(workspace: string, repoSlug: string, title: string, sourceBranch: string, destBranch: string, description?: string) {
    return this.request("POST", `/repositories/${workspace}/${repoSlug}/pullrequests`, {
      title, description,
      source: { branch: { name: sourceBranch } },
      destination: { branch: { name: destBranch } },
    });
  }
}
