import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      orgId: string;
      role: string;
      image?: string | null;
    };
  }
  interface User {
    orgId?: string;
    role?: string;
  }
}

const config = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt" as const,
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email as string;
        const password = credentials.password as string;

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (!user) return null;

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          orgId: user.orgId,
          role: user.role,
        };
      },
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: Record<string, unknown>; user?: Record<string, unknown> }) {
      if (user) {
        token.userId = user.id;
        token.orgId = user.orgId;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }: { session: Record<string, unknown>; token: Record<string, unknown> }) {
      const user = session.user as Record<string, unknown>;
      user.id = (token.userId as string) ?? "";
      user.orgId = (token.orgId as string) ?? "";
      user.role = (token.role as string) ?? "";
      return session;
    },
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const nextAuth = NextAuth(config as any);

// Explicit type casts to avoid TS2742 portability errors in monorepos
export const handlers: {
  GET: (req: Request) => Promise<Response>;
  POST: (req: Request) => Promise<Response>;
} = nextAuth.handlers as never;

export const auth: {
  (): Promise<{ user: { id: string; name: string; email: string; orgId: string; role: string } } | null>;
  (handler: (req: unknown) => Response | void | Promise<Response | void>): (req: unknown) => Promise<Response>;
} = nextAuth.auth as never;

export const signIn: typeof nextAuth.signIn = nextAuth.signIn as never;
export const signOut: typeof nextAuth.signOut = nextAuth.signOut as never;
