/**
 * Equipe OrbitMind (a empresa), não admins de organizações clientes.
 * Os pedidos de orçamento do site são leads da OrbitMind e só essa equipe pode vê-los.
 * Configure em PLATFORM_ADMIN_EMAILS (lista separada por vírgula).
 */
export function isPlatformAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const allowed = (process.env.PLATFORM_ADMIN_EMAILS ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(email.trim().toLowerCase());
}
