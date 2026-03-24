#!/usr/bin/env node

/**
 * OrbitMind CLI — Setup wizard
 *
 * Usage: npx orbitmind init
 */

export async function init(): Promise<void> {
  const readline = await import("node:readline");
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q: string): Promise<string> => new Promise((r) => rl.question(q, r));

  console.log("");
  console.log("  ╔══════════════════════════════════════╗");
  console.log("  ║       OrbitMind Platform Setup        ║");
  console.log("  ╚══════════════════════════════════════╝");
  console.log("");

  // 1. Organization
  const orgName = await ask("  Nome da organizacao: ") || "Minha Org";
  console.log(`  > Organizacao: ${orgName}`);

  // 2. Template
  console.log("");
  console.log("  Templates disponiveis:");
  console.log("    1. Marketing Agency (7 agentes, 10 steps)");
  console.log("    2. Instagram Carousel Factory (5 agentes, 13 steps)");
  console.log("    3. Dev Team (5 agentes, 8 steps)");
  console.log("    4. Support Team (4 agentes, 6 steps)");
  console.log("    5. Do zero (criar pelo chat)");
  const templateChoice = await ask("  Escolha (1-5): ") || "5";
  const templates = ["marketing-agency", "instagram-carousel", "dev-team", "support-team", "custom"];
  const template = templates[parseInt(templateChoice) - 1] ?? "custom";
  console.log(`  > Template: ${template}`);

  // 3. LLM Provider
  console.log("");
  console.log("  Provedor de IA:");
  console.log("    1. OpenAI (GPT-5.4, o3)");
  console.log("    2. Anthropic (Claude Opus, Sonnet, Haiku)");
  console.log("    3. Google Gemini (Gemini 3.1 Pro, Flash)");
  console.log("    4. Configurar depois (via UI)");
  const providerChoice = await ask("  Escolha (1-4): ") || "4";
  const providers = ["openai", "anthropic", "gemini", "skip"];
  const provider = providers[parseInt(providerChoice) - 1] ?? "skip";

  let apiKey = "";
  if (provider !== "skip") {
    apiKey = await ask(`  API Key do ${provider}: `);
  }

  // 4. Database
  console.log("");
  const dbUrl = await ask("  DATABASE_URL (Enter para default local): ") || "postgresql://orbitmind:orbitmind_dev@localhost:5432/orbitmind";

  // 5. Summary
  console.log("");
  console.log("  ════════════════════════════════════════");
  console.log("  Resumo:");
  console.log(`    Organizacao: ${orgName}`);
  console.log(`    Template: ${template}`);
  console.log(`    LLM Provider: ${provider}`);
  console.log(`    Database: ${dbUrl.substring(0, 40)}...`);
  console.log("  ════════════════════════════════════════");
  console.log("");

  const confirm = await ask("  Confirmar? (s/n): ");
  if (confirm.toLowerCase() !== "s" && confirm.toLowerCase() !== "y") {
    console.log("  Cancelado.");
    rl.close();
    return;
  }

  // 6. Generate .env
  console.log("");
  console.log("  Gerando .env...");
  const { writeFileSync, existsSync } = await import("node:fs");
  if (!existsSync(".env")) {
    const envContent = [
      `DATABASE_URL=${dbUrl}`,
      `NEXTAUTH_SECRET=${crypto.randomUUID()}`,
      `NEXTAUTH_URL=http://localhost:3000`,
      "",
    ].join("\n");
    writeFileSync(".env", envContent);
    console.log("  > .env criado");
  } else {
    console.log("  > .env ja existe, pulando");
  }

  console.log("");
  console.log("  Setup completo! Proximos passos:");
  console.log("    1. docker compose up -d");
  console.log("    2. pnpm db:push");
  console.log("    3. pnpm db:seed");
  console.log("    4. pnpm dev");
  console.log("    5. Acesse http://localhost:3000");
  console.log(`    6. Login: admin@orbitmind.com / admin123`);
  if (provider !== "skip") {
    console.log(`    7. Configure ${provider} em Settings > Provedores de IA`);
  }
  console.log("");

  rl.close();
}

// Run if called directly
if (typeof require !== "undefined" && require.main === module) {
  init().catch(console.error);
}
