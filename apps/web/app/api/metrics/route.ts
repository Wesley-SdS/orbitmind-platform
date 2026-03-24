import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDashboardMetrics } from "@/lib/db/queries";

export async function GET(): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
    }

    const metrics = await getDashboardMetrics(session.user.orgId);
    return NextResponse.json(metrics);
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
