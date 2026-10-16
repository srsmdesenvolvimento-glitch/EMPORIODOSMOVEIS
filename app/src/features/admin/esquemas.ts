import { z } from "zod";

/**
 * Esquemas que só o painel usa. Ficam fora de `shared/lib/esquemas` de
 * propósito: assim não viajam no pacote de quem apenas visita o catálogo.
 */

export const esquemaLogin = z.object({
  email: z.string().min(1, "Informe o e-mail").email("E-mail inválido"),
  senha: z.string().min(6, "A senha precisa ter ao menos 6 caracteres"),
});
export type DadosLogin = z.infer<typeof esquemaLogin>;

export const esquemaNovoUsuario = z.object({
  nome: z.string().min(2, "Informe o nome"),
  email: z.string().email("E-mail inválido"),
  senha: z
    .string()
    .min(8, "Use ao menos 8 caracteres")
    .regex(/[a-zA-Z]/, "Inclua ao menos uma letra")
    .regex(/[0-9]/, "Inclua ao menos um número"),
  papel: z.enum(["admin", "editor"]),
});
export type DadosNovoUsuario = z.infer<typeof esquemaNovoUsuario>;

export const esquemaFormProduto = z.object({
  nome: z.string().trim().min(2, "Informe o nome do móvel").max(160),
  slug: z
    .string()
    .trim()
    .min(2, "Informe o endereço do produto")
    .regex(/^[a-z0-9-]+$/, "Use apenas letras minúsculas, números e hífen"),
  categoria_id: z.string().uuid("Escolha uma categoria").nullable(),
  descricao: z.string().trim().max(4000).nullable(),
  especificacoes: z.array(z.string().trim().min(1)).default([]),
  codigos: z.array(z.string().trim().min(1)).default([]),
  altura_cm: z.number().min(0).max(1000).nullable(),
  largura_cm: z.number().min(0).max(1000).nullable(),
  profundidade_cm: z.number().min(0).max(1000).nullable(),
  peso_kg: z.number().min(0).max(1000).nullable(),
  volumes: z.number().int().min(0).max(99).nullable(),
  destaque: z.boolean(),
  em_oferta: z.boolean(),
  selo: z.string().trim().max(40).nullable(),
  ativo: z.boolean(),
});
export type DadosFormProduto = z.infer<typeof esquemaFormProduto>;
/** O tipo ANTES dos `.default()`: e o que o formulario realmente segura. */
export type EntradaFormProduto = z.input<typeof esquemaFormProduto>;

export const esquemaFormBanner = z.object({
  titulo: z.string().trim().min(2, "Informe o título").max(120),
  subtitulo: z.string().trim().max(200).nullable(),
  texto_botao: z.string().trim().max(40).nullable(),
  link: z.string().trim().max(300).nullable(),
  imagem_url: z.string().min(1, "Envie uma imagem"),
  imagem_mobile_url: z.string().nullable(),
  ativo: z.boolean(),
  ordem: z.number().int().min(0).max(99),
  inicia_em: z.string().nullable(),
  termina_em: z.string().nullable(),
});
export type DadosFormBanner = z.infer<typeof esquemaFormBanner>;

export const esquemaFormCategoria = z.object({
  nome: z.string().trim().min(2, "Informe o nome").max(80),
  slug: z
    .string()
    .trim()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "Use apenas letras minúsculas, números e hífen"),
  descricao: z.string().trim().max(500).nullable(),
  imagem_url: z.string().nullable(),
  ordem: z.number().int().min(0).max(99),
  ativa: z.boolean(),
  ambiente: z.enum(["sala", "jantar", "quarto", "cozinha", "escritorio", "outros"]),
});
export type DadosFormCategoria = z.infer<typeof esquemaFormCategoria>;

