import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PREMIUM_INTEGRATIONS, PREMIUM_TOTAL } from "@/lib/integrations";
import { fetchDynamicCatalog } from "@/lib/integrations/generic-catalog";

export async function GET(): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
    }

    // Fetch dinamico do Nango API (700+ providers) com fallback estatico
    const dynamicCatalog = await fetchDynamicCatalog();

    return NextResponse.json({
      premium: PREMIUM_INTEGRATIONS,
      premiumTotal: PREMIUM_TOTAL,
      generic: dynamicCatalog.categories,
      genericTotal: dynamicCatalog.totalProviders,
      totalAvailable: PREMIUM_TOTAL + dynamicCatalog.totalProviders,
      source: dynamicCatalog.source,
    });
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
