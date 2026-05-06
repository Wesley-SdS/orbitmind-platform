// Stub para evitar flood do Inngest CLI de outros projetos rodando na
// mesma porta (ex: lumina). Sem isso, cada poll caia no middleware de auth,
// fazia redirect para /login e gerava centenas de requests por minuto.

const NOT_HOSTED = {
  ok: false,
  message: "Inngest is not hosted on this app. Stop the inngest CLI or change its target URL.",
};

function reply(): Response {
  return new Response(JSON.stringify(NOT_HOSTED), {
    status: 410,
    headers: { "Content-Type": "application/json" },
  });
}

export const GET = reply;
export const POST = reply;
export const PUT = reply;
export const DELETE = reply;
export const PATCH = reply;
