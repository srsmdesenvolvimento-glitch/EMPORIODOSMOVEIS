/**
 * Cria um usuário do painel.
 *
 * A criação de contas exige a chave de serviço, que nunca pode viver no
 * navegador. Por isso ela acontece aqui: a função confere o JWT de quem
 * chamou, exige que seja um admin ativo, e só então usa a chave de serviço.
 */
import { createClient } from "jsr:@supabase/supabase-js@2";

const URL_SUPABASE = Deno.env.get("SUPABASE_URL") ?? "";
const CHAVE_SERVICO = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const CHAVE_PUBLICA = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const ORIGENS = (Deno.env.get("ORIGENS_PERMITIDAS") ?? "*")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

function cabecalhosCors(origem: string | null): Record<string, string> {
  const liberada =
    ORIGENS.includes("*") || (origem !== null && ORIGENS.includes(origem));
  return {
    "Access-Control-Allow-Origin": liberada ? (origem ?? "*") : ORIGENS[0] ?? "",
    "Access-Control-Allow-Headers": "authorization, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

function responder(
  corpo: Record<string, unknown>,
  status: number,
  origem: string | null,
): Response {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { "Content-Type": "application/json", ...cabecalhosCors(origem) },
  });
}

function senhaAceitavel(senha: string): boolean {
  return senha.length >= 8 && /[a-zA-Z]/.test(senha) && /[0-9]/.test(senha);
}

Deno.serve(async (req) => {
  const origem = req.headers.get("origin");

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cabecalhosCors(origem) });
  }
  if (req.method !== "POST") {
    return responder({ erro: "Método não permitido" }, 405, origem);
  }

  const autorizacao = req.headers.get("Authorization") ?? "";
  if (!autorizacao.startsWith("Bearer ")) {
    return responder({ erro: "Não autenticado" }, 401, origem);
  }

  // 1. Quem está chamando? Valida o token com a chave pública.
  const comoUsuario = createClient(URL_SUPABASE, CHAVE_PUBLICA, {
    global: { headers: { Authorization: autorizacao } },
  });
  const { data: dadosUsuario, error: erroUsuario } = await comoUsuario.auth.getUser();
  if (erroUsuario || !dadosUsuario.user) {
    return responder({ erro: "Sessão inválida" }, 401, origem);
  }

  // 2. Esse usuário é admin ativo? A resposta vem do banco, não do cliente.
  const comoServico = createClient(URL_SUPABASE, CHAVE_SERVICO, {
    auth: { persistSession: false },
  });
  const { data: perfil } = await comoServico
    .from("perfis")
    .select("papel, ativo")
    .eq("id", dadosUsuario.user.id)
    .maybeSingle();

  if (!perfil || !perfil.ativo || perfil.papel !== "admin") {
    return responder({ erro: "Apenas administradores podem criar usuários" }, 403, origem);
  }

  // 3. Valida a entrada.
  let corpo: { nome?: string; email?: string; senha?: string; papel?: string };
  try {
    corpo = await req.json();
  } catch {
    return responder({ erro: "Corpo inválido" }, 400, origem);
  }

  const nome = (corpo.nome ?? "").trim();
  const email = (corpo.email ?? "").trim().toLowerCase();
  const senha = corpo.senha ?? "";
  const papel = corpo.papel === "admin" ? "admin" : "editor";

  if (nome.length < 2 || nome.length > 120) {
    return responder({ erro: "Informe um nome válido" }, 400, origem);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return responder({ erro: "E-mail inválido" }, 400, origem);
  }
  if (!senhaAceitavel(senha)) {
    return responder(
      { erro: "A senha precisa de ao menos 8 caracteres, com letra e número" },
      400,
      origem,
    );
  }

  // 4. Cria a conta. O gatilho no banco monta o perfil correspondente.
  const { data: criado, error: erroCriacao } =
    await comoServico.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
      user_metadata: { nome, papel },
    });

  if (erroCriacao || !criado.user) {
    const mensagem = erroCriacao?.message ?? "Falha ao criar usuário";
    const jaExiste = mensagem.toLowerCase().includes("already");
    return responder(
      { erro: jaExiste ? "Já existe uma conta com esse e-mail" : mensagem },
      jaExiste ? 409 : 400,
      origem,
    );
  }

  // O gatilho só promove a admin o primeiro usuário; garante o papel pedido.
  await comoServico
    .from("perfis")
    .update({ papel, nome, email })
    .eq("id", criado.user.id);

  return responder({ ok: true, id: criado.user.id }, 201, origem);
});
