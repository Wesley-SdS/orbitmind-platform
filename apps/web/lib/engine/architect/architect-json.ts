/**
 * JSON extraction utilities for Architect design parsing.
 * Extracted from architect-handler.ts to be shared with architect-workflow.ts.
 */
import type { ArchitectConversationState } from "./architect-state";

export function extractDesignJson(output: string): ArchitectConversationState["proposedDesign"] | null {
  const fencedMatch =
    output.match(/```(?:json:squad-design|json)?\s*\n([\s\S]*?)\n\s*```/) ||
    output.match(/```\s*\n?(\{[\s\S]*?"agents"[\s\S]*?\})\n?\s*```/);

  if (fencedMatch) {
    try {
      const parsed = JSON.parse(fencedMatch[1]!);
      if (parsed.agents && Array.isArray(parsed.agents)) return parsed;
    } catch { /* */ }
  }

  const bareEnd = findBareJsonEnd(output.trimStart());
  if (bareEnd > 0) {
    const offset = output.length - output.trimStart().length;
    try {
      const parsed = JSON.parse(output.slice(offset, offset + bareEnd));
      if (parsed.agents && Array.isArray(parsed.agents)) return parsed;
    } catch { /* */ }
  }

  // Aggressive fallback: find JSON with "agents" anywhere in the output
  const jsonStart = output.indexOf('{"ready"');
  if (jsonStart === -1) {
    // Try finding by "agents" key
    const agentsIdx = output.indexOf('"agents"');
    if (agentsIdx > 0) {
      let braceIdx = output.lastIndexOf('{', agentsIdx);
      while (braceIdx > 0) {
        try {
          const candidate = output.substring(braceIdx);
          let depth = 0;
          let endIdx = -1;
          for (let i = 0; i < candidate.length; i++) {
            if (candidate[i] === '{') depth++;
            if (candidate[i] === '}') depth--;
            if (depth === 0) { endIdx = i + 1; break; }
          }
          if (endIdx > 0) {
            const parsed = JSON.parse(candidate.substring(0, endIdx));
            if (parsed.agents && Array.isArray(parsed.agents)) return parsed;
          }
        } catch { /* continue searching */ }
        braceIdx = output.lastIndexOf('{', braceIdx - 1);
        if (braceIdx < 0) break;
      }
    }
  }

  if (jsonStart >= 0) {
    try {
      let depth = 0;
      let endIdx = -1;
      for (let i = jsonStart; i < output.length; i++) {
        if (output[i] === '{') depth++;
        if (output[i] === '}') depth--;
        if (depth === 0) { endIdx = i + 1; break; }
      }
      if (endIdx > 0) {
        const parsed = JSON.parse(output.substring(jsonStart, endIdx));
        if (parsed.agents && Array.isArray(parsed.agents)) return parsed;
      }
    } catch { /* ignore */ }
  }

  return null;
}

export function stripJsonFromOutput(output: string): string {
  let cleaned = output.replace(/```(?:json:squad-design|json)?\s*\n[\s\S]*?\n\s*```\s*/g, "");
  const bareEnd = findBareJsonEnd(cleaned.trimStart());
  if (bareEnd > 0) {
    const offset = cleaned.length - cleaned.trimStart().length;
    cleaned = cleaned.slice(offset + bareEnd);
  }

  // Also strip any embedded JSON object with "agents" array
  const agentsIdx = cleaned.indexOf('"agents"');
  if (agentsIdx > 0) {
    let braceIdx = cleaned.lastIndexOf('{', agentsIdx);
    while (braceIdx >= 0) {
      try {
        const candidate = cleaned.substring(braceIdx);
        let depth = 0;
        let endIdx = -1;
        for (let i = 0; i < candidate.length; i++) {
          if (candidate[i] === '{') depth++;
          if (candidate[i] === '}') depth--;
          if (depth === 0) { endIdx = i + 1; break; }
        }
        if (endIdx > 0) {
          const parsed = JSON.parse(candidate.substring(0, endIdx));
          if (parsed.agents && Array.isArray(parsed.agents)) {
            cleaned = cleaned.substring(0, braceIdx) + cleaned.substring(braceIdx + endIdx);
            break;
          }
        }
      } catch { /* continue */ }
      braceIdx = cleaned.lastIndexOf('{', braceIdx - 1);
      if (braceIdx < 0) break;
    }
  }

  return cleaned.trim();
}

function findBareJsonEnd(text: string): number {
  if (!text.startsWith("{")) return 0;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (escape) { escape = false; continue; }
    if (ch === "\\") { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{" || ch === "[") depth++;
    if (ch === "}" || ch === "]") depth--;
    if (depth === 0) return i + 1;
  }
  return 0;
}
