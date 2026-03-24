import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PREMIUM_INTEGRATIONS, PREMIUM_TOTAL } from "@/lib/integrations";
import { GENERIC_CATALOG, GENERIC_TOTAL } from "@/lib/integrations";

export async function GET(): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
    }

    return NextResponse.json({
      premium: PREMIUM_INTEGRATIONS,
      premiumTotal: PREMIUM_TOTAL,
      generic: GENERIC_CATALOG,
      genericTotal: GENERIC_TOTAL,
      totalAvailable: PREMIUM_TOTAL + GENERIC_TOTAL,
    });
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
