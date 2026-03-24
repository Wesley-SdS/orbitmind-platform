/**
 * Tone of Voice System
 *
 * 6 pre-defined tones that agents can use.
 * Writer agents ask for tone BEFORE producing content.
 *
 * Based on: opensquad-ref pipeline/data/tone-of-voice.md
 */

export interface ToneDefinition {
  id: string;
  name: string;
  emoji: string;
  description: string;
  characteristics: string[];
  vocabulary: { use: string[]; avoid: string[] };
  example: string;
}

export const TONE_OF_VOICE_OPTIONS: ToneDefinition[] = [
  {
    id: "educativo",
    name: "Educativo",
    emoji: "📚",
    description: "Didatico, ensina com clareza e paciencia",
    characteristics: ["Explica conceitos complexos de forma simples", "Usa analogias e exemplos praticos", "Tom de professor acessivel", "Progressao logica de ideias"],
    vocabulary: {
      use: ["vamos entender", "na pratica", "por exemplo", "o segredo e", "funciona assim"],
      avoid: ["obviamente", "todo mundo sabe", "e simples", "basicamente"],
    },
    example: "Voce ja parou para pensar em como o algoritmo do Instagram decide o que mostrar no seu feed? Funciona assim: cada vez que voce interage com um post...",
  },
  {
    id: "provocativo",
    name: "Provocativo",
    emoji: "🔥",
    description: "Desafia crencas, provoca reflexao e debate",
    characteristics: ["Questiona o status quo", "Usa dados surpreendentes", "Tom de debate construtivo", "Convida a pensar diferente"],
    vocabulary: {
      use: ["e se eu te disser que", "a verdade e que", "ninguem fala sobre", "o problema real e"],
      avoid: ["na minha humilde opiniao", "talvez", "possivelmente", "sei la"],
    },
    example: "90% dos posts de marketing que voce ve no LinkedIn sao lixo reciclado. E se eu te disser que o problema nao e o conteudo — e o modelo mental?",
  },
  {
    id: "inspiracional",
    name: "Inspiracional",
    emoji: "✨",
    description: "Motiva, emociona e conecta com proposito",
    characteristics: ["Storytelling emocional", "Foca na transformacao", "Tom esperancoso", "Celebra conquistas"],
    vocabulary: {
      use: ["imagine", "transformacao", "jornada", "possivel", "voce consegue"],
      avoid: ["impossivel", "dificil demais", "fracasso", "problema"],
    },
    example: "Ha 2 anos, eu mal sabia o que era marketing digital. Hoje, minha agencia atende 47 clientes. O que mudou nao foi o mercado — fui eu.",
  },
  {
    id: "humoristico",
    name: "Humoristico",
    emoji: "😄",
    description: "Leve, divertido, viraliza com humor inteligente",
    characteristics: ["Timing comico", "Autoironia", "Memes e referencias culturais", "Humor inteligente (nao forcado)"],
    vocabulary: {
      use: ["spoiler", "plot twist", "nao e piada", "risos nervosos"],
      avoid: ["piadas ofensivas", "humor pesado", "sarcasmo destrutivo"],
    },
    example: "POV: voce gastou 3 horas criando um carrossel perfeito e o Instagram decidiu mostrar para 12 pessoas. 12. Seus pais e 10 bots.",
  },
  {
    id: "autoridade",
    name: "Autoridade",
    emoji: "🎯",
    description: "Especialista, data-driven, confiavel",
    characteristics: ["Dados e estatisticas", "Linguagem tecnica acessivel", "Citacoes de fontes", "Tom de consultor senior"],
    vocabulary: {
      use: ["dados mostram", "segundo [fonte]", "o benchmarking indica", "na nossa experiencia"],
      avoid: ["acho que", "parece que", "talvez", "acredito que"],
    },
    example: "Segundo o State of Marketing 2026 da HubSpot, empresas que usam agentes de IA em marketing tiveram aumento de 340% em produtividade de conteudo.",
  },
  {
    id: "conversacional",
    name: "Conversacional",
    emoji: "💬",
    description: "Amigavel, proximo, como conversa entre amigos",
    characteristics: ["Tom informal mas profissional", "Perguntas retoricas", "Emojis com moderacao", "Cria senso de comunidade"],
    vocabulary: {
      use: ["olha so", "entre nos", "vou te contar", "sabe o que eu percebi"],
      avoid: ["prezados", "venho por meio desta", "outrossim", "destarte"],
    },
    example: "Olha so, vou te contar uma coisa que mudou completamente minha forma de criar conteudo. Sabe aquela sensacao de ficar 2 horas olhando pra tela em branco?",
  },
];

export function getToneById(id: string): ToneDefinition | undefined {
  return TONE_OF_VOICE_OPTIONS.find((t) => t.id === id);
}

export function buildToneInstructions(toneId: string): string {
  const tone = getToneById(toneId);
  if (!tone) return "";

  return `## Tom de Voz: ${tone.emoji} ${tone.name}
${tone.description}

**Caracteristicas:**
${tone.characteristics.map((c) => `- ${c}`).join("\n")}

**Use:** ${tone.vocabulary.use.join(", ")}
**Evite:** ${tone.vocabulary.avoid.join(", ")}

**Exemplo de referencia:**
"${tone.example}"`;
}
