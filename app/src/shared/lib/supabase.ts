import { createClient } from "@supabase/supabase-js";

import { ambiente } from "./env";

export const supabase = createClient(
  ambiente.VITE_SUPABASE_URL,
  ambiente.VITE_SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: "emporio-sessao",
    },
    global: {
      headers: { "x-cliente": "emporio-site" },
    },
  },
);

/** URL pública de um arquivo do bucket do catálogo. */
export function urlDoCatalogo(caminho: string): string {
  if (/^https?:\/\//.test(caminho)) return caminho;
  const { data } = supabase.storage.from("catalogo").getPublicUrl(caminho);
  return data.publicUrl;
}

/**
 * Erro do Supabase traduzido para algo que o visitante entenda.
 * Mensagem crua de banco não vai para a tela — vaza estrutura interna.
 */
export function mensagemDeErro(erro: unknown): string {
  if (erro && typeof erro === "object" && "message" in erro) {
    const bruta = String((erro as { message: unknown }).message);
    const mapa: Record<string, string> = {
      "Invalid login credentials": "E-mail ou senha incorretos.",
      "Email not confirmed": "Confirme seu e-mail antes de entrar.",
      "User already registered": "Já existe uma conta com esse e-mail.",
      "Password should be at least 6 characters":
        "A senha precisa ter ao menos 6 caracteres.",
      "Failed to fetch": "Sem conexão com o servidor. Verifique sua internet.",
    };
    for (const [chave, amigavel] of Object.entries(mapa)) {
      if (bruta.includes(chave)) return amigavel;
    }
    if (bruta.includes("row-level security") || bruta.includes("permission denied")) {
      return "Você não tem permissão para essa ação.";
    }
    if (bruta.includes("duplicate key")) {
      return "Esse registro já existe.";
    }
  }
  return "Não foi possível completar a ação. Tente de novo.";
}
