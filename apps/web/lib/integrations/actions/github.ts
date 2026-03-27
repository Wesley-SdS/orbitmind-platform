import { BaseIntegrationAction } from "./base";

// ── Types ──

export interface ImportedAgent {
  name: string;
  displayName: string;
  role: string;
  workflowId: number;
  workflowPath: string;
  workflowContent: string;
  workflowSha: string;
  skillPath: string;
  skillContent: string;
  skillSha: string;
  state: string;
  lastRun: {
    id: number;
    status: string;
    conclusion: string | null;
    startedAt: string;
    duration: number | null;
  } | null;
}

interface GitHubWorkflow {
  id: number;
  name: string;
  path: string;
  state: string;
}

interface GitHubWorkflowRun {
  id: number;
  workflow_id: number;
  status: string;
  conclusion: string | null;
  run_started_at: string;
  updated_at: string;
}

interface GitHubContentFile {
  name: string;
  path: string;
  sha: string;
  content?: string;
  type: string;
}

// ── Integration ──

export class GitHubIntegration extends BaseIntegrationAction {
  constructor(connectionId: string) {
    super("github", connectionId);
  }

  // ── Repos ──

  async listRepos() {
    return this.request<Array<{ full_name: string; name: string; private: boolean }>>(
      "GET", "/user/repos", undefined, { per_page: "100", sort: "updated" },
    );
  }

  async listOrganizations() {
    return this.request<Array<{ login: string; avatar_url: string; description: string | null }>>(
      "GET", "/user/orgs",
    );
  }

  async listOrgRepos(org: string) {
    return this.request<Array<{ full_name: string; name: string; private: boolean; default_branch: string }>>(
      "GET", `/orgs/${org}/repos`, undefined, { sort: "updated", per_page: "30" },
    );
  }

  // ── Issues & PRs ──

  async createIssue(owner: string, repo: string, title: string, body?: string, labels?: string[]) {
    return this.request("POST", `/repos/${owner}/${repo}/issues`, { title, body, labels });
  }

  async closeIssue(owner: string, repo: string, issueNumber: number) {
    return this.request("PATCH", `/repos/${owner}/${repo}/issues/${issueNumber}`, { state: "closed" });
  }

  async listIssues(owner: string, repo: string, state: string = "open", labels?: string) {
    const params: Record<string, string> = { state, per_page: "30" };
    if (labels) params.labels = labels;
    return this.request("GET", `/repos/${owner}/${repo}/issues`, undefined, params);
  }

  async createPR(owner: string, repo: string, title: string, head: string, base: string, body?: string) {
    return this.request("POST", `/repos/${owner}/${repo}/pulls`, { title, head, base, body });
  }

  async listPullRequests(owner: string, repo: string, state: string = "open") {
    return this.request("GET", `/repos/${owner}/${repo}/pulls`, undefined, { state, per_page: "20" });
  }

  async commentOnPR(owner: string, repo: string, pullNumber: number, body: string) {
    return this.request("POST", `/repos/${owner}/${repo}/issues/${pullNumber}/comments`, { body });
  }

  async mergePR(owner: string, repo: string, pullNumber: number, mergeMethod?: "merge" | "squash" | "rebase") {
    return this.request("PUT", `/repos/${owner}/${repo}/pulls/${pullNumber}/merge`, {
      merge_method: mergeMethod ?? "squash",
    });
  }

  async closePR(owner: string, repo: string, pullNumber: number) {
    return this.request("PATCH", `/repos/${owner}/${repo}/pulls/${pullNumber}`, { state: "closed" });
  }

  // ── Branches ──

  async listBranches(owner: string, repo: string) {
    return this.request<Array<{ name: string }>>("GET", `/repos/${owner}/${repo}/branches`);
  }

  async createBranch(owner: string, repo: string, branchName: string, sha: string) {
    return this.request("POST", `/repos/${owner}/${repo}/git/refs`, {
      ref: `refs/heads/${branchName}`, sha,
    });
  }

  // ── Labels ──

  async addLabels(owner: string, repo: string, issueNumber: number, labels: string[]) {
    return this.request("POST", `/repos/${owner}/${repo}/issues/${issueNumber}/labels`, { labels });
  }

  async listLabels(owner: string, repo: string) {
    return this.request<Array<{ name: string; color: string; description: string | null }>>(
      "GET", `/repos/${owner}/${repo}/labels`,
    );
  }

  async createLabel(owner: string, repo: string, name: string, color: string, description?: string) {
    return this.request("POST", `/repos/${owner}/${repo}/labels`, { name, color, description });
  }

  // ── File Operations ──

  async getFile(owner: string, repo: string, path: string, ref?: string) {
    const params: Record<string, string> = {};
    if (ref) params.ref = ref;
    return this.request<GitHubContentFile>("GET", `/repos/${owner}/${repo}/contents/${path}`, undefined, params);
  }

  async getFileContent(owner: string, repo: string, path: string, ref?: string) {
    const result = await this.getFile(owner, repo, path, ref);
    if (result.success && result.data?.content) {
      return {
        ...result,
        data: {
          ...result.data,
          decodedContent: Buffer.from(result.data.content, "base64").toString("utf-8"),
        },
      };
    }
    return result as typeof result & { data?: typeof result.data & { decodedContent?: string } };
  }

  async createOrUpdateFile(owner: string, repo: string, path: string, content: string, message: string, sha?: string) {
    const encoded = Buffer.from(content).toString("base64");
    return this.request("PUT", `/repos/${owner}/${repo}/contents/${path}`, {
      message, content: encoded, sha,
    });
  }

  async listDirectory(owner: string, repo: string, path: string) {
    return this.request<GitHubContentFile[]>("GET", `/repos/${owner}/${repo}/contents/${path}`);
  }

  // ── Workflows (GitHub Actions) ──

  async listWorkflows(owner: string, repo: string) {
    return this.request<{ workflows: GitHubWorkflow[]; total_count: number }>(
      "GET", `/repos/${owner}/${repo}/actions/workflows`,
    );
  }

  async listWorkflowRuns(owner: string, repo: string, workflowId?: number) {
    const endpoint = workflowId
      ? `/repos/${owner}/${repo}/actions/workflows/${workflowId}/runs`
      : `/repos/${owner}/${repo}/actions/runs`;
    const perPage = workflowId ? "10" : "20";
    return this.request<{ workflow_runs: GitHubWorkflowRun[]; total_count: number }>(
      "GET", endpoint, undefined, { per_page: perPage },
    );
  }

  async getWorkflowRun(owner: string, repo: string, runId: number) {
    return this.request<GitHubWorkflowRun>(
      "GET", `/repos/${owner}/${repo}/actions/runs/${runId}`,
    );
  }

  async toggleWorkflow(owner: string, repo: string, workflowId: number, enable: boolean) {
    return this.request(
      "PUT",
      `/repos/${owner}/${repo}/actions/workflows/${workflowId}/${enable ? "enable" : "disable"}`,
    );
  }

  async triggerWorkflow(owner: string, repo: string, workflowId: number, ref: string = "main", inputs?: Record<string, string>) {
    return this.request(
      "POST",
      `/repos/${owner}/${repo}/actions/workflows/${workflowId}/dispatches`,
      { ref, inputs: inputs ?? {} },
    );
  }

  // ── Webhooks ──

  async createWebhook(owner: string, repo: string, url: string, events: string[]) {
    return this.request("POST", `/repos/${owner}/${repo}/hooks`, {
      config: { url, content_type: "json" },
      events,
      active: true,
    });
  }

  // ── Pipeline Import ──

  async importPipeline(owner: string, repo: string): Promise<ImportedAgent[]> {
    const agents: ImportedAgent[] = [];

    // 1. Buscar workflows
    const workflows = await this.listWorkflows(owner, repo);
    const workflowFiles = workflows.data?.workflows ?? [];

    // 2. Buscar skill files
    let skillFiles: GitHubContentFile[] = [];
    try {
      const dir = await this.listDirectory(owner, repo, ".claude/commands");
      if (dir.success && Array.isArray(dir.data)) {
        skillFiles = dir.data;
      }
    } catch {
      // .claude/commands pode nao existir
    }

    // 3. Mapear cada workflow como um agente
    for (const wf of workflowFiles) {
      const wfContent = await this.getFileContent(owner, repo, wf.path);
      const yamlContent = wfContent.data?.decodedContent ?? "";

      // Tentar encontrar skill file correspondente
      const baseName = wf.name.replace(/\.ya?ml$/, "");
      const matchingSkill = skillFiles.find((sf) =>
        sf.name.toLowerCase().includes(baseName.toLowerCase())
        || baseName.toLowerCase().includes(sf.name.replace(".md", "").toLowerCase()),
      );

      let skillContent = "";
      let skillPath = "";
      let skillSha = "";
      if (matchingSkill) {
        const sf = await this.getFileContent(owner, repo, matchingSkill.path);
        skillContent = sf.data?.decodedContent ?? "";
        skillPath = matchingSkill.path;
        skillSha = sf.data?.sha ?? "";
      }

      const role = inferRoleFromWorkflow(wf.name, yamlContent);

      agents.push({
        name: baseName,
        displayName: formatWorkflowName(wf.name),
        role,
        workflowId: wf.id,
        workflowPath: wf.path,
        workflowContent: yamlContent,
        workflowSha: wfContent.data?.sha ?? "",
        skillPath,
        skillContent,
        skillSha,
        state: wf.state,
        lastRun: null,
      });
    }

    // 4. Buscar ultimo run de cada agente
    const runs = await this.listWorkflowRuns(owner, repo);
    const allRuns = runs.data?.workflow_runs ?? [];
    for (const agent of agents) {
      const lastRun = allRuns.find((r) => r.workflow_id === agent.workflowId);
      if (lastRun) {
        const duration = lastRun.run_started_at && lastRun.updated_at
          ? Math.round((new Date(lastRun.updated_at).getTime() - new Date(lastRun.run_started_at).getTime()) / 1000)
          : null;
        agent.lastRun = {
          id: lastRun.id,
          status: lastRun.status,
          conclusion: lastRun.conclusion,
          startedAt: lastRun.run_started_at,
          duration,
        };
      }
    }

    return agents;
  }
}

// ── Helpers ──

function inferRoleFromWorkflow(name: string, _content: string): string {
  const n = name.toLowerCase();
  if (n.includes("review") || n.includes("reviewer")) return "reviewer";
  if (n.includes("autofix") || n.includes("fix")) return "autofix";
  if (n.includes("architect") || n.includes("prd")) return "architect";
  if (n.includes("docs") || n.includes("documentation")) return "docs";
  if (n.includes("test") || n.includes("qa")) return "qa";
  if (n.includes("ideator") || n.includes("idea")) return "ideator";
  if (n.includes("taskmaster")) return "taskmaster";
  if (n.includes("designer") || n.includes("design")) return "designer";
  if (n.includes("claude") || n.includes("implement")) return "developer";
  if (n.includes("release")) return "release";
  if (n.includes("rebase")) return "rebase";
  if (n.includes("label") || n.includes("project")) return "project-sync";
  return "general";
}

function formatWorkflowName(name: string): string {
  return name
    .replace(/\.ya?ml$/, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
