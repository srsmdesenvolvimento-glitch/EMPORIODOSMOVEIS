import { z } from "zod";

/**
 * O ambiente é validado no boot. Se faltar chave, a aplicação quebra aqui,
 * na inicialização, e não três telas adiante em produção.
 *
 * Só entra aqui o que pode ser público. Chave de serviço do Supabase nunca
 * atravessa para o cliente — ela vive no servidor (scripts e Edge Functions).
 */
const esquemaAmbiente = z.object({
  VITE_SUPABASE_URL: z.string().url("VITE_SUPABASE_URL precisa ser uma URL"),
  VITE_SUPABASE_PUBLISHABLE_KEY: z
    .string()
    .min(20, "VITE_SUPABASE_PUBLISHABLE_KEY ausente ou curta demais"),
  VITE_SITE_URL: z.string().url().optional(),
});

const resultado = esquemaAmbiente.safeParse(import.meta.env);

if (!resultado.success) {
  const problemas = resultado.error.issues
    .map((i) => `  · ${i.path.join(".")}: ${i.message}`)
    .join("\n");
  throw new Error(
    `Variáveis de ambiente inválidas.\n${problemas}\n\n` +
      "Copie .env.example para .env.local e preencha os valores.",
  );
}

export const ambiente = resultado.data;
export type Ambiente = z.infer<typeof esquemaAmbiente>;
