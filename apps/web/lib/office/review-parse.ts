/**
 * Leitura da entrega em revisão (markdown gerado pelos agentes) para o painel
 * de checkpoint: critérios com resultado, sugestão do revisor, slides de um
 * carrossel e um resumo curto para o balão de fala.
 * Nada é inventado: seção que não aparece no texto não é exibida.
 */

export interface ReviewCriterion {
  text: string;
  passed: boolean;
}

export interface ReviewSlide {
  index: number;
  text: string;
  chars: number;
  overLimit: boolean;
}

export interface ReviewDigest {
  criteria: ReviewCriterion[];
  suggestion: string | null;
  slides: ReviewSlide[];
  charLimit: number | null;
  summary: string | null;
}

const PASS = /^[✅✔☑]️?/u;
const FAIL = /^[❌✗✘⚠]️?/u;

function clean(line: string): string {
  return line
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function parseCriteria(lines: string[]): ReviewCriterion[] {
  const out: ReviewCriterion[] = [];
  for (const raw of lines) {
    const line = raw.trim();
    const box = line.match(/^[-*+]\s*\[( |x|X)\]\s*(.+)$/);
    if (box) { out.push({ passed: box[1] !== " ", text: clean(box[2]!) }); continue; }
    const bullet = line.replace(/^[-*+]\s*/, "");
    if (PASS.test(bullet)) out.push({ passed: true, text: clean(bullet.replace(PASS, "")) });
    else if (FAIL.test(bullet)) out.push({ passed: false, text: clean(bullet.replace(FAIL, "")) });
  }
  return out.filter((c) => c.text.length > 0).slice(0, 8);
}

function parseSuggestion(lines: string[]): string | null {
  const start = lines.findIndex((l) => /^\s*(#{1,6}\s*|\*\*)?\s*(sugest|recomenda|pr[oó]ximo passo|a[cç][aã]o sugerida)/i.test(l));
  if (start < 0) return null;
  const head = lines[start]!;
  // texto na mesma linha do rótulo ("**Sugestão:** devolver para…")
  const inline = clean(head.replace(/^\s*(#{1,6}\s*)?/, "").replace(/^\**\s*(sugest\w*|recomenda\w*|pr[oó]ximo passo|a[cç][aã]o sugerida)[^:]*:?\**\s*:?/i, ""));
  const body: string[] = inline ? [inline] : [];
  for (let i = start + 1; i < lines.length; i++) {
    const l = lines[i]!;
    if (/^\s*#{1,6}\s/.test(l) || /^\s*\*\*[^*]+\*\*\s*:?\s*$/.test(l)) break;
    if (!l.trim()) { if (body.length) break; continue; }
    body.push(clean(l.replace(/^\s*[-*+]\s*/, "")));
  }
  const text = body.join(" ").trim();
  return text ? text.slice(0, 400) : null;
}

function parseCharLimit(text: string): number | null {
  const m = text.match(/(\d{2,4})\s*caracteres/i);
  return m ? Number(m[1]) : null;
}

function parseSlides(lines: string[], limit: number | null): ReviewSlide[] {
  const slides: Array<{ index: number; body: string[] }> = [];
  let cur: { index: number; body: string[] } | null = null;
  for (const raw of lines) {
    const m = raw.match(/^\s*(?:#{1,6}\s*)?\**\s*slide\s*(\d+)\s*\**\s*[:.\-–—]?\s*\**\s*(.*)$/i);
    if (m) {
      cur = { index: Number(m[1]), body: m[2] ? [m[2]] : [] };
      slides.push(cur);
      continue;
    }
    if (!cur) continue;
    if (/^\s*#{1,6}\s/.test(raw)) { cur = null; continue; }
    if (raw.trim()) cur.body.push(raw);
  }
  return slides
    .map((s) => {
      const text = clean(s.body.join(" ").replace(/^[-*+]\s*/gm, ""));
      return { index: s.index, text, chars: text.length, overLimit: limit !== null && text.length > limit };
    })
    .filter((s) => s.text.length > 0);
}

function parseSummary(lines: string[]): string | null {
  for (const raw of lines) {
    const l = raw.trim();
    if (!l || /^#{1,6}\s/.test(l) || /^[-*+|>]/.test(l) || /^\d+\./.test(l) || /^slide\s*\d/i.test(l)) continue;
    const text = clean(l);
    if (text.length < 20) continue;
    return text.length > 180 ? `${text.slice(0, 177).trimEnd()}…` : text;
  }
  return null;
}

export function digestReview(markdown: string | null | undefined): ReviewDigest {
  if (!markdown) return { criteria: [], suggestion: null, slides: [], charLimit: null, summary: null };
  const lines = markdown.split(/\r?\n/);
  const criteria = parseCriteria(lines);
  const charLimit = parseCharLimit(criteria.map((c) => c.text).join("\n")) ?? parseCharLimit(markdown);
  return {
    criteria,
    suggestion: parseSuggestion(lines),
    slides: parseSlides(lines, charLimit),
    charLimit,
    summary: parseSummary(lines),
  };
}
