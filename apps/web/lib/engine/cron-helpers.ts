/**
 * Auto-select the best option from a step output.
 * Looks for scored/ranked items and picks the highest.
 */
export function autoSelectBestOption(output: string): number {
  if (!output) return 0;

  // Try to find scored items (e.g., "Score: 8/10", "Potencial viral: 9")
  const scorePattern = /(?:score|potencial|pontuação|nota)[:\s]*(\d+)/gi;
  const scores: Array<{ index: number; score: number }> = [];

  // Split by numbered items
  const items = output.split(/\n(?=\d+[\.\)]\s)/);
  for (let i = 0; i < items.length; i++) {
    const item = items[i]!;
    const scoreMatch = item.match(scorePattern);
    if (scoreMatch) {
      const lastScore = scoreMatch[scoreMatch.length - 1]!;
      const numMatch = lastScore.match(/(\d+)/);
      if (numMatch) {
        scores.push({ index: i, score: parseInt(numMatch[1]!, 10) });
      }
    }
  }

  if (scores.length > 0) {
    // Return index of highest scored item
    scores.sort((a, b) => b.score - a.score);
    return scores[0]!.index;
  }

  // No scores found — return first item (index 0)
  return 0;
}
