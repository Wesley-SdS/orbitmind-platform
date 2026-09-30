"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { landingButton } from "@/components/landing/primitives";
import { AuthError, AuthField, PasswordField } from "@/components/auth/auth-fields";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Erro ao criar conta.");
      setLoading(false);
      return;
    }

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Conta criada, mas não foi possível entrar. Tente fazer login.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div>
      <h1 className="text-[32px] font-semibold tracking-[-0.03em]">Criar conta</h1>
      <p className="mt-2 text-[15px] text-om-fg-2">
        Comece grátis a orquestrar squads de IA. Sem cartão de crédito.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <AuthField
          id="name"
          label="Nome"
          type="text"
          placeholder="Seu nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoComplete="name"
        />
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
          placeholder="Mínimo de 6 caracteres"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
        />
        <PasswordField
          id="confirmPassword"
          label="Confirmar senha"
          placeholder="Repita a senha"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          autoComplete="new-password"
        />
        {error && <AuthError>{error}</AuthError>}
        <button
          type="submit"
          disabled={loading}
          className={cn(landingButton({ size: "md" }), "mt-2 w-full disabled:opacity-60")}
        >
          {loading && <Loader2 className="animate-spin" />}
          Criar conta
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-om-fg-2">
        Já tem uma conta?{" "}
        <Link href="/login" className="font-semibold text-om-fg underline-offset-4 hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  );
}
