import { NextResponse } from "next/server";
import { encode } from "next-auth/jwt";
import { auth } from "@/lib/auth";
import { WS_TOKEN_MAX_AGE_SECONDS, WS_TOKEN_SALT } from "@/lib/realtime/ws-token";

/**
 * Token curto para abrir o WebSocket (`/api/ws?token=...`).
 * O cookie de sessão é httpOnly, então o cliente não consegue lê-lo; aqui
 * emitimos um JWT próprio, com salt diferente e validade de poucos minutos.
 */
export async function GET(): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
    }
    const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;
    if (!secret) {
      return NextResponse.json({ error: "NEXTAUTH_SECRET nao configurado." }, { status: 500 });
    }
    const token = await encode({
      token: { sub: session.user.id, orgId: session.user.orgId },
      secret,
      salt: WS_TOKEN_SALT,
      maxAge: WS_TOKEN_MAX_AGE_SECONDS,
    });
    return NextResponse.json({ token, expiresIn: WS_TOKEN_MAX_AGE_SECONDS }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
