"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Github } from "lucide-react";
import { cn } from "@/lib/utils";
import { landingButton } from "@/components/landing/primitives";
import { AuthDivider, AuthError, AuthField, PasswordField } from "@/components/auth/auth-fields";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("E-mail ou senha inválidos.");
      setLoading(false);
      return;
    }

    router.push(callbackUrl);
  }

  return (
    <div>
      <h1 className="text-[32px] font-semibold tracking-[-0.03em]">Entrar</h1>
      <p className="mt-2 text-[15px] text-om-fg-2">Acesse seus squads, agentes e projetos.</p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <AuthField
          id="email"
          label="E-mail"
          type="email"
          placeholder="voce@empresa.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <PasswordField
          id="password"
          label="Senha"
          placeholder="Sua senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
        {error && <AuthError>{error}</AuthError>}
        <button
          type="submit"
          disabled={loading}
          className={cn(landingButton({ size: "md" }), "mt-2 w-full disabled:opacity-60")}
        >
          {loading && <Loader2 className="animate-spin" />}
          Entrar
        </button>
      </form>

      <AuthDivider>ou</AuthDivider>

      <button
        type="button"
        onClick={() => signIn("github", { callbackUrl })}
        className={cn(landingButton({ variant: "ghost", size: "md" }), "w-full font-medium")}
      >
        <Github />
        Continuar com GitHub
      </button>

      <p className="mt-8 text-center text-sm text-om-fg-2">
        Ainda não tem conta?{" "}
        <Link href="/register" className="font-semibold text-om-fg underline-offset-4 hover:underline">
          Criar conta grátis
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
