import { z } from "zod";

/**
 * Zod é a origem de todo tipo deste projeto. Nada de interface escrita à mão
 * em paralelo: o tipo sai sempre de `z.infer`.
 */

export const esquemaCategoria = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  nome: z.string(),
  descricao: z.string().nullable(),
  imagem_url: z.string().nullable(),
  icone: z.string().nullable(),
  ordem: z.number(),
  ativa: z.boolean(),
  ambiente: z.string().default("outros"),
});
export type Categoria = z.infer<typeof esquemaCategoria>;

export const esquemaImagem = z.object({
  id: z.string().uuid(),
  url: z.string(),
  alt: z.string().nullable(),
  largura: z.number().nullable(),
  altura: z.number().nullable(),
  ordem: z.number(),
});
export type ImagemProduto = z.infer<typeof esquemaImagem>;

export const esquemaCor = z.object({
  id: z.string().uuid(),
  nome: z.string(),
  imagem_url: z.string().nullable(),
  amostra_hex: z.string().nullable(),
  ordem: z.number(),
});
export type CorProduto = z.infer<typeof esquemaCor>;

/** O que a vitrine precisa de um produto — nada além disso. */
export const esquemaProdutoCartao = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  nome: z.string(),
  categoria_slug: z.string().nullable(),
  categoria_nome: z.string().nullable(),
  selo: z.string().nullable(),
  em_oferta: z.boolean(),
  destaque: z.boolean(),
  altura_cm: z.coerce.number().nullable(),
  largura_cm: z.coerce.number().nullable(),
  profundidade_cm: z.coerce.number().nullable(),
  imagem_url: z.string().nullable(),
  imagem_largura: z.number().nullable(),
  imagem_altura: z.number().nullable(),
  imagem2_url: z.string().nullable().default(null),
  total_cores: z.number().default(0),
  /** Até 4 acabamentos com foto, para as amostras do cartão. */
  cores_previa: z
    .array(z.object({ nome: z.string(), imagem_url: z.string() }))
    .default([]),
  total: z.coerce.number().default(0),
});
export type ProdutoCartao = z.infer<typeof esquemaProdutoCartao>;

export const esquemaProduto = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  nome: z.string(),
  categoria_id: z.string().uuid().nullable(),
  descricao: z.string().nullable(),
  especificacoes: z.array(z.string()).default([]),
  codigos: z.array(z.string()).default([]),
  altura_cm: z.coerce.number().nullable(),
  largura_cm: z.coerce.number().nullable(),
  profundidade_cm: z.coerce.number().nullable(),
  peso_kg: z.coerce.number().nullable(),
  volumes: z.number().nullable(),
  medidas_texto: z.array(z.string()).default([]),
  observacoes: z.array(z.string()).default([]),
  destaque: z.boolean(),
  em_oferta: z.boolean(),
  selo: z.string().nullable(),
  ativo: z.boolean(),
  ordem: z.number(),
  pagina_catalogo: z.number().nullable(),
  criado_em: z.string(),
});
export type Produto = z.infer<typeof esquemaProduto>;

export const esquemaProdutoCompleto = esquemaProduto.extend({
  categorias: esquemaCategoria.pick({ slug: true, nome: true }).nullable(),
  produto_imagens: z.array(esquemaImagem).default([]),
  produto_cores: z.array(esquemaCor).default([]),
});
export type ProdutoCompleto = z.infer<typeof esquemaProdutoCompleto>;

export const esquemaBanner = z.object({
  id: z.string().uuid(),
  titulo: z.string(),
  subtitulo: z.string().nullable(),
  texto_botao: z.string().nullable(),
  link: z.string().nullable(),
  imagem_url: z.string(),
  imagem_mobile_url: z.string().nullable(),
  cor_fundo: z.string().nullable(),
  ordem: z.number(),
  ativo: z.boolean(),
  inicia_em: z.string().nullable(),
  termina_em: z.string().nullable(),
});
export type Banner = z.infer<typeof esquemaBanner>;

export const esquemaPerfil = z.object({
  id: z.string().uuid(),
  nome: z.string(),
  email: z.string(),
  papel: z.enum(["admin", "editor"]),
  ativo: z.boolean(),
  criado_em: z.string(),
});
export type Perfil = z.infer<typeof esquemaPerfil>;

// ---------------------------------------------------------------- formulários

export const esquemaItemOrcamento = z.object({
  produto_id: z.string().uuid(),
  slug: z.string(),
  nome: z.string(),
  cor: z.string().nullable(),
  quantidade: z.number().int().min(1).max(99),
  imagem_url: z.string().nullable(),
  codigo: z.string().nullable(),
});
export type ItemOrcamento = z.infer<typeof esquemaItemOrcamento>;

export const esquemaEnvioOrcamento = z.object({
  nome: z.string().trim().min(2, "Informe seu nome").max(120),
  telefone: z
    .string()
    .trim()
    .min(8, "Informe um telefone com DDD")
    .max(30)
    .refine((v) => v.replace(/\D/g, "").length >= 10, "Telefone incompleto"),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  cidade: z.string().trim().max(80).optional().or(z.literal("")),
  mensagem: z.string().trim().max(2000).optional().or(z.literal("")),
});
export type DadosEnvioOrcamento = z.infer<typeof esquemaEnvioOrcamento>;

/** Configurações editáveis do site (WhatsApp, endereço, horários). */
export const esquemaConfigSite = z.object({
  whatsapp: z.string().default(""),
  telefone: z.string().default(""),
  email: z.string().default(""),
  endereco: z.string().default(""),
  cidade: z.string().default(""),
  horarios: z.string().default(""),
  instagram: z.string().default(""),
  facebook: z.string().default(""),
  mapa_url: z.string().default(""),
  chamada_home: z.string().default(""),
  sobre_texto: z.string().default(""),
  // Venda na promissória: o diferencial da loja. Tudo editável no painel,
  // porque as condições são da loja e mudam sem depender de programador.
  promissoria_ativa: z.boolean().default(true),
  promissoria_titulo: z.string().default(""),
  promissoria_texto: z.string().default(""),
  promissoria_condicoes: z.string().default(""),
  faixa_topo: z.string().default(""),
});
export type ConfigSite = z.infer<typeof esquemaConfigSite>;
export type EntradaConfigSite = z.input<typeof esquemaConfigSite>;
