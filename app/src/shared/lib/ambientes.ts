/**
 * Ambientes: como o cliente pensa a casa. Cada categoria do catálogo pertence
 * a um deles (coluna `categorias.ambiente`, editável no painel).
 */
export const AMBIENTES = [
  { slug: "sala", nome: "Sala", chamada: "Racks, painéis, estofados e decoração" },
  { slug: "quarto", nome: "Quarto", chamada: "Roupeiros, camas, cômodas e cabeceiras" },
  { slug: "cozinha", nome: "Cozinha", chamada: "Cozinhas completas, kits e balcões" },
  { slug: "jantar", nome: "Jantar", chamada: "Mesas, cadeiras e bistrôs" },
  { slug: "escritorio", nome: "Escritório", chamada: "Escrivaninhas e linha office" },
  { slug: "outros", nome: "Multiuso", chamada: "Armários e peças para qualquer canto" },
] as const;

export type SlugAmbiente = (typeof AMBIENTES)[number]["slug"];

export function nomeDoAmbiente(slug: string | null | undefined): string | null {
  return AMBIENTES.find((a) => a.slug === slug)?.nome ?? null;
}

/** Famílias de cor dos acabamentos (função `tons_da_cor` no banco). */
export const TONS = [
  { slug: "claro", nome: "Claros", amostra: "oklch(0.97 0.012 90)" },
  { slug: "madeira", nome: "Madeira", amostra: "oklch(0.62 0.11 60)" },
  { slug: "escuro", nome: "Escuros", amostra: "oklch(0.3 0.01 60)" },
  { slug: "colorido", nome: "Coloridos", amostra: "oklch(0.62 0.13 160)" },
] as const;

/** "Cabe no meu espaço": larguras máximas em centímetros. */
export const LARGURAS_MAXIMAS = [60, 90, 120, 160, 200, 250] as const;
