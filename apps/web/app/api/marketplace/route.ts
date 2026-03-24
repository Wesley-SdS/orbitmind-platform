import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { marketplaceItems } from "@/lib/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";

export async function GET(req: Request): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });

    const url = new URL(req.url);
    const type = url.searchParams.get("type");
    const category = url.searchParams.get("category");
    const search = url.searchParams.get("search");
    const limit = parseInt(url.searchParams.get("limit") ?? "20", 10);

    let query = db.select().from(marketplaceItems).where(eq(marketplaceItems.isActive, true));

    const conditions = [eq(marketplaceItems.isActive, true)];
    if (type) conditions.push(eq(marketplaceItems.type, type as "agent" | "squad"));
    if (category) conditions.push(eq(marketplaceItems.category, category as any));

    const items = await db
      .select()
      .from(marketplaceItems)
      .where(and(...conditions))
      .orderBy(desc(marketplaceItems.installs))
      .limit(limit);

    const filtered = search
      ? items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()) || i.description.toLowerCase().includes(search.toLowerCase()))
      : items;

    return NextResponse.json(filtered);
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
