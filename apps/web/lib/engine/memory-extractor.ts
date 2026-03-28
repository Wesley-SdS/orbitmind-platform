import { addSquadMemory } from "@/lib/db/queries/squad-memories";

interface StepOutput {
  agentName: string;
  agentIcon: string;
  content: string;
  completedAt: string;
}

/**
 * Extract and save key learnings from a pipeline run.
 * Called after successful pipeline completion.
 */
export async function extractAndSaveMemories(
  squadId: string,
  stepOutputs: Record<string, StepOutput>,
  runId: string,
): Promise<void> {
  const entries = Object.entries(stepOutputs);
  if (entries.length === 0) return;

  // 1. Save what topic/theme was worked on (from first checkpoint or first agent)
  const firstOutput = entries[0]?.[1];
  if (firstOutput) {
    const topicSummary = firstOutput.content.substring(0, 200);
    await addSquadMemory({
      squadId,
      type: "decision",
      content: `Run ${runId}: Tema trabalhado — ${topicSummary}`,
      source: `pipeline-run-${runId}`,
      importance: 5,
    });
  }

  // 2. Save review feedback if exists (from reviewer agent)
  const reviewEntry = entries.find(([_, v]) =>
    v.agentName.toLowerCase().includes("revis") ||
    v.agentName.toLowerCase().includes("review")
  );
  if (reviewEntry) {
    const feedback = reviewEntry[1].content.substring(0, 500);
    await addSquadMemory({
      squadId,
      type: "feedback",
      content: `Feedback da revisão (run ${runId}): ${feedback}`,
      source: `pipeline-run-${runId}`,
      importance: 7,
    });
  }

  // 3. Save execution summary
  const agentNames = entries.map(([_, v]) => v.agentName).join(", ");
  await addSquadMemory({
    squadId,
    type: "pattern",
    content: `Pipeline executado com sucesso (run ${runId}). ${entries.length} steps completados. Agentes: ${agentNames}.`,
    source: `pipeline-run-${runId}`,
    importance: 3,
  });
}
