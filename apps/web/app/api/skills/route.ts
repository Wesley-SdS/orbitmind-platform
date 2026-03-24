import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getSkillsByOrgId, installSkill } from "@/lib/db/queries";
import { SKILL_REGISTRY } from "@orbitmind/engine";

export async function GET(): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });

    const installed = await getSkillsByOrgId(session.user.orgId);
    const installedIds = new Set(installed.map((s) => s.skillId));

    // Merge registry with installed status
    const skills = SKILL_REGISTRY.map((def) => {
      const inst = installed.find((i) => i.skillId === def.id);
      return {
        ...def,
        installed: !!inst,
        isActive: inst?.isActive ?? false,
        dbId: inst?.id ?? null,
        lastUsedAt: inst?.lastUsedAt ?? null,
        requiredConfig: def.requiredConfig,
      };
    });

    return NextResponse.json(skills);
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

const installSchema = z.object({
  skillId: z.string().min(1),
  config: z.record(z.string()).default({}),
  secrets: z.record(z.string()).default({}),
});

export async function POST(req: Request): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });

    const body = await req.json();
    const parsed = installSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Dados invalidos." }, { status: 400 });

    const def = SKILL_REGISTRY.find((s) => s.id === parsed.data.skillId);
    if (!def) return NextResponse.json({ error: "Skill nao encontrada." }, { status: 404 });

    const skill = await installSkill({
      orgId: session.user.orgId,
      skillId: def.id,
      name: def.name,
      type: def.type,
      config: parsed.data.config,
      secrets: parsed.data.secrets,
    });

    return NextResponse.json(skill, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
