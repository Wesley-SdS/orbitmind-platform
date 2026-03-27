/**
 * Pipeline Installer — instala workflows, skill files e labels em um repo via GitHub API
 */

import { GitHubIntegration } from "../actions/github";
import { AGENT_TEMPLATES, PIPELINE_LABELS, type AgentTemplate } from "./pipeline-templates";

export interface InstallResult {
  installed: string[];
  skipped: string[];
  errors: string[];
  labelsCreated: string[];
}

/**
 * Instala a esteira completa (ou agentes selecionados) em um repositorio.
 */
export async function installPipeline(
  github: GitHubIntegration,
  owner: string,
  repo: string,
  options?: {
    agents?: string[];   // nomes dos agentes a instalar (default: todos)
    branch?: string;     // branch para commit (default: main)
    skipExisting?: boolean; // pular arquivos que ja existem (default: true)
  },
): Promise<InstallResult> {
  const {
    agents: selectedAgents,
    branch = "main",
    skipExisting = true,
  } = options ?? {};

  const templates = selectedAgents
    ? AGENT_TEMPLATES.filter((t) => selectedAgents.includes(t.name))
    : AGENT_TEMPLATES;

  const result: InstallResult = {
    installed: [],
    skipped: [],
    errors: [],
    labelsCreated: [],
  };

  // 1. Criar labels
  for (const label of PIPELINE_LABELS) {
    try {
      await github.createLabel(owner, repo, label.name, label.color, label.description);
      result.labelsCreated.push(label.name);
    } catch {
      // Label ja existe — ok
    }
  }

  // 2. Instalar workflows e skill files
  for (const template of templates) {
    // Workflow
    if (template.workflowContent) {
      const workflowPath = `.github/workflows/${template.workflowFile}`;
      try {
        if (skipExisting) {
          const existing = await github.getFile(owner, repo, workflowPath);
          if (existing.success) {
            result.skipped.push(workflowPath);
            continue;
          }
        }

        await github.createOrUpdateFile(
          owner, repo, workflowPath,
          template.workflowContent,
          `feat: install ${template.displayName} agent workflow via OrbitMind`,
        );
        result.installed.push(workflowPath);
      } catch (error) {
        result.errors.push(`${workflowPath}: ${error instanceof Error ? error.message : "unknown error"}`);
      }
    }

    // Skill file
    if (template.skillContent && template.skillFile) {
      const skillPath = `.claude/commands/${template.skillFile}`;
      try {
        if (skipExisting) {
          const existing = await github.getFile(owner, repo, skillPath);
          if (existing.success) {
            result.skipped.push(skillPath);
            continue;
          }
        }

        await github.createOrUpdateFile(
          owner, repo, skillPath,
          template.skillContent,
          `feat: install ${template.displayName} agent skill via OrbitMind`,
        );
        result.installed.push(skillPath);
      } catch (error) {
        result.errors.push(`${skillPath}: ${error instanceof Error ? error.message : "unknown error"}`);
      }
    }
  }

  return result;
}

/**
 * Retorna os templates disponiveis para selecao na UI.
 */
export function getAvailableTemplates(): Array<{
  name: string;
  displayName: string;
  role: string;
  description: string;
  hasSkillFile: boolean;
  requiredLabels: string[];
}> {
  return AGENT_TEMPLATES.map((t) => ({
    name: t.name,
    displayName: t.displayName,
    role: t.role,
    description: t.description,
    hasSkillFile: !!t.skillFile && !!t.skillContent,
    requiredLabels: t.requiredLabels,
  }));
}
